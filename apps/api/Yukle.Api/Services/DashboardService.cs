using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public class DashboardService : IDashboardService
{
    private readonly YukleDbContext _context;

    public DashboardService(YukleDbContext context)
    {
        _context = context;
    }

    // ── Müşteri İstatistikleri ─────────────────────────────────────────────────

    /// <summary>
    /// Kullanıcının tüm yük ilanlarını tek sorguda gruplayarak
    /// durum sayılarını ve toplam harcamayı döner.
    /// </summary>
    public async Task<CustomerDashboardDto> GetCustomerStatsAsync(int userId)
    {
        var stats = await _context.Loads
            .Where(l => l.UserId == userId)
            .GroupBy(_ => 0)
            .Select(g => new CustomerDashboardDto
            {
                ActiveLoadCount    = g.Count(l => l.Status == LoadStatus.Active),
                OnWayLoadCount     = g.Count(l => l.Status == LoadStatus.OnWay),
                DeliveredLoadCount = g.Count(l => l.Status == LoadStatus.Delivered),
                TotalSpent         = g.Where(l => l.Status == LoadStatus.Delivered)
                                      .Sum(l => l.Price)
            })
            .AsNoTracking()
            .FirstOrDefaultAsync();

        return stats ?? new CustomerDashboardDto();
    }

    // ── Şoför İstatistikleri ───────────────────────────────────────────────────

    /// <summary>
    /// Şoförün tüm tekliflerini tek sorguda gruplayarak
    /// tamamlanan iş, aktif teklif ve toplam kazanç verilerini döner.
    /// </summary>
    public async Task<DriverDashboardDto> GetDriverStatsAsync(int userId)
    {
        var stats = await _context.Bids
            .Where(b => b.DriverId == userId)
            .GroupBy(_ => 0)
            .Select(g => new DriverDashboardDto
            {
                CompletedJobCount = g.Count(b => b.Status == BidStatus.Accepted
                                              && b.Load.Status == LoadStatus.Delivered),
                ActiveBidCount    = g.Count(b => b.Status == BidStatus.Pending),
                TotalEarnings     = g.Where(b => b.Status == BidStatus.Accepted
                                              && b.Load.Status == LoadStatus.Delivered)
                                     .Sum(b => b.Amount)
            })
            .AsNoTracking()
            .FirstOrDefaultAsync();

        return stats ?? new DriverDashboardDto();
    }
}
