using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Yukle.Api.DTOs;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
[EnableRateLimiting("global-policy")]   // Phase 2.2: TokenBucket, 10 istek/sn
public sealed class AiController(
    GeminiServiceClient geminiClient,
    AiPricingService    aiPricingService,
    PricingService      pricingService,
    Data.YukleDbContext context) : ControllerBase
{
    // ── OCR: Evrak Analizi ────────────────────────────────────────────────────

    /// <summary>
    /// Yüklenen görsel dosyasını Gemini Flash multimodal modeline göndererek
    /// belge bilgilerini (ehliyet, SRC, ruhsat) JSON olarak döner.
    /// </summary>
    [HttpPost("ocr")]
    public async Task<IActionResult> AnalyzeDocument(
        IFormFile    file,
        [FromQuery] DocumentType docType = DocumentType.DriverLicense)
    {
        if (file is null || file.Length == 0)
            return BadRequest("Geçerli bir görsel yüklenmedi.");

        var mimeType = file.ContentType switch
        {
            "image/png"  => "image/png",
            "image/webp" => "image/webp",
            _            => "image/jpeg"
        };

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        var result = await geminiClient.AnalyzeDocumentAsync(ms.ToArray(), docType, mimeType);
        return Ok(result);
    }

    // ── Fiyat Analizi: Akıllı Senkron ────────────────────────────────────────

    /// <summary>
    /// Lojistik parametrelerden Gemini Pro ile anlık navlun fiyatı üretir.
    /// <para>
    /// <b>Akıllı Mod</b>: <c>OriginLat/Lng</c> + <c>DestLat/Lng</c> verilirse OSRM üzerinden
    /// gerçek karayolu mesafesi hesaplanır; <c>FromCity</c> verilirse DB'den güncel mazot fiyatı
    /// otomatik çekilir — elle mesafe veya yakıt fiyatı girmek gerekmez.
    /// </para>
    /// <para>
    /// <b>Manuel Mod</b>: Koordinat verilmezse <c>Distance</c> ve <c>FuelPrice</c> alanları kullanılır.
    /// </para>
    /// </summary>
    [HttpPost("price-suggestion")]
    public async Task<IActionResult> GetPriceSuggestion([FromBody] PriceAnalysisRequestDto request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        // Koordinatlar tam geldi → PricingService (OSRM + DB yakıt)
        if (request.HasCoordinates)
        {
            var result = await pricingService.GetSmartPriceAsync(
                originLat:         request.OriginLat!.Value,
                originLng:         request.OriginLng!.Value,
                destLat:           request.DestLat!.Value,
                destLng:           request.DestLng!.Value,
                vehicleType:       request.VehicleType,
                weightKg:          request.Weight,
                fromCity:          request.FromCity ?? string.Empty,
                toCity:            request.ToCity   ?? string.Empty,
                userId:            userId,
                manualDistanceKm:  null,
                fuelPriceOverride: request.FuelPrice);

            return Ok(result);
        }

        // Manuel mod — Distance zorunlu
        if (request.Distance is null or <= 0)
            return BadRequest("Koordinat verilmediğinde 'distance' alanı zorunludur.");

        // Şehir bilgisi varsa PricingService (DB yakıt, Haversine yok)
        if (!string.IsNullOrEmpty(request.FromCity))
        {
            var result = await pricingService.GetPriceWithAutoFuelAsync(
                distanceKm:        request.Distance.Value,
                vehicleType:       request.VehicleType,
                weightKg:          request.Weight,
                fromCity:          request.FromCity,
                toCity:            request.ToCity ?? string.Empty,
                userId:            userId,
                fuelPriceOverride: request.FuelPrice);

            return Ok(result);
        }

        // Geriye dönük uyumluluk — eski endpoint davranışı
        var fuelPrice = request.FuelPrice
                        ?? await pricingService.GetCurrentFuelPriceAsync("Türkiye");

        var legacyResult = await aiPricingService.GetPriceSuggestionAsync(
            request.Distance.Value,
            request.VehicleType,
            fuelPrice,
            request.Weight,
            userId:  userId,
            route:   request.Route);

        return Ok(legacyResult);
    }

    // ── Fiyat Analizi: Kuyruklu (fire-and-forget + SignalR geri bildirim) ─────

    /// <summary>
    /// Fiyat analizini kuyruğa ekler; HTTP 202 hemen döner.
    /// Sonuç <c>GeminiPriceResult</c> SignalR olayı ile kullanıcıya iletilir.
    /// </summary>
    [HttpPost("price-suggestion/enqueue")]
    public async Task<IActionResult> EnqueuePriceSuggestion([FromBody] PriceAnalysisRequestDto request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("Kullanıcı kimliği alınamadı.");

        if (request.Distance is null or <= 0 && !request.HasCoordinates)
            return BadRequest("Koordinat veya mesafe alanlarından biri zorunludur.");

        // Koordinat varsa OSRM mesafesini DB fiyatıyla birleştirip kuyruğa al
        double  distanceKm;
        decimal fuelPrice;
        string  routeContext;

        if (request.HasCoordinates)
        {
            distanceKm   = await ResolveDistanceAsync(request);
            fuelPrice    = request.FuelPrice
                           ?? await pricingService.GetCurrentFuelPriceAsync(
                               request.FromCity ?? string.Empty);
            routeContext = BuildRouteContext(request);
        }
        else
        {
            distanceKm   = request.Distance!.Value;
            fuelPrice    = request.FuelPrice
                           ?? await pricingService.GetCurrentFuelPriceAsync(
                               request.FromCity ?? string.Empty);
            routeContext = request.Route ?? BuildRouteContext(request);
        }

        await aiPricingService.EnqueuePriceSuggestionAsync(
            distanceKm,
            request.VehicleType,
            fuelPrice,
            request.Weight,
            userId,
            route: routeContext);

        return Accepted(new
        {
            Message       = "Fiyat analizi sıraya alındı.",
            QueuePosition = 1
        });
    }

    // ── OCR: Kuyruklu ─────────────────────────────────────────────────────────

    /// <summary>
    /// Evrak analizini kuyruğa ekler; HTTP 202 hemen döner.
    /// Sonuç <c>GeminiOcrResult</c> SignalR olayı ile kullanıcıya iletilir.
    /// </summary>
    [HttpPost("ocr/enqueue")]
    public async Task<IActionResult> EnqueueOcr(
        IFormFile    file,
        [FromQuery] DocumentType docType = DocumentType.DriverLicense)
    {
        if (file is null || file.Length == 0)
            return BadRequest("Geçerli bir görsel yüklenmedi.");

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("Kullanıcı kimliği alınamadı.");

        var mimeType = file.ContentType switch
        {
            "image/png"  => "image/png",
            "image/webp" => "image/webp",
            _            => "image/jpeg"
        };

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        await aiPricingService.EnqueueOcrAsync(ms.ToArray(), userId, docType, mimeType);

        return Accepted(new
        {
            Message  = "Evrak analizi sıraya alındı.",
            DocType  = docType.ToString()
        });
    }

    // ── Yük Bazlı Akıllı Fiyat Önerisi ───────────────────────────────────────

    /// <summary>
    /// Verilen yükün gerçek koordinatlarını OSRM'ye gönderir, DB'den güncel mazot fiyatını çeker
    /// ve Gemini ile tam analiz döner. Manuel veri girişi gerektirmez.
    /// </summary>
    [HttpGet("load/{id:guid}/price-suggestion")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> SuggestPriceForLoad(Guid id)
    {
        var load = await context.Loads.FindAsync(id);
        if (load is null) return NotFound("Yük bulunamadı.");

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var suggestion = await pricingService.GetSmartPriceAsync(
            originLat:   load.Origin.Y,
            originLng:   load.Origin.X,
            destLat:     load.Destination.Y,
            destLng:     load.Destination.X,
            vehicleType: load.RequiredVehicleType?.ToString() ?? "Kamyon",
            weightKg:    load.Weight,
            fromCity:    load.FromCity,
            toCity:      load.ToCity,
            userId:      userId);

        return Ok(new { LoadId = id, Suggestion = suggestion });
    }

    // ── Yardımcı ─────────────────────────────────────────────────────────────

    private async Task<double> ResolveDistanceAsync(PriceAnalysisRequestDto request)
    {
        // OSRM üzerinden gerçek mesafe
        var routeSvc = HttpContext.RequestServices.GetRequiredService<IRouteService>();
        var km = await routeSvc.GetDistanceKmAsync(
            request.OriginLat!.Value, request.OriginLng!.Value,
            request.DestLat!.Value,   request.DestLng!.Value);

        if (km is > 0) return km.Value;

        // OSRM başarısız → Haversine
        return CalculateHaversine(
            request.OriginLat.Value, request.OriginLng.Value,
            request.DestLat.Value,   request.DestLng.Value);
    }

    private static string BuildRouteContext(PriceAnalysisRequestDto request)
    {
        if (!string.IsNullOrEmpty(request.FromCity) && !string.IsNullOrEmpty(request.ToCity))
            return $"{request.FromCity} → {request.ToCity}";
        return request.Route ?? string.Empty;
    }

    private static double CalculateHaversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLon = (lon2 - lon1) * Math.PI / 180.0;
        var a    = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                 + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0)
                 * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
