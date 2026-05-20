using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Yukle.Api.Data;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public sealed class WalletLedgerService(
    YukleDbContext              context,
    IWalletSettlementCalculator calculator,
    ILogger<WalletLedgerService> logger) : IWalletLedgerService
{
    public async Task ApplyHoldAsync(Guid loadId, int driverUserId, decimal grossAmount, CancellationToken ct = default)
    {
        var driver = await context.Users
            .FirstOrDefaultAsync(u => u.Id == driverUserId, ct)
            ?? throw new InvalidOperationException($"Driver user {driverUserId} not found.");

        var settlement = calculator.Calculate(grossAmount, driver.IsCorporate);
        var pendingBefore = driver.PendingBalance;

        driver.PendingBalance += settlement.DriverNet;
        var pendingAfter = driver.PendingBalance;

        await AddLogAsync(driverUserId, loadId, settlement.DriverNet, WalletAuditLogType.Hold,
            pendingBefore, pendingAfter,
            $"Escrow hold net={settlement.DriverNet:N2} gross={settlement.GrossAmount:N2}", ct);

        if (settlement.Commission > 0)
        {
            await AddLogAsync(driverUserId, loadId, settlement.Commission, WalletAuditLogType.Commission,
                pendingAfter, pendingAfter,
                $"Platform commission {settlement.Commission:N2} on gross {settlement.GrossAmount:N2}", ct);
        }

        if (settlement.Withholding > 0)
        {
            await AddLogAsync(driverUserId, loadId, settlement.Withholding, WalletAuditLogType.Tax,
                pendingAfter, pendingAfter,
                $"Withholding tax {settlement.Withholding:N2} on gross {settlement.GrossAmount:N2}", ct);
        }

        logger.LogInformation(
            "Wallet hold Load={LoadId} Driver={DriverId} T={Gross:N2} H={Net:N2} K={Commission:N2} S={Tax:N2} Corporate={Corp}",
            loadId, driverUserId, settlement.GrossAmount, settlement.DriverNet,
            settlement.Commission, settlement.Withholding, driver.IsCorporate);
    }

    public async Task ApplyReleaseAsync(Guid loadId, int driverUserId, CancellationToken ct = default)
    {
        var holdLog = await context.WalletAuditLogs
            .AsNoTracking()
            .Where(l => l.LoadId == loadId
                     && l.UserId == driverUserId
                     && l.Type == WalletAuditLogType.Hold)
            .OrderByDescending(l => l.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (holdLog is null)
            throw new InvalidOperationException($"No Hold audit for load {loadId} driver {driverUserId}.");

        var h = holdLog.Amount;

        var driver = await context.Users
            .FirstOrDefaultAsync(u => u.Id == driverUserId, ct)
            ?? throw new InvalidOperationException($"Driver user {driverUserId} not found.");

        if (driver.PendingBalance < h)
        {
            throw new InvalidOperationException(
                $"Insufficient pending balance for release. Pending={driver.PendingBalance:N2} required={h:N2}");
        }

        var pendingBefore = driver.PendingBalance;
        var walletBefore  = driver.WalletBalance;

        driver.PendingBalance -= h;
        driver.WalletBalance  += h;

        await AddLogAsync(driverUserId, loadId, h, WalletAuditLogType.Release,
            walletBefore, driver.WalletBalance,
            $"Escrow release net={h:N2} pending {pendingBefore:N2}->{driver.PendingBalance:N2}", ct);

        logger.LogInformation(
            "Wallet release Load={LoadId} Driver={DriverId} H={Net:N2} Wallet={Wallet:N2} Pending={Pending:N2}",
            loadId, driverUserId, h, driver.WalletBalance, driver.PendingBalance);
    }

    private async Task AddLogAsync(
        int userId, Guid loadId, decimal amount, WalletAuditLogType type,
        decimal balanceBefore, decimal balanceAfter, string reason, CancellationToken ct)
    {
        await context.WalletAuditLogs.AddAsync(new WalletAuditLog
        {
            UserId         = userId,
            LoadId         = loadId,
            Amount         = amount,
            Type           = type,
            BalanceBefore  = balanceBefore,
            BalanceAfter   = balanceAfter,
            Reason         = reason,
            CreatedAt      = DateTime.UtcNow
        }, ct);
    }
}
