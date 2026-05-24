using System.Globalization;
using Microsoft.Extensions.Configuration;
using Yukle.Api.Models;

namespace Yukle.Api.Infrastructure;

public sealed class FuelOptions
{
    public const int DefaultRefreshHours = 12;
    public const int DefaultRequestDelayMs = 400;

    public int RefreshHours { get; init; } = DefaultRefreshHours;
    public int RequestDelayMs { get; init; } = DefaultRequestDelayMs;
    public FuelFallbackOptions Fallback { get; init; } = FuelFallbackOptions.Defaults();
    public FuelSanityOptions Sanity { get; init; } = FuelSanityOptions.Defaults();

    public static FuelOptions FromConfiguration(IConfiguration? configuration)
    {
        if (configuration is null)
            return new FuelOptions();

        return new FuelOptions
        {
            RefreshHours = ReadInt(configuration, "Fuel:RefreshHours", DefaultRefreshHours, 1, 168),
            RequestDelayMs = ReadInt(configuration, "Fuel:RequestDelayMs", DefaultRequestDelayMs, 100, 5000),
            Fallback = FuelFallbackOptions.FromConfiguration(configuration),
            Sanity = FuelSanityOptions.FromConfiguration(configuration)
        };
    }

    public decimal GetFallbackPrice(FuelType fuelType) => fuelType switch
    {
        FuelType.Benzin => Fallback.Gasoline,
        FuelType.Lpg    => Fallback.Lpg,
        _               => Fallback.Diesel
    };

    public decimal GetFallbackPrice(VehicleFuelKind kind) => kind switch
    {
        VehicleFuelKind.Gasoline => Fallback.Gasoline,
        VehicleFuelKind.Lpg      => Fallback.Lpg,
        VehicleFuelKind.Electric => Fallback.Electric,
        _                        => Fallback.Diesel
    };

    private static int ReadInt(IConfiguration config, string key, int fallback, int min, int max)
    {
        try
        {
            var v = config.GetValue<int?>(key);
            if (v is null || v.Value < min) return fallback;
            return Math.Min(v.Value, max);
        }
        catch
        {
            return fallback;
        }
    }
}

public sealed class FuelFallbackOptions
{
    public decimal Diesel { get; init; } = 68m;
    public decimal Gasoline { get; init; } = 65m;
    public decimal Lpg { get; init; } = 31m;
    public decimal Electric { get; init; } = 10m;

    public static FuelFallbackOptions Defaults() => new();

    public static FuelFallbackOptions FromConfiguration(IConfiguration config) => new()
    {
        Diesel    = ReadDecimal(config, "Fuel:Fallback:Diesel", 68m),
        Gasoline  = ReadDecimal(config, "Fuel:Fallback:Gasoline", 65m),
        Lpg       = ReadDecimal(config, "Fuel:Fallback:Lpg", 31m),
        Electric  = ReadDecimal(config, "Fuel:Fallback:Electric", 10m)
    };

    private static decimal ReadDecimal(IConfiguration config, string key, decimal fallback)
    {
        try
        {
            var v = config.GetValue<decimal?>(key);
            return v is null or <= 0 ? fallback : v.Value;
        }
        catch
        {
            return fallback;
        }
    }
}

public sealed class FuelSanityOptions
{
    public decimal DieselMin { get; init; } = 20m;
    public decimal DieselMax { get; init; } = 250m;
    public decimal GasolineMin { get; init; } = 20m;
    public decimal GasolineMax { get; init; } = 250m;
    public decimal LpgMin { get; init; } = 8m;
    public decimal LpgMax { get; init; } = 120m;
    public decimal MaxJumpPercent { get; init; } = 25m;

    public static FuelSanityOptions Defaults() => new();

    public static FuelSanityOptions FromConfiguration(IConfiguration config) => new()
    {
        DieselMin       = ReadDecimal(config, "Fuel:Sanity:DieselMin", 20m),
        DieselMax       = ReadDecimal(config, "Fuel:Sanity:DieselMax", 250m),
        GasolineMin     = ReadDecimal(config, "Fuel:Sanity:GasolineMin", 20m),
        GasolineMax     = ReadDecimal(config, "Fuel:Sanity:GasolineMax", 250m),
        LpgMin          = ReadDecimal(config, "Fuel:Sanity:LpgMin", 8m),
        LpgMax          = ReadDecimal(config, "Fuel:Sanity:LpgMax", 120m),
        MaxJumpPercent  = ReadDecimal(config, "Fuel:Sanity:MaxJumpPercent", 25m)
    };

    public (decimal Min, decimal Max) GetBand(FuelType fuelType) => fuelType switch
    {
        FuelType.Benzin => (GasolineMin, GasolineMax),
        FuelType.Lpg    => (LpgMin, LpgMax),
        _               => (DieselMin, DieselMax)
    };

    private static decimal ReadDecimal(IConfiguration config, string key, decimal fallback)
    {
        try
        {
            var v = config.GetValue<decimal?>(key);
            return v is null or < 0 ? fallback : v.Value;
        }
        catch
        {
            return fallback;
        }
    }
}

public static class FuelPriceSanity
{
    public static bool IsPriceValid(
        decimal apiPrice,
        decimal? lastKnownGood,
        decimal absMin,
        decimal absMax,
        decimal maxJumpPercent)
    {
        if (apiPrice < absMin || apiPrice > absMax)
            return false;

        if (lastKnownGood is null or <= 0)
            return true;

        var maxJump = lastKnownGood.Value * (maxJumpPercent / 100m);
        return Math.Abs(apiPrice - lastKnownGood.Value) <= maxJump;
    }
}
