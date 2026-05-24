using Yukle.Api.Models;

namespace Yukle.Api.Infrastructure;

/// <summary>Arac profilindeki yakit tipi — DB <see cref="FuelType"/> ile eslenir.</summary>
public enum VehicleFuelKind
{
    Diesel,
    Gasoline,
    Lpg,
    Electric
}

public static class VehicleFuelKindMapper
{
    public static VehicleFuelKind Parse(string? raw, VehicleFuelKind fallback)
    {
        if (string.IsNullOrWhiteSpace(raw)) return fallback;
        return raw.Trim().ToLowerInvariant() switch
        {
            "diesel" or "motorin" or "mazot" => VehicleFuelKind.Diesel,
            "gasoline" or "benzin" or "petrol" => VehicleFuelKind.Gasoline,
            "lpg" or "otogaz" => VehicleFuelKind.Lpg,
            "electric" or "elektrik" or "ev" => VehicleFuelKind.Electric,
            _ => fallback
        };
    }

    public static FuelType ToDbFuelType(VehicleFuelKind kind) => kind switch
    {
        VehicleFuelKind.Gasoline => FuelType.Benzin,
        VehicleFuelKind.Lpg      => FuelType.Lpg,
        VehicleFuelKind.Diesel   => FuelType.Motorin,
        _                        => FuelType.Motorin
    };

    public static string UnitLabel(VehicleFuelKind kind) => kind switch
    {
        VehicleFuelKind.Electric => "kWh",
        _                        => "lt"
    };

    public static string PriceUnitLabel(VehicleFuelKind kind) => kind switch
    {
        VehicleFuelKind.Electric => "TL/kWh",
        _                        => "TL/lt"
    };
}
