using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Yukle.Api.Data;
using Yukle.Api.Models;
using Yukle.Api.Services;

namespace Yukle.Api.BackgroundServices;

/// <summary>
/// <b>Emanet Backfill (Idempotent, Best-Effort)</b>
/// <para>
/// Atanmış/yolda olup (Assigned/OnWay/Arrived) henüz bir emanet (Blocked
/// <c>PaymentTransaction</c>) kaydı bulunmayan eski yükler için emanet üretir.
/// Böylece bu özellik öncesi oluşmuş demo yükler (ör. İstanbul→Kocaeli) de
/// "emanette" görünür.
/// </para>
/// <para>
/// <see cref="IPaymentService.HoldPaymentAsync"/> zaten idempotenttir (mevcut
/// Blocked ödeme varsa atlar); bu iş her başlangıçta güvenle çalışır. Hatalar
/// yutulur — uygulama başlatması ASLA bu işe bağlı çökmez.
/// </para>
/// </summary>
public sealed class PaymentBackfillJob(
    IServiceScopeFactory       scopeFactory,
    ILogger<PaymentBackfillJob> logger) : IHostedService
{
    private static readonly LoadStatus[] EscrowStates =
        { LoadStatus.Assigned, LoadStatus.OnWay, LoadStatus.Arrived };

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db      = scope.ServiceProvider.GetRequiredService<YukleDbContext>();
            var payment = scope.ServiceProvider.GetRequiredService<IPaymentService>();

            // Emanet aşamasındaki, atanmış ve henüz Blocked ödemesi olmayan yükler.
            var candidates = await db.Loads.AsNoTracking()
                .Where(l => EscrowStates.Contains(l.Status) && l.DriverId != null)
                .Where(l => !db.PaymentTransactions.Any(p => p.LoadId == l.Id && p.Status == PaymentStatus.Blocked))
                .Select(l => l.Id)
                .ToListAsync(cancellationToken);

            if (candidates.Count == 0)
            {
                logger.LogInformation("PaymentBackfill: emanet üretilecek yük yok.");
                return;
            }

            int created = 0;
            foreach (var loadId in candidates)
            {
                try
                {
                    var bidAmount = await db.Bids.AsNoTracking()
                        .Where(b => b.LoadId == loadId && b.Status == BidStatus.Accepted)
                        .Select(b => (decimal?)b.Amount)
                        .FirstOrDefaultAsync(cancellationToken);

                    if (bidAmount is not decimal amount || amount <= 0)
                    {
                        // Kabul edilmiş teklif yoksa ilan fiyatına düş.
                        amount = await db.Loads.AsNoTracking()
                            .Where(l => l.Id == loadId).Select(l => l.Price)
                            .FirstOrDefaultAsync(cancellationToken);
                    }

                    if (amount <= 0) continue;

                    if (await payment.HoldPaymentAsync(loadId, amount, "backfill"))
                        created++;
                }
                catch (Exception exItem)
                {
                    logger.LogWarning(exItem, "PaymentBackfill: Load={LoadId} için emanet üretilemedi (atlandı).", loadId);
                }
            }

            logger.LogInformation(
                "PaymentBackfill: {Created}/{Total} yük için emanet üretildi.", created, candidates.Count);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "PaymentBackfill: genel hata — atlandı (best-effort).");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
