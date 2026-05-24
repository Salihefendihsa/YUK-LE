using Microsoft.Extensions.Configuration;
using Yukle.Api.Infrastructure;

namespace Yukle.Api.Services;

public sealed class WalletSettlementCalculator : IWalletSettlementCalculator
{
    private readonly decimal _driverRate;
    private readonly decimal _customerRate;
    private readonly decimal _stopajRate;
    private readonly bool _stopajAppliesToCorporate;

    public WalletSettlementCalculator(IConfiguration configuration)
    {
        var options = CommissionSettlementOptions.FromConfiguration(configuration);
        _driverRate = options.DriverRate;
        _customerRate = options.CustomerRate;
        _stopajRate = options.StopajRate;
        _stopajAppliesToCorporate = options.StopajAppliesToCorporate;
    }

    public WalletSettlement Calculate(decimal bidAmount, bool driverIsCorporate)
    {
        var x = RoundMoney(bidAmount);
        var driverCommission = RoundMoney(x * _driverRate);
        var customerCommission = RoundMoney(x * _customerRate);

        var stopaj = CalculateStopaj(x, driverIsCorporate);
        var driverNet = RoundMoney(x - driverCommission - stopaj);
        var customerTotal = RoundMoney(x + customerCommission);
        var platformRevenue = RoundMoney(driverCommission + customerCommission);

        return new WalletSettlement
        {
            BidAmount              = x,
            DriverCommission       = driverCommission,
            CustomerCommission     = customerCommission,
            Withholding            = stopaj,
            DriverNet              = driverNet,
            CustomerTotal          = customerTotal,
            PlatformRevenue        = platformRevenue,
            DriverCommissionRate   = _driverRate,
            CustomerCommissionRate = _customerRate,
            StopajRate             = _stopajRate
        };
    }

    private decimal CalculateStopaj(decimal bidAmount, bool driverIsCorporate)
    {
        if (driverIsCorporate && !_stopajAppliesToCorporate)
            return 0m;

        if (!driverIsCorporate)
            return RoundMoney(bidAmount * _stopajRate);

        return _stopajAppliesToCorporate ? RoundMoney(bidAmount * _stopajRate) : 0m;
    }

    private static decimal RoundMoney(decimal value)
        => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
