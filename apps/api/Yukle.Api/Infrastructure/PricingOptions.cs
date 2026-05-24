using System.Globalization;
using Microsoft.Extensions.Configuration;

namespace Yukle.Api.Infrastructure;

/// <summary>Navlun fiyatlandirma oranlari — config eksikse guvenli varsayilanlar.</summary>
public sealed class PricingOptions
{
    public const decimal DefaultProfitMarginRate = 0.25m;
    public const decimal DefaultVolumetricKgPerM3 = 333m;
    public const decimal DefaultFuelPriceTl = 42.50m;
    public const decimal DefaultBenzinPriceTl = 44.00m;
    public const decimal DefaultLpgPriceTl = 28.00m;
    public const decimal DefaultElectricityPriceTlPerKwh = 8.50m;

    public decimal ProfitMarginRate { get; init; } = DefaultProfitMarginRate;
    public decimal VolumetricKgPerM3 { get; init; } = DefaultVolumetricKgPerM3;
    public decimal DefaultFuelPriceTlValue { get; init; } = DefaultFuelPriceTl;
    public decimal DefaultBenzinPriceTlValue { get; init; } = DefaultBenzinPriceTl;
    public decimal DefaultLpgPriceTlValue { get; init; } = DefaultLpgPriceTl;
    public decimal ElectricityPriceTlPerKwh { get; init; } = DefaultElectricityPriceTlPerKwh;

    public VehiclePricingProfile Tir { get; init; } = VehiclePricingProfile.TirDefaults();
    public VehiclePricingProfile Kamyon { get; init; } = VehiclePricingProfile.KamyonDefaults();
    public VehiclePricingProfile Kamyonet { get; init; } = VehiclePricingProfile.KamyonetDefaults();
    public VehiclePricingProfile Panelvan { get; init; } = VehiclePricingProfile.PanelvanDefaults();

    public static PricingOptions FromConfiguration(IConfiguration? configuration)
    {
        if (configuration is null)
            return new PricingOptions();

        return new PricingOptions
        {
            ProfitMarginRate = ReadDecimal(configuration, "Pricing:ProfitMarginRate", DefaultProfitMarginRate),
            VolumetricKgPerM3 = ReadDecimal(configuration, "Pricing:VolumetricKgPerM3", DefaultVolumetricKgPerM3),
            DefaultFuelPriceTlValue = ReadDecimal(configuration, "Pricing:DefaultFuelPriceTl", DefaultFuelPriceTl),
            DefaultBenzinPriceTlValue = ReadDecimal(configuration, "Pricing:DefaultBenzinPriceTl", DefaultBenzinPriceTl),
            DefaultLpgPriceTlValue = ReadDecimal(configuration, "Pricing:DefaultLpgPriceTl", DefaultLpgPriceTl),
            ElectricityPriceTlPerKwh = ReadDecimal(
                configuration, "Pricing:ElectricityPriceTlPerKwh", DefaultElectricityPriceTlPerKwh),
            Tir = VehiclePricingProfile.FromConfiguration(configuration, "TIR", VehiclePricingProfile.TirDefaults()),
            Kamyon = VehiclePricingProfile.FromConfiguration(configuration, "KAMYON", VehiclePricingProfile.KamyonDefaults()),
            Kamyonet = VehiclePricingProfile.FromConfiguration(configuration, "KAMYONET", VehiclePricingProfile.KamyonetDefaults()),
            Panelvan = VehiclePricingProfile.FromConfiguration(configuration, "PANELVAN", VehiclePricingProfile.PanelvanDefaults())
        };
    }

    public VehiclePricingProfile GetVehicleProfile(string vehicleType)
    {
        return vehicleType.Trim().ToUpperInvariant() switch
        {
            "TIR" => Tir,
            "KAMYON" => Kamyon,
            "KAMYONET" => Kamyonet,
            "PANELVAN" => Panelvan,
            _ => Kamyon
        };
    }

    public decimal GetDefaultFuelPrice(VehicleFuelKind kind) => kind switch
    {
        VehicleFuelKind.Gasoline => DefaultBenzinPriceTlValue,
        VehicleFuelKind.Lpg      => DefaultLpgPriceTlValue,
        VehicleFuelKind.Electric => ElectricityPriceTlPerKwh,
        _                        => DefaultFuelPriceTlValue
    };

