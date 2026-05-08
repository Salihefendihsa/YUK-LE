using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;

namespace Yukle.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController(YukleDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] bool? isRead = null)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var query = context.Notifications.Where(n => n.UserId == userId);
        if (isRead.HasValue) query = query.Where(n => n.IsRead == isRead.Value);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(n => n.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { Total = total, Items = items });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var count = await context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
        return Ok(new { Count = count });
    }

    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var item = await context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
        if (item is null) return NotFound();
        item.IsRead = true;
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var items = await context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
        foreach (var i in items) i.IsRead = true;
        await context.SaveChangesAsync();
        return Ok(new { Updated = items.Count });
    }
}
