using Microsoft.AspNetCore.SignalR;
using Yukle.Api.DTOs;
using Yukle.Api.Hubs;
using Yukle.Api.Services;

namespace Yukle.Api.BackgroundServices;

/// <summary>
/// Gemini görev kuyruklarını sürekli izleyen arka plan servisi.
///
/// İşlem önceliği: Fiyat kanalı tamamen boşalana kadar OCR kanalına geçilmez.
///
/// Throttle: Gemini ücretsiz kotasını (15 RPM Pro / 60 RPM Flash) korumak için
/// her istek arasında <see cref="ThrottleDelay"/> kadar beklenir.
/// Mevcut Polly pipeline (Retry + CB + Timeout) kuyruktan çıkan her
/// istek için otomatik olarak devreye girer.
/// </summary>
public sealed class GeminiQueueProcessor(
    GeminiTaskQueue               queue,
    IHubContext<NotificationHub>  hubContext,
    IServiceScopeFactory          scopeFactory,
    ILogger<GeminiQueueProcessor> logger) : BackgroundService
{
    // 2 saniye aralık → ~30 RPM; Gemini Pro ücretsiz kota için güvenli marj.
    private static readonly TimeSpan ThrottleDelay = TimeSpan.FromSeconds(2);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "GeminiQueueProcessor started. Throttle: {Delay}s/request.",
            ThrottleDelay.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            // ── Önce Fiyat kanalını tamamen boşalt ────────────────────────
            while (queue.TryReadPrice(out var priceItem))
            {
                await ProcessAsync(priceItem!, stoppingToken);
                await DelayAsync(ThrottleDelay, stoppingToken);
            }

            // ── Ardından tek OCR işle, sonra fiyat kontrolüne dön ─────────
            if (queue.TryReadOcr(out var ocrItem))
            {
                await ProcessAsync(ocrItem!, stoppingToken);
                await DelayAsync(ThrottleDelay, stoppingToken);
                continue;
            }

            // ── Her iki kuyruk boş: yeni iş gelene kadar blokla ──────────
            // İki kanaldan hangisi önce yazılırsa oradan devam edilir.
            // LinkedCts ile kazanan kanal okununca kaybeden iptal edilir.
            try
            {
                using var linkedCts = CancellationTokenSource
                    .CreateLinkedTokenSource(stoppingToken);

                var waitPrice = queue.WaitForPriceAsync(linkedCts.Token).AsTask();
                var waitOcr   = queue.WaitForOcrAsync(linkedCts.Token).AsTask();

                await Task.WhenAny(waitPrice, waitOcr);
                await linkedCts.CancelAsync();    // Kaybeden bekleyiciyi iptal et
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch
            {
                // LinkedCts iptalinden gelen OperationCanceledException — yoksay.
            }
        }

        logger.LogInformation("GeminiQueueProcessor stopped.");
    }

    // ── İş Kalemi İşleyici ────────────────────────────────────────────────────

    private async Task ProcessAsync(GeminiWorkItem item, CancellationToken ct)
    {
        logger.LogDebug(
            "Processing Gemini {Type} for user {UserId}. Queue depth: Price={P} OCR={O}.",
            item.Type, item.UserId, queue.PriceQueueCount, queue.OcrQueueCount);

        try
        {
            // Scoped IGeminiService — scope başına taze instance; HttpClient factory'den gelir.
            using var scope        = scopeFactory.CreateScope();
            var       geminiClient = scope.ServiceProvider
                                         .GetRequiredService<IGeminiService>();

            switch (item)
            {
                // ── Fiyat Analizi ──────────────────────────────────────────
                case PriceAnalysisWorkItem p:
                {
                    var result = await geminiClient.GetPriceSuggestionAsync(
                        p.Distance, p.VehicleType, p.FuelPrice, p.Weight, route: p.Route);

                    // Tam sonuç (Flutter UI güncellemesi için)
                    await PushAsync(item.UserId, "GeminiPriceResult", result, ct);

                    // Kullanıcı dostu bildirim
                    await PushAsync(item.UserId, "PriceAnalyzed", new
                    {
                        Message          = $"Fiyat Analiz Edildi: {result.RecommendedPrice:N0} TL",
                        RecommendedPrice = result.RecommendedPrice,
                        MinPrice         = result.MinPrice,
                        MaxPrice         = result.MaxPrice,
                        Reasoning        = result.Reasoning,
                        VehicleType      = p.VehicleType,
                        DistanceKm       = p.Distance
                    }, ct);

                    logger.LogInformation(
                        "Gemini Price (Navlun Uzmanı): {Rec} TL for user {UserId} " +
                        "({Dist}km {Vehicle}{RouteCtx}).",
                        result.RecommendedPrice, item.UserId, p.Distance, p.VehicleType,
                        p.Route is not null ? $" via {p.Route}" : string.Empty);
                    break;
                }

                // ── OCR Analizi ────────────────────────────────────────────
                case OcrWorkItem o:
                {
                    var result = await geminiClient.AnalyzeDocumentAsync(
                        o.ImageBytes, o.DocumentType, o.MimeType);

                    await PushAsync(item.UserId, "GeminiOcrResult", result, ct);

                    logger.LogInformation(
                        "Gemini OCR completed for user {UserId}. DocType: {DocType}.",
                        item.UserId, o.DocumentType);
                    break;
                }
            }
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Gemini {Type} failed for user {UserId}.", item.Type, item.UserId);

            // Hata bildirimini kullanıcıya ilet — asla sessiz başarısız olma.
            await PushAsync(item.UserId, "GeminiTaskFailed", new
            {
                Type    = item.Type.ToString(),
                Message = "AI analizi başarısız oldu. Matematiksel model devrede."
            }, ct);
        }
    }

    // ── Yardımcılar ───────────────────────────────────────────────────────────

    private async Task PushAsync(string userId, string eventName, object payload, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            await hubContext.Clients.Group(userId).SendAsync(eventName, payload, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex,
                "SignalR push '{Event}' to user {UserId} failed.", eventName, userId);
        }
    }

    private static async Task DelayAsync(TimeSpan delay, CancellationToken ct)
    {
        try   { await Task.Delay(delay, ct); }
        catch (OperationCanceledException) { throw; }
    }
}
