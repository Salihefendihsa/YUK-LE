using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NetTopologySuite.Geometries;
using Yukle.Api.Data;
using Yukle.Api.Models;
using Yukle.Api.Services;

namespace Yukle.Api.BackgroundServices;

/// <summary>
/// <b>Jüri Demo Veri Üreticisi (idempotent + sürümlü).</b>
/// <para>
/// Test müşterisi (<c>test@navlonix.com</c>) için ZENGİN, gerçekçi ve tutarlı bir
/// demo seti üretir: gerçekçi isimli 3 demo şoför, son 6 aya yayılı 12 teslim edilmiş
/// ilan (şoför dağılımı 5/4/3), her teslim için kabul edilmiş teklif + escrow hold/release
/// (gerçek PaymentTransaction + WalletAuditLog), çeşitlilik için 2 Active + 1 OnWay (canlı
/// takip konumlu) + 1 Cancelled, ve 6 şoför→müşteri puanı (ortalama ~4.6).
/// </para>
/// <para>
/// <b>Idempotent:</b> tüm kayıtlar <see cref="DemoMarker"/> ile işaretlenir. Güncel sürüm
/// zaten kuruluysa atlanır; değilse SADECE demo işaretli veriler temizlenip yeniden kurulur.
/// admin@/test@/sofor@ ve demo dışı hiçbir veriye dokunulmaz. Şema/migration değişmez.
/// </para>
/// </summary>
public sealed class DemoProvaSeederJob(
    IServiceScopeFactory scopeFactory,
    ILogger<DemoProvaSeederJob> logger) : IHostedService
{
    /// <summary>Güncel demo sürümünün işareti (Load.Description prefix'i).</summary>
    private const string DemoMarker = "DEMO_RICH:v3";

    /// <summary>Tüm demo sürümlerini (eski "DEMO_PROVA:v2" dahil) kapsayan temizlik prefix'i.</summary>
    private const string DemoCleanupPrefix = "DEMO_";

    // Test hesapları farklı ortamlarda iki domain'den biriyle kurulmuş olabilir
    // (navlonix.com veya yukle.com). Sıralı fallback ile ilk eşleşeni kullanırız;
    // hesap RENAME edilmez, login mantığına dokunulmaz — sadece lookup esnetilir.
    private static readonly string[] TestCustomerEmails = { "test@navlonix.com", "test@yukle.com" };
    private static readonly string[] TestDriverEmails = { "sofor@navlonix.com", "sofor@yukle.com" };

    // 12 Delivered + 2 Active + 1 OnWay + 1 Cancelled
    private const int ExpectedDemoLoadCount = 16;

    private static readonly string[] DemoDriverEmails =
    {
        "demo-driver-1@navlonix.com",
        "demo-driver-2@navlonix.com",
        "demo-driver-3@navlonix.com",
    };

    private static readonly GeometryFactory Gf = new(new PrecisionModel(), 4326);

    public async Task StartAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<YukleDbContext>();
            var payments = scope.ServiceProvider.GetRequiredService<IPaymentService>();

            var customer = await FindFirstByEmailAsync(db, TestCustomerEmails, ct);
            if (customer is null)
            {
                logger.LogWarning(
                    "DemoSeeder: test müşterisi ({Emails}) bulunamadı, atlandı.",
                    string.Join(" / ", TestCustomerEmails));
                return;
            }

            // ── Idempotency: güncel marker'lı tam set + 3 demo şoför varsa hiçbir şey yapma ──
            var currentCount = await db.Loads.CountAsync(
                l => l.UserId == customer.Id && l.Description.StartsWith(DemoMarker), ct);
            var demoDriverCount = await db.Users.CountAsync(
                u => DemoDriverEmails.Contains(u.Email), ct);

            if (currentCount == ExpectedDemoLoadCount && demoDriverCount == DemoDriverEmails.Length)
            {
                logger.LogInformation("DemoSeeder: zengin demo seti güncel ({Marker}), atlandı.", DemoMarker);
                return;
            }

            var removed = await CleanupDemoAsync(db, customer.Id, ct);
            var drivers = await EnsureDemoDriversAsync(db, ct);
            await SeedRichDemoAsync(db, payments, customer, drivers, ct);

            logger.LogWarning(
                "DemoSeeder: {Removed} eski demo kaydı temizlendi, zengin set kuruldu ({Marker}).",
                removed, DemoMarker);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "DemoSeeder çalışırken hata oluştu.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    /// <summary>Aday e-posta listesini sırayla dener; ilk eşleşen kullanıcıyı döner (yoksa null).</summary>
    private static async Task<User?> FindFirstByEmailAsync(
        YukleDbContext db, string[] candidateEmails, CancellationToken ct)
    {
        foreach (var email in candidateEmails)
        {
            var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email, ct);
            if (user is not null) return user;
        }
        return null;
    }

    // ── Temizlik: SADECE demo işaretli ilanlar + demo şoförler (FK güvenli sıra) ──────────
    private static async Task<int> CleanupDemoAsync(YukleDbContext db, int customerId, CancellationToken ct)
    {
        var loadIds = await db.Loads
            .Where(l => l.UserId == customerId && l.Description.StartsWith(DemoCleanupPrefix))
            .Select(l => l.Id)
            .ToListAsync(ct);

        if (loadIds.Count > 0)
        {
            db.WalletAuditLogs.RemoveRange(db.WalletAuditLogs.Where(w => loadIds.Contains(w.LoadId)));
            db.PaymentTransactions.RemoveRange(db.PaymentTransactions.Where(p => loadIds.Contains(p.LoadId)));
            db.UetdsOutboxes.RemoveRange(db.UetdsOutboxes.Where(o => loadIds.Contains(o.LoadId)));
            db.ChatMessages.RemoveRange(db.ChatMessages.Where(c => loadIds.Contains(c.LoadId)));
            db.Ratings.RemoveRange(db.Ratings.Where(r => loadIds.Contains(r.LoadId)));
            // Bid → Load Cascade olduğu için ilanlar silinince teklifler de gider.
            db.Loads.RemoveRange(db.Loads.Where(l => loadIds.Contains(l.Id)));
            await db.SaveChangesAsync(ct);
        }

        // Eski demo'dan kalan cüzdan bakiyelerini sıfırla (müşteri + test şoför).
        // (AverageRating/TotalRatingCount seed sonunda gerçek satırlardan yeniden hesaplanır.)
        var customer = await db.Users.FindAsync([customerId], ct);
        if (customer is not null)
        {
            customer.WalletBalance = 0;
            customer.PendingBalance = 0;
        }

        var testDriver = await FindFirstByEmailAsync(db, TestDriverEmails, ct);
        if (testDriver is not null)
        {
            testDriver.WalletBalance = 0;
            testDriver.PendingBalance = 0;
        }

        // Demo şoförleri EN SON sil — ilanları/rating'leri/teklifleri artık yok (Rating→User Restrict).
        var demoDrivers = await db.Users.Where(u => DemoDriverEmails.Contains(u.Email)).ToListAsync(ct);
        if (demoDrivers.Count > 0)
            db.Users.RemoveRange(demoDrivers);

        await db.SaveChangesAsync(ct);
        return loadIds.Count;
    }

    // ── 3 gerçekçi demo şoför (idempotent, Email ile) ─────────────────────────────────────
    private static async Task<List<User>> EnsureDemoDriversAsync(YukleDbContext db, CancellationToken ct)
    {
        byte[] hash = Encoding.UTF8.GetBytes(BCrypt.Net.BCrypt.HashPassword("Test123!"));

        var specs = new (string Email, string FullName, string Phone)[]
        {
            ("demo-driver-1@navlonix.com", "Mehmet Yılmaz", "5000000101"),
            ("demo-driver-2@navlonix.com", "Ahmet Kaya",    "5000000102"),
            ("demo-driver-3@navlonix.com", "Hasan Demir",   "5000000103"),
        };

        var result = new List<User>();
        foreach (var s in specs)
        {
            var u = await db.Users.SingleOrDefaultAsync(x => x.Email == s.Email, ct);
            if (u is null)
            {
                u = new User { Email = s.Email, CreatedAt = DateTime.UtcNow };
                await db.Users.AddAsync(u, ct);
            }

            u.FullName = s.FullName;
            u.Phone = s.Phone;                       // deterministik AES + UNIQUE; numaralar benzersiz
            u.Role = UserRole.Driver;
            u.ApprovalStatus = ApprovalStatus.Active;
            u.IsActive = true;
            u.IsPhoneVerified = true;
            u.PasswordHash = hash;
            u.PasswordSalt = Array.Empty<byte>();
            u.WalletBalance = 0;
            u.PendingBalance = 0;
            u.AverageRating = 0;
            u.TotalRatingCount = 0;
            result.Add(u);
        }

        await db.SaveChangesAsync(ct);
        return result;
    }

    // ── Zengin demo seti ──────────────────────────────────────────────────────────────────
    private static async Task SeedRichDemoAsync(
        YukleDbContext db, IPaymentService payments, User customer, List<User> drivers, CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        // 12 teslim — şoför dağılımı 5 (Mehmet) / 4 (Ahmet) / 3 (Hasan), tablo sırasıyla.
        var delivered = new[]
        {
            // Mehmet (index 0) — 5 sefer
            new DeliveredSpec("İstanbul", "Kadıköy", 41.0082, 28.9784, "Ankara", "Çankaya",   39.9334, 32.8597, 0, 48_500m, 12_000, 30, LoadType.Paletli,  VehicleType.TIR),
            new DeliveredSpec("İzmir",    "Konak",   38.4237, 27.1428, "Bursa",  "Osmangazi", 40.1826, 29.0665, 0, 36_000m, 18_000, 45, LoadType.Dökme,    VehicleType.Kamyon),
            new DeliveredSpec("Adana",    "Seyhan",  37.0000, 35.3213, "Mersin", "Yenişehir", 36.8121, 34.6415, 0, 18_500m,  9_000, 20, LoadType.Parsiyel, VehicleType.Kamyonet),
            new DeliveredSpec("Antalya",  "Muratpaşa", 36.8969, 30.7133, "Konya", "Selçuklu", 37.8746, 32.4932, 0, 29_000m, 15_000, 38, LoadType.Paletli,  VehicleType.TIR),
            new DeliveredSpec("Gaziantep","Şahinbey", 37.0662, 37.3833, "Kayseri","Melikgazi",38.7312, 35.4787, 0, 33_500m, 22_000, 55, LoadType.Dökme,    VehicleType.TIR),
            // Ahmet (index 1) — 4 sefer
            new DeliveredSpec("Samsun",   "İlkadım", 41.2867, 36.3300, "Trabzon","Ortahisar", 41.0027, 39.7168, 1, 27_000m, 11_000, 28, LoadType.Parsiyel, VehicleType.Kamyon),
            new DeliveredSpec("Eskişehir","Tepebaşı",39.7767, 30.5206, "Kütahya","Merkez",    39.4242, 29.9833, 1, 15_000m,  7_000, 16, LoadType.Paletli,  VehicleType.Kamyonet),
            new DeliveredSpec("Diyarbakır","Bağlar", 37.9144, 40.2306, "Şanlıurfa","Haliliye",37.1591, 38.7969, 1, 22_500m, 14_000, 35, LoadType.Dökme,    VehicleType.Kamyon),
            new DeliveredSpec("İstanbul", "Tuzla",   41.0082, 28.9784, "İzmir",  "Bornova",   38.4237, 27.1428, 1, 52_000m, 24_000, 60, LoadType.Paletli,  VehicleType.TIR),
            // Hasan (index 2) — 3 sefer
            new DeliveredSpec("Ankara",   "Çankaya", 39.9334, 32.8597, "Konya",  "Selçuklu",  37.8746, 32.4932, 2, 24_000m, 10_000, 24, LoadType.Parsiyel, VehicleType.Kamyon),
            new DeliveredSpec("Bursa",    "Osmangazi",40.1826,29.0665, "İstanbul","Kadıköy",  41.0082, 28.9784, 2, 26_500m, 13_000, 32, LoadType.Paletli,  VehicleType.Kamyon),
            new DeliveredSpec("Mersin",   "Yenişehir",36.8121,34.6415, "Gaziantep","Şahinbey",37.0662, 37.3833, 2, 31_000m, 19_000, 48, LoadType.Dökme,    VehicleType.TIR),
        };

        // 6 teslim için şoför→müşteri puanı: ortalama (5+5+4+5+4+5)/6 ≈ 4.67
        var ratingScores = new[] { 5, 5, 4, 5, 4, 5 };
        var ratingComments = new[]
        {
            "Yük zamanında ve sorunsuz teslim edildi, teşekkürler.",
            "İletişim çok iyiydi, tekrar çalışmak isterim.",
            "Genel olarak iyi, ufak gecikme oldu.",
            "Profesyonel müşteri, evrak eksiksizdi.",
            "Sorunsuz bir taşıma süreciydi.",
            "Her şey yolundaydı, memnun kaldım.",
        };

        for (var i = 0; i < delivered.Length; i++)
        {
            var s = delivered[i];
            var driver = drivers[s.DriverIndex];

            var monthOffset = i / 2;          // 0..5 → son 6 ay, her aya 2 teslim
            var slot = i % 2;
            var deliveryDate = DeliveryDateForBucket(now, monthOffset, slot);

            var load = NewLoad(
                s.FromCity, s.FromDistrict, s.FromLat, s.FromLng,
                s.ToCity, s.ToDistrict, s.ToLat, s.ToLng,
                s.Type, s.VehicleType, s.Price, s.WeightKg, s.VolumeM3,
                LoadStatus.Delivered, driver.Id,
                created: deliveryDate.AddDays(-4),
                pickup: deliveryDate.AddDays(-2),
                delivery: deliveryDate,
                customerId: customer.Id);

            await db.Loads.AddAsync(load, ct);
            await db.SaveChangesAsync(ct);

            db.Bids.Add(new Bid
            {
                LoadId = load.Id,
                DriverId = driver.Id,
                Amount = s.Price,
                Status = BidStatus.Accepted,
                CreatedAt = deliveryDate.AddDays(-3),
            });
            await db.SaveChangesAsync(ct);

            // Escrow: hold + release → gerçek PaymentTransaction + WalletAuditLog
            await payments.HoldPaymentAsync(load.Id, s.Price, "demo_token");
            await payments.ReleasePaymentAsync(load.Id, driver.Id);

            // İlk 6 teslim için şoför→müşteri puanı (UNIQUE LoadId+GivenByUserId güvenli: her load tekil)
            if (i < ratingScores.Length)
            {
                db.Ratings.Add(new Rating
                {
                    LoadId = load.Id,
                    GivenByUserId = driver.Id,
                    GivenToUserId = customer.Id,
                    Score = ratingScores[i],
                    Comment = ratingComments[i],
                    RaterRole = RaterRole.Driver,
                    CreatedAt = deliveryDate.AddDays(1),
                });
                await db.SaveChangesAsync(ct);
            }
        }

        // ── Çeşitlilik: 2 Active ──────────────────────────────────────────────────────────
        var active1 = NewLoad("Kocaeli", "İzmit", 40.7654, 29.9408, "Sakarya", "Adapazarı", 40.7569, 30.3781,
            LoadType.Paletli, VehicleType.Kamyon, 14_000m, 8_000, 20, LoadStatus.Active, null,
            created: now.AddDays(-1), pickup: now.AddDays(2), delivery: now.AddDays(4), customerId: customer.Id);

        var active2 = NewLoad("Konya", "Selçuklu", 37.8746, 32.4932, "Antalya", "Muratpaşa", 36.8969, 30.7133,
            LoadType.Dökme, VehicleType.TIR, 30_000m, 20_000, 50, LoadStatus.Active, null,
            created: now.AddDays(-2), pickup: now.AddDays(3), delivery: now.AddDays(5), customerId: customer.Id);

        await db.Loads.AddRangeAsync(new[] { active1, active2 }, ct);
        await db.SaveChangesAsync(ct);

        // ── Çeşitlilik: 1 OnWay (canlı takip) ─────────────────────────────────────────────
        var onWayDriver = drivers[0]; // Mehmet Yılmaz
        var onWay = NewLoad("Ankara", "Çankaya", 39.9334, 32.8597, "İstanbul", "Kadıköy", 41.0082, 28.9784,
            LoadType.Paletli, VehicleType.TIR, 47_000m, 21_000, 52, LoadStatus.OnWay, onWayDriver.Id,
            created: now.AddDays(-1), pickup: now, delivery: now.AddDays(2), customerId: customer.Id);

        await db.Loads.AddAsync(onWay, ct);
        await db.SaveChangesAsync(ct);

        db.Bids.Add(new Bid
        {
            LoadId = onWay.Id,
            DriverId = onWayDriver.Id,
            Amount = 47_000m,
            Status = BidStatus.Accepted,
            CreatedAt = now.AddDays(-1),
        });
        await db.SaveChangesAsync(ct);

        await payments.HoldPaymentAsync(onWay.Id, 47_000m, "demo_token"); // release YOK — yolda

        // Şoförün canlı konumu: Ankara–İstanbul güzergahında (Bolu civarı)
        onWayDriver.LastKnownLatitude = 40.7390;
        onWayDriver.LastKnownLongitude = 31.6080;
        onWayDriver.LastLocationUpdate = now;
        await db.SaveChangesAsync(ct);

        // ── Çeşitlilik: 1 Cancelled ───────────────────────────────────────────────────────
        var cancelled = NewLoad("Bursa", "Osmangazi", 40.1826, 29.0665, "Eskişehir", "Tepebaşı", 39.7767, 30.5206,
            LoadType.Parsiyel, VehicleType.Kamyonet, 13_000m, 6_000, 16, LoadStatus.Cancelled, null,
            created: now.AddDays(-5), pickup: now.AddDays(-3), delivery: now.AddDays(-1), customerId: customer.Id);
        cancelled.CancelledAt = now.AddDays(-3);
        cancelled.CancellationReason = "Demo — müşteri iptali";

        await db.Loads.AddAsync(cancelled, ct);
        await db.SaveChangesAsync(ct);

        // ── Müşteri cached puan alanlarını gerçek satırlardan yeniden hesapla ──────────────
        var custScores = await db.Ratings
            .Where(r => r.GivenToUserId == customer.Id)
            .Select(r => r.Score)
            .ToListAsync(ct);
        customer.TotalRatingCount = custScores.Count;
        customer.AverageRating = custScores.Count == 0 ? 0 : custScores.Average();
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Son 6 ayın her birine 2 teslim düşecek şekilde GEÇMİŞTE bir teslim tarihi üretir.</summary>
    private static DateTime DeliveryDateForBucket(DateTime now, int monthOffset, int slot)
    {
        var monthStart = new DateTime(now.Year, now.Month, 1, 9, 0, 0, DateTimeKind.Utc).AddMonths(-monthOffset);
        int day;
        if (monthOffset == 0)
        {
            // İçinde bulunulan ay: bugünden önce kal.
            var maxDay = Math.Max(1, now.Day - 1);
            day = slot == 0 ? Math.Max(1, maxDay - 2) : maxDay;
        }
        else
        {
            day = slot == 0 ? 9 : 21;
        }
        return monthStart.AddDays(day - 1);
    }

    private static Load NewLoad(
        string fromCity, string fromDistrict, double fromLat, double fromLng,
        string toCity, string toDistrict, double toLat, double toLng,
        LoadType type, VehicleType vehicleType, decimal price, double weightKg, double volumeM3,
        LoadStatus status, int? driverId,
        DateTime created, DateTime pickup, DateTime delivery, int customerId)
        => new()
        {
            FromCity = fromCity,
            FromDistrict = fromDistrict,
            ToCity = toCity,
            ToDistrict = toDistrict,
            Origin = Gf.CreatePoint(new Coordinate(fromLng, fromLat)),
            Destination = Gf.CreatePoint(new Coordinate(toLng, toLat)),
            Description = $"{DemoMarker} — {fromCity} → {toCity} demo ilanı",
            Weight = weightKg,
            Volume = volumeM3,
            Type = type,
            RequiredVehicleType = vehicleType,
            PickupDate = pickup,
            DeliveryDate = delivery,
            CreatedAt = created,
            Price = price,
            Currency = "TRY",
            UserId = customerId,
            DriverId = driverId,
            Status = status,
            AiSuggestedPrice = price * 0.98m,
            AiMinPrice = price * 0.92m,
            AiMaxPrice = price * 1.08m,
            AiPriceReasoning = "Demo öneri fiyatı",
        };

    private sealed record DeliveredSpec(
        string FromCity, string FromDistrict, double FromLat, double FromLng,
        string ToCity, string ToDistrict, double ToLat, double ToLng,
        int DriverIndex, decimal Price, double WeightKg, double VolumeM3,
        LoadType Type, VehicleType VehicleType);
}
