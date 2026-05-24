using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.Infrastructure;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public sealed record FuelPriceRefreshResult(
    int UpdatedProvinces,
    int UpsertedRows,
    int RejectedPrices,
    int FailedProvinces,
    string Source);

/// <summary>81 il yakit fiyatlarini canli kaynaktan cekip FuelPrices tablosuna yazar.</summary>
public sealed class FuelPriceRefreshService(
    YukleDbContext         db,
    OpetFuelPriceClient    opetClient,
    IConfiguration         configuration,
    ILogger<FuelPriceRefreshService> logger)
{
    private const string SourceTag = "Opet";

    public async Task<FuelPriceRefreshResult> RefreshAllAsync(CancellationToken ct = default)
    {
        var fuelOpts = FuelOptions.FromConfiguration(configuration);
        logger.LogInformation("Yakit fiyati guncelleme dongusu basladi (UTC {Time})", DateTime.UtcNow);

        var updatedProvinces = 0;
        var rejectedPrices   = 0;
        var failedProvinces  = 0;
        var upsertedRows     = 0;
        var today            = DateOnly.FromDateTime(DateTime.UtcNow);
        var rng              = Random.Shared;

        foreach (var plate in TurkeyPlateRegistry.Plates)
        {
            if (ct.IsCancellationRequested) break;

            try
            {
                var fetched = await opetClient.FetchProvincePricesAsync(plate.Code, ct);
                if (fetched.Count == 0)
                {
                    failedProvinces++;
                    logger.LogDebug("Plaka {Code} ({Name}): fiyat parse edilemedi.", plate.Code, plate.Name);
                }
                else
                {
                    var provinceUpdated = false;

                    foreach (var (fuelType, amount) in fetched)
                    {
                        var existing = await db.FuelPrices
                            .Where(f => f.PlateCode == plate.Code && f.FuelType == fuelType)
                            .OrderByDescending(f => f.FetchedAt)
                            .FirstOrDefaultAsync(ct);

                        var lastGood = existing?.PriceTL;
                        var (min, max) = fuelOpts.Sanity.GetBand(fuelType);

                        if (!FuelPriceSanity.IsPriceValid(
                                amount, lastGood, min, max, fuelOpts.Sanity.MaxJumpPercent))
                        {
                            rejectedPrices++;
                            continue;
                        }

                        var now = DateTime.UtcNow;
                        if (existing is not null)
                        {
                            existing.PriceTL   = amount;
                            existing.FetchedAt = now;
                            existing.Date      = today;
                            existing.Source    = SourceTag;
                            existing.City      = plate.Name;
                        }
                        else
                        {
                            await db.FuelPrices.AddAsync(new FuelPrice
                            {
                                PlateCode = plate.Code,
                                City      = plate.Name,
                                PriceTL   = amount,
                                FuelType  = fuelType,
                                Date      = today,
                                FetchedAt = now,
                                Source    = SourceTag
                            }, ct);
                        }

                        upsertedRows++;
                        provinceUpdated = true;
                    }

                    if (provinceUpdated)
                        updatedProvinces++;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                failedProvinces++;
                logger.LogWarning(ex, "Plaka {Code} ({Name}) guncellenemedi.", plate.Code, plate.Name);
            }

            await Task.Delay(fuelOpts.RequestDelayMs + rng.Next(0, 201), ct);
        }

        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "Yakit guncelleme ozeti: {Updated} il guncellendi, {Upserted} kayit yazildi, " +
            "{Rejected} fiyat reddedildi, {Failed} il basarisiz (kaynak: {Source}).",
            updatedProvinces, upsertedRows, rejectedPrices, failedProvinces, SourceTag);

        return new FuelPriceRefreshResult(
            updatedProvinces, upsertedRows, rejectedPrices, failedProvinces, SourceTag);
    }
}
