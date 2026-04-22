using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Distributed;
using Yukle.Api.Models;
using Yukle.Api.Services;

namespace Yukle.Api.Hubs;

/// <summary>
/// Gerçek zamanlı araç takip hub'ı.
/// Şoförler konum verisi yayınlar; müşteriler ve operatörler bu veriyi anlık izler.
/// Her yük, izole bir SignalR grubunda takip edilir — konum verisi asla yanlış tarafa sızmaz.
/// Son bilinen konum Redis'te 24 saat tamponlanır; harita ilk açıldığında anlık şoför bağlantısı
/// olmasa dahi araç pozisyonu gösterilir.
/// Grup üyeliği yük sahibi ve atanan şoförle kısıtlıdır; yetkisiz erişimde HubException fırlatılır.
/// Şoför hedefe 200 m'ye yaklaştığında Haversine algoritması ile varış otomatik algılanır.
/// </summary>
[Authorize]
public sealed class TrackingHub(
    ILogger<TrackingHub>  logger,
    IDistributedCache     cache,
    ILoadService          loadService,
    INotificationService  notificationService) : Hub
{
    private readonly ILogger<TrackingHub>  _logger              = logger;
    private readonly IDistributedCache     _cache               = cache;
    private readonly ILoadService          _loadService         = loadService;
    private readonly INotificationService  _notificationService = notificationService;

    // Varış eşiği: şoför hedefe bu mesafenin altına girince Arrived tetiklenir.
    private const double ArrivalThresholdKm = 0.2;

    // Tüm cache girişleri için ortak TTL — 24 saat.
    private static readonly DistributedCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
    };

    // =========================================================================
    // Grup Yönetimi
    // =========================================================================

    /// <summary>
    /// Bağlantıyı belirtilen yük grubuna dahil eder.
    /// Yalnızca o yükün sahibi (Owner) veya atanmış şoförü (Driver) grubu dinleyebilir.
    /// </summary>
    /// <param name="loadId">Takip edilecek yükün benzersiz kimliği (Guid).</param>
    /// <exception cref="HubException">Kullanıcı yetkisiz ya da yük bulunamazsa.</exception>
    public async Task JoinLoadGroup(string loadId)
    {
        // ── 1. Kimlik doğrulama ────────────────────────────────────────────────
        if (!int.TryParse(
                Context.User?.FindFirstValue(ClaimTypes.NameIdentifier),
                out var userId))
            throw new HubException("Kimlik doğrulaması başarısız.");

        if (!Guid.TryParse(loadId, out var loadGuid))
            throw new HubException("Geçersiz yük kimliği formatı.");

        // ── 2. Yük erişim yetkisi kontrolü ────────────────────────────────────
        var load = await _loadService.GetLoadByIdAsync(loadGuid)
            ?? throw new HubException("Yük bulunamadı.");

        var isOwner  = load.OwnerId  == userId;
        var isDriver = load.DriverId == userId;

        if (!isOwner && !isDriver)
        {
            _logger.LogWarning(
                "Unauthorized JoinLoadGroup attempt. User {UserId} tried Load {LoadId}.",
                userId, loadId);

            throw new HubException("Bu yükü izleme yetkiniz bulunmuyor.");
        }

        // ── 3. SignalR grubuna ekle ────────────────────────────────────────────
        var groupName = GetGroupName(loadId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // ── 4. Bağlantı → yük eşleşmesini Redis'e yaz (cleanup için) ──────────
        await _cache.SetStringAsync(
            GetConnectionKey(Context.ConnectionId),
            loadId,
            CacheOptions);

        _logger.LogInformation(
            "User {UserId} ({Role}) joined tracking group {Group}.",
            userId, isDriver ? "Driver" : "Owner", groupName);
    }

    // =========================================================================
    // Konum Akışı
    // =========================================================================

    /// <summary>
    /// Şoförün anlık konumunu yük grubundaki diğer tüm taraflara iletir,
    /// Redis'e "son bilinen konum" olarak tamponlar ve Haversine algoritmasıyla
    /// hedef mesafesini hesaplar. Mesafe 200 m'nin altına düştüğünde varış tetiklenir.
    /// Yalnızca "Driver" rolüne sahip kimliği doğrulanmış kullanıcılar çağırabilir.
    /// </summary>
    [Authorize(Roles = "Driver")]
    public async Task UpdateLocation(double lat, double lng, string loadId)
    {
        if (!Guid.TryParse(loadId, out var loadGuid))
            throw new HubException("Geçersiz yük kimliği formatı.");

        var driverId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                       ?? Context.ConnectionId;

        _logger.LogDebug(
            "Driver {DriverId} for Load {LoadId}: {Lat},{Lng}",
            driverId, loadId, lat, lng);

        // Redis yazma ve SignalR push paralel çalışır — ikisi de I/O-bound.
        var dto = new LocationBufferDto(lat, lng, driverId, DateTime.UtcNow);

        await Task.WhenAll(
            _cache.SetStringAsync(
                GetCacheKey(loadId),
                JsonSerializer.Serialize(dto),
                CacheOptions),
            Clients.OthersInGroup(GetGroupName(loadId))
                   .SendAsync("ReceiveLocation", lat, lng, driverId)
        );

        // ── Haversine Varış Kontrolü ──────────────────────────────────────────
        // Yalnızca OnWay durumundaki yükler için hesap yapılır; böylece her
        // konum güncellemesinde gereksiz DB sorgusu atılmaz.
        await CheckArrivalAsync(lat, lng, loadId, loadGuid, driverId);
    }

    /// <summary>
    /// Redis'teki son bilinen konumu döner.
    /// Müşteri haritayı ilk açtığında şoför aktif değilse bu metod devreye girer.
    /// </summary>
    /// <returns>Son konum verisi; hiç kayıt yoksa <c>null</c>.</returns>
    public async Task<LocationBufferDto?> GetLastLocation(string loadId)
    {
        var json = await _cache.GetStringAsync(GetCacheKey(loadId));

        if (json is null)
            return null;

        return JsonSerializer.Deserialize<LocationBufferDto>(json);
    }

    // =========================================================================
    // Bağlantı Yaşam Döngüsü
    // =========================================================================

    /// <summary>
    /// Bağlantı koptuğunda çağrılır.
    /// SignalR tüm grup üyeliklerini otomatik temizler; bu override yalnızca
    /// loglama ve Redis cleanup görevini üstlenir.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var loadId = await _cache.GetStringAsync(GetConnectionKey(Context.ConnectionId));

        if (loadId is not null)
        {
            _logger.LogInformation(
                "Connection {ConnectionId} left tracking group for Load {LoadId}. Reason: {Reason}",
                Context.ConnectionId,
                loadId,
                exception?.Message ?? "Normal disconnect");

            // Bağlantı izleme kaydını temizle — TTL'e bırakmak yerine anında sil.
            await _cache.RemoveAsync(GetConnectionKey(Context.ConnectionId));
        }

        await base.OnDisconnectedAsync(exception);
    }

    // =========================================================================
    // Varış Algılama
    // =========================================================================

    /// <summary>
    /// Şoförün mevcut koordinatlarını yükün hedefiyle karşılaştırır.
    /// Mesafe eşiğin altına düşer ve yük henüz <c>Arrived</c> değilse varış sürecini başlatır.
    /// DB güncellemesi, SignalR push ve push bildirimi eş zamanlı tetiklenir.
    /// </summary>
    private async Task CheckArrivalAsync(
        double lat, double lng,
        string loadId, Guid loadGuid,
        string driverId)
    {
        try
        {
            var load = await _loadService.GetLoadByIdAsync(loadGuid);

            // Yalnızca yolda olan yükler kontrol edilir — spam koruması burada.
            if (load is null || load.Status != LoadStatus.OnWay)
                return;

            var distanceKm = CalculateDistance(lat, lng, load.DestinationLat, load.DestinationLng);

            if (distanceKm >= ArrivalThresholdKm)
                return;

            _logger.LogInformation(
                "Arrival detected for Load {LoadId}. Driver {DriverId} is {Dist:F0}m from destination.",
                loadId, driverId, distanceKm * 1000);

            // DB, SignalR ve bildirimler paralel fırlatılır.
            await Task.WhenAll(
                _loadService.UpdateStatusAsync(loadGuid, LoadStatus.Arrived),
                Clients.Group(GetGroupName(loadId))
                       .SendAsync("OnLoadArrived", loadId),
                _notificationService.SendAsync(
                    int.Parse(driverId),
                    "Hedefe Ulaştınız! 📍",
                    "Varış noktasına ulaşıldı! Yükü teslim edebilirsiniz."),
                _notificationService.SendAsync(
                    load.OwnerId,
                    "Yükünüz Hedefe Ulaştı! 🎯",
                    "Aracınız varış noktasına ulaştı. Teslimat sürecini başlatabilirsiniz.")
            );
        }
        catch (Exception ex)
        {
            // Varış kontrolü hatası konum yayınını engellememelidir.
            _logger.LogError(ex,
                "Arrival check failed for Load {LoadId}.", loadId);
        }
    }

    // =========================================================================
    // Haversine Algoritması
    // =========================================================================

    /// <summary>
    /// İki GPS koordinatı arasındaki yüzey mesafesini Haversine formülüyle hesaplar.
    /// Dünya yarıçapı 6371 km alınmıştır (ortalama küresel yarıçap).
    /// </summary>
    /// <returns>Kilometre cinsinden mesafe.</returns>
    private static double CalculateDistance(
        double lat1, double lon1,
        double lat2, double lon2)
    {
        const double EarthRadiusKm = 6371.0;

        // Derece → radyan dönüşümü
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2))
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;

    // =========================================================================
    // Anahtar / İsim Fabrikaları — merkezi, typo-proof
    // =========================================================================

    // SignalR grup adı  →  load_<loadId>
    private static string GetGroupName(string loadId)     => $"load_{loadId}";

    // Redis: son bilinen konum  →  last_location:{loadId}
    private static string GetCacheKey(string loadId)      => $"last_location:{loadId}";

    // Redis: bağlantı → yük eşleşmesi  →  tracking_conn:{connectionId}
    private static string GetConnectionKey(string connId) => $"tracking_conn:{connId}";
}
