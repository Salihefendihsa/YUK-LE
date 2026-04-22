using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.Models;

namespace Yukle.Api.BackgroundServices;

/// <summary>
/// <b>Phase 2.3 — KVKK Veri Saklama ve Temizlik Politikası (Data Retention Job)</b>
/// <para>
/// Her gün <c>DocumentCleanup:RunHour</c> (varsayılan: 02:00 UTC) saatinde çalışır.
/// Onaylanmamış veya inceleme sürecinde takılı kalan kullanıcı kayıtlarını tespit eder
/// ve saklama süresi (<c>DocumentCleanup:RetentionDays</c>, varsayılan: 30 gün) dolduktan
/// sonra veritabanından güvenli biçimde siler.
/// </para>
/// <para>
/// <b>Temizlenen kayıtlar:</b>
/// <list type="bullet">
///   <item><c>ApprovalStatus = PendingReview</c> — AI kararsız kaldı, admin inceleme kuyruğunda.</item>
///   <item><c>ApprovalStatus = Rejected</c> — AI belgeler reddetti; kullanıcı yeniden başvurmadı.</item>
/// </list>
/// </para>
/// <para>
/// <b>Güvenlik:</b> Cascade delete (User → Load, Vehicle, Bid, Notification) ile
/// ilişkili tüm veriler atomik olarak temizlenir. Silme işlemi öncesi ve sonrası
/// ILogger ile raporlanır; hassas alan değerleri (isim/telefon) log'a yazılmaz.
/// </para>
/// </summary>
public sealed class DocumentCleanupJob(
    IServiceScopeFactory             scopeFactory,
    IConfiguration                   config,
    ILogger<DocumentCleanupJob>      logger) : BackgroundService
{
    // Kontrol döngüsü — her dakika saat kontrolü yapılır (CPU etkisi ihmal edilebilir).
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "DocumentCleanupJob başlatıldı. " +
            "Saklama süresi: {Days} gün | Çalışma saati (UTC): {Hour}:00",
            config.GetValue<int>("DocumentCleanup:RetentionDays", 30),
            config.GetValue<int>("DocumentCleanup:RunHour", 2));

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(CheckInterval, stoppingToken);

            var runHour = config.GetValue<int>("DocumentCleanup:RunHour", 2);
            var now     = DateTime.UtcNow;

            // Sadece belirlenen saatte (dakika 00-01 penceresinde) çalış
            if (now.Hour == runHour && now.Minute == 0)
            {
                await TryCleanupExpiredRecordsAsync(stoppingToken);

                // Aynı saat içinde çift tetiklenmeyi önlemek için 2 dakika bekle
                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
        }
    }

    // ── Core Cleanup Logic ─────────────────────────────────────────────────────

    private async Task TryCleanupExpiredRecordsAsync(CancellationToken ct)
    {
        var retentionDays = config.GetValue<int>("DocumentCleanup:RetentionDays", 30);
        var cutoffDate    = DateTime.UtcNow.AddDays(-retentionDays);

        logger.LogInformation(
            "KVKK Temizlik başladı (UTC {Time}). " +
            "Kesim tarihi: {Cutoff:yyyy-MM-dd} (>{Days} gün önce oluşturulanlar).",
            DateTime.UtcNow, cutoffDate, retentionDays);

        try
        {
            // BackgroundService singleton yaşam döngüsüne sahiptir; DbContext scoped'tır.
            // Her çalışmada yeni bir scope ve DbContext instance'ı oluşturulur.
            using var scope  = scopeFactory.CreateScope();
            var db           = scope.ServiceProvider.GetRequiredService<YukleDbContext>();

            // ── Silinecek kayıtları tespit et ──────────────────────────────────
            // Hassas alanlar (FullName, Phone) şifreli DB'de saklı olduğundan
            // bu sorgu sadece metadata alanlarını (Id, ApprovalStatus, CreatedAt) okur.
            // Alanların plaintext değerleri log'a yazılmaz (KVKK gereği).
            var statuses = new[]
            {
                ApprovalStatus.PendingReview,
                ApprovalStatus.Rejected
            };

            var expiredUsers = await db.Users
                .Where(u =>
                    statuses.Contains(u.ApprovalStatus) &&
                    u.CreatedAt < cutoffDate)
                .Select(u => new
                {
                    u.Id,
                    u.ApprovalStatus,
                    u.CreatedAt,
                    u.Role
                })
                .ToListAsync(ct);

            if (expiredUsers.Count == 0)
            {
                logger.LogInformation(
                    "KVKK Temizlik: Silinecek kayıt bulunamadı. İşlem atlandı.");
                return;
            }

            logger.LogWarning(
                "KVKK Temizlik: {Count} adet süresi dolmuş kayıt tespit edildi. " +
                "Silme işlemi başlıyor...",
                expiredUsers.Count);

            // ── Batch silme: 100'lük gruplar halinde (büyük veri setleri için) ──
            var expiredIds   = expiredUsers.Select(u => u.Id).ToList();
            const int batchSize = 100;
            int totalDeleted = 0;

            for (int i = 0; i < expiredIds.Count; i += batchSize)
            {
                ct.ThrowIfCancellationRequested();

                var batch = expiredIds.Skip(i).Take(batchSize).ToList();

                // EF Core Cascade Delete: User silinince ilişkili Load (sahip olduğu),
                // Vehicle, Bid ve Notification kayıtları da otomatik silinir.
                // (DeleteBehavior.Cascade DbContext'te yapılandırılmış — bkz. YukleDbContext)
                var batchCount = await db.Users
                    .Where(u => batch.Contains(u.Id))
                    .ExecuteDeleteAsync(ct);

                totalDeleted += batchCount;

                logger.LogInformation(
                    "KVKK Temizlik: Batch {BatchNo}/{TotalBatches} tamamlandı. " +
                    "Bu batch'te silinen: {Count}",
                    (i / batchSize) + 1,
                    (int)Math.Ceiling((double)expiredIds.Count / batchSize),
                    batchCount);
            }

            // ── Silme özet raporu ──────────────────────────────────────────────
            var byStatus = expiredUsers
                .GroupBy(u => u.ApprovalStatus)
                .Select(g => $"{g.Key}: {g.Count()} kayıt")
                .ToList();

            logger.LogWarning(
                "KVKK Temizlik TAMAMLANDI: Toplam {Total} kullanıcı kaydı silindi. " +
                "Dağılım: [{Distribution}]. " +
                "Kesim tarihi: {Cutoff:yyyy-MM-dd}. " +
                "İşlem saati: {Time:O}",
                totalDeleted,
                string.Join(", ", byStatus),
                cutoffDate,
                DateTime.UtcNow);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Uygulama kapanıyor — silme işlemi yarında kaldığında sorun değil,
            // bir sonraki çalışmada eksik kayıtları tamamlar.
            logger.LogWarning("KVKK Temizlik: Uygulama kapanışı sırasında işlem iptal edildi.");
        }
        catch (Exception ex)
        {
            // Silme hatası kritik değil — uygulamanın çalışmasını engellemez.
            // Bir sonraki çalışmada yeniden denenir.
            logger.LogError(ex,
                "KVKK Temizlik: Beklenmeyen hata. Bir sonraki periyotta yeniden denenecek.");
        }
    }
}
