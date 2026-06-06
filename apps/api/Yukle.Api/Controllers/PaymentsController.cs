using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

/// <summary>
/// Emanet (escrow) ödeme görünürlüğü. Mevcut <c>PaymentTransaction</c> + komisyon
/// hesaplayıcı üzerinden SADECE OKUMA yapar — yeni tablo/yazma yoktur, çekirdek
/// accept/deliver akışına dokunmaz.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly YukleDbContext              _context;
    private readonly IWalletSettlementCalculator _calculator;

    public PaymentsController(YukleDbContext context, IWalletSettlementCalculator calculator)
    {
        _context    = context;
        _calculator = calculator;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool IsAdmin => User.IsInRole("Admin");

    private static string MapStatus(PaymentStatus s) => s switch
    {
        PaymentStatus.Blocked  => "Held",
        PaymentStatus.Released => "Released",
        PaymentStatus.Refunded => "Refunded",
        _                      => s.ToString()
    };

    // ── GET /Payments/load/{loadId} — bir yükün emanet bilgisi ───────────────
    [HttpGet("load/{loadId:guid}")]
    public async Task<IActionResult> ByLoad(Guid loadId)
    {
        var load = await _context.Loads.AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == loadId);
        if (load is null) return NotFound();

        // Yetki: yük sahibi (müşteri), atanan şoför veya admin.
        if (!IsAdmin && CurrentUserId != load.UserId && CurrentUserId != load.DriverId)
            return Forbid();

        var payment = await _context.PaymentTransactions.AsNoTracking()
            .Where(p => p.LoadId == loadId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        if (payment is null)
            return NotFound(new { Message = "Bu yük için emanet kaydı yok." });

        var dto = await BuildAsync(load, payment);
        return Ok(dto);
    }

    // ── GET /Payments/mine — kullanıcının ödemeleri ──────────────────────────
    [HttpGet("mine")]
    public async Task<IActionResult> Mine()
    {
        var userId = CurrentUserId;

        // İlgili yükler: müşteri → sahibi olduğu; şoför → atandığı; admin → hepsi.
        var loadsQuery = _context.Loads.AsNoTracking();
        if (!IsAdmin)
            loadsQuery = loadsQuery.Where(l => l.UserId == userId || l.DriverId == userId);

        var loads = await loadsQuery
            .Select(l => new { l.Id, l.UserId, l.DriverId })
            .ToListAsync();
        var loadIds = loads.Select(l => l.Id).ToList();

        var payments = await _context.PaymentTransactions.AsNoTracking()
            .Where(p => loadIds.Contains(p.LoadId))
            .ToListAsync();

        // Toplu yardımcı sözlükler (N+1 önler).
        var payLoadIds = payments.Select(p => p.LoadId).Distinct().ToList();
        var bidByLoad = await _context.Bids.AsNoTracking()
            .Where(b => payLoadIds.Contains(b.LoadId) && b.Status == BidStatus.Accepted)
            .GroupBy(b => b.LoadId)
            .Select(g => new { LoadId = g.Key, Amount = g.Max(b => b.Amount) })
            .ToDictionaryAsync(x => x.LoadId, x => x.Amount);

        var driverIds = loads.Where(l => l.DriverId != null).Select(l => l.DriverId!.Value).Distinct().ToList();
        var corpByDriver = await _context.Users.AsNoTracking()
            .Where(u => driverIds.Contains(u.Id))
            .Select(u => new { u.Id, u.IsCorporate })
            .ToDictionaryAsync(x => x.Id, x => x.IsCorporate);

        var loadInfo = loads.ToDictionary(l => l.Id, l => l);

        var result = payments
            .OrderByDescending(p => p.CreatedAt)
            .Select(p =>
            {
                loadInfo.TryGetValue(p.LoadId, out var l);
                var bid = bidByLoad.TryGetValue(p.LoadId, out var b) ? b : 0m;
                var isCorp = l?.DriverId != null && corpByDriver.TryGetValue(l.DriverId.Value, out var c) && c;
                return MapDto(p, l?.UserId ?? 0, l?.DriverId, bid, isCorp);
            })
            .ToList();

        return Ok(result);
    }

    // ── GET /Payments/admin/summary — platform gelir göstergesi (B4) ──────────
    [HttpGet("admin/summary")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdminSummary()
    {
        var payments = await _context.PaymentTransactions.AsNoTracking().ToListAsync();
        var payLoadIds = payments.Select(p => p.LoadId).Distinct().ToList();

        var bidByLoad = await _context.Bids.AsNoTracking()
            .Where(b => payLoadIds.Contains(b.LoadId) && b.Status == BidStatus.Accepted)
            .GroupBy(b => b.LoadId)
            .Select(g => new { LoadId = g.Key, Amount = g.Max(b => b.Amount) })
            .ToDictionaryAsync(x => x.LoadId, x => x.Amount);

        var driverByLoad = await _context.Loads.AsNoTracking()
            .Where(l => payLoadIds.Contains(l.Id))
            .Select(l => new { l.Id, l.DriverId })
            .ToDictionaryAsync(x => x.Id, x => x.DriverId);

        var driverIds = driverByLoad.Values.Where(d => d != null).Select(d => d!.Value).Distinct().ToList();
        var corpByDriver = await _context.Users.AsNoTracking()
            .Where(u => driverIds.Contains(u.Id))
            .Select(u => new { u.Id, u.IsCorporate })
            .ToDictionaryAsync(x => x.Id, x => x.IsCorporate);

        var summary = new PaymentRevenueSummaryDto();
        foreach (var p in payments)
        {
            var bid = bidByLoad.TryGetValue(p.LoadId, out var b) ? b : 0m;
            var driverId = driverByLoad.TryGetValue(p.LoadId, out var d) ? d : null;
            var isCorp = driverId != null && corpByDriver.TryGetValue(driverId.Value, out var c) && c;
            var settlement = _calculator.Calculate(bid > 0 ? bid : p.Amount, isCorp);

            if (p.Status == PaymentStatus.Blocked)
            {
                summary.HeldCount++;
                summary.HeldEscrowTotal += p.Amount;
            }
            else if (p.Status == PaymentStatus.Released)
            {
                summary.ReleasedCount++;
                summary.ReleasedGrossTotal += settlement.BidAmount;
                summary.TotalPlatformRevenue += settlement.PlatformRevenue;
            }
        }

        return Ok(summary);
    }

    // ── Yardımcılar ──────────────────────────────────────────────────────────

    private async Task<PaymentInfoDto> BuildAsync(Load load, PaymentTransaction payment)
    {
        var bid = await _context.Bids.AsNoTracking()
            .Where(b => b.LoadId == load.Id && b.Status == BidStatus.Accepted)
            .Select(b => (decimal?)b.Amount)
            .FirstOrDefaultAsync() ?? 0m;

        var isCorp = false;
        if (load.DriverId is int dId)
            isCorp = await _context.Users.AsNoTracking()
                .Where(u => u.Id == dId).Select(u => u.IsCorporate).FirstOrDefaultAsync();

        return MapDto(payment, load.UserId, load.DriverId, bid, isCorp);
    }

    private PaymentInfoDto MapDto(PaymentTransaction p, int customerId, int? driverId, decimal bidAmount, bool isCorporate)
    {
        // Brüt bilinmiyorsa emanet tutarına düş (en kötü senaryoda bile çökme yok).
        var gross = bidAmount > 0 ? bidAmount : p.Amount;
        var s = _calculator.Calculate(gross, isCorporate);

        return new PaymentInfoDto
        {
            LoadId           = p.LoadId,
            CustomerId       = customerId,
            DriverId         = driverId,
            GrossAmount      = s.BidAmount,
            CustomerTotal    = bidAmount > 0 ? s.CustomerTotal : p.Amount,
            CommissionRate   = s.DriverCommissionRate + s.CustomerCommissionRate,
            CommissionAmount = s.PlatformRevenue,
            CustomerCommission     = s.CustomerCommission,
            CustomerCommissionRate = s.CustomerCommissionRate,
            DriverCommission       = s.DriverCommission,
            DriverCommissionRate   = s.DriverCommissionRate,
            Withholding      = s.Withholding,
            NetAmount        = s.DriverNet,
            Status           = MapStatus(p.Status),
            CreatedAt        = p.CreatedAt,
            ReleasedAt       = p.Status == PaymentStatus.Released ? p.UpdatedAt : null
        };
    }
}
