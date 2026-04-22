using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

/// <summary>
/// Kullanıcı rolüne göre kişiselleştirilmiş dashboard istatistiklerini sunar.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("global-policy")]   // Phase 2.2: TokenBucket, 10 istek/sn
public sealed class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    // ── GET api/dashboard ─────────────────────────────────────────────────────

    /// <summary>
    /// Giriş yapmış kullanıcının rolüne göre uygun istatistik özetini döner.
    /// Customer → <see cref="DTOs.CustomerDashboardDto"/> |
    /// Driver   → <see cref="DTOs.DriverDashboardDto"/>
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { Message = "Geçerli bir kullanıcı kimliği bulunamadı." });

        var role = User.FindFirstValue(ClaimTypes.Role);

        return role switch
        {
            "Customer" => Ok(await _dashboardService.GetCustomerStatsAsync(userId)),
            "Driver"   => Ok(await _dashboardService.GetDriverStatsAsync(userId)),
            _          => BadRequest(new { Message = $"'{role}' rolü için dashboard tanımlanmamış." })
        };
    }
}
