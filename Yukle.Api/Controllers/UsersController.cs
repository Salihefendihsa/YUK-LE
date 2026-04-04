using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;

namespace Yukle.Api.Controllers;

/// <summary>
/// Kullanıcıya özgü profil ve cihaz yönetimi operasyonları.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class UsersController : ControllerBase
{
    private readonly YukleDbContext _context;

    public UsersController(YukleDbContext context)
    {
        _context = context;
    }

    // ── PUT api/users/fcm-token ────────────────────────────────────────────────

    /// <summary>
    /// Giriş yapmış kullanıcının Firebase FCM token'ını günceller.
    /// Flutter tarafında uygulama her açıldığında bu endpoint çağrılmalıdır
    /// (token yenilenebilir). UserId JWT claim'lerinden okunur; body'den alınmaz.
    /// </summary>
    [HttpPut("fcm-token")]
    public async Task<IActionResult> UpdateFcmToken([FromBody] UpdateFcmTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
            return BadRequest(new { Message = "FCM token boş olamaz." });

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { Message = "Geçerli bir kullanıcı kimliği bulunamadı." });

        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user is null)
                return NotFound(new { Message = "Kullanıcı bulunamadı." });

            user.FcmToken = request.Token.Trim();
            await _context.SaveChangesAsync();

            return Ok(new { Message = "FCM token güncellendi." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Token güncellenirken bir hata oluştu.", Details = ex.Message });
        }
    }
}

/// <summary>FCM token güncelleme isteği için basit payload.</summary>
public sealed record UpdateFcmTokenRequest(string Token);
