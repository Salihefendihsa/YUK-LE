using System.Text;
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
/// Demo prova: test müşteri ilanlarını çeşitlendirir, tekrarlayan Elazığ→Malatya kayıtlarını temizler.
/// Giriş bilgileri (telefon/şifre) değişmez.
/// </summary>
public sealed class DemoProvaSeederJob(
    IServiceScopeFactory scopeFactory,
    ILogger<DemoProvaSeederJob> logger) : IHostedService
{
    private const string DemoMarker = "DEMO_PROVA:v2";
    private const string TestCustomerEmail = "test@navlonix.com";
    private const string TestDriverEmail = "sofor@navlonix.com";
    private const double DemoAnkaraLat = 39.9334;
    private const double DemoAnkaraLng = 32.8597;

    private static readonly GeometryFactory Gf =
        new(new PrecisionModel(), 4326);

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<YukleDbContext>();
            var payments = scope.ServiceProvider.GetRequiredService<IPaymentService>();

            var customer = await db.Users.SingleOrDefaultAsync(
                u => u.Email == TestCustomerEmail, cancellationToken);
            var driver = await db.Users.SingleOrDefaultAsync(
                u => u.Email == TestDriverEmail, cancellationToken);

            if (customer is null || driver is null)
            {
                logger.LogWarning("DemoProvaSeeder: test kullanıcıları bulunamadı, atlandı.");
                return;
            }

            var existing = await db.Loads
                .Where(l => l.UserId == customer.Id)
                .Select(l => new { l.Description, l.FromCity, l.ToCity, l.Price })
                .ToListAsync(cancellationToken);

            var duplicateElazig = existing.Count(l =>
                (l.FromCity.Contains("Elaz", StringComparison.OrdinalIgnoreCase)
                 || l.FromCity.Contains("Elazı", StringComparison.OrdinalIgnoreCase))
                && l.ToCity.Contains("Malatya", StringComparison.OrdinalIgnoreCase));

            var needsReseed = existing.Count == 0
                || existing.Count > 12
                || duplicateElazig > 1
                || existing.Any(l => l.Description == null || !l.Description.StartsWith(DemoMarker, StringComparison.Ordinal));

            if (!needsReseed)
            {
                await EnsureDemoOnWayLoadAsync(db, customer.Id, driver.Id, cancellationToken);
                await EnsureDemoDriverLocationAsync(db, driver, customer.Id, cancellationToken);
                logger.LogInformation("DemoProvaSeeder: demo ilan seti güncel ({Count} kayıt), atlandı.", existing.Count);
                return;
            }

            var removed = await CleanupCustomerLoadsAsync(db, customer.Id, cancellationToken);
            await SeedDemoLoadsAsync(db, payments, customer, driver, cancellationToken);

            logger.LogWarning(
                "DemoProvaSeeder: {Removed} eski kayıt temizlendi, 6 çeşitli demo ilan eklendi (müşteri={CustomerId}).",
                removed, customer.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "DemoProvaSeeder çalışırken hata oluştu.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static async Task<int> CleanupCustomerLoadsAsync(
        YukleDbContext db,
        int customerId,
        CancellationToken ct)
    {
        var loadIds = await db.Loads
            .Where(l => l.UserId == customerId)
            .Select(l => l.Id)
            .ToListAsync(ct);

        if (loadIds.Count == 0) return 0;

        db.WalletAuditLogs.RemoveRange(db.WalletAuditLogs.Where(w => loadIds.Contains(w.LoadId)));
        db.PaymentTransactions.RemoveRange(db.PaymentTransactions.Where(p => loadIds.Contains(p.LoadId)));
        db.UetdsOutboxes.RemoveRange(db.UetdsOutboxes.Where(o => loadIds.Contains(o.LoadId)));
        db.ChatMessages.RemoveRange(db.ChatMessages.Where(c => loadIds.Contains(c.LoadId)));
        db.Loads.RemoveRange(db.Loads.Where(l => loadIds.Contains(l.Id)));
        await db.SaveChangesAsync(ct);

        var customer = await db.Users.FindAsync([customerId], ct);
        if (customer is not null)
        {
            customer.WalletBalance = 0;
            customer.PendingBalance = 0;
        }

        var driver = await db.Users.FirstOrDefaultAsync(u => u.Email == TestDriverEmail, ct);
        if (driver is not null)
        {
            driver.WalletBalance = 0;
            driver.PendingBalance = 0;
        }

        await db.SaveChangesAsync(ct);
        return loadIds.Count;
    }

    private static async Task SeedDemoLoadsAsync(
        YukleDbContext db,
        IPaymentService payments,
        User customer,
        User driver,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var pickup = now.AddDays(1);
        var delivery = now.AddDays(3);

        var scenarios = new[]
        {
            new DemoLoadSpec("İstanbul", "Kadıköy", "Ankara", "Çankaya", 41.0082, 28.9784, 39.9334, 32.8597,
                LoadStatus.Active, null, VehicleType.Kamyon, LoadType.Paletli, 18_000, 32, 48_500m, null),
            new DemoLoadSpec("İzmir", "Konak", "Bursa", "Osmangazi", 38.4192, 27.1287, 40.1885, 29.0610,
                LoadStatus.Active, null, VehicleType.TIR, LoadType.Paletli, 24_000, 45, 62_000m, null),
            new DemoLoadSpec("Elazığ", "Merkez", "Malatya", "Yeşilyurt", 38.6810, 39.2264, 38.3552, 38.3095,
                LoadStatus.Assigned, driver.Id, VehicleType.Kamyon, LoadType.Dökme, 12_000, 24, 28_500m, 28_500m),
            new DemoLoadSpec("Antalya", "Muratpaşa", "Konya", "Selçuklu", 36.8969, 30.7133, 37.8746, 32.4932,
                LoadStatus.OnWay, driver.Id, VehicleType.TIR, LoadType.Paletli, 20_000, 40, 55_000m, null),
            new DemoLoadSpec("Gaziantep", "Şahinbey", "Mersin", "Yenişehir", 37.0662, 37.3833, 36.8121, 34.6415,
                LoadStatus.Delivered, driver.Id, VehicleType.Kamyon, LoadType.Parsiyel, 15_000, 28, 42_000m, 42_000m),
            new DemoLoadSpec("Denizli", "Merkez", "Eskişehir", "Tepebaşı", 37.7765, 29.0864, 39.7767, 30.5206,
                LoadStatus.Cancelled, null, VehicleType.Kamyonet, LoadType.Parsiyel, 8_000, 14, 19_500m, null),
        };

        for (var i = 0; i < scenarios.Length; i++)
        {
            var s = scenarios[i];
            var load = new Load
            {
                FromCity = s.FromCity,
                FromDistrict = s.FromDistrict,
                ToCity = s.ToCity,
                ToDistrict = s.ToDistrict,
                Origin = Gf.CreatePoint(new Coordinate(s.FromLng, s.FromLat)),
                Destination = Gf.CreatePoint(new Coordinate(s.ToLng, s.ToLat)),
                Description = $"{DemoMarker} — {s.FromCity} → {s.ToCity} demo ilanı",
                Weight = s.WeightKg,
                Volume = s.VolumeM3,
                Type = s.LoadType,
                RequiredVehicleType = s.VehicleType,
                PickupDate = pickup,
                DeliveryDate = delivery,
                Price = s.ListPrice,
                Currency = "TRY",
                UserId = customer.Id,
                DriverId = s.DriverId,
                Status = s.Status,
                CreatedAt = now.AddHours(-i * 6),
                AiSuggestedPrice = s.ListPrice * 0.98m,
                AiMinPrice = s.ListPrice * 0.92m,
                AiMaxPrice = s.ListPrice * 1.08m,
                AiPriceReasoning = "Demo öneri fiyatı",
            };

            if (s.Status == LoadStatus.Cancelled)
            {
                load.CancelledAt = now;
                load.CancellationReason = "Demo prova — müşteri iptali";
            }

            await db.Loads.AddAsync(load, ct);
            await db.SaveChangesAsync(ct);

            if (s.BidAmount is decimal bidAmount && s.DriverId is int driverId)
            {
                db.Bids.Add(new Bid
                {
                    LoadId = load.Id,
                    DriverId = driverId,
                    Amount = bidAmount,
                    Status = BidStatus.Accepted,
                    CreatedAt = now,
                });
                await db.SaveChangesAsync(ct);

                if (s.Status is LoadStatus.Assigned or LoadStatus.OnWay)
                {
                    await payments.HoldPaymentAsync(load.Id, bidAmount, "demo_token");
                }
                else if (s.Status == LoadStatus.Delivered)
                {
                    await payments.HoldPaymentAsync(load.Id, bidAmount, "demo_token");
                    await payments.ReleasePaymentAsync(load.Id, driverId);
                }
            }
        }

        await EnsureDemoOnWayLoadAsync(db, customer.Id, driver.Id, ct);
        await EnsureDemoDriverLocationAsync(db, driver, customer.Id, ct);
    }

    /// <summary>
    /// Demo canlı harita için en az bir demo ilanın OnWay + atanmış şoför durumda olmasını garanti eder.
    /// </summary>
    private static async Task EnsureDemoOnWayLoadAsync(
        YukleDbContext db,
        int customerId,
        int driverId,
        CancellationToken ct)
    {
        var onWayDemo = await db.Loads
            .FirstOrDefaultAsync(
                l => l.UserId == customerId
                     && l.DriverId == driverId
                     && l.Status == LoadStatus.OnWay
                     && l.Description.StartsWith(DemoMarker),
                ct);
        if (onWayDemo is not null) return;

        var candidate = await db.Loads
            .Where(l =>
                l.UserId == customerId
                && l.Description.StartsWith(DemoMarker)
                && l.Status != LoadStatus.Delivered
                && l.Status != LoadStatus.Cancelled)
            .OrderByDescending(l => l.CreatedAt)
            .FirstOrDefaultAsync(ct);
        if (candidate is null) return;

        candidate.DriverId = driverId;
        candidate.Status = LoadStatus.OnWay;
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Demo canlı takip: Antalya–Konya güzergahında örnek şoför konumu.</summary>
    private static async Task EnsureDemoDriverLocationAsync(
        YukleDbContext db,
        User driver,
        int customerId,
        CancellationToken ct)
    {
        var hasOnWay = await db.Loads.AnyAsync(
            l => l.UserId == customerId
                 && l.DriverId == driver.Id
                 && l.Status == LoadStatus.OnWay,
            ct);
        if (!hasOnWay) return;

        var now = DateTime.UtcNow;
        var simulatedMinutesAgo = 10 + (now.Minute % 6); // 10..15 dk arası güncellenmiş gibi

        driver.LastKnownLatitude = DemoAnkaraLat;
        driver.LastKnownLongitude = DemoAnkaraLng;
        driver.LastLocationUpdate = now.AddMinutes(-simulatedMinutesAgo);
        await db.SaveChangesAsync(ct);
    }

    private sealed record DemoLoadSpec(
        string FromCity,
        string FromDistrict,
        string ToCity,
        string ToDistrict,
        double FromLat,
        double FromLng,
        double ToLat,
        double ToLng,
        LoadStatus Status,
        int? DriverId,
        VehicleType VehicleType,
        LoadType LoadType,
        double WeightKg,
        double VolumeM3,
        decimal ListPrice,
        decimal? BidAmount);
}
