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
public sealed class ChatController(YukleDbContext db) : ControllerBase
{
    /// <summary>Yüke ait engellenmemiş sohbet mesajları (yük sahibi veya atanmış şoför).</summary>
    [HttpGet("{loadId:guid}/messages")]
    public async Task<IActionResult> GetMessagesForLoad(Guid loadId)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized(new { message = "Kimlik doğrulaması gerekli." });

        var isAdmin = User.IsInRole(nameof(UserRole.Admin));

        var load = await db.Loads.AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == loadId);

        if (load is null)
            return NotFound(new { message = "Yük bulunamadı." });

        if (!isAdmin && load.UserId != userId && load.DriverId != userId)
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Bu yükün mesajlarına erişim yetkiniz yok." });

        var q = db.ChatMessages.AsNoTracking().Where(m => m.LoadId == loadId);
        if (!isAdmin)
            q = q.Where(m => !m.IsBlocked);

        var rows = await q
            .OrderBy(m => m.CreatedAt)
            .Select(m => new ChatMessageItemDto(
                m.Id,
                m.LoadId,
                m.SenderUserId,
                m.SenderName,
                m.SenderRole,
                m.Message,
                m.CreatedAt,
                m.IsBlocked))
            .ToListAsync();

        return Ok(rows);
    }
}

public sealed record ChatMessageItemDto(
    Guid Id,
    Guid LoadId,
    int SenderId,
    string SenderName,
    string SenderRole,
    string Message,
    DateTime SentAt,
    bool IsBlocked);
