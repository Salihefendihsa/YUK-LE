using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Yukle.Api.Data;
using Yukle.Api.Models;

namespace Yukle.Api.Services
{
    public class BidService
    {
        private readonly YukleDbContext _context;

        public BidService(YukleDbContext context)
        {
            _context = context;
        }

        public async Task AcceptBidAsync(int bidId)
        {
            // Atomik İşlem (Transaction) Mührü: Hata çıkarsa tüm veri eski haline döner.
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var acceptedBid = await _context.Bids
                    .Include(b => b.Load)
                    .FirstOrDefaultAsync(b => b.Id == bidId)
                    ?? throw new Exception("Teklif bulunamadı.");

                if (acceptedBid.Status != BidStatus.Pending)
                    throw new Exception("Sadece statüsü 'Pending' olan teklifler kabul edilebilir.");

                // 1. Seçilen teklifin durumunu Accepted yap
                acceptedBid.Status = BidStatus.Accepted;
                
                // 2. Yükün durumunu Assigned yap ve şoförü ata
                var load = acceptedBid.Load;
                load.Status = LoadStatus.Assigned;
                load.DriverId = acceptedBid.DriverId;

                // 3. Bu yüke gelen diğer tüm teklifleri Rejected yap
                var otherBids = await _context.Bids
                    .Where(b => b.LoadId == load.Id && b.Id != bidId)
                    .ToListAsync();

                foreach (var bid in otherBids)
                {
                    bid.Status = BidStatus.Rejected;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
