using Microsoft.Extensions.Configuration;

namespace Yukle.Api.Services;

public sealed class WalletSettlementCalculator : IWalletSettlementCalculator
{
    private readonly decimal _commissionRate;
    private readonly decimal _withholdingRate;

    public WalletSettlementCalculator(IConfiguration configuration)
    {
        _commissionRate   = configuration.GetValue("Wallet:CommissionRate", 0.10m);
        _withholdingRate  = configuration.GetValue("Wallet:WithholdingRate", 0.05m);
    }

    public WalletSettlement Calculate(decimal grossAmount, bool driverIsCorporate)
    {
        var t = RoundMoney(grossAmount);
        var k = RoundMoney(t * _commissionRate);
        var s = driverIsCorporate ? 0m : RoundMoney(t * _withholdingRate);
        var h = RoundMoney(t - k - s);

        return new WalletSettlement
        {
            GrossAmount = t,
            Commission  = k,
            Withholding = s,
            DriverNet   = h
        };
    }

    private static decimal RoundMoney(decimal value)
        => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
