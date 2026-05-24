using System.Globalization;
using Microsoft.Extensions.Configuration;

namespace Yukle.Api.Infrastructure;

/// <summary>Komisyon ve stopaj oranlari — config eksik/null olsa bile guvenli varsayilanlar.</summary>
public sealed class CommissionSettlementOptions
{
    public const decimal DefaultDriverRate = 0.02m;
    public const decimal DefaultCustomerRate = 0.02m;
    public const decimal DefaultStopajRate = 0.0m;
    public const bool DefaultStopajAppliesToCorporate = false;

    public decimal DriverRate { get; init; } = DefaultDriverRate;
    public decimal CustomerRate { get; init; } = DefaultCustomerRate;
    public decimal StopajRate { get; init; } = DefaultStopajRate;
    public bool StopajAppliesToCorporate { get; init; } = DefaultStopajAppliesToCorporate;

    public static CommissionSettlementOptions FromConfiguration(IConfiguration? configuration)
    {
        if (configuration is null)
            return new CommissionSettlementOptions();

        return new CommissionSettlementOptions
        {
            DriverRate = ReadDecimal(configuration, "Commission:DriverRate", DefaultDriverRate),
            CustomerRate = ReadDecimal(configuration, "Commission:CustomerRate", DefaultCustomerRate),
            StopajRate = ReadDecimal(configuration, "Settlement:StopajRate", DefaultStopajRate),
            StopajAppliesToCorporate = ReadBool(
                configuration,
                "Settlement:StopajAppliesToCorporate",
                DefaultStopajAppliesToCorporate)
        };
    }

    private static decimal ReadDecimal(IConfiguration config, string key, decimal fallback)
    {
        try
        {
            var value = config.GetValue<decimal?>(key);
            if (value is null)
            {
                var raw = config[key];
                if (string.IsNullOrWhiteSpace(raw))
                    return fallback;
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

    private static bool ReadBool(IConfiguration config, string key, bool fallback)
    {
        try
        {
            var value = config.GetValue<bool?>(key);
            return value ?? fallback;
        }
        catch
        {
            return fallback;
        }
    }
}
