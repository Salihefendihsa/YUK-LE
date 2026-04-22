using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Yukle.Api.Data;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

/// <summary>
/// <b>Faz 4.1 — MockPaymentService (Simülasyon)</b>
/// <para>
/// Iyzico canlı entegrasyonu tamamlanana kadar para tutma (Hold) ve serbest bırakma (Release) 
/// adımlarını simüle eden, ancak veritabanına gerçek izlerini (PaymentTransaction) bırakan geçici servistir.
/// </para>
/// </summary>
public class MockPaymentService : IPaymentService
{
    private readonly YukleDbContext _context;
    private readonly ILogger<MockPaymentService> _logger;

    public MockPaymentService(YukleDbContext context, ILogger<MockPaymentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> HoldPaymentAsync(Guid loadId, decimal amount, string creditCardToken)
    {
        _logger.LogInformation("Escrow (Mock): {Amount} TL tutarı Load={LoadId} için bloke ediliyor...", amount, loadId);

        // Sahte işlem ID'si üretelim
        var mockIyzicoTransactionId = $"mock_iyzico_auth_{Guid.NewGuid().ToString("N")[..10]}";

        var transaction = new PaymentTransaction
        {
            LoadId = loadId,
            TransactionId = mockIyzicoTransactionId,
            Amount = amount,
            Status = PaymentStatus.Blocked,
            CreatedAt = DateTime.UtcNow
        };

        _context.PaymentTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Escrow (Mock): İşlem başarılı! TransactionId: {TxId}", mockIyzicoTransactionId);
        return true;
    }

    public async Task<bool> ReleasePaymentAsync(Guid loadId, int driverUserId)
    {
        var activeTx = await _context.PaymentTransactions
            .FirstOrDefaultAsync(p => p.LoadId == loadId && p.Status == PaymentStatus.Blocked);

        if (activeTx == null)
        {
            _logger.LogWarning("Release (Mock): Load={LoadId} için Blocked statüsünde işlem bulunamadı!", loadId);
            return false;
        }

        _logger.LogInformation("Release (Mock): Load={LoadId} Transaction={TxId} serbest bırakılıyor. Şoför: {DriverId}", 
            loadId, activeTx.TransactionId, driverUserId);

        activeTx.Status = PaymentStatus.Released;
        activeTx.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Release (Mock): Ödeme şoförün alt-iş yeri (sub-merchant) cüzdanına aktarıldı (Simülasyon).");
        return true;
    }
}
