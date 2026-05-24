using System.Globalization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Hubs;
using Yukle.Api.Infrastructure;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

/// <summary>
/// Gemini'ye gitmeden önce iki kritik veriyi otomatik hazırlayan orkestrasyon servisi:
/// <list type="number">
///   <item>DB'den arac yakit tipine gore canli birim fiyati ceker (motorin/benzin/LPG) veya config.</item>
///   <item>OSRM üzerinden gerçek karayolu mesafesini hesaplar.</item>
/// </list>
/// Temizlenmiş verilerle <see cref="IGeminiService.CalculateFairPriceAsync"/> çağrılır.
/// Koordinat verilmezse ya da OSRM ulaşılamazsa Haversine/manuel mesafe fallback'e geçer.
/// </summary>
public class PricingService(
    IGeminiService               geminiService,
    IRouteService                routeService,
    YukleDbContext               db,
    IHubContext<NotificationHub> hubContext,
    ILogger<PricingService>      logger,
    PricingOptions               pricingOptions,
    FuelOptions                  fuelOptions)
{

    // ── Ana Metod ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Kalkış–varış koordinatlarını ve araç bilgisini alarak tam otomatik fiyat analizi yapar.
    /// <para>Sıra: OSRM mesafesi → DB yakıt fiyatı → Gemini AI → SignalR bildirim</para>
    /// </summary>
    /// <param name="originLat">Kalkış enlemi.</param>
    /// <param name="originLng">Kalkış boylamı.</param>
    /// <param name="destLat">Varış enlemi.</param>
    /// <param name="destLng">Varış boylamı.</param>
    /// <param name="vehicleType">Araç tipi metni (TIR, Kamyon, vb.).</param>
    /// <param name="weightKg">Yük ağırlığı (kilogram).</param>
    /// <param name="fromCity">Kalkış ili — yakıt fiyatı ve rota bağlamı için.</param>
    /// <param name="toCity">Varış ili — rota bağlamı için.</param>
    /// <param name="userId">Bildirim alacak kullanıcı ID'si (opsiyonel).</param>
    /// <param name="manualDistanceKm">
    /// OSRM atlanacaksa elle girilmiş mesafe (opsiyonel).
    /// <c>null</c> ise OSRM sorgulanır.
    /// </param>
    /// <param name="fuelPriceOverride">
    /// DB atlanacaksa elle girilmiş yakıt fiyatı (opsiyonel).
    /// <c>null</c> ise DB'den çekilir.
    /// </param>
    public async Task<AiPriceSuggestionDto> GetSmartPriceAsync(
        double   originLat,
        double   originLng,
        double   destLat,
        double   destLng,
        string   vehicleType,
        double   weightKg,
        string   fromCity,
        string   toCity,
        string?  userId               = null,
        double?  manualDistanceKm     = null,
        decimal? fuelPriceOverride    = null,
        double?  volumeM3             = null,
        CancellationToken ct          = default)
    {
        // 1. Karayolu mesafesi
        var distanceKm = await ResolveDistanceAsync(
            originLat, originLng, destLat, destLng, manualDistanceKm, ct);

        // 2. Arac tipine gore birim yakit/enerji fiyati
        var fuelPrice = fuelPriceOverride
                        ?? await ResolveFuelUnitPriceAsync(fromCity, vehicleType, ct);

        // 3. Rota bağlamı
        var routeContext = $"{fromCity} → {toCity}";
        var weightTon    = weightKg / 1000.0;

        var volume = volumeM3 ?? 0;
        var profile = pricingOptions.GetVehicleProfile(vehicleType);

        logger.LogDebug(
            "PricingService → Gemini: mesafe={Dist:F1}km, birimFiyat={Fuel} {Unit}, yakitTipi={Kind}, " +
            "arac={Vehicle}, agirlik={Weight}t, hacim={Volume}m3, guzergah={Route}",
            distanceKm, fuelPrice, VehicleFuelKindMapper.PriceUnitLabel(profile.FuelKind),
            profile.FuelKind, vehicleType, weightTon, volume, routeContext);

        // 4. Gemini AI fiyat analizi
        var result = await geminiService.CalculateFairPriceAsync(
            distanceKm, vehicleType, fuelPrice, weightTon, routeContext, volume);

        // 5. SignalR bildirim
        if (!string.IsNullOrEmpty(userId))
        {
            await SendPriceNotificationAsync(userId, result, vehicleType, distanceKm, ct);
        }

        return result;
    }

    /// <summary>
    /// Sadece koordinat yerine doğrudan parametre verildiğinde çağrılır
    /// (eski <c>AiPricingService.GetPriceSuggestionAsync</c> ile uyumluluk katmanı).
    /// DB yakıt fiyatı yine de otomatik uygulanır; koordinat olmadığı için OSRM atlanır.
    /// </summary>
    public async Task<AiPriceSuggestionDto> GetPriceWithAutoFuelAsync(
        double   distanceKm,
        string   vehicleType,
        double   weightKg,
        string   fromCity,
        string   toCity,
        string?  userId            = null,
        decimal? fuelPriceOverride = null,
        double?  volumeM3          = null,
        CancellationToken ct       = default)
    {
        var fuelPrice    = fuelPriceOverride
                           ?? await ResolveFuelUnitPriceAsync(fromCity, vehicleType, ct);
        var routeContext = $"{fromCity} → {toCity}";
        var weightTon    = weightKg / 1000.0;

        var volume = volumeM3 ?? 0;
        var result = await geminiService.CalculateFairPriceAsync(
            distanceKm, vehicleType, fuelPrice, weightTon, routeContext, volume);

        if (!string.IsNullOrEmpty(userId))
        {
            await SendPriceNotificationAsync(userId, result, vehicleType, distanceKm, ct);
        }

        return result;
    }

    // ── Yakıt / Enerji Birim Fiyatı ─────────────────────────────────────────

    /// <summary>Arac tipinin tipik yakit turune gore il bazli canli birim fiyat (DB veya config).</summary>
    public Task<decimal> ResolveFuelUnitPriceAsync(
        string city,
        string vehicleType,
        CancellationToken ct = default)
    {
        var profile = pricingOptions.GetVehicleProfile(vehicleType);
        if (profile.FuelKind == VehicleFuelKind.Electric)
        {
            var electric = pricingOptions.ElectricityPriceTlPerKwh > 0
                ? pricingOptions.ElectricityPriceTlPerKwh
                : fuelOptions.Fallback.Electric;
            return Task.FromResult(electric);
        }

        var dbType = VehicleFuelKindMapper.ToDbFuelType(profile.FuelKind);
        return GetCurrentFuelPriceAsync(city, dbType, ct);
    }

    /// <summary>Geriye donuk uyumluluk — motorin.</summary>
    public Task<decimal> GetCurrentFuelPriceAsync(string city, CancellationToken ct = default)
        => GetCurrentFuelPriceAsync(city, FuelType.Motorin, ct);

    /// <summary>
    /// Il ve yakit turune gore DB'den guncel fiyat. Yoksa son 7 gun, ulusal ortalama, config fallback.
    /// </summary>
    public async Task<decimal> GetCurrentFuelPriceAsync(
        string city,
        FuelType fuelType,
        CancellationToken ct = default)
    {
        var plateCode = TurkeyPlateRegistry.TryGetPlateCode(city);

        if (plateCode.HasValue)
        {
            var byPlate = await db.FuelPrices
                .Where(f => f.PlateCode == plateCode.Value && f.FuelType == fuelType)
                .OrderByDescending(f => f.FetchedAt)
                .Select(f => (decimal?)f.PriceTL)
                .FirstOrDefaultAsync(ct);

            if (byPlate.HasValue)
            {
                logger.LogDebug(
                    "Plaka {Plate} ({City}) {Fuel}: {Price} TL (DB)",
                    plateCode.Value, city, fuelType, byPlate.Value);
                return byPlate.Value;
            }
        }

        // Geriye donuk: eski il adi kayitlari
        var byCity = await db.FuelPrices
            .Where(f => f.City == city && f.FuelType == fuelType)
            .OrderByDescending(f => f.FetchedAt)
            .Select(f => (decimal?)f.PriceTL)
            .FirstOrDefaultAsync(ct);

        if (byCity.HasValue)
        {
            logger.LogDebug("{City} {Fuel}: {Price} TL (DB, il adi)", city, fuelType, byCity.Value);
            return byCity.Value;
        }

        var fallback = fuelOptions.GetFallbackPrice(fuelType);
        logger.LogWarning(
            "Warning: Fuel price cache miss for {City} (plate {Plate}); config fallback {Price} TL.",
            city, plateCode, fallback);
        return fallback;
    }

    // ── Mesafe Çözme ─────────────────────────────────────────────────────────

    private async Task<double> ResolveDistanceAsync(
        double  originLat, double originLng,
        double  destLat,   double destLng,
        double? manualKm,
        CancellationToken ct)
    {
        // Kullanıcı elle girdiyse OSRM'yi atla
        if (manualKm is > 0)
        {
            logger.LogDebug("Manuel mesafe kullanılıyor: {Km} km", manualKm.Value);
            return manualKm.Value;
        }

        // OSRM sorgusu
        var osrmKm = await routeService.GetDistanceKmAsync(
            originLat, originLng, destLat, destLng, ct);

        if (osrmKm is > 0)
        {
            logger.LogInformation("OSRM mesafe: {Km:F1} km", osrmKm.Value);
            return osrmKm.Value;
        }

        // OSRM başarısız → Haversine fallback
        var haversineKm = Haversine(originLat, originLng, destLat, destLng);
        logger.LogWarning(
            "OSRM ulaşılamaz; Haversine fallback kullanılıyor: {Km:F1} km",
            haversineKm);
        return haversineKm;
    }

    private static double Haversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a    = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                 + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2))
                 * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRad(double deg) =>
        deg * (Math.PI / 180.0);

    // ── SignalR Bildirim ──────────────────────────────────────────────────────

    private async Task SendPriceNotificationAsync(
        string               userId,
        AiPriceSuggestionDto result,
        string               vehicleType,
        double               distanceKm,
        CancellationToken    ct)
    {
        try
        {
            await hubContext.Clients.Group(userId)
                .SendAsync("PriceAnalyzed", new
                {
                    Message          = $"Fiyat Analiz Edildi: {result.RecommendedPrice:N0} TL",
                    RecommendedPrice = result.RecommendedPrice,
                    MinPrice         = result.MinPrice,
                    MaxPrice         = result.MaxPrice,
                    Reasoning        = result.Reasoning,
                    VehicleType      = vehicleType,
                    DistanceKm       = Math.Round(distanceKm, 1)
                }, ct);
        }
        catch (Exception ex)
        {
            // SignalR hatası ana akışı engellemez
            logger.LogWarning(ex, "PriceAnalyzed SignalR bildirimi gönderilemedi — userId: {UserId}", userId);
        }
    }
}