    private static decimal ReadDecimal(IConfiguration config, string key, decimal fallback)
    {
        try
        {
            var value = config.GetValue<decimal?>(key);
            if (value is null)
            {
                var raw = config[key];
                if (string.IsNullOrWhiteSpace(raw)) return fallback;
                if (!decimal.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed))
                    return fallback;
                value = parsed;
            }

            return value.Value < 0 ? fallback : value.Value;
        }
        catch
        {
            return fallback;
        }
    }
}

public sealed class VehiclePricingProfile
{
    public VehicleFuelKind FuelKind { get; init; } = VehicleFuelKind.Diesel;

    /// <summary>Sivi: lt/100 km; elektrik: kWh/100 km.</summary>
    public decimal ConsumptionPer100Km { get; init; } = 26m;

    public decimal TollTlPerKm { get; init; } = 1.50m;
    public decimal AmortizationTlPerKm { get; init; } = 2.50m;
    public decimal WeightSurchargePerTon { get; init; } = 12m;
    public decimal MinPriceBand { get; init; } = 0.85m;
    public decimal MaxPriceBand { get; init; } = 1.22m;

    public static VehiclePricingProfile TirDefaults() => new()
    {
        FuelKind = VehicleFuelKind.Diesel,
        ConsumptionPer100Km = 32m,
        TollTlPerKm = 2.00m,
        AmortizationTlPerKm = 3.50m,
        WeightSurchargePerTon = 15m,
        MinPriceBand = 0.82m,
        MaxPriceBand = 1.25m
    };

    public static VehiclePricingProfile KamyonDefaults() => new()
    {
        FuelKind = VehicleFuelKind.Diesel,
        ConsumptionPer100Km = 26m,
        TollTlPerKm = 1.50m,
        AmortizationTlPerKm = 2.50m,
        WeightSurchargePerTon = 12m,
        MinPriceBand = 0.85m,
        MaxPriceBand = 1.22m
    };

    public static VehiclePricingProfile KamyonetDefaults() => new()
    {
        FuelKind = VehicleFuelKind.Diesel,
        ConsumptionPer100Km = 13m,
        TollTlPerKm = 0.80m,
        AmortizationTlPerKm = 1.20m,
        WeightSurchargePerTon = 8m,
        MinPriceBand = 0.88m,
        MaxPriceBand = 1.18m
    };

    public static VehiclePricingProfile PanelvanDefaults() => new()
    {
        FuelKind = VehicleFuelKind.Gasoline,
        ConsumptionPer100Km = 10m,
        TollTlPerKm = 0.50m,
        AmortizationTlPerKm = 0.80m,
        WeightSurchargePerTon = 5m,
        MinPriceBand = 0.90m,
        MaxPriceBand = 1.15m
    };

    public static VehiclePricingProfile FromConfiguration(
        IConfiguration config,
        string vehicleKey,
        VehiclePricingProfile defaults)
    {
        string P(string name) => $"Pricing:Vehicle:{vehicleKey}:{name}";

        var fuelKind = VehicleFuelKindMapper.Parse(config[P("FuelKind")], defaults.FuelKind);

        var consumption = Read(config, P("ConsumptionPer100Km"), -1m);
        if (consumption < 0)
        {
            if (fuelKind == VehicleFuelKind.Electric)
                consumption = Read(config, P("ConsumptionKwhPer100Km"), defaults.ConsumptionPer100Km);
            else
                consumption = Read(config, P("ConsumptionLPer100Km"), defaults.ConsumptionPer100Km);
        }

        if (consumption < 0)
            consumption = defaults.ConsumptionPer100Km;

        return new VehiclePricingProfile
        {
            FuelKind = fuelKind,
            ConsumptionPer100Km = consumption,
            TollTlPerKm = Read(config, P("TollTlPerKm"), defaults.TollTlPerKm),
            AmortizationTlPerKm = Read(config, P("AmortizationTlPerKm"), defaults.AmortizationTlPerKm),
            WeightSurchargePerTon = Read(config, P("WeightSurchargePerTon"), defaults.WeightSurchargePerTon),
            MinPriceBand = Read(config, P("MinPriceBand"), defaults.MinPriceBand),
            MaxPriceBand = Read(config, P("MaxPriceBand"), defaults.MaxPriceBand)
        };
    }

    private static decimal Read(IConfiguration config, string key, decimal fallback)
    {
        try
        {
            var value = config.GetValue<decimal?>(key);
            return value is null or < 0 ? fallback : value.Value;
        }
        catch
        {
            return fallback;
        }
    }
}
