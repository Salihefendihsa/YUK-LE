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

            const string adminEmail = "admin@navlonix.com";
            // Phone alanı User entity'de UNIQUE (YukleDbContext.HasIndex(Phone).IsUnique).
            // Eski seeder bu aday phone'u sabit kullanıyordu — başka bir kullanıcı
            // aynı numara ile kayıtlıysa SaveChanges UNIQUE violation atıyor ve
            // ADMIN HİÇ OLUŞMUYORDU. Aşağıdaki idempotent upsert:
            //   1) Email ile mevcut admin'i ara (Email de UNIQUE).
            //   2) Yoksa: aday phone'u collision check'le; gerekirse benzersiz
            //      synthetic phone (`admin-<guid>`) ile oluştur.
            //   3) Her durumda şifre + onay flag'leri güncelle.
            // Backend login `u.Phone == input || u.Email == input` dual-mode olduğu
            // için admin sadece email ile giriş yapar; phone'un değeri kritik değil.
            const string adminPhoneCandidate = "+900000000000";
            const string adminPassword = "Admin123!";
            byte[] adminPasswordHash = Encoding.UTF8.GetBytes(BCrypt.Net.BCrypt.HashPassword(adminPassword));

            var adminUser = await db.Users.SingleOrDefaultAsync(u => u.Email == adminEmail, cancellationToken);
            if (adminUser is null)
            {
                var candidatePhoneTaken = await db.Users
                    .AnyAsync(u => u.Phone == adminPhoneCandidate, cancellationToken);
                var adminPhone = candidatePhoneTaken
                    ? $"admin-{Guid.NewGuid():N}"
                    : adminPhoneCandidate;

                adminUser = new User
                {
                    FullName = "System Administrator",
                    Email = adminEmail,
                    Phone = adminPhone,
                    Role = UserRole.Admin,
                    CreatedAt = DateTime.UtcNow
                };
                await db.Users.AddAsync(adminUser, cancellationToken);

                if (candidatePhoneTaken)
                {
                    logger.LogWarning(
                        "AdminSeeder: aday telefon ({Candidate}) başka bir kullanıcıda kullanılıyor; " +
                        "admin için benzersiz synthetic phone atandı ({SyntheticPhone}). " +
                        "Admin yine email ile giriş yapar.",
                        adminPhoneCandidate, adminPhone);
                }
                else
                {
                    logger.LogInformation("AdminSeeder: yeni admin oluşturuldu (email={Email}).", adminEmail);
                }
            }
            else
            {
                logger.LogInformation("AdminSeeder: mevcut admin bulundu, kimlik bilgileri güncelleniyor.");
            }

            adminUser.PasswordHash = adminPasswordHash;
            adminUser.PasswordSalt = Array.Empty<byte>();
            adminUser.IsActive = true;
            adminUser.IsPhoneVerified = true;
            adminUser.ApprovalStatus = ApprovalStatus.Active;
            // Var olan admin'in role'ü manuel değiştirilmiş olabilir — emniyet:
            adminUser.Role = UserRole.Admin;

            await UpsertTestUsersAsync(db, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            logger.LogInformation(
                "AdminSeeder: admin ({Email}) ve test kullanıcıları başarıyla seed edildi.",
                adminEmail);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "AdminSeeder çalışırken hata: {Message}. Admin login muhtemelen çalışmayacak.",
                ex.Message);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static async Task UpsertTestUsersAsync(YukleDbContext db, CancellationToken cancellationToken)
    {
        byte[] testPasswordHash = Encoding.UTF8.GetBytes(BCrypt.Net.BCrypt.HashPassword("Test123!"));

        var testCustomer = await db.Users.SingleOrDefaultAsync(u => u.Email == "test@navlonix.com", cancellationToken);
        if (testCustomer is null)
        {
            testCustomer = new User
            {
                FullName = "Test Müşteri A.Ş.",
                Email = "test@navlonix.com",
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

        var testDriver = await db.Users.SingleOrDefaultAsync(u => u.Email == "sofor@navlonix.com", cancellationToken);
        if (testDriver is null)
        {
            testDriver = new User
            {
                FullName = "Test Şoför",
                Email = "sofor@navlonix.com",
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
