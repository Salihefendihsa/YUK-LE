using Microsoft.EntityFrameworkCore;
using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Yukle.Api.Data;
using Yukle.Api.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Yukle.Api.BackgroundServices;

/// <summary>
/// <b>Phase 2.5.7 — İlk Admin Kurulumu (Idempotent Seeder)</b>
/// <para>
/// Uygulama her başladığında çalışır ancak veritabanında daha önce oluşturulmuş 
/// bir admin (UserRole.Admin) varsa hiçbir işlem yapmaz (idempotent).
/// Sistemin ilk kurulumunda varsayılan yöneticiyi ayağa kaldırmaktan sorumludur.
/// </para>
/// </summary>
public sealed class AdminSeederJob(
    IServiceScopeFactory        scopeFactory,
    ILogger<AdminSeederJob>     logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<YukleDbContext>();

            string adminPassword = "Admin123!";
            byte[] adminPasswordHash = Encoding.UTF8.GetBytes(BCrypt.Net.BCrypt.HashPassword(adminPassword));

            var adminUser = await db.Users.SingleOrDefaultAsync(u => u.Email == "admin@yuk-le.com", cancellationToken);
            if (adminUser is null)
            {
                adminUser = new User
                {
                    FullName = "System Administrator",
                    Email = "admin@yuk-le.com",
                    Phone = "+900000000000",
                    Role = UserRole.Admin,
                    CreatedAt = DateTime.UtcNow
                };
                await db.Users.AddAsync(adminUser, cancellationToken);
            }

            adminUser.PasswordHash = adminPasswordHash;
            adminUser.PasswordSalt = Array.Empty<byte>();
            adminUser.IsActive = true;
            adminUser.IsPhoneVerified = true;
            adminUser.ApprovalStatus = ApprovalStatus.Active;

            await UpsertTestUsersAsync(db, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            logger.LogWarning("AdminSeeder: Admin ve test kullanıcıları başarıyla güncellendi.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "AdminSeeder çalışırken beklenmeyen bir hata oluştu.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static async Task UpsertTestUsersAsync(YukleDbContext db, CancellationToken cancellationToken)
    {
        byte[] testPasswordHash = Encoding.UTF8.GetBytes(BCrypt.Net.BCrypt.HashPassword("Test123!"));

        var testCustomer = await db.Users.SingleOrDefaultAsync(u => u.Email == "test@yukle.com", cancellationToken);
        if (testCustomer is null)
        {
            testCustomer = new User
            {
                FullName = "Test Müşteri A.Ş.",
                Email = "test@yukle.com",
                Phone = "5000000001",
                Role = UserRole.Customer,
                CreatedAt = DateTime.UtcNow
            };
            await db.Users.AddAsync(testCustomer, cancellationToken);
        }

        testCustomer.FullName = "Test Müşteri A.Ş.";
        testCustomer.PasswordHash = testPasswordHash;
        testCustomer.PasswordSalt = Array.Empty<byte>();
        testCustomer.IsActive = true;
        testCustomer.IsPhoneVerified = true;
        testCustomer.ApprovalStatus = ApprovalStatus.Active;

        var testDriver = await db.Users.SingleOrDefaultAsync(u => u.Email == "sofor@yukle.com", cancellationToken);
        if (testDriver is null)
        {
            testDriver = new User
            {
                FullName = "Test Şoför",
                Email = "sofor@yukle.com",
                Phone = "5000000002",
                Role = UserRole.Driver,
                CreatedAt = DateTime.UtcNow
            };
            await db.Users.AddAsync(testDriver, cancellationToken);
        }

        testDriver.FullName = "Test Şoför";
        testDriver.PasswordHash = testPasswordHash;
        testDriver.PasswordSalt = Array.Empty<byte>();
        testDriver.IsActive = true;
        testDriver.IsPhoneVerified = true;
        testDriver.ApprovalStatus = ApprovalStatus.Active;
    }
}
