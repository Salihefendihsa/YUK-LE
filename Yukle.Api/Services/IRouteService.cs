namespace Yukle.Api.Services;

/// <summary>
/// İki koordinat noktası arasındaki karayolu mesafesini ve süresini hesaplar.
/// Varsayılan uygulama: OSRM (Open Source Routing Machine).
/// </summary>
public interface IRouteService
{
    /// <summary>
    /// Kalkış ve varış koordinatlarını kullanarak karayolu mesafesini kilometre cinsinden döner.
    /// API ulaşılamaz durumdaysa <c>null</c> döner — çağıran taraf Haversine fallback'e geçmeli.
    /// </summary>
    Task<double?> GetDistanceKmAsync(
        double originLat,  double originLng,
        double destLat,    double destLng,
        CancellationToken ct = default);

    /// <summary>
    /// Mesafe (km) ile tahmini süreyü (dakika) birlikte döner.
    /// </summary>
    Task<RouteResult?> GetRouteAsync(
        double originLat,  double originLng,
        double destLat,    double destLng,
        CancellationToken ct = default);
}

/// <summary>OSRM'den dönen rota özeti.</summary>
/// <param name="DistanceKm">Karayolu mesafesi (kilometre).</param>
/// <param name="DurationMin">Tahmini sürüş süresi (dakika).</param>
public record RouteResult(double DistanceKm, double DurationMin);
