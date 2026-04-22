using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Yukle.Api.Data;
using Yukle.Api.Models;

namespace Yukle.Api.BackgroundServices;

/// <summary>
/// <b>Faz 4.3 — U-ETDS Bildirim İşçisi (Outbox Pattern)</b>
/// <para>
/// Belli aralıklarla veritabanındaki UetdsOutbox tablosunu kontrol eder.
/// Gönderilmemiş (Pending) bildirimleri mock bir Bakanlık API'sine iletir.
/// Başarılı olursa Sent işaretler, hata olursa RetryCount'u arttırır.
/// </para>
/// </summary>
public sealed class UetdsBackgroundWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<UetdsBackgroundWorker> _logger;
    private readonly HttpClient _httpClient; // Simülasyon için
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(2); // Normalde 5dk, testi hızlandırmak için 2dk

    public UetdsBackgroundWorker(IServiceScopeFactory scopeFactory, ILogger<UetdsBackgroundWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _httpClient = new HttpClient();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("U-ETDS Background Worker başlatıldı.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessOutboxMessagesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "U-ETDS bildirimlerini işlerken beklenmeyen hata oluştu.");
            }

            // Belirlenen süre kadar uyu
            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("U-ETDS Background Worker durduruluyor.");
    }

    private async Task ProcessOutboxMessagesAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<YukleDbContext>();

        // Fail olmuş ama hala retry hakkı olan (Max 3) ve hiç gönderilmemişleri getir
        var pendingMessages = await db.UetdsOutboxes
            .Where(o => o.Status == OutboxStatus.Pending || (o.Status == OutboxStatus.Failed && o.RetryCount < 3))
            .OrderBy(o => o.CreatedAt)
            .Take(50) // Batch processing
            .ToListAsync(stoppingToken);

        if (pendingMessages.Count == 0) return;

        _logger.LogInformation("U-ETDS Bildirimi: {Count} kayıt işlenmek üzere çekildi.", pendingMessages.Count);

        foreach (var message in pendingMessages)
        {
            try
            {
                // ── MOCK BİLDİRİM API ÇAĞRISI ────────────────────────────
                // Gerçek bir senaryoda bakanlık U-ETDS SOAP veya REST uç noktasına istek atılır.
                _logger.LogInformation("U-ETDS'ye gönderiliyor... LoadId={LoadId}, Retry={Retry}", message.LoadId, message.RetryCount);
                
                // Simüle edilmiş bekleme süresi ve HTTP isteği taklidi
                await Task.Delay(200, stoppingToken); 
                
                // Zaman zaman hataları simüle etmek için rastgele fail (opsiyonel, şu an hep başarılı sayıyoruz)
                bool mockApiSuccess = true; 

                if (mockApiSuccess)
                {
                    message.Status = OutboxStatus.Sent;
                    message.ProcessedAt = DateTime.UtcNow;
                    _logger.LogInformation("U-ETDS Bildirimi Başarılı: LoadId={LoadId}", message.LoadId);
                }
                else
                {
                    throw new Exception("Bakanlık servisi HTTP 503 Service Unavailable döndü.");
                }
            }
            catch (Exception ex)
            {
                message.RetryCount++;
                message.LastErrorMessage = ex.Message;
                
                if (message.RetryCount >= 3)
                {
                    message.Status = OutboxStatus.Failed;
                    _logger.LogError("U-ETDS Bildirimi tamamen iptal edildi (Maksimum deneme). LoadId={LoadId}, Hata: {Error}", message.LoadId, ex.Message);
                }
                else
                {
                    // Bir sonraki tick'te tekrar denenmesi için Pending (veya Retryable özel statüsü) bırakılabilir 
                    // Ancak bizim sorgumuz o.Status == Failed && RetryCount < 3 olduğu için Failed yapıyoruz.
                    message.Status = OutboxStatus.Failed;
                    _logger.LogWarning("U-ETDS Bildirimi başarısız oldu, tekrar denenecek. LoadId={LoadId}", message.LoadId);
                }
            }
        }

        await db.SaveChangesAsync(stoppingToken);
    }
}
