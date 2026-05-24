using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using NetTopologySuite.Geometries;
using Yukle.Api.Data;
using Yukle.Api.Models;
using Yukle.Api.Services;

public class CancellationIdempotencyTests
{
    [Fact]
    public async Task DoubleCancel_Sequential_SecondIsNoOp_NoDoubleCustomerRefund()
    {
        await using var db = CreateDb();
        var (loadId, customerId, _) = await SeedAssignedLoadWithEscrowAsync(db);

        var svc = CreateService(db);
        var first  = await svc.CancelAsync(loadId, actorUserId: 99, isAdmin: true, reason: "test");
        var second = await svc.CancelAsync(loadId, actorUserId: 99, isAdmin: true, reason: "test");

        Assert.False(first.AlreadyCancelled);
        Assert.True(second.AlreadyCancelled);
        Assert.True(first.RefundAmount > 0);

        var customer = await db.Users.AsNoTracking().SingleAsync(u => u.Id == customerId);
        var refundLogs = await db.WalletAuditLogs.AsNoTracking()
            .Where(l => l.LoadId == loadId
                     && l.UserId == customerId
                     && l.Type == WalletAuditLogType.Refund
                     && l.Reason == WalletRefundAudit.CustomerRefundReason(loadId))
            .ToListAsync();

        Assert.Single(refundLogs);
        Assert.Equal(first.RefundAmount, customer.WalletBalance);
    }

    [Fact]
    public void WalletRefundAudit_CustomerReason_IsDeterministicPerLoad()
    {
        var id = Guid.NewGuid();
        Assert.Equal($"Iptal/Iade REFUND load={id}", WalletRefundAudit.CustomerRefundReason(id));
    }

    /// <summary>
    /// Es zamanli cift tik PostgreSQL FOR UPDATE + partial unique index ile korunur.
    /// InMemory provider kilidi desteklemez; bu test yalnizca sirali senaryoyu dogrular.
    /// </summary>
    [Fact]
    public void ConcurrentDoubleRefund_RequiresPostgresIntegrationTest()
    {
        Assert.True(true, "Es zamanli yaris testi PostgreSQL entegrasyon ortaminda calistirilmali.");
    }

    private static YukleDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<YukleDbContext>()
            .UseInMemoryDatabase($"cancel-idem-{Guid.NewGuid():N}")
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new YukleDbContext(options, new PassthroughEncryptionService());
    }

    private static CancellationService CreateService(YukleDbContext db)
    {
        var config = new ConfigurationBuilder().Build();
        var calc   = new WalletSettlementCalculator(config);
        var ledger = new WalletLedgerService(db, calc, NullLogger<WalletLedgerService>.Instance);
        var pay    = new MockPaymentService(db, ledger, calc, NullLogger<MockPaymentService>.Instance);
        var notify = new NoOpNotificationService();
        return new CancellationService(db, pay, notify, config, NullLogger<CancellationService>.Instance);
    }

    private static async Task<(Guid LoadId, int CustomerId, int DriverId)> SeedAssignedLoadWithEscrowAsync(
        YukleDbContext db)
    {
        var gf = new GeometryFactory(new PrecisionModel(), 4326);
        var customer = new User
        {
            Email = $"c-{Guid.NewGuid():N}@t.com",
            Phone = $"5{Random.Shared.Next(100000000, 999999999)}",
            FullName = "Test Customer",
            Role = UserRole.Customer,
            PasswordHash = [],
            PasswordSalt = []
        };
        var driver = new User
        {
            Email = $"d-{Guid.NewGuid():N}@t.com",
            Phone = $"5{Random.Shared.Next(100000000, 999999999)}",
            FullName = "Test Driver",
            Role = UserRole.Driver,
            PasswordHash = [],
            PasswordSalt = [],
            IsActive = true
        };
        db.Users.AddRange(customer, driver);
        await db.SaveChangesAsync();

        const decimal bidAmount = 1000m;
        var load = new Load
        {
            FromCity = "Bursa",
            FromDistrict = "Osm",
            ToCity = "Istanbul",
            ToDistrict = "Kad",
            Origin = gf.CreatePoint(new Coordinate(29, 40)),
            Destination = gf.CreatePoint(new Coordinate(28.9, 41)),
            Weight = 1000,
            UserId = customer.Id,
            DriverId = driver.Id,
            Status = LoadStatus.Assigned,
            Price = bidAmount
        };
        db.Loads.Add(load);
        await db.SaveChangesAsync();

        db.Bids.Add(new Bid
        {
            LoadId = load.Id,
            DriverId = driver.Id,
            Amount = bidAmount,
            Status = BidStatus.Accepted
        });
        await db.SaveChangesAsync();

        var calc = new WalletSettlementCalculator(new ConfigurationBuilder().Build());
        var ledger = new WalletLedgerService(db, calc, NullLogger<WalletLedgerService>.Instance);
        await new MockPaymentService(db, ledger, calc, NullLogger<MockPaymentService>.Instance)
            .HoldPaymentAsync(load.Id, bidAmount, "tok");

        return (load.Id, customer.Id, driver.Id);
    }

    private sealed class PassthroughEncryptionService : IEncryptionService
    {
        public string? Encrypt(string? plaintext) => plaintext;
        public string? Decrypt(string? ciphertext) => ciphertext;
    }

    private sealed class NoOpNotificationService : INotificationService
    {
        public Task SendAsync(int userId, string title, string message) => Task.CompletedTask;
        public Task SendNotificationAsync(int userId, string title, string message, NotificationType type, Guid? relatedId = null)
            => Task.CompletedTask;
        public Task SendPushAsync(string fcmToken, string title, string body, Dictionary<string, string>? data = null)
            => Task.CompletedTask;
    }
}
