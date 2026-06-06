using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.Models;

namespace Yukle.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WalletController(YukleDbContext context) : ControllerBase
{
    private IQueryable<PaymentTransaction> PaymentsForCustomer(int userId)
        => context.PaymentTransactions.AsNoTracking()
            .Where(p => context.Loads.Any(l => l.Id == p.LoadId && l.UserId == userId));

    // Alias: bazı istemciler /Wallet/me bekliyor — özet ile aynı yanıtı döner.
    [HttpGet("me")]
    public Task<IActionResult> GetMe() => GetSummary();

    [HttpGet]
    public async Task<IActionResult> GetSummary()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = User.FindFirstValue(ClaimTypes.Role);
        var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        decimal monthAmount;
        if (string.Equals(role, nameof(UserRole.Driver), StringComparison.OrdinalIgnoreCase))
        {
            monthAmount = await context.WalletAuditLogs.AsNoTracking()
                .Where(l => l.UserId == userId
                         && l.Type == WalletAuditLogType.Release
                         && l.CreatedAt >= monthStart)
                .SumAsync(l => (decimal?)l.Amount) ?? 0m;
        }
        else if (string.Equals(role, nameof(UserRole.Customer), StringComparison.OrdinalIgnoreCase))
        {
            monthAmount = await PaymentsForCustomer(userId)
                .Where(p => p.CreatedAt >= monthStart
                         && (p.Status == PaymentStatus.Blocked || p.Status == PaymentStatus.Released))
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;
        }
        else
        {
            monthAmount = 0m;
        }

        return Ok(new
        {
            user.WalletBalance,
            user.PendingBalance,
            MonthAmount = monthAmount
        });
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> Transactions([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = User.FindFirstValue(ClaimTypes.Role);

        if (string.Equals(role, nameof(UserRole.Driver), StringComparison.OrdinalIgnoreCase))
        {
            var q = context.WalletAuditLogs.AsNoTracking().Where(l => l.UserId == userId);
            if (from.HasValue) q = q.Where(l => l.CreatedAt >= from.Value);
            if (to.HasValue) q = q.Where(l => l.CreatedAt <= to.Value);

            var items = await q.OrderByDescending(l => l.CreatedAt)
                .Select(l => new
                {
                    l.Id,
                    l.LoadId,
                    l.Amount,
                    Status = l.Type.ToString(),
                    l.CreatedAt,
                    l.Reason
                })
                .ToListAsync();

            return Ok(items);
        }

        if (string.Equals(role, nameof(UserRole.Customer), StringComparison.OrdinalIgnoreCase))
        {
            var query = PaymentsForCustomer(userId);
            if (from.HasValue) query = query.Where(t => t.CreatedAt >= from.Value);
            if (to.HasValue) query = query.Where(t => t.CreatedAt <= to.Value);

            var items = await query.OrderByDescending(t => t.CreatedAt).Select(t => new
            {
                t.Id,
                t.LoadId,
                t.Amount,
                Status = t.Status.ToString(),
                t.CreatedAt,
                Reason = (string?)null
            }).ToListAsync();

            return Ok(items);
        }

        return Ok(Array.Empty<object>());
    }
}
