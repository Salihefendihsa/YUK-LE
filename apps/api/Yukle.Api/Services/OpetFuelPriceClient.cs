using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

/// <summary>Canli yakit fiyatlari — harici istasyon agi REST API (plaka kodu ile).</summary>
public sealed class OpetFuelPriceClient(IHttpClientFactory httpFactory, ILogger<OpetFuelPriceClient> logger)
{
    private const string BaseUrl = "https://api.opet.com.tr/api/fuelprices/prices";

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<IReadOnlyDictionary<FuelType, decimal>> FetchProvincePricesAsync(
        int plateCode,
        CancellationToken ct = default)
    {
        var client = httpFactory.CreateClient("OpetFuel");
        var url    = $"{BaseUrl}?ProvinceCode={plateCode}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0");
        request.Headers.TryAddWithoutValidation("Accept", "application/json");
        request.Headers.TryAddWithoutValidation("Referer", "https://www.opet.com.tr/");

        using var response = await client.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync(ct);
        var districts = JsonSerializer.Deserialize<List<OpetDistrictDto>>(body, JsonOpts);
        if (districts is null or { Count: 0 })
        {
            logger.LogWarning("Yakit API bos yanit (plaka {Plate})", plateCode);
            return new Dictionary<FuelType, decimal>();
        }

        return ParseDistricts(districts);
    }

    private static IReadOnlyDictionary<FuelType, decimal> ParseDistricts(List<OpetDistrictDto> districts)
    {
        decimal? diesel = null;
        decimal? gasoline = null;
        decimal? lpg = null;

        foreach (var district in districts)
        {
            if (district.Prices is null) continue;

            foreach (var p in district.Prices)
            {
                if (string.IsNullOrWhiteSpace(p.ProductName) || p.Amount <= 0)
                    continue;

                var name = p.ProductName;
                var upper = name.ToUpperInvariant();

                if (ContainsAny(upper, "OTOGAZ", "LPG"))
                {
                    lpg = lpg is null ? p.Amount : Math.Min(lpg.Value, p.Amount);
                    continue;
                }

                if (ContainsAny(upper, "MOTORIN", "MAZOT", "DIZEL", "DIESEL")
                    && !ContainsAny(upper, "EXCELLIUM", "KATKILI"))
                {
                    diesel = diesel is null ? p.Amount : Math.Max(diesel.Value, p.Amount);
                    continue;
                }

                if (ContainsAny(upper, "BENZIN", "KURSUNSUZ", "KURŞUNSUZ", "GASOLINE", "PETROL")
                    && !ContainsAny(upper, "EXCELLIUM"))
                {
                    gasoline = gasoline is null ? p.Amount : Math.Max(gasoline.Value, p.Amount);
                }
            }
        }

        var result = new Dictionary<FuelType, decimal>();
        if (diesel.HasValue) result[FuelType.Motorin] = diesel.Value;
        if (gasoline.HasValue) result[FuelType.Benzin] = gasoline.Value;
        if (lpg.HasValue) result[FuelType.Lpg] = lpg.Value;
        return result;
    }

    private static bool ContainsAny(string haystack, params string[] needles)
    {
        foreach (var n in needles)
        {
            if (haystack.Contains(n, StringComparison.Ordinal))
                return true;
        }
        return false;
    }

    private sealed class OpetDistrictDto
    {
        [JsonPropertyName("districtName")]
        public string? DistrictName { get; set; }

        [JsonPropertyName("prices")]
        public List<OpetPriceDto>? Prices { get; set; }
    }

    private sealed class OpetPriceDto
    {
        [JsonPropertyName("productName")]
        public string ProductName { get; set; } = string.Empty;

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }
    }
}
