using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Yukle.Api.Services;

/// <summary>
/// OSRM (Open Source Routing Machine) tabanlı rota servisi.
/// Varsayılan endpoint: <c>https://router.project-osrm.org</c> (public demo server).
/// Kendi OSRM sunucunuz varsa <c>appsettings.json → OSRM:BaseUrl</c> ayarını değiştirin.
/// </summary>
public class RouteService(
    HttpClient                      httpClient,
    IConfiguration                  config,
    ILogger<RouteService>           logger) : IRouteService
{
    // OSRM table API: /route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=false
    private readonly string _baseUrl = config["OSRM:BaseUrl"]
                                       ?? "https://router.project-osrm.org";

    public async Task<double?> GetDistanceKmAsync(
        double originLat, double originLng,
        double destLat,   double destLng,
        CancellationToken ct = default)
    {
        var result = await GetRouteAsync(originLat, originLng, destLat, destLng, ct);
        return result?.DistanceKm;
    }

    public async Task<RouteResult?> GetRouteAsync(
        double originLat, double originLng,
        double destLat,   double destLng,
        CancellationToken ct = default)
    {
        // OSRM koordinatları lon,lat sırasında alır
        var url = BuildUrl(originLng, originLat, destLng, destLat);

        try
        {
            var response = await httpClient.GetAsync(url, ct);
            response.EnsureSuccessStatusCode();

            var body = await response.Content.ReadAsStringAsync(ct);
            var osrm = JsonSerializer.Deserialize<OsrmResponse>(body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (osrm?.Code != "Ok" || osrm.Routes is not { Length: > 0 })
            {
                logger.LogWarning("OSRM başarısız yanıt döndü: {Code} — URL: {Url}", osrm?.Code, url);
                return null;
            }

            var route      = osrm.Routes[0];
            var distanceKm = route.Distance / 1000.0;   // metre → km
            var durationMin= route.Duration / 60.0;     // saniye → dakika

            logger.LogDebug("OSRM rota: {Dist:F1} km, {Dur:F0} dk — ({oLat},{oLng})→({dLat},{dLng})",
                distanceKm, durationMin, originLat, originLng, destLat, destLng);

            return new RouteResult(distanceKm, durationMin);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "OSRM API erişilemez — {Url}", url);
            return null;
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            logger.LogWarning(ex, "OSRM isteği zaman aşımına uğradı — {Url}", url);
            return null;
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "OSRM yanıtı parse edilemedi");
            return null;
        }
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private string BuildUrl(double lng1, double lat1, double lng2, double lat2)
    {
        var c = CultureInfo.InvariantCulture;
        return $"{_baseUrl}/route/v1/driving/" +
               $"{lng1.ToString("F6", c)},{lat1.ToString("F6", c)};" +
               $"{lng2.ToString("F6", c)},{lat2.ToString("F6", c)}" +
               "?overview=false&steps=false";
    }

    // ── OSRM response DTOs (internal, no public exposure needed) ─────────────

    private sealed class OsrmResponse
    {
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        [JsonPropertyName("routes")]
        public OsrmRoute[] Routes { get; set; } = [];
    }

    private sealed class OsrmRoute
    {
        /// <summary>Metre cinsinden toplam mesafe.</summary>
        [JsonPropertyName("distance")]
        public double Distance { get; set; }

        /// <summary>Saniye cinsinden tahmini süre.</summary>
        [JsonPropertyName("duration")]
        public double Duration { get; set; }
    }
}
