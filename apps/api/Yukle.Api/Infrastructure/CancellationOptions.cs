using Microsoft.Extensions.Configuration;

namespace Yukle.Api.Infrastructure;

public sealed class CancellationOptions
{
    public bool AllowCustomerCancelAfterAccept { get; init; }
    public decimal RefundPercent { get; init; } = 100m;
    public decimal CancellationFee { get; init; }
    public bool AllowCancelAfterTripStart { get; init; }

    public static CancellationOptions FromConfiguration(IConfiguration? configuration)
    {
        if (configuration is null)
            return Defaults();

        return new CancellationOptions
        {
            AllowCustomerCancelAfterAccept = configuration.GetValue("Cancellation:AllowCustomerCancelAfterAccept", false),
            RefundPercent = ReadPercent(configuration, "Cancellation:RefundPercent", 100m),
            CancellationFee = ReadMoney(configuration, "Cancellation:CancellationFee", 0m),
            AllowCancelAfterTripStart = configuration.GetValue("Cancellation:AllowCancelAfterTripStart", false)
        };
    }

    public static CancellationOptions Defaults() => new();

    private static decimal ReadPercent(IConfiguration config, string key, decimal fallback)
    {
        var v = config.GetValue<decimal?>(key);
        if (v is null or < 0 or > 100)
            return fallback;
        return v.Value;
    }

    private static decimal ReadMoney(IConfiguration config, string key, decimal fallback)
    {
        var v = config.GetValue<decimal?>(key);
        if (v is null or < 0)
            return fallback;
        return v.Value;
    }
}
