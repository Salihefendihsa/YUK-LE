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
            $"Escrow hold net={settlement.DriverNet:N2} bid={settlement.BidAmount:N2}", ct);

        await AddLogAsync(driverUserId, loadId, settlement.DriverCommission, WalletAuditLogType.Commission,
            pendingAfter, pendingAfter,
            $"Şoför komisyonu ({Pct(settlement.DriverCommissionRate)}) bid={settlement.BidAmount:N2}", ct);

        await AddLogAsync(driverUserId, loadId, settlement.CustomerCommission, WalletAuditLogType.CustomerCommission,
            pendingAfter, pendingAfter,
            $"Müşteri komisyonu ({Pct(settlement.CustomerCommissionRate)}) bid={settlement.BidAmount:N2}", ct);

        await AddLogAsync(driverUserId, loadId, settlement.Withholding, WalletAuditLogType.Tax,
            pendingAfter, pendingAfter,
            $"Stopaj ({Pct(settlement.StopajRate)}) bid={settlement.BidAmount:N2}", ct);

        logger.LogInformation(
            "Wallet hold Load={LoadId} Driver={DriverId} Bid={Bid:N2} CustomerTotal={Cust:N2} DriverNet={Net:N2} " +
            "DriverComm={DComm:N2} CustComm={CComm:N2} Stopaj={Tax:N2} Platform={Plat:N2} Corporate={Corp}",
            loadId, driverUserId, settlement.BidAmount, settlement.CustomerTotal, settlement.DriverNet,
            settlement.DriverCommission, settlement.CustomerCommission, settlement.Withholding,
            settlement.PlatformRevenue, driver.IsCorporate);
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

    public async Task<decimal> ApplyRefundAsync(
        Guid loadId, int customerUserId, int driverUserId, decimal refundAmount, decimal bidAmount,
        CancellationToken ct = default)
    {
        var customerRefundReason = WalletRefundAudit.CustomerRefundReason(loadId);

        var existingCustomerRefund = await context.WalletAuditLogs
            .AnyAsync(l => l.LoadId == loadId
                        && l.UserId == customerUserId
                        && l.Type == WalletAuditLogType.Refund
                        && l.Reason == customerRefundReason, ct);

        if (existingCustomerRefund)
            return 0m;

        var holdLog = await context.WalletAuditLogs
            .AsNoTracking()
            .Where(l => l.LoadId == loadId
                     && l.UserId == driverUserId
                     && l.Type == WalletAuditLogType.Hold)
            .OrderByDescending(l => l.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var driver = await context.Users
            .FirstOrDefaultAsync(u => u.Id == driverUserId, ct)
            ?? throw new InvalidOperationException($"Driver user {driverUserId} not found.");

        if (holdLog is not null)
        {
            if (driver.PendingBalance < holdLog.Amount)
            {
                throw new InvalidOperationException(
                    $"Insufficient pending balance for refund reversal. Pending={driver.PendingBalance:N2} required={holdLog.Amount:N2}");
            }

            var pendingBefore = driver.PendingBalance;
            driver.PendingBalance -= holdLog.Amount;

            await AddLogAsync(driverUserId, loadId, holdLog.Amount, WalletAuditLogType.Refund,
                pendingBefore, driver.PendingBalance,
                $"{WalletRefundAudit.HoldReversalReasonPrefix} net={holdLog.Amount:N2}", ct);
        }

        if (bidAmount > 0)
        {
            var settlement = calculator.Calculate(bidAmount, driver.IsCorporate);
            var bal = driver.PendingBalance;

            await AddLogAsync(driverUserId, loadId, settlement.DriverCommission, WalletAuditLogType.Refund,
                bal, bal, $"Iptal/Iade driver {WalletRefundAudit.CommissionReversalSuffix}", ct);

            await AddLogAsync(driverUserId, loadId, settlement.CustomerCommission, WalletAuditLogType.Refund,
                bal, bal, $"Iptal/Iade customer {WalletRefundAudit.CommissionReversalSuffix}", ct);

            if (settlement.Withholding > 0)
            {
                await AddLogAsync(driverUserId, loadId, settlement.Withholding, WalletAuditLogType.Refund,
                    bal, bal, $"Iptal/Iade stopaj {WalletRefundAudit.CommissionReversalSuffix}", ct);
            }
        }

        var customer = await context.Users
            .FirstOrDefaultAsync(u => u.Id == customerUserId, ct)
            ?? throw new InvalidOperationException($"Customer user {customerUserId} not found.");

        var walletBefore = customer.WalletBalance;
        customer.WalletBalance += refundAmount;

        await AddLogAsync(customerUserId, loadId, refundAmount, WalletAuditLogType.Refund,
            walletBefore, customer.WalletBalance, customerRefundReason, ct);

        logger.LogInformation(
            "Wallet refund Load={LoadId} Customer={CustomerId} Amount={Amount:N2} Bid={Bid:N2}",
            loadId, customerUserId, refundAmount, bidAmount);

        return refundAmount;
    }

    private static string Pct(decimal rate) => $"{rate * 100m:0.##}%";

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
