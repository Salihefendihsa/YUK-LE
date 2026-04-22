using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Distributed;
using Yukle.Api.Services;

namespace Yukle.Api.Hubs;

/// <summary>
/// Yük özelinde şoför–müşteri anlık mesajlaşma hub'ı.
/// Her yük için izole bir sohbet odası (chat:{loadId}) açılır; mesajlar
/// yalnızca o odadaki iki tarafa iletilir — başka hiç kimse okuyamaz.
/// Oda üyeliği yük sahibi ve atanmış şoförle kısıtlıdır; yetkisiz girişimde
/// HubException fırlatılır.
/// </summary>
[Authorize]
public sealed class ChatHub(
    ILogger<ChatHub>     logger,
    IDistributedCache    cache,
    ILoadService         loadService) : Hub
{
    private readonly ILogger<ChatHub>     _logger      = logger;
    private readonly IDistributedCache    _cache       = cache;
    private readonly ILoadService         _loadService = loadService;

    // Bağlantı izleme kayıtları için TTL — aktif oturum süresiyle uyumlu.
    private static readonly DistributedCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
    };

    // =========================================================================
    // Bağlantı Yaşam Döngüsü
    // =========================================================================

    /// <summary>
    /// Bağlantı kurulduğunda kullanıcıyı kendi userId grubuyla eşleştirir.
    /// Bu sayede ileride sunucu tarafından başlatılan direkt mesajlar (DM) gönderilebilir.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;

        if (userId is not null)
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Bağlantı koptuğunda Redis bağlantı kaydını temizler ve kanalı loglar.
    /// SignalR grup üyeliklerini otomatik kaldırır; bu override loglama içindir.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var loadId = await _cache.GetStringAsync(GetConnectionKey(Context.ConnectionId));

        if (loadId is not null)
        {
            _logger.LogInformation(
                "ChatHub: Connection {ConnectionId} left chat room for Load {LoadId}. Reason: {Reason}",
                Context.ConnectionId,
                loadId,
                exception?.Message ?? "Normal disconnect");

            await _cache.RemoveAsync(GetConnectionKey(Context.ConnectionId));
        }

        await base.OnDisconnectedAsync(exception);
    }

    // =========================================================================
    // Oda Yönetimi
    // =========================================================================

    /// <summary>
    /// Kullanıcıyı belirtilen yüke ait sohbet odasına dahil eder.
    /// Yalnızca o yükün sahibi (Owner) veya atanmış şoförü (Driver) odaya girebilir.
    /// </summary>
    /// <param name="loadId">Sohbetin ilişkilendirileceği yükün Guid kimliği.</param>
    /// <exception cref="HubException">Kullanıcı yetkisiz ya da yük bulunamazsa.</exception>
    public async Task JoinChatGroup(string loadId)
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
                "ChatHub: Unauthorized JoinChatGroup attempt. User {UserId} tried Load {LoadId}.",
                userId, loadId);

            throw new HubException("Bu yüke ait sohbet odasına giriş yetkiniz bulunmuyor.");
        }

        // ── 3. Sohbet odasına ekle ────────────────────────────────────────────
        var roomName = GetRoomName(loadId);
        await Groups.AddToGroupAsync(Context.ConnectionId, roomName);

        // ── 4. Bağlantı → oda eşleşmesini Redis'e yaz (cleanup için) ──────────
        await _cache.SetStringAsync(
            GetConnectionKey(Context.ConnectionId),
            loadId,
            CacheOptions);

        _logger.LogInformation(
            "ChatHub: User {UserId} ({Role}) joined chat room {Room}.",
            userId, isDriver ? "Driver" : "Owner", roomName);
    }

    // =========================================================================
    // Mesajlaşma
    // =========================================================================

    /// <summary>
    /// Gönderenin mesajını yük sohbet odasındaki diğer tarafa iletir.
    /// Gönderen kendi mesajını almaz (<c>OthersInGroup</c>); UI optimistic update uygular.
    /// </summary>
    /// <param name="loadId">Mesajın ait olduğu yükün kimliği.</param>
    /// <param name="message">Gönderilecek mesaj metni.</param>
    /// <exception cref="HubException">Mesaj boşsa veya kimlik doğrulaması başarısızsa.</exception>
    public async Task SendMessage(string loadId, string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            throw new HubException("Mesaj boş gönderilemez.");

        var senderId   = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? Context.ConnectionId;
        var senderName = Context.User?.FindFirstValue(ClaimTypes.Name)
                         ?? $"Kullanıcı #{senderId}";

        _logger.LogDebug(
            "ChatHub: User {SenderId} sent message to Load {LoadId} room.",
            senderId, loadId);

        await Clients
            .OthersInGroup(GetRoomName(loadId))
            .SendAsync("ReceiveMessage", new
            {
                SenderId   = senderId,
                SenderName = senderName,
                Message    = message,
                Timestamp  = DateTime.UtcNow
            });
    }

    // =========================================================================
    // İsim / Anahtar Fabrikaları — merkezi, typo-proof
    // =========================================================================

    // SignalR sohbet odası adı  →  chat:{loadId}
    private static string GetRoomName(string loadId)      => $"chat:{loadId}";

    // Redis: bağlantı → oda eşleşmesi  →  chat_conn:{connectionId}
    private static string GetConnectionKey(string connId) => $"chat_conn:{connId}";
}
