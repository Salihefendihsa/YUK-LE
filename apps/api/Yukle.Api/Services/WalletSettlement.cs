namespace Yukle.Api.Services;

/// <summary>Roadmap 4.2.4 — gross T split into platform commission, withholding, driver net.</summary>
public sealed class WalletSettlement
{
    public decimal GrossAmount { get; init; }
    public decimal Commission { get; init; }
    public decimal Withholding { get; init; }
    public decimal DriverNet { get; init; }
}
