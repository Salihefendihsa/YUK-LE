using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Controllers;

/// <summary>Kullanıcıya özgü profil ve cihaz yönetimi operasyonları.</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("global-policy")]
public sealed class UsersController : ControllerBase
{
    private readonly YukleDbContext _context;

    public UsersController(YukleDbContext context)
    {
        _context = context;
    }

    private bool CanAccessUser(int targetId) =>
        User.IsInRole(nameof(UserRole.Admin))
        || (int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var self) && self == targetId);

    // ── GET api/Users/{id} ───────────────────────────────────────────────────

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        if (!CanAccessUser(id))
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Bu profili görüntüleme yetkiniz yok." });

        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Vehicles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
            return NotFound(new { message = "Kullanıcı bulunamadı." });

        var dto = await BuildProfileResponseAsync(user);
        return Ok(dto);
    }

    // ── PUT api/Users/{id} — müşteri veya şoför profil güncellemesi ───────────

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProfile(int id, [FromBody] UpdateUserProfileRequest body)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!CanAccessUser(id))
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Bu profili güncelleme yetkiniz yok." });

        var user = await _context.Users
            .Include(u => u.Vehicles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
            return NotFound(new { message = "Kullanıcı bulunamadı." });

        var emailTaken = await _context.Users.AnyAsync(u => u.Id != id && u.Email == body.Email.Trim());
        if (emailTaken)
            return Conflict(new { message = "Bu e-posta adresi başka bir hesapta kullanılıyor." });

        user.FullName = body.FullName.Trim();
        user.Email    = body.Email.Trim();

        if (user.Role == UserRole.Customer)
        {
            if (!string.IsNullOrWhiteSpace(body.CompanyName) || !string.IsNullOrWhiteSpace(body.CompanyAddress))
            {
                var addr = await _context.DeliveryAddresses
                    .Where(a => a.UserId == id)
                    .OrderByDescending(a => a.IsDefault)
                    .FirstOrDefaultAsync();

                if (addr is null)
                {
                    addr = new DeliveryAddress
                    {
                        UserId         = id,
                        Title          = "Varsayılan",
                        CompanyName    = body.CompanyName?.Trim() ?? string.Empty,
                        ContactPerson  = user.FullName,
                        ContactPhone   = user.Phone,
                        Address        = body.CompanyAddress?.Trim() ?? string.Empty,
                        City           = "-",
                        District       = "-",
                        IsDefault      = true,
                        CreatedAt      = DateTime.UtcNow
                    };
                    await _context.DeliveryAddresses.AddAsync(addr);
                }
                else
                {
                    if (!string.IsNullOrWhiteSpace(body.CompanyName))
                        addr.CompanyName = body.CompanyName.Trim();
                    if (!string.IsNullOrWhiteSpace(body.CompanyAddress))
                        addr.Address = body.CompanyAddress.Trim();
                }
            }
        }
        else if (user.Role == UserRole.Driver)
        {
            if (!string.IsNullOrWhiteSpace(body.Iban))
            {
                if (!Regex.IsMatch(body.Iban.Trim(), @"^TR\d{24}$"))
                    return BadRequest(new { message = "IBAN TR ile başlayan 26 karakter olmalıdır." });
                user.BankIban = body.Iban.Trim();
            }

            if (body.HomeAddress is not null)
                user.HomeAddress = string.IsNullOrWhiteSpace(body.HomeAddress) ? null : body.HomeAddress.Trim();
        }

        await _context.SaveChangesAsync();
        var dto = await BuildProfileResponseAsync(user);
        return Ok(dto);
    }

    // ── PUT api/users/fcm-token ───────────────────────────────────────────────

    [HttpPut("fcm-token")]
    public async Task<IActionResult> UpdateFcmToken([FromBody] UpdateFcmTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
            return BadRequest(new { Message = "FCM token boş olamaz." });

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { Message = "Geçerli bir kullanıcı kimliği bulunamadı." });

        var user = await _context.Users.FindAsync(userId);
        if (user is null)
            return NotFound(new { Message = "Kullanıcı bulunamadı." });

        user.FcmToken = request.Token.Trim();
        await _context.SaveChangesAsync();

        return Ok(new { Message = "FCM token güncellendi." });
    }

    private async Task<UserProfileResponseDto> BuildProfileResponseAsync(User user)
    {
        var addr = await _context.DeliveryAddresses.AsNoTracking()
            .Where(a => a.UserId == user.Id)
            .OrderByDescending(a => a.IsDefault)
            .FirstOrDefaultAsync();

        var vehicle = user.Vehicles
            .OrderByDescending(v => v.IsActive)
            .FirstOrDefault();

        return new UserProfileResponseDto
        {
            Id                 = user.Id,
            FullName           = user.FullName,
            Email              = user.Email,
            Phone              = MaskPhone(user.Phone),
            CompanyName        = addr?.CompanyName,
            TaxNumber          = user.Role == UserRole.Customer ? MaskTax(user.TaxNumberOrTCKN) : null,
            CompanyAddress     = addr?.Address,
            TcIdentityNumber   = user.Role == UserRole.Driver ? MaskTc(user.TaxNumberOrTCKN) : null,
            Iban               = user.BankIban,
            LicenseClass       = user.LicenseClasses,
            HomeAddress        = user.HomeAddress,
            VehiclePlate       = vehicle?.Plate,
            VehicleType        = vehicle?.Type.ToString(),
            AverageRating      = user.AverageRating,
            TotalRatingCount   = user.TotalRatingCount,
            Role               = user.Role.ToString(),
            ApprovalStatus     = user.ApprovalStatus.ToString()
        };
    }

    private static string MaskPhone(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone) || phone.Length < 4)
            return "****";
        return $"{phone[..2]}******{phone[^2..]}";
    }

    private static string MaskTax(string? tax)
    {
        if (string.IsNullOrWhiteSpace(tax) || tax.Length < 4)
            return "******";
        return $"XXXXXX{tax[^4..]}";
    }

    private static string MaskTc(string? tc)
    {
        if (string.IsNullOrWhiteSpace(tc) || tc.Length != 11)
            return "***********";
        return $"{tc[0]}{new string('X', 9)}{tc[^1]}";
    }
}
