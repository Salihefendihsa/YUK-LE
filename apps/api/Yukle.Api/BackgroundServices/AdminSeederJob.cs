using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var env = scope.ServiceProvider.GetRequiredService<IHostEnvironment>();

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
            // Admin şifresi config'ten (Seed:AdminPassword) okunur; yoksa Admin123! fallback.
            // YALNIZCA admin YOKSA (ilk kurulum) uygulanır — mevcut admin'in şifresine DOKUNULMAZ.
            var adminPassword = config["Seed:AdminPassword"];
            if (string.IsNullOrWhiteSpace(adminPassword)) adminPassword = "Admin123!";

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
                    // Şifre YALNIZ oluşturma anında set edilir; sonraki açılışlarda korunur.
                    PasswordHash = Encoding.UTF8.GetBytes(BCrypt.Net.BCrypt.HashPassword(adminPassword)),
                    PasswordSalt = Array.Empty<byte>(),
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
                logger.LogInformation("AdminSeeder: mevcut admin bulundu — şifre KORUNUYOR, yalnız erişim bayrakları doğrulanıyor.");
            }

            // Şifre yalnız oluşturma anında set edildi (yukarıda). Mevcut admin'in şifresi
            // her açılışta sıfırlanmaz. Aşağıdakiler operatörü kilitlememek için güvenlik teyidi
            // (admin hesabı her zaman erişilebilir kalır).
            adminUser.IsActive = true;
            adminUser.IsPhoneVerified = true;
            adminUser.ApprovalStatus = ApprovalStatus.Active;
            // Var olan admin'in role'ü manuel değiştirilmiş olabilir — emniyet:
            adminUser.Role = UserRole.Admin;

            // Admin'i ÖNCE commit et — test users seed'inde collision olursa
            // (5000000001 / 5000000002 başka kayıtta varsa) tek transaction'da
            // batch rollback admin'i de geri alıyordu. Ayrı SaveChanges = izolasyon.
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation(
                "AdminSeeder: admin ({Email}) başarıyla seed edildi.", adminEmail);

            // Test users best-effort — YALNIZCA Development ortamında seed edilir.
            // Development dışında (ör. Production) seed ATLANIR; mevcut hesaplara DOKUNULMAZ (silinmez).
            if (env.IsDevelopment())
            {
                try
                {
                    await UpsertTestUsersAsync(db, cancellationToken);
                    await db.SaveChangesAsync(cancellationToken);
                    logger.LogInformation("AdminSeeder: test kullanıcıları seed edildi (Development).");
                }
                catch (Exception testEx)
                {
                    logger.LogWarning(testEx,
                        "AdminSeeder: test kullanıcıları seed edilemedi (muhtemelen phone collision: " +
                        "5000000001/5000000002 başka kayıtta). Admin login etkilenmedi.");
                }
            }
            else
            {
                logger.LogInformation(
                    "AdminSeeder: Development dışı ortam ({Env}) — test kullanıcıları seed EDİLMEDİ, mevcutlara dokunulmadı.",
                    env.EnvironmentName);
            }
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
