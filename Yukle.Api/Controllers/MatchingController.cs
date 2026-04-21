using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

/// <summary>
/// Şoföre kişiselleştirilmiş yük önerileri sunan "Smart Matching" controller'ı.
/// Gemini AI, şoförün geçmiş başarılarını ve araç kapasitesini analiz ederek
/// her aktif yük için 0–100 arası uyumluluk puanı ve samimi gerekçe üretir.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireActiveDriver")]   // v2.5.3 — Sadece AI onaylı şoförler eşleşme görebilir
public sealed class MatchingController(
    YukleDbContext               db,
    IGeminiService               geminiService,
    IRouteService                routeService,
    ILogger<MatchingController>  logger) : ControllerBase
{
    // Gemini'ye gönderilecek maksimum aday yük sayısı (maliyet kontrolü)
    private const int MaxCandidates   = 15;
    // Şoförden çekilecek geçmiş rota sayısı
    private const int HistoryDepth    = 10;

    // ── GET api/matching/recommended ─────────────────────────────────────────

    /// <summary>
    /// Şoföre "Senin İçin Önerilenler" listesi döner.
    /// <para>
    /// Akış: DB'den şoför geçmişi + araç + aktif yükler → Gemini puanlama →
    /// MatchScore'a göre sıralı <see cref="LoadWithMatchDto"/> listesi.
    /// </para>
    /// <para>
    /// Yeni şoförlerde (geçmişsiz) matematiksel fallback devreye girer;
    /// araç tipine göre 70 baz puan + motivasyon mesajı döner.
    /// </para>
    /// </summary>
    [HttpGet("recommended")]
    public async Task<IActionResult> GetRecommended(CancellationToken ct = default)
    {
        var driverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(driverIdClaim, out var driverId))
            return Unauthorized(new { Message = "Geçerli bir şoför kimliği bulunamadı." });

        // ── 1. Şoför bilgisi ve aracı ─────────────────────────────────────
        var driver = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == driverId, ct);

        if (driver is null)
            return NotFound(new { Message = "Şoför bulunamadı." });

        var primaryVehicle = await db.Vehicles
            .Where(v => v.DriverId == driverId && v.IsActive)
            .OrderByDescending(v => v.Id)
            .AsNoTracking()
            .FirstOrDefaultAsync(ct);

        var vehicleType     = primaryVehicle?.Type.ToString() ?? "Kamyon";
        var vehicleCapacity = primaryVehicle?.Capacity ?? 10.0;

        // ── 2. Geçmiş başarılı teslimatlar ───────────────────────────────
        var recentRoutes = await db.Loads
            .Where(l => l.DriverId == driverId && l.Status == LoadStatus.Delivered)
            .OrderByDescending(l => l.DeliveryDate)
            .Take(HistoryDepth)
            .Select(l => new DriverRouteHistoryItem
            {
                FromCity    = l.FromCity,
                ToCity      = l.ToCity,
                LoadType    = l.Type.ToString(),
                VehicleType = vehicleType,
                CompletedAt = l.DeliveryDate
            })
            .AsNoTracking()
            .ToListAsync(ct);

        // ── 3. Aktif yük ilanları (aday havuzu) ──────────────────────────
        var activeLoads = await db.Loads
            .Where(l => l.Status == LoadStatus.Active)
            .OrderByDescending(l => l.CreatedAt)
            .Take(MaxCandidates)
            .Include(l => l.Owner)
            .AsNoTracking()
            .ToListAsync(ct);

        if (activeLoads.Count == 0)
            return Ok(new List<LoadWithMatchDto>());

        // ── 4. Gemini bağlamını inşa et ───────────────────────────────────
        var candidates = await BuildCandidatesAsync(activeLoads, ct);

        var context = new DriverMatchContextDto
        {
            DriverName         = driver.FullName,
            VehicleType        = vehicleType,
            VehicleCapacityTon = vehicleCapacity,
            IsNewDriver        = recentRoutes.Count == 0,
            RecentRoutes       = recentRoutes,
            CandidateLoads     = candidates
        };

        // ── 5. Gemini puanlama ────────────────────────────────────────────
        var matchResults = await geminiService.AnalyzeDriverMatchAsync(context, ct);

        // ── 6. Yük listesiyle birleştir ve sırala ─────────────────────────
        var loadDtoMap = activeLoads.ToDictionary(
            l => l.Id,
            l => MapToLoadListDto(l));

        var resultMap = matchResults.ToDictionary(r => r.LoadId);

        var response = activeLoads
            .Where(l => resultMap.ContainsKey(l.Id))
            .Select(l => new LoadWithMatchDto
            {
                Load  = loadDtoMap[l.Id],
                Match = resultMap[l.Id]
            })
            .OrderByDescending(x => x.Match.MatchScore)
            .ToList();

        logger.LogInformation(
            "Smart Matching 'recommended' tamamlandı: {Count} yük, şoför: {Driver} ({Id})",
            response.Count, driver.FullName, driverId);

        return Ok(response);
    }

    // ── GET api/matching/load/{id} ────────────────────────────────────────────

    /// <summary>
    /// Belirli bir yük için şoföre özel uyumluluk analizi döner.
    /// Detay ekranında "Bu Yük Ne Kadar Uygun?" bölümü için kullanılır.
    /// </summary>
    [HttpGet("load/{id:guid}")]
    public async Task<IActionResult> GetMatchForLoad(Guid id, CancellationToken ct = default)
    {
        var driverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(driverIdClaim, out var driverId))
            return Unauthorized(new { Message = "Geçerli bir şoför kimliği bulunamadı." });

        // Yük ve şoför bilgisi paralel çek
        var loadTask   = db.Loads.Include(l => l.Owner).AsNoTracking()
                              .FirstOrDefaultAsync(l => l.Id == id, ct);
        var driverTask = db.Users.AsNoTracking()
                              .FirstOrDefaultAsync(u => u.Id == driverId, ct);
        var vehicleTask= db.Vehicles.Where(v => v.DriverId == driverId && v.IsActive)
                              .OrderByDescending(v => v.Id)
                              .AsNoTracking()
                              .FirstOrDefaultAsync(ct);
        var historyTask= db.Loads
                              .Where(l => l.DriverId == driverId && l.Status == LoadStatus.Delivered)
                              .OrderByDescending(l => l.DeliveryDate)
                              .Take(HistoryDepth)
                              .AsNoTracking()
                              .ToListAsync(ct);

        await Task.WhenAll(loadTask, driverTask, vehicleTask, historyTask);

        var load    = loadTask.Result;
        var driver  = driverTask.Result;
        var vehicle = vehicleTask.Result;
        var history = historyTask.Result;

        if (load   is null) return NotFound(new { Message = "Yük bulunamadı." });
        if (driver is null) return NotFound(new { Message = "Şoför bulunamadı." });

        var vehicleType     = vehicle?.Type.ToString() ?? "Kamyon";
        var vehicleCapacity = vehicle?.Capacity ?? 10.0;

        var recentRoutes = history.Select(l => new DriverRouteHistoryItem
        {
            FromCity    = l.FromCity,
            ToCity      = l.ToCity,
            LoadType    = l.Type.ToString(),
            VehicleType = vehicleType,
            CompletedAt = l.DeliveryDate
        }).ToList();

        var candidates = await BuildCandidatesAsync([load], ct);

        var context = new DriverMatchContextDto
        {
            DriverName         = driver.FullName,
            VehicleType        = vehicleType,
            VehicleCapacityTon = vehicleCapacity,
            IsNewDriver        = recentRoutes.Count == 0,
            RecentRoutes       = recentRoutes,
            CandidateLoads     = candidates
        };

        var matchResults = await geminiService.AnalyzeDriverMatchAsync(context, ct);
        var matchResult  = matchResults.FirstOrDefault(r => r.LoadId == id);

        if (matchResult is null)
            return StatusCode(500, new { Message = "Eşleşme analizi üretilemedi." });

        return Ok(new LoadWithMatchDto
        {
            Load  = MapToLoadListDto(load),
            Match = matchResult
        });
    }

    // ── Yardımcılar ──────────────────────────────────────────────────────────

    private async Task<List<CandidateLoadItem>> BuildCandidatesAsync(
        List<Load>        loads,
        CancellationToken ct)
    {
        var candidates = new List<CandidateLoadItem>(loads.Count);

        for (int i = 0; i < loads.Count; i++)
        {
            var l = loads[i];

            // OSRM mesafesi — başarısız olursa Haversine fallback
            var distKm = await routeService.GetDistanceKmAsync(
                l.Origin.Y,      l.Origin.X,
                l.Destination.Y, l.Destination.X,
                ct);
            distKm ??= Haversine(l.Origin.Y, l.Origin.X, l.Destination.Y, l.Destination.X);

            candidates.Add(new CandidateLoadItem
            {
                Key                 = $"l{i + 1}",
                LoadId              = l.Id,
                FromCity            = l.FromCity,
                ToCity              = l.ToCity,
                LoadType            = l.Type.ToString(),
                RequiredVehicleType = l.RequiredVehicleType?.ToString() ?? "Kamyon",
                WeightTon           = Math.Round(l.Weight / 1000.0, 2),
                DistanceKm          = Math.Round(distKm.Value, 1),
                Price               = l.Price,
                AiSuggestedPrice    = l.AiSuggestedPrice ?? 0m
            });
        }

        return candidates;
    }

    private static LoadListDto MapToLoadListDto(Load l) => new()
    {
        Id               = l.Id,
        FromCity         = l.FromCity,
        FromDistrict     = l.FromDistrict,
        ToCity           = l.ToCity,
        ToDistrict       = l.ToDistrict,
        Description      = l.Description,
        Weight           = l.Weight,
        Volume           = l.Volume,
        Type             = l.Type,
        PickupDate       = l.PickupDate,
        DeliveryDate     = l.DeliveryDate,
        CreatedAt        = l.CreatedAt,
        Price            = l.Price,
        Currency         = l.Currency,
        Status           = l.Status,
        OwnerId          = l.UserId,
        OwnerFullName    = l.Owner?.FullName ?? string.Empty,
        DriverId         = l.DriverId,
        DestinationLat   = l.Destination.Y,
        DestinationLng   = l.Destination.X,
        BidCount         = l.Bids.Count,
        AiSuggestedPrice = l.AiSuggestedPrice,
        AiMinPrice       = l.AiMinPrice,
        AiMaxPrice       = l.AiMaxPrice,
        AiPriceReasoning = l.AiPriceReasoning
    };

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
