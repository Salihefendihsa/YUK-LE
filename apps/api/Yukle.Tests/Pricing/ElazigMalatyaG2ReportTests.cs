using System.Globalization;
using Npgsql;
using Xunit.Abstractions;
using Yukle.Api.Infrastructure;
using Yukle.Api.Services;

namespace Yukle.Tests.Pricing;

/// <summary>FAZ G.2 — Elazig-Malatya gercekci model raporu (sunucu tarafi dokum).</summary>
public sealed class ElazigMalatyaG2ReportTests(ITestOutputHelper output)
{
    private const double  OsrmDistanceKm = 101.59;
    private const string  VehicleType    = "TIR";
    private const double  WeightTon      = 12.0;
    private const double  VolumeM3       = 24.0;
    private const string  Route          = "Elazig → Malatya";

    [Fact(DisplayName = "G.2 Rapor — Elazig-Malatya TIR 12t 24m3 (DB canli motorin)")]
    public async Task Report_ElazigMalatya_RealisticModel()
    {
        var options = PricingOptions.FromConfiguration(null);
        var profile = options.GetVehicleProfile(VehicleType);

        var motorinTl = await TryGetElazigMotorinFromDbAsync()
                        ?? options.DefaultFuelPriceTlValue;
        var motorinSource = motorinTl != options.DefaultFuelPriceTlValue
            ? "FuelPrices DB (Elazig, Motorin)"
            : "config fallback (DB bos/ulasilamadi)";

        var engine = new FreightPricingEngine(options);
        var result = engine.Calculate(new FreightPricingInput(
            OsrmDistanceKm, VehicleType, motorinTl, WeightTon, VolumeM3, Route));

        var dist = (decimal)OsrmDistanceKm;
        var fuel = FreightPricingEngine.CalculateFuelCost(dist, profile, motorinTl);
        var toll = Math.Round(dist * profile.TollTlPerKm, 2);
        var amort = Math.Round(dist * profile.AmortizationTlPerKm, 2);
        var baseCost = fuel + toll + amort;
        var profit = Math.Round(baseCost * options.ProfitMarginRate, 2);
        var load = Math.Round(12m * profile.WeightSurchargePerTon, 2);

        output.WriteLine("══════════════════════════════════════════════════════");
        output.WriteLine("  FAZ G.2 — Elazig → Malatya (TIR, 12 t, 24 m³)");
        output.WriteLine("══════════════════════════════════════════════════════");
        output.WriteLine($"  OSRM mesafe          : {OsrmDistanceKm:F1} km");
        output.WriteLine($"  Canli motorin (kaynak): {motorinSource}");
        output.WriteLine($"  Motorin birim fiyat  : {motorinTl:N2} TL/lt");
        output.WriteLine($"  Tuketim (TIR)        : {profile.ConsumptionPer100Km} lt/100 km");
        output.WriteLine($"  Kar marji            : %{options.ProfitMarginRate * 100m:N0}");
        output.WriteLine("──────────────────────────────────────────────────────");
        output.WriteLine($"  Yakit maliyeti       : {fuel:N2} TL");
        output.WriteLine($"  Otoyol/kopru         : {toll:N2} TL");
        output.WriteLine($"  Amortisman           : {amort:N2} TL");
        output.WriteLine($"  Taban maliyet        : {baseCost:N2} TL");
        output.WriteLine($"  Kar payi (%25)       : {profit:N2} TL");
        output.WriteLine($"  Yuk payi (12 t)      : {load:N2} TL");
        output.WriteLine("──────────────────────────────────────────────────────");
        output.WriteLine($"  ONERILEN             : {result.RecommendedPrice:N2} TL");
        output.WriteLine($"  MIN                  : {result.MinPrice:N2} TL");
        output.WriteLine($"  MAX                  : {result.MaxPrice:N2} TL");
        output.WriteLine("══════════════════════════════════════════════════════");

        Assert.True(result.RecommendedPrice > 0);
        Assert.InRange(result.RecommendedPrice, 2_000m, 4_500m);
    }

    private static async Task<decimal?> TryGetElazigMotorinFromDbAsync()
    {
        var cs = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                 ?? "Host=localhost;Port=5432;Database=yukledb;Username=postgres;Password=adb16adb";
        try
        {
            await using var conn = new NpgsqlConnection(cs);
            await conn.OpenAsync();
            await using var cmd = new NpgsqlCommand(
                """
                SELECT "PriceTL", "City", "Date" FROM "FuelPrices"
                WHERE "FuelType" = 0
                  AND ("PlateCode" = 23 OR "City" ILIKE 'Elaz%')
                ORDER BY "FetchedAt" DESC
                LIMIT 1
                """, conn);
            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var price = reader.GetDecimal(0);
                if (price > 0) return price;
            }

            await reader.CloseAsync();
            await using var anyCmd = new NpgsqlCommand(
                """SELECT "PriceTL" FROM "FuelPrices" WHERE "FuelType" = 0 ORDER BY "Date" DESC LIMIT 1""",
                conn);
            var any = await anyCmd.ExecuteScalarAsync();
            return any is decimal d2 and > 0 ? d2 : null;
        }
        catch
        {
            return null;
        }
    }
}
