using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

/// <summary>
/// Yük ilanı CRUD ve listeleme operasyonlarını yöneten RESTful controller.
/// Tüm endpoint'ler JWT ile korunur.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("global-policy")]   // Phase 2.2: TokenBucket, 10 istek/sn
public sealed class LoadsController(
    ILoadService             loadService,
    ICancellationService     cancellationService,
    ILoadEditService         loadEditService,
    YukleDbContext           db,
    PricingService           pricingService,
    ILogger<LoadsController> logger,
    IConfiguration           configuration,
    IWebHostEnvironment      environment) : ControllerBase
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

        var customer = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.Role == UserRole.Customer);
        if (customer is null || !customer.IsActive)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { Message = "Hesabınız henüz aktif değil. İlan oluşturmak için telefon doğrulamasını tamamlayın." });

        // ── 1. Yükü DB'ye kaydet ─────────────────────────────────────────────
        var newId = await loadService.CreateLoadAsync(dto, userId);

        // ── 2. Gemini AI fiyat analizi ────────────────────────────────────────
        // Hata olursa yük zaten kaydedildi; analiz sonucu null olacak ama yük hayatta.
        AiMarketAnalysisDto aiAnalysis;
        double resolvedDistanceKm = 0;
        decimal resolvedFuelPrice = 0;

        try
        {
            var vehicleTypeEarly = dto.RequiredVehicleType.ToString();
            resolvedFuelPrice = await pricingService.ResolveFuelUnitPriceAsync(dto.FromCity, vehicleTypeEarly);

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
                fuelPriceOverride: resolvedFuelPrice,
                volumeM3:          dto.Volume ?? 0);

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
    /// <para>
    /// <b>v2.5.3 Yetki Bariyeri:</b> Yalnızca AI onayından geçmiş (<c>IsActive=true</c>)
    /// şoförler erişebilir. Evrakı eksik/reddedilmiş şoförler 403 Forbidden alır.
    /// </para>
    /// </summary>
    [HttpGet("active")]
    [Authorize(Roles = "Customer,Driver,Admin")]
    public async Task<IActionResult> GetActiveLoads(
        [FromQuery] string? fromCity = null,
        [FromQuery] string? toCity = null,
        [FromQuery] string? vehicleType = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] double? minWeight = null,
        [FromQuery] double? maxWeight = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        List<LoadListDto> loads;

        if (User.IsInRole("Customer")
            && int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var customerId))
        {
            loads = await loadService.GetCustomerLoadsAsync(customerId);
        }
        else
        {
            loads = await loadService.GetActiveLoadsAsync();

            if (User.IsInRole("Driver")
                && int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var driverId))
            {
                var currentTrip = await loadService.GetDriverCurrentLoadAsync(driverId);
                if (currentTrip is not null && loads.All(l => l.Id != currentTrip.Id))
                    loads.Add(currentTrip);
            }
        }

        var query = loads.AsQueryable();
        if (!string.IsNullOrWhiteSpace(fromCity)) query = query.Where(x => x.FromCity.Contains(fromCity, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(toCity)) query = query.Where(x => x.ToCity.Contains(toCity, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(vehicleType)) query = query.Where(x => string.Equals(x.Type.ToString(), vehicleType, StringComparison.OrdinalIgnoreCase));
        if (minPrice.HasValue) query = query.Where(x => x.Price >= minPrice.Value);
        if (maxPrice.HasValue) query = query.Where(x => x.Price <= maxPrice.Value);
        if (minWeight.HasValue) query = query.Where(x => x.Weight >= minWeight.Value);
        if (maxWeight.HasValue) query = query.Where(x => x.Weight <= maxWeight.Value);
        if (dateFrom.HasValue) query = query.Where(x => x.PickupDate >= dateFrom.Value);
        if (dateTo.HasValue) query = query.Where(x => x.PickupDate <= dateTo.Value);

        query = (sortBy ?? "date").ToLowerInvariant() switch
        {
            "price" => query.OrderBy(x => x.Price),
            _ => query.OrderByDescending(x => x.CreatedAt)
        };

        var total = query.Count();
        var items = query.Skip((Math.Max(page, 1) - 1) * Math.Max(pageSize, 1)).Take(Math.Max(pageSize, 1)).ToList();
        return Ok(new { Total = total, Items = items });
    }

    // ── GET api/loads/{id} ─────────────────────────────────────────────────────

    /// <summary>
    /// Belirtilen ID'ye sahip yük ilanının detayını döner (AI fiyat alanları dahil).
    /// <para>
    /// <b>v2.5.3 Yetki Bariyeri:</b> Sadece aktif şoförler detay sayfasına ulaşabilir.
    /// </para>
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Customer,Driver,Admin")]
    public async Task<IActionResult> GetLoadById(Guid id)
    {
        var load = await loadService.GetLoadByIdAsync(id);

        if (load is null)
            return NotFound(new { Message = $"'{id}' ID'sine sahip yük ilanı bulunamadı." });

        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized(new { Message = "Geçerli bir kullanıcı kimliği bulunamadı." });

        if (!CanViewLoad(load, userId))
            return NotFound(new { Message = $"'{id}' ID'sine sahip yük ilanı bulunamadı." });

        return Ok(load);
    }

    // ── POST api/loads/{id}/cancel ─────────────────────────────────────────────

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> CancelLoad(Guid id, [FromBody] CancelLoadRequestDto? dto)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized(new { Message = "Gecerli bir kullanici kimligi bulunamadi." });

        var isAdmin = User.IsInRole("Admin");

        try
        {
            var result = await cancellationService.CancelAsync(
                id, userId, isAdmin, dto?.Reason);

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    // ── PUT api/loads/{id} ─────────────────────────────────────────────────────

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> UpdateLoad(Guid id, [FromBody] CreateLoadDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized(new { Message = "Gecerli bir kullanici kimligi bulunamadi." });

        try
        {
            var result = await loadEditService.UpdateAsync(id, userId, isAdmin: false, dto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    // ── POST api/loads/{id}/pickup ─────────────────────────────────────────────

    /// <summary>
    /// Şoförün yükü teslim aldığını bildirir; durumu <c>OnWay</c> yapar.
    /// Yalnızca yüke atanmış şoför çağırabilir.
    /// </summary>
    [HttpPost("{id:guid}/pickup")]
    [Authorize(Policy = "RequireActiveDriver")]
    public async Task<IActionResult> Pickup(Guid id)
    {
        var driverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(driverIdClaim, out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        await loadService.PickupAsync(id, driverId);
        return Ok(new { Message = "Yük teslim alındı. İyi yolculuklar!" });
    }

    // ── GET api/loads/{id}/delivery-qr ────────────────────────────────────────

    /// <summary>
    /// Faz 4.2 — Teslimat noktasına varıldığında fiziksel varlığı kantılamak için 
    /// kullanılacak, 15 dakika geçerli HMAC-SHA256 imzalı QR Token üretir.
    /// (Müşteri veya Alıcı tarafından çağırılır).
    /// </summary>
    [HttpGet("{id:guid}/delivery-qr")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> GetDeliveryQr(Guid id, [FromServices] ITokenService tokenService)
    {
        var load = await loadService.GetLoadByIdAsync(id);
        if (load == null) return NotFound(new { Message = "Yük bulunamadı." });

        if (load.Status != LoadStatus.OnWay && load.Status != LoadStatus.Assigned)
            return BadRequest(new { Message = "QR kod yalnızca atanmış veya yoldaki yükler için üretilebilir." });

        var qrToken = tokenService.GenerateDeliveryQrToken(id);
        return Ok(new { LoadId = id, Token = qrToken, ExpiresInMinutes = 15 });
    }

    // ── POST api/loads/{id}/deliver ────────────────────────────────────────────

    /// <summary>
    /// Faz 4.2 — Şoförün yükü teslim ettiğini bildirir; durumu <c>Delivered</c> yapar.
    /// Şoför fiziki lokasyonunu ve QR'dan okuduğu token'ı gönderir.
    /// Token 15 dk içerisinde üretilmiş olmalıdır. Production'da şoför cihaz GPS'i
    /// teslim noktasına 500 m içinde olmalıdır; Development/demo'da GPS atlanır (QR zorunlu kalır).
    /// </summary>
    [HttpPost("{id:guid}/deliver")]
    [Authorize(Policy = "RequireActiveDriver")]
    public async Task<IActionResult> Deliver(Guid id, [FromBody] DeliverRequestDto dto, [FromServices] ITokenService tokenService)
    {
        var driverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(driverIdClaim, out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        var qrToken = dto.QrToken?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(qrToken)
            || string.Equals(qrToken, "manual-delivery", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { Message = "Geçerli müşteri QR kodu zorunludur." });
        }

        // 1. Birincil kanıt: QR token (HMAC imza, süre, yük eşleşmesi)
        if (!tokenService.ValidateDeliveryQrToken(qrToken, out var tokenLoadId))
            return BadRequest(new { Message = "Geçersiz veya süresi dolmuş QR kod." });

        if (tokenLoadId != id)
            return BadRequest(new { Message = "Okutulan QR kod bu yüke ait değil." });

        var load = await loadService.GetLoadByIdAsync(id);
        if (load == null) return NotFound(new { Message = "Yük bulunamadı." });

        // 2. İkincil kanıt: şoförün DB'deki gerçek cihaz GPS'i (istemci-supplied hedef değil)
        var enforceGpsDistance = configuration.GetValue<bool?>("Delivery:EnforceGpsDistanceCheck")
            ?? !environment.IsDevelopment();

        if (enforceGpsDistance)
        {
            var driverGps = await db.Users.AsNoTracking()
                .Where(u => u.Id == driverId)
                .Select(u => new { u.LastKnownLatitude, u.LastKnownLongitude })
                .FirstOrDefaultAsync();

            if (driverGps?.LastKnownLatitude is not double driverLat
                || driverGps.LastKnownLongitude is not double driverLng)
            {
                return BadRequest(new
                {
                    Message = "Şoför konumu bulunamadı. Teslimattan önce konum paylaşımını açın."
                });
            }

            var maxDistanceKm = configuration.GetValue("Delivery:MaxDistanceKm", 0.5);
            var distanceKm = Haversine(driverLat, driverLng, load.DestinationLat, load.DestinationLng);
            if (distanceKm > maxDistanceKm)
            {
                logger.LogWarning(
                    "Teslimat GPS uyuşmazlığı: LoadId={LoadId} DriverId={DriverId} " +
                    "Hedef=({DestLat},{DestLng}) Cihaz=({DriverLat},{DriverLng}) Fark={Km:F3} km",
                    id, driverId, load.DestinationLat, load.DestinationLng, driverLat, driverLng, distanceKm);

                return BadRequest(new
                {
                    Message = $"Teslimat noktasına çok uzaksınız (cihaz GPS). Kalan mesafe: {distanceKm:F2} km. " +
                              $"İzin verilen sapma: {maxDistanceKm * 1000:F0} m."
                });
            }
        }
        else
        {
            logger.LogInformation(
                "Teslimat GPS mesafe kontrolü atlandı (demo/dev). LoadId={LoadId} — QR doğrulandı.",
                id);
        }

        // 3. İşlem Kaydı (DB Transaction, U-ETDS, Escrow Release)
        await loadService.DeliverAsync(id, driverId);
        
        return Ok(new { Message = "Yük başarıyla teslim edildi. Ödeme şoför cüzdanına aktarıldı. Teşekkürler!" });
    }

    // ── GET api/loads/history (müşteri — teslim edilen yükler) ───────────────

    [HttpGet("history")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> GetCustomerHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = db.Loads.AsNoTracking()
            .Where(l => l.UserId == userId && l.Status == LoadStatus.Delivered)
            .OrderByDescending(l => l.DeliveryDate);

        var total = await q.CountAsync();
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(l => new
            {
                l.Id,
                l.FromCity,
                l.ToCity,
                l.DeliveryDate,
                l.Price,
                DriverName = db.Users.Where(u => u.Id == l.DriverId).Select(u => u.FullName).FirstOrDefault()
            })
            .ToListAsync();

        var totalSpend = await db.Loads.AsNoTracking()
            .Where(l => l.UserId == userId && l.Status == LoadStatus.Delivered)
            .SumAsync(l => (decimal?)l.Price) ?? 0m;

        return Ok(new { Total = total, Page = page, PageSize = pageSize, TotalSpend = totalSpend, Items = items });
    }

    // ── GET api/loads/driver-history (şoför — teslim edilen yükler) ───────────

    [HttpGet("driver-history")]
    [Authorize(Roles = "Driver")]
    public async Task<IActionResult> GetDriverHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var driverId))
            return Unauthorized();

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = db.Loads.AsNoTracking()
            .Where(l => l.DriverId == driverId && l.Status == LoadStatus.Delivered)
            .OrderByDescending(l => l.DeliveryDate);

        var total = await q.CountAsync();
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(l => new
            {
                l.Id,
                l.FromCity,
                l.ToCity,
                l.DeliveryDate,
                l.Price,
                CustomerName = db.Users.Where(u => u.Id == l.UserId).Select(u => u.FullName).FirstOrDefault()
            })
            .ToListAsync();

        var totalEarn = await db.Loads.AsNoTracking()
            .Where(l => l.DriverId == driverId && l.Status == LoadStatus.Delivered)
            .SumAsync(l => (decimal?)l.Price) ?? 0m;

        return Ok(new { Total = total, Page = page, PageSize = pageSize, TotalEarn = totalEarn, TripCount = total, Items = items });
    }

    // ── Yardımcı ─────────────────────────────────────────────────────────────

    private bool CanViewLoad(LoadListDto load, int userId)
    {
        if (User.IsInRole("Admin"))
            return true;

        if (User.IsInRole("Customer"))
            return load.OwnerId == userId;

        if (User.IsInRole("Driver"))
        {
            if (load.Status == LoadStatus.Active)
                return true;
            if (load.DriverId == userId)
                return true;
            return false;
        }

        return false;
    }

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
