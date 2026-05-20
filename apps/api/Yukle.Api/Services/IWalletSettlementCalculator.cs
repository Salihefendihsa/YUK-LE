namespace Yukle.Api.Services;

public interface IWalletSettlementCalculator
{
    WalletSettlement Calculate(decimal grossAmount, bool driverIsCorporate);
}
