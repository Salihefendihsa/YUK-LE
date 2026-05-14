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
public class RatingsController(YukleDbContext context) : ControllerBase
{
    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] SubmitRatingRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var givenByUserId))
            return Unauthorized(new { Message = "Geçersiz kullanıcı oturumu." });

        if (request.Score < 1 || request.Score > 5)
            return BadRequest(new { Message = "Puan 1-5 aralığında olmalıdır." });

        var load = await context.Loads.FirstOrDefaultAsync(l => l.Id == request.LoadId);
        if (load is null || load.Status != LoadStatus.Delivered)
            return BadRequest(new { Message = "Yalnızca teslim edilmiş yükler puanlanabilir." });

        var alreadyRated = await context.Ratings.AnyAsync(r => r.LoadId == request.LoadId && r.GivenByUserId == givenByUserId);
        if (alreadyRated)
            return BadRequest(new { Message = "Aynı yük için tekrar puanlama yapılamaz." });

        var role = User.IsInRole("Customer") ? RaterRole.Customer : RaterRole.Driver;
        var rating = new Rating
        {
            LoadId = request.LoadId,
            GivenByUserId = givenByUserId,
            GivenToUserId = request.GivenToUserId,
            Score = request.Score,
            Comment = request.Comment?.Trim() ?? string.Empty,
            RaterRole = role
        };
        await context.Ratings.AddAsync(rating);

        var targetUser = await context.Users.FirstOrDefaultAsync(u => u.Id == request.GivenToUserId);
        if (targetUser is not null)
        {
            var totalScore = targetUser.AverageRating * targetUser.TotalRatingCount + request.Score;
            targetUser.TotalRatingCount += 1;
            targetUser.AverageRating = totalScore / targetUser.TotalRatingCount;
        }

        await context.SaveChangesAsync();
        return Ok(new { Message = "Puanlama kaydedildi." });
    }

    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var ratings = await context.Ratings
            .Where(r => r.GivenToUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new { r.Score, r.Comment, r.CreatedAt, r.RaterRole, r.GivenByUserId })
            .ToListAsync();

        var avg = ratings.Count == 0 ? 0 : ratings.Average(r => r.Score);
        return Ok(new { Average = avg, Count = ratings.Count, Ratings = ratings });
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllRatings(
        [FromQuery] string? filter = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null)
    {
        var q = context.Ratings.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(filter))
        {
            var f = filter.Trim().ToLowerInvariant();
            if (f is "low" or "dusuk")
                q = q.Where(r => r.Score <= 2);
            else if (f is "high" or "yuksek")
                q = q.Where(r => r.Score >= 4);
        }

        if (dateFrom.HasValue)
            q = q.Where(r => r.CreatedAt >= dateFrom.Value);
        if (dateTo.HasValue)
            q = q.Where(r => r.CreatedAt <= dateTo.Value);

        var rows = await (
            from r in q
            join a in context.Users.AsNoTracking() on r.GivenByUserId equals a.Id
            join b in context.Users.AsNoTracking() on r.GivenToUserId equals b.Id
            orderby r.CreatedAt descending
            select new
            {
                r.Id,
                GivenByName = a.FullName,
                GivenToName = b.FullName,
                r.Score,
                r.Comment,
                r.LoadId,
                r.CreatedAt
            }).Take(500).ToListAsync();

        return Ok(rows);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteRating(Guid id)
    {
        var r = await context.Ratings.FirstOrDefaultAsync(x => x.Id == id);
        if (r is null)
            return NotFound();

        var targetId = r.GivenToUserId;
        context.Ratings.Remove(r);
        await context.SaveChangesAsync();

        var rest = await context.Ratings.Where(x => x.GivenToUserId == targetId).ToListAsync();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == targetId);
        if (user is not null)
        {
            user.TotalRatingCount = rest.Count;
            user.AverageRating = rest.Count == 0 ? 0 : rest.Average(x => x.Score);
            await context.SaveChangesAsync();
        }

        return Ok(new { success = true });
    }
}

public sealed class SubmitRatingRequest
{
    public Guid LoadId { get; set; }
    public int GivenToUserId { get; set; }
    public int Score { get; set; }
    public string? Comment { get; set; }
}
