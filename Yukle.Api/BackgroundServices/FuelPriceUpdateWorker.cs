using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.Models;

namespace Yukle.Api.BackgroundServices;

/// <summary>
/// Her gün gece saat <c>FuelPriceWorker:UpdateHour</c> (varsayılan: 00:00) UTC'de uyanır;
/// CollectAPI üzerinden Türkiye il bazlı Motorin fiyatlarını çekerek <c>FuelPrices</c> tablosunu günceller.
/// API ulaşılamazsa son başarılı fiyat DB'de korunur ve uyarı logu bırakılır.
/// </summary>
public sealed class FuelPriceUpdateWorker(
    IServiceScopeFactory        scopeFactory,
    IConfiguration              config,
    ILogger<FuelPriceUpdateWorker> logger) : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(1);

    // CollectAPI endpoint
    private const string CollectApiUrl =
        "https://api.collectapi.com/economy/fuelPrices";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("FuelPriceUpdateWorker başlatıldı.");

        // Uygulama ilk açıldığında da bir kez çalış (DB boşsa fiyatlar hemen gelsin)
        await TryUpdateFuelPricesAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(CheckInterval, stoppingToken);

            var targetHour = config.GetValue<int>("FuelPriceWorker:UpdateHour", 0);
            var now        = DateTime.UtcNow;

            // Sadece belirlenen saatte (dakika 00-01 penceresinde) çalış
            if (now.Hour == targetHour && now.Minute == 0)
            {
                await TryUpdateFuelPricesAsync(stoppingToken);

                // Aynı saat içinde çift tetiklenmeyi önlemek için 2 dakika bekle
                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
        }
    }

    // ── Core Update Logic ─────────────────────────────────────────────────────

    private async Task TryUpdateFuelPricesAsync(CancellationToken ct)
    {
        logger.LogInformation("Yakıt fiyatı güncelleme başladı (UTC {Time})", DateTime.UtcNow);

        var apiKey = config["CollectAPI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            logger.LogWarning("CollectAPI:ApiKey yapılandırılmamış — yakıt fiyatı güncelleme atlandı.");
            return;
        }

        try
        {
            using var scope  = scopeFactory.CreateScope();
            var db           = scope.ServiceProvider.GetRequiredService<YukleDbContext>();
            var httpFactory  = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
            using var client = httpFactory.CreateClient("CollectAPI");

            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("authorization", $"apikey {apiKey}");
            client.DefaultRequestHeaders.Add("content-type",  "application/json");

            using var response = await client.GetAsync(CollectApiUrl, ct);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Warning: Fuel API unreachable, using last cached price. " +
                    "HTTP {Status}", response.StatusCode);
                return;
            }

            var body    = await response.Content.ReadAsStringAsync(ct);
            var apiResp = JsonSerializer.Deserialize<CollectApiResponse>(body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (apiResp?.Success != true || apiResp.Result is not { Count: > 0 })
            {
                logger.LogWarning("CollectAPI boş/hatalı yanıt döndü.");
                return;
            }

            var today   = DateOnly.FromDateTime(DateTime.UtcNow);
            var newRows = new List<FuelPrice>();

            foreach (var item in apiResp.Result)
            {
                if (string.IsNullOrWhiteSpace(item.Name)) continue;

                // Motorin
                if (decimal.TryParse(item.Motorin,
                        System.Globalization.NumberStyles.Number,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out var motorinPrice) && motorinPrice > 0)
                {
                    newRows.Add(BuildRow(item.Name, motorinPrice, FuelType.Motorin, today));
                }

                // Benzin
                if (decimal.TryParse(item.Benzin,
                        System.Globalization.NumberStyles.Number,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out var benzinPrice) && benzinPrice > 0)
                {
                    newRows.Add(BuildRow(item.Name, benzinPrice, FuelType.Benzin, today));
                }

                // LPG
                if (decimal.TryParse(item.Lpg,
                        System.Globalization.NumberStyles.Number,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out var lpgPrice) && lpgPrice > 0)
                {
                    newRows.Add(BuildRow(item.Name, lpgPrice, FuelType.Lpg, today));
                }
            }

            if (newRows.Count == 0)
            {
                logger.LogWarning("CollectAPI yanıtından hiç geçerli fiyat parse edilemedi.");
                return;
            }

            // Bugünkü kayıtları sil (upsert benzeri — günde 1 güncelleme yeterli)
            var existing = await db.FuelPrices
                .Where(f => f.Date == today && f.Source == "CollectAPI")
                .ToListAsync(ct);

            db.FuelPrices.RemoveRange(existing);
            await db.FuelPrices.AddRangeAsync(newRows, ct);
            await db.SaveChangesAsync(ct);

            logger.LogInformation(
                "Yakıt fiyatı güncellemesi tamamlandı: {Count} il kaydedildi (kaynak: CollectAPI).",
                newRows.Count / 3);  // 3 tür: motorin, benzin, lpg
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex,
                "Warning: Fuel API unreachable, using last cached price.");
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            logger.LogWarning(ex, "CollectAPI isteği zaman aşımına uğradı.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Yakıt fiyatı güncellemesi sırasında beklenmeyen hata.");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static FuelPrice BuildRow(
        string city, decimal price, FuelType fuelType, DateOnly date) => new()
    {
        City      = city,
        PriceTL   = price,
        FuelType  = fuelType,
        Date      = date,
        FetchedAt = DateTime.UtcNow,
        Source    = "CollectAPI"
    };

    // ── CollectAPI Response DTOs ──────────────────────────────────────────────

    private sealed class CollectApiResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("result")]
        public List<CollectApiFuelItem> Result { get; set; } = [];
    }

    private sealed class CollectApiFuelItem
    {
        /// <summary>İl adı — Türkçe (örn: "Elazığ", "İstanbul").</summary>
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("benzin")]
        public string Benzin { get; set; } = string.Empty;

        [JsonPropertyName("motorin")]
        public string Motorin { get; set; } = string.Empty;

        [JsonPropertyName("lpg")]
        public string Lpg { get; set; } = string.Empty;
    }
}
