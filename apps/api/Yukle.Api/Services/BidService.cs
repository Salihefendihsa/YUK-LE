using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public class BidService : IBidService
{
    private readonly YukleDbContext       _context;
    private readonly INotificationService _notifications;
    private readonly IPaymentService      _paymentService;

    public BidService(YukleDbContext context, INotificationService notifications, IPaymentService paymentService)
    {
        _context       = context;
        _notifications = notifications;
        _paymentService = paymentService;
    }

    // ── SubmitBidAsync ────────────────────────────────────────────────────────

    public async Task<Bid> SubmitBidAsync(CreateBidDto dto, int driverId)
    {
        // Kontrol 1: Yük var mı?
        var load = await _context.Loads
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == dto.LoadId)
            ?? throw new InvalidOperationException("Belirtilen yük ilanı bulunamadı.");

        // Kontrol 2: Yük aktif mi?
        if (load.Status != LoadStatus.Active)
            throw new InvalidOperationException(
                $"Bu yük ilanına teklif verilemez. Mevcut durum: {load.Status}.");

        // Kontrol 3: Şoför daha önce teklif vermiş mi?
        var alreadyBid = await _context.Bids
            .AnyAsync(b => b.LoadId == dto.LoadId && b.DriverId == driverId);

        if (alreadyBid)
            throw new InvalidOperationException("Bu yük ilanına daha önce teklif verdiniz.");

        var bid = new Bid
        {
            LoadId    = dto.LoadId,
            DriverId  = driverId,
            Amount    = dto.Amount,
            Note      = dto.Note?.Trim(),
            Status    = BidStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Bids.AddAsync(bid);
        await _context.SaveChangesAsync();

        return bid;
    }

    // ── GetBidsByLoadIdAsync ──────────────────────────────────────────────────

    public async Task<List<BidListDto>> GetBidsByLoadIdAsync(Guid loadId, int customerId)
    {
        // Sahiplik doğrulaması: yük var mı ve bu kullanıcıya mı ait?
        var load = await _context.Loads
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == loadId)
            ?? throw new InvalidOperationException("Belirtilen yük ilanı bulunamadı.");

        if (load.UserId != customerId)
            throw new UnauthorizedAccessException(
                "Bu yük ilanına ait teklifleri görüntüleme yetkiniz yok.");

        return await _context.Bids
            .Where(b => b.LoadId == loadId)
            .Include(b => b.Driver)
            .AsNoTracking()
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BidListDto
            {
                Id             = b.Id,
                Amount         = b.Amount,
                Note           = b.Note,
                OfferDate      = b.CreatedAt,
                Status         = b.Status.ToString(),
                DriverFullName = b.Driver.FullName,
                DriverPhone    = b.Driver.Phone
            })
            .ToListAsync();
    }

    // ── AcceptBidAsync ────────────────────────────────────────────────────────

    public async Task AcceptBidAsync(int bidId, int customerId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Guard 1: Teklif var mı ve Pending mi?
            var bid = await _context.Bids
                .Include(b => b.Load)
                .FirstOrDefaultAsync(b => b.Id == bidId)
                ?? throw new InvalidOperationException("Teklif bulunamadı.");

            if (bid.Status != BidStatus.Pending)
                throw new InvalidOperationException(
                    $"Bu teklif kabul edilemez. Mevcut durum: {bid.Status}.");

            // Guard 2: Yük sahibi mi?
            if (bid.Load.UserId != customerId)
                throw new UnauthorizedAccessException(
                    "Bu teklifi kabul etme yetkiniz yok.");

            // Guard 3: Yük hâlâ Active mi? (race condition koruması)
            if (bid.Load.Status != LoadStatus.Active)
                throw new InvalidOperationException(
                    $"Bu yük ilanı artık aktif değil. Mevcut durum: {bid.Load.Status}.");

            // İşlem 1: Kabul edilen teklifi onayla
            bid.Status = BidStatus.Accepted;

            // İşlem 2: Yükü şoföre ata
            bid.Load.Status   = LoadStatus.Assigned;
            bid.Load.DriverId = bid.DriverId;

            // İşlem 3: Reddedilecek şoförlerin ID'lerini toplu güncelleme öncesi al
            // (ExecuteUpdateAsync sonrasında nesne memory'de olmaz)
            var rejectedDriverIds = await _context.Bids
                .Where(b => b.LoadId == bid.LoadId
                         && b.Id     != bidId
                         && b.Status == BidStatus.Pending)
                .Select(b => b.DriverId)
                .ToListAsync();

            // Toplu reddetme — tek SQL UPDATE, RAM'e çekmeden
            await _context.Bids
                .Where(b => b.LoadId == bid.LoadId
                         && b.Id     != bidId
                         && b.Status == BidStatus.Pending)
                .ExecuteUpdateAsync(s => s.SetProperty(b => b.Status, BidStatus.Rejected));

            // Faz 4.1: İyzico Mock Ödeme Havuzuna (Escrow) Alma İşlemi
            // Gerçek projede 'creditCardToken' body'den gelir. Simülasyon için dummy yolluyoruz.
            bool paymentHoldSuccess = await _paymentService.HoldPaymentAsync(bid.LoadId, bid.Amount, "dummy_card_token");
            if (!paymentHoldSuccess)
            {
                throw new InvalidOperationException("Ödeme blokajı sağlanamadı. Lütfen kart limitinizi kontrol edin.");
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // ── Bildirimler (transaction dışında; hata olsa core işlem etkilenmez) ──

            // Kabul edilen şoföre
            await _notifications.SendAsync(
                bid.DriverId,
                "Teklifin Kabul Edildi! 🎉",
                "Teklifin kabul edildi! Yükü belirtilen adresten teslim alabilirsin.");

            // Müşteriye
            await _notifications.SendAsync(
                bid.Load.UserId,
                "Şoför Atandı",
                "Şoför ile el sıkışıldı, yük süreci başladı. Yükünüz yola çıkmayı bekliyor.");

            // Reddedilen şoförlere
            foreach (var driverId in rejectedDriverIds)
            {
                await _notifications.SendAsync(
                    driverId,
                    "Teklif Reddedildi",
                    "Bu ilan için başka bir teklif kabul edildi. Diğer ilanlara göz atabilirsin.");
            }
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
