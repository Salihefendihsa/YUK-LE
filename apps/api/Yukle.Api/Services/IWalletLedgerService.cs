namespace Yukle.Api.Services;

public interface IWalletLedgerService
{
    /// <summary>Escrow hold: pending += H, audit Hold/Commission/Tax.</summary>
    Task ApplyHoldAsync(Guid loadId, int driverUserId, decimal grossAmount, CancellationToken ct = default);

    /// <summary>Release: pending -= H, wallet += H, audit Release.</summary>
    Task ApplyReleaseAsync(Guid loadId, int driverUserId, CancellationToken ct = default);
}
