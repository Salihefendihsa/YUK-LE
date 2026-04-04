using Microsoft.AspNetCore.SignalR;
using Yukle.Api.BackgroundServices;
using Yukle.Api.DTOs;
using Yukle.Api.Hubs;

namespace Yukle.Api.Services;

/// <summary>
/// Gemini AI tabanlı navlun fiyatlandırma servisi.
/// İki mod sunar:
/// <list type="bullet">
///   <item><b>Senkron</b> — <c>GetPriceSuggestionAsync</c>: doğrudan Gemini çağrısı (Polly korumalı).</item>
///   <item><b>Kuyruklu</b> — <c>EnqueuePriceSuggestionAsync</c>: HTTP 202 döner, sonuç SignalR ile gelir.</item>
/// </list>
/// Her iki modda da fiyat belirlendikten sonra <c>PriceAnalyzed</c> SignalR bildirimi gönderilir.
/// </summary>
public class AiPricingService(
    IGeminiService               geminiClient,
    GeminiTaskQueue              queue,
    IHubContext<NotificationHub> hubContext)
{
    private readonly IGeminiService               _geminiClient = geminiClient;
    private readonly GeminiTaskQueue              _queue        = queue;
    private readonly IHubContext<NotificationHub> _hubContext   = hubContext;

    // ── Senkron ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Lojistik parametrelerini Gemini Pro'ya (Navlun Uzmanı) doğrudan göndererek fiyat önerisi döner.
    /// Polly resilience pipeline (Retry + CB + Timeout) otomatik devrededir.
    /// <para>
    /// <paramref name="userId"/> verilirse, fiyat belirlendikten hemen sonra
    /// <c>PriceAnalyzed</c> SignalR bildirimi kullanıcı grubuna fırlatılır.
    /// </para>
    /// </summary>
    /// <param name="userId">Bildirim gönderilecek kullanıcı ID'si (opsiyonel).</param>
    /// <param name="route">Güzergah bağlamı — bölgesel faktörleri Gemini'ye bildirir (opsiyonel).</param>
    public async Task<AiPriceSuggestionDto> GetPriceSuggestionAsync(
        double  distance,
        string  vehicleType,
        decimal fuelPrice,
        double  weight,
        string? userId = null,
        string? route  = null)
    {
        var result = await _geminiClient.GetPriceSuggestionAsync(
            distance, vehicleType, fuelPrice, weight, route);

        // Fiyat belirlendi — kullanıcıya anlık bildirim
        if (!string.IsNullOrEmpty(userId))
        {
            try
            {
                await _hubContext.Clients.Group(userId)
                    .SendAsync("PriceAnalyzed", new
                    {
                        Message          = $"Fiyat Analiz Edildi: {result.RecommendedPrice:N0} TL",
                        RecommendedPrice = result.RecommendedPrice,
                        MinPrice         = result.MinPrice,
                        MaxPrice         = result.MaxPrice,
                        Reasoning        = result.Reasoning,
                        VehicleType      = vehicleType,
                        DistanceKm       = distance
                    });
            }
            catch
            {
                // SignalR hatası ana akışı engellemez.
            }
        }

        return result;
    }

    // ── Kuyruklu (fire-and-forget + SignalR geri bildirim) ────────────────────

    /// <summary>
    /// Fiyat analizi görevini kuyruğa ekler ve hemen döner.
    /// Kullanıcıya "Sıraya alındı..." bildirimi anında gönderilir.
    /// Sonuç <c>GeminiPriceResult</c> + <c>PriceAnalyzed</c> SignalR olayları ile iletilir.
    /// </summary>
    /// <param name="route">Güzergah bağlamı (opsiyonel).</param>
    public async Task EnqueuePriceSuggestionAsync(
        double  distance,
        string  vehicleType,
        decimal fuelPrice,
        double  weight,
        string  userId,
        string? route             = null,
        CancellationToken ct      = default)
    {
        await _hubContext.Clients.Group(userId)
            .SendAsync("GeminiTaskQueued", new
            {
                Message       = "Fiyat analizi sıraya alındı...",
                QueuePosition = _queue.PriceQueueCount + 1
            }, ct);

        await _queue.EnqueuePriceAsync(new PriceAnalysisWorkItem
        {
            UserId      = userId,
            Distance    = distance,
            VehicleType = vehicleType,
            FuelPrice   = fuelPrice,
            Weight      = weight,
            Route       = route
        }, ct);
    }

    /// <summary>
    /// OCR / evrak analizi görevini kuyruğa ekler ve hemen döner.
    /// OCR kanalı fiyat kanalından düşük önceliklidir; ağır işlemler için ayrı kanal.
    /// Sonuç <c>GeminiOcrResult</c> SignalR eventi ile iletilir.
    /// </summary>
    public async Task EnqueueOcrAsync(
        byte[]            imageBytes,
        string            userId,
        DocumentType      documentType = DocumentType.DriverLicense,
        string            mimeType     = "image/jpeg",
        CancellationToken ct           = default)
    {
        var docLabel = documentType switch
        {
            DocumentType.SrcCertificate      => "SRC belgesi",
            DocumentType.VehicleRegistration => "araç ruhsatı",
            _                                => "ehliyet"
        };

        await _hubContext.Clients.Group(userId)
            .SendAsync("GeminiTaskQueued", new
            {
                Message       = $"{docLabel} analizi sıraya alındı...",
                QueuePosition = _queue.OcrQueueCount + 1
            }, ct);

        await _queue.EnqueueOcrAsync(new OcrWorkItem
        {
            UserId       = userId,
            ImageBytes   = imageBytes,
            DocumentType = documentType,
            MimeType     = mimeType
        }, ct);
    }
}
