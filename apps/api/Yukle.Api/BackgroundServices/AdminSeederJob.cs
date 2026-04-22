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

            // 1. Admin varlık kontrolü (Performance: Sadece Role=Admin olan kayıt var mı)
            bool adminExists = await db.Users.AnyAsync(u => u.Role == UserRole.Admin, cancellationToken);
            if (adminExists)
            {
                logger.LogInformation("AdminSeeder: Sistemde Admin kullanıcısı mevcuttur, seeding atlandı.");
                return;
            }

            // 2. İlk Admin'in oluşturulması
            logger.LogWarning("AdminSeeder: Sistemde hiç Admin bulunamadı. Varsayılan süper admin oluşturuluyor...");

            string rawPassword = "Admin123!";
            byte[] passwordHash = Encoding.UTF8.GetBytes(BCrypt.Net.BCrypt.HashPassword(rawPassword));

            var adminUser = new User
            {
                FullName        = "System Administrator",
                Email           = "admin@yuk-le.com",
                Phone           = "+900000000000",   // Standart bir placeholder
                Role            = UserRole.Admin,
                IsActive        = true,              // Admin otomatik aktiftir
                ApprovalStatus  = ApprovalStatus.Active,
                PasswordHash    = passwordHash,
                PasswordSalt    = Array.Empty<byte>(),
                CreatedAt       = DateTime.UtcNow,
                IsPhoneVerified = true               // OTP'ye takılmamak için
            };

            await db.Users.AddAsync(adminUser, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            logger.LogWarning(
                "AdminSeeder: Başarıyla oluşturuldu! [Email: {Email}] — Lütfen production ortamında şifreyi değiştirin.",
                adminUser.Email);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "AdminSeeder çalışırken beklenmeyen bir hata oluştu.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
