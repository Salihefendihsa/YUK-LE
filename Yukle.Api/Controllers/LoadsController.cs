using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Yukle.Api.DTOs;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

/// <summary>
/// Yük ilanı CRUD ve listeleme operasyonlarını yöneten RESTful controller.
/// Tüm endpoint'ler JWT ile korunur.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class LoadsController(
    ILoadService   loadService,
    PricingService pricingService,
    ILogger<LoadsController> logger) : ControllerBase
{
    // ── POST api/loads ─────────────────────────────────────────────────────────

    /// <summary>
    /// Yeni yük ilanı oluşturur ve ardından Gemini AI ile "Adil Navlun" analizi yapar.
    /// <para>
    /// Akış: DB kaydet → OSRM mesafe → DB yakıt fiyatı → Gemini fiyat analizi →
    /// AiSuggestedPrice'ı yüke mühürle → zenginleştirilmiş yanıt dön.
    /// </para>
    /// <para>
    /// Gemini veya OSRM başarısız olsa bile yük oluşturulur; fallback matematiksel
    /// model devreye girer ve sonuç yine döner.
    /// </para>
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> CreateLoad([FromBody] CreateLoadDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { Message = "Geçerli bir kullanıcı kimliği bulunamadı." });

        // ── 1. Yükü DB'ye kaydet ─────────────────────────────────────────────
        Guid newId;
        try
        {
            newId = await loadService.CreateLoadAsync(dto, userId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Yük oluşturulurken DB hatası.");
            return StatusCode(500, new { Message = "Yük oluşturulurken bir hata oluştu.", Details = ex.Message });
        }

        // ── 2. Gemini AI fiyat analizi ────────────────────────────────────────
        // Hata olursa yük zaten kaydedildi; analiz sonucu null olacak ama yük hayatta.
        AiMarketAnalysisDto aiAnalysis;
        double resolvedDistanceKm = 0;
        decimal resolvedFuelPrice = 0;

        try
        {
            // Yakıt fiyatını DB'den önceden çek — yanıta da koyacağız
            resolvedFuelPrice = await pricingService.GetCurrentFuelPriceAsync(dto.FromCity);

            // OSRM → gerçek karayolu mesafesi
            var routeService = HttpContext.RequestServices.GetRequiredService<IRouteService>();
            var osrmKm       = await routeService.GetDistanceKmAsync(
                dto.FromLatitude, dto.FromLongitude,
                dto.ToLatitude,   dto.ToLongitude);

            resolvedDistanceKm = osrmKm ?? Haversine(
                dto.FromLatitude, dto.FromLongitude,
                dto.ToLatitude,   dto.ToLongitude);

            // Gemini AI fiyat analizi (Polly zırhı + fallback matematiksel model)
            var vehicleType  = dto.RequiredVehicleType.ToString();
            var routeContext = $"{dto.FromCity} → {dto.ToCity}";
            var weightTon    = dto.Weight / 1000.0;

            var suggestion = await pricingService.GetSmartPriceAsync(
                originLat:         dto.FromLatitude,
                originLng:         dto.FromLongitude,
                destLat:           dto.ToLatitude,
                destLng:           dto.ToLongitude,
                vehicleType:       vehicleType,
                weightKg:          dto.Weight,
                fromCity:          dto.FromCity,
                toCity:            dto.ToCity,
                userId:            userIdClaim,
                fuelPriceOverride: resolvedFuelPrice);

            // ── 3. AI sonucunu yüke mühürle ──────────────────────────────────
            await loadService.UpdateAiPriceAsync(
                newId,
                suggestion.RecommendedPrice,
                suggestion.MinPrice,
                suggestion.MaxPrice,
                suggestion.Reasoning ?? string.Empty);

            aiAnalysis = new AiMarketAnalysisDto
            {
                RecommendedPrice  = suggestion.RecommendedPrice,
                MinPrice          = suggestion.MinPrice,
                MaxPrice          = suggestion.MaxPrice,
                Reasoning         = suggestion.Reasoning ?? string.Empty,
                DistanceKm        = Math.Round(resolvedDistanceKm, 1),
                FuelPriceTl       = resolvedFuelPrice,
                IsAiGenerated     = true,
                FuelCost          = suggestion.FuelCost,
                TollCost          = suggestion.TollCost,
                AmortizationCost  = suggestion.AmortizationCost,
                EstimatedNetProfit= suggestion.EstimatedNetProfit
            };

            logger.LogInformation(
                "AI fiyat analizi tamamlandı — LoadId: {Id}, " +
                "Önerilen: {Price:N0} TL, Mesafe: {Km:F1} km, Yakıt: {Fuel} TL/lt",
                newId, suggestion.RecommendedPrice, resolvedDistanceKm, resolvedFuelPrice);
        }
        catch (Exception ex)
        {
            // Analiz başarısız — yük hâlâ oluşturuldu, sadece AI alanları null
            logger.LogWarning(ex,
                "Yük {Id} için AI fiyat analizi başarısız. " +
                "Yük oluşturuldu, AiSuggestedPrice null bırakıldı.", newId);

            aiAnalysis = new AiMarketAnalysisDto
            {
                RecommendedPrice = 0,
                MinPrice         = 0,
                MaxPrice         = 0,
                Reasoning        = "Fiyat analizi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
                DistanceKm       = Math.Round(resolvedDistanceKm, 1),
                FuelPriceTl      = resolvedFuelPrice,
                IsAiGenerated    = false
            };
        }

        // ── 4. Zenginleştirilmiş yükü çek ve döndür ──────────────────────────
        var created = await loadService.GetLoadByIdAsync(newId);

        var response = new CreateLoadResponseDto
        {
            Load             = created!,
            AiMarketAnalysis = aiAnalysis
        };

        return CreatedAtAction(nameof(GetLoadById), new { id = newId }, response);
    }

    // ── GET api/loads/active ───────────────────────────────────────────────────

    /// <summary>
    /// Durumu Active olan tüm yük ilanlarını (AI fiyat alanları dahil) özet bilgiyle listeler.
    /// </summary>
    [HttpGet("active")]
    public async Task<IActionResult> GetActiveLoads()
    {
        try
        {
            var loads = await loadService.GetActiveLoadsAsync();
            return Ok(loads);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Yükler listelenirken bir hata oluştu.", Details = ex.Message });
        }
    }

    // ── GET api/loads/{id} ─────────────────────────────────────────────────────

    /// <summary>
    /// Belirtilen ID'ye sahip yük ilanının detayını döner (AI fiyat alanları dahil).
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetLoadById(Guid id)
    {
        try
        {
            var load = await loadService.GetLoadByIdAsync(id);

            if (load is null)
                return NotFound(new { Message = $"'{id}' ID'sine sahip yük ilanı bulunamadı." });

            return Ok(load);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Yük detayı alınırken bir hata oluştu.", Details = ex.Message });
        }
    }

    // ── POST api/loads/{id}/pickup ─────────────────────────────────────────────

    /// <summary>
    /// Şoförün yükü teslim aldığını bildirir; durumu <c>OnWay</c> yapar.
    /// Yalnızca yüke atanmış şoför çağırabilir.
    /// </summary>
    [HttpPost("{id:guid}/pickup")]
    [Authorize(Roles = "Driver")]
    public async Task<IActionResult> Pickup(Guid id)
    {
        var driverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(driverIdClaim, out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        try
        {
            await loadService.PickupAsync(id, driverId);
            return Ok(new { Message = "Yük teslim alındı. İyi yolculuklar!" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Durum güncellenirken bir hata oluştu.", Details = ex.Message });
        }
    }

    // ── POST api/loads/{id}/deliver ────────────────────────────────────────────

    /// <summary>
    /// Şoförün yükü teslim ettiğini bildirir; durumu <c>Delivered</c> yapar.
    /// Yalnızca yüke atanmış ve yolda olan şoför çağırabilir.
    /// </summary>
    [HttpPost("{id:guid}/deliver")]
    [Authorize(Roles = "Driver")]
    public async Task<IActionResult> Deliver(Guid id)
    {
        var driverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(driverIdClaim, out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        try
        {
            await loadService.DeliverAsync(id, driverId);
            return Ok(new { Message = "Yük başarıyla teslim edildi. Teşekkürler!" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Durum güncellenirken bir hata oluştu.", Details = ex.Message });
        }
    }

    // ── Yardımcı ─────────────────────────────────────────────────────────────

    private static double Haversine(double lat1, double lon1, double lat2, double lon2)
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
