using System.Globalization;
using Yukle.Api.DTOs;
using Yukle.Api.Infrastructure;

namespace Yukle.Api.Services;

public sealed record FreightPricingInput(
    double DistanceKm,
    string VehicleType,
    decimal FuelUnitPriceTl,
    double WeightTon,
    double VolumeM3,
    string? Route = null);

/// <summary>
/// Deterministik navlun modeli — arac yakit tipine gore birim fiyat, hacimsel agirlik, config oranlari.
/// Maliyet dokumu yalnizca sunucu tarafinda tutulur.
/// </summary>
public sealed class FreightPricingEngine(PricingOptions options)
{
    public AiPriceSuggestionDto Calculate(FreightPricingInput input)
    {
        var profile = options.GetVehicleProfile(input.VehicleType);
        var dist = (decimal)input.DistanceKm;
        var weightTon = (decimal)input.WeightTon;
        var volumeM3 = (decimal)Math.Max(0, input.VolumeM3);

        var volumetricTon = volumeM3 > 0
            ? Math.Round(volumeM3 * options.VolumetricKgPerM3 / 1000m, 3)
            : 0m;
        var effectiveTon = Math.Max(weightTon, volumetricTon);

        var fuelCost = CalculateFuelCost(dist, profile, input.FuelUnitPriceTl);
        var tollCost = Math.Round(dist * profile.TollTlPerKm, 2);
        var amortCost = Math.Round(dist * profile.AmortizationTlPerKm, 2);

        var baseCost = fuelCost + tollCost + amortCost;
        var profit = Math.Round(baseCost * options.ProfitMarginRate, 2);
        var loadSurcharge = Math.Round(effectiveTon * profile.WeightSurchargePerTon, 2);

        var recommended = Math.Round(baseCost + profit + loadSurcharge, 2);
        var min = Math.Round(recommended * profile.MinPriceBand, 2);
        var max = Math.Round(recommended * profile.MaxPriceBand, 2);
        var netProfit = Math.Max(0m, Math.Round(recommended - fuelCost - tollCost - amortCost, 2));

        var reasoning = BuildUserReasoning(
            input.Route,
            input.VehicleType,
            input.DistanceKm,
            effectiveTon,
            recommended,
            min,
            max);

        return new AiPriceSuggestionDto(
            recommended,
            min,
            max,
            reasoning,
            FuelCost: fuelCost,
            TollCost: tollCost,
            AmortizationCost: amortCost,
            EstimatedNetProfit: netProfit);
    }

    internal static decimal CalculateFuelCost(
        decimal distanceKm,
        VehiclePricingProfile profile,
        decimal unitPriceTl)
        => Math.Round(distanceKm / 100m * profile.ConsumptionPer100Km * unitPriceTl, 2);

    private static string BuildUserReasoning(
        string? route,
        string vehicleType,
        double distanceKm,
        decimal effectiveTon,
        decimal recommended,
        decimal min,
        decimal max)
    {
        var routePart = string.IsNullOrWhiteSpace(route)
            ? $"{distanceKm:F0} km mesafe"
            : route;

        return
            $"{routePart} icin {vehicleType} arac tipi ve {effectiveTon:N1} ton fatura agirligi baz alinarak " +
            $"onerilen navlun {recommended:N0} TL (aralik {min:N0}–{max:N0} TL) olarak hesaplandi. " +
            "Bu deger rehber niteligindedir; kesin fiyat teklif uzerinden belirlenir.";
    }
}
