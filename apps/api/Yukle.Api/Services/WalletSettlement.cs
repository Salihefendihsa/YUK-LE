namespace Yukle.Api.Services;

/// <summary>Bid amount X split: driver/customer commission, stopaj, nets.</summary>
public sealed class WalletSettlement
{
    /// <summary>Accepted bid amount (X).</summary>
    public decimal BidAmount { get; init; }

    public decimal DriverCommission { get; init; }
    public decimal CustomerCommission { get; init; }
    public decimal Withholding { get; init; }
    public decimal DriverNet { get; init; }
    public decimal CustomerTotal { get; init; }
    public decimal PlatformRevenue { get; init; }

    public decimal DriverCommissionRate { get; init; }
    public decimal CustomerCommissionRate { get; init; }
    public decimal StopajRate { get; init; }
}
