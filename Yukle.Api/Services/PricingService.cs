using System.Globalization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Hubs;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

/// <summary>
/// Gemini'ye gitmeden önce iki kritik veriyi otomatik hazırlayan orkestrasyon servisi:
/// <list type="number">
///   <item>DB'den o günkü en güncel Motorin fiyatını çeker.</item>
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
    ILogger<PricingService>      logger)
{
    // Yakıt fiyatı çekilemezse kullanılacak son çare sabit fiyat (TL/lt)
    private const decimal DefaultFuelPriceTl = 42.50m;

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
        CancellationToken ct          = default)
    {
        // 1. Karayolu mesafesi
        var distanceKm = await ResolveDistanceAsync(
            originLat, originLng, destLat, destLng, manualDistanceKm, ct);

        // 2. Yakıt fiyatı
        var fuelPrice = fuelPriceOverride
                        ?? await GetCurrentFuelPriceAsync(fromCity, ct);

        // 3. Rota bağlamı
        var routeContext = $"{fromCity} → {toCity}";
        var weightTon    = weightKg / 1000.0;

        logger.LogDebug(
            "PricingService → Gemini: mesafe={Dist:F1}km, yakıt={Fuel}TL/lt, " +
            "araç={Vehicle}, ağırlık={Weight}t, güzergah={Route}",
            distanceKm, fuelPrice, vehicleType, weightTon, routeContext);

        // 4. Gemini AI fiyat analizi
        var result = await geminiService.CalculateFairPriceAsync(
            distanceKm, vehicleType, fuelPrice, weightTon, routeContext);

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
        CancellationToken ct       = default)
    {
        var fuelPrice    = fuelPriceOverride
                           ?? await GetCurrentFuelPriceAsync(fromCity, ct);
        var routeContext = $"{fromCity} → {toCity}";
        var weightTon    = weightKg / 1000.0;

        var result = await geminiService.CalculateFairPriceAsync(
            distanceKm, vehicleType, fuelPrice, weightTon, routeContext);

        if (!string.IsNullOrEmpty(userId))
        {
            await SendPriceNotificationAsync(userId, result, vehicleType, distanceKm, ct);
        }

        return result;
    }

    // ── Yakıt Fiyatı Çekme ────────────────────────────────────────────────────

    /// <summary>
    /// İl adına göre DB'den bugünkü Motorin fiyatını döner.
    /// Bugünkü kayıt yoksa son 7 günlük en güncel fiyatı kullanır.
    /// Hiç kayıt bulunamazsa <see cref="DefaultFuelPriceTl"/> sabitini döner ve uyarı loglar.
    /// </summary>
    public async Task<decimal> GetCurrentFuelPriceAsync(
        string city,
        CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Önce bugünkü fiyatı dene
        var todayPrice = await db.FuelPrices
            .Where(f => f.City == city
                        && f.FuelType == FuelType.Motorin
                        && f.Date == today)
            .Select(f => (decimal?)f.PriceTL)
            .FirstOrDefaultAsync(ct);

        if (todayPrice.HasValue)
        {
            logger.LogDebug("{City} Motorin fiyatı DB'den alındı: {Price} TL/lt (bugün)", city, todayPrice.Value);
            return todayPrice.Value;
        }

        // Bugün yoksa son 7 günün en güncel kaydını kullan
        var lastKnown = await db.FuelPrices
            .Where(f => f.City == city
                        && f.FuelType == FuelType.Motorin
                        && f.Date >= today.AddDays(-7))
            .OrderByDescending(f => f.Date)
            .Select(f => new { f.PriceTL, f.Date })
            .FirstOrDefaultAsync(ct);

        if (lastKnown != null)
        {
            logger.LogDebug(
                "{City} Motorin fiyatı DB'den alındı: {Price} TL/lt (son kayıt: {Date})",
                city, lastKnown.PriceTL, lastKnown.Date);
            return lastKnown.PriceTL;
        }

        // Hiç kayıt yok — ülke geneli ortalamasına bak
        var nationalAvg = await db.FuelPrices
            .Where(f => f.FuelType == FuelType.Motorin)
            .OrderByDescending(f => f.Date)
            .Select(f => (decimal?)f.PriceTL)
            .FirstOrDefaultAsync(ct);

        if (nationalAvg.HasValue)
        {
            logger.LogWarning(
                "Warning: Fuel API unreachable, using last cached price. " +
                "{City} için kayıt yok; ulusal ortalama kullanılıyor: {Price} TL/lt",
                city, nationalAvg.Value);
            return nationalAvg.Value;
        }

        // Kesinlikle hiç veri yok — hardcoded fallback
        logger.LogWarning(
            "Warning: Fuel API unreachable, using last cached price. " +
            "DB'de hiç yakıt kaydı yok; varsayılan {Default} TL/lt kullanılıyor.",
            DefaultFuelPriceTl);
        return DefaultFuelPriceTl;
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
