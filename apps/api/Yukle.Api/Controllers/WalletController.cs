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
    [HttpGet]
    public async Task<IActionResult> GetSummary()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var monthIncome = await context.PaymentTransactions
            .Where(p => p.CreatedAt >= monthStart && p.Status == PaymentStatus.Released)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        return Ok(new
        {
            user.WalletBalance,
            user.PendingBalance,
            MonthAmount = monthIncome
        });
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> Transactions([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var query = context.PaymentTransactions.AsNoTracking().AsQueryable();
        if (from.HasValue) query = query.Where(t => t.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(t => t.CreatedAt <= to.Value);
        var items = await query.OrderByDescending(t => t.CreatedAt).Select(t => new
        {
            t.Id,
            t.LoadId,
            t.Amount,
            t.Status,
            t.CreatedAt
        }).ToListAsync();
        return Ok(items);
    }
}
