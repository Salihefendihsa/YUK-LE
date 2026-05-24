using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Yukle.Api.Data;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

/// <summary>
/// Mock escrow — no real Iyzico charge; ledger and PaymentTransaction rows are real.
/// </summary>
public class MockPaymentService : IPaymentService
{
    private readonly YukleDbContext               _context;
    private readonly IWalletLedgerService         _ledger;
    private readonly IWalletSettlementCalculator  _calculator;
    private readonly ILogger<MockPaymentService>  _logger;

    public MockPaymentService(
        YukleDbContext context,
        IWalletLedgerService ledger,
        IWalletSettlementCalculator calculator,
        ILogger<MockPaymentService> logger)
    {
        _context    = context;
        _ledger     = ledger;
        _calculator = calculator;
        _logger     = logger;
    }

    public async Task<bool> HoldPaymentAsync(Guid loadId, decimal amount, string creditCardToken)
    {
        _ = creditCardToken;
        _logger.LogInformation("Escrow (Mock): bid={BidAmount} TL for Load={LoadId}", amount, loadId);

        var tracked = await _context.Loads.FindAsync(loadId);
        int? driverId = tracked?.DriverId;

        if (driverId is null)
        {
            driverId = await _context.Loads.AsNoTracking()
                .Where(l => l.Id == loadId)
                .Select(l => l.DriverId)
                .FirstOrDefaultAsync();
        }

        if (driverId is not int resolvedDriverId)
        {
            _logger.LogWarning("Hold (Mock): Load={LoadId} has no assigned driver.", loadId);
            return false;
        }

        var alreadyHeld = await _context.PaymentTransactions
            .AnyAsync(p => p.LoadId == loadId && p.Status == PaymentStatus.Blocked);
        if (alreadyHeld)
        {
            _logger.LogWarning("Hold (Mock): Load={LoadId} already has a blocked payment.", loadId);
            return false;
        }

        var driver = await _context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == resolvedDriverId);
        if (driver is null)
        {
            _logger.LogWarning("Hold (Mock): Driver={DriverId} not found.", resolvedDriverId);
            return false;
        }

        var settlement = _calculator.Calculate(amount, driver.IsCorporate);
        var mockTxId = $"mock_iyzico_auth_{Guid.NewGuid().ToString("N")[..10]}";

        _context.PaymentTransactions.Add(new PaymentTransaction
        {
            LoadId        = loadId,
            TransactionId = mockTxId,
            Amount        = settlement.CustomerTotal,
            Status        = PaymentStatus.Blocked,
            CreatedAt     = DateTime.UtcNow
        });

        await _ledger.ApplyHoldAsync(loadId, resolvedDriverId, amount);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Escrow (Mock): hold OK TxId={TxId} bid={Bid:N2} customerTotal={Total:N2}",
            mockTxId, settlement.BidAmount, settlement.CustomerTotal);
        return true;
    }

    public async Task<bool> ReleasePaymentAsync(Guid loadId, int driverUserId)
    {
        var activeTx = await _context.PaymentTransactions
            .FirstOrDefaultAsync(p => p.LoadId == loadId && p.Status == PaymentStatus.Blocked);

        if (activeTx is null)
        {
            _logger.LogWarning("Release (Mock): no Blocked payment for Load={LoadId}", loadId);
            return false;
        }

        await _ledger.ApplyReleaseAsync(loadId, driverUserId);

        activeTx.Status    = PaymentStatus.Released;
        activeTx.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Release (Mock): Load={LoadId} Tx={TxId} driver={DriverId} (ledger updated)",
            loadId, activeTx.TransactionId, driverUserId);
        return true;
    }
}
