using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Yukle.Api.DTOs;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

/// <summary>
/// Yük ilanı CRUD ve listeleme operasyonlarını yöneten RESTful controller.
/// Tüm endpoint'ler JWT ile korunur.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class LoadsController : ControllerBase
{
    private readonly ILoadService _loadService;

    public LoadsController(ILoadService loadService)
    {
        _loadService = loadService;
    }

    // ── POST api/loads ─────────────────────────────────────────────────────────

    /// <summary>
    /// Yeni yük ilanı oluşturur.
    /// Yalnızca <c>Customer</c> rolüne sahip kullanıcılar erişebilir.
    /// Kullanıcı kimliği JWT claim'lerinden okunur; DTO'dan alınmaz.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> CreateLoad([FromBody] CreateLoadDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { Message = "Geçerli bir kullanıcı kimliği bulunamadı." });

        try
        {
            var newId = await _loadService.CreateLoadAsync(dto, userId);
            var created = await _loadService.GetLoadByIdAsync(newId);
            return CreatedAtAction(nameof(GetLoadById), new { id = newId }, created);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Yük oluşturulurken bir hata oluştu.", Details = ex.Message });
        }
    }

    // ── GET api/loads/active ───────────────────────────────────────────────────

    /// <summary>
    /// Durumu Active olan tüm yük ilanlarını özet bilgiyle listeler.
    /// </summary>
    [HttpGet("active")]
    public async Task<IActionResult> GetActiveLoads()
    {
        try
        {
            var loads = await _loadService.GetActiveLoadsAsync();
            return Ok(loads);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Yükler listelenirken bir hata oluştu.", Details = ex.Message });
        }
    }

    // ── GET api/loads/{id} ─────────────────────────────────────────────────────

    /// <summary>
    /// Belirtilen ID'ye sahip yük ilanının detayını döner.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetLoadById(Guid id)
    {
        try
        {
            var load = await _loadService.GetLoadByIdAsync(id);

            if (load is null)
                return NotFound(new { Message = $"'{id}' ID'sine sahip yük ilanı bulunamadı." });

            return Ok(load);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Yük detayı alınırken bir hata oluştu.", Details = ex.Message });
        }
    }

    // ── POST api/loads/{id}/pickup ─────────────────────────────────────────────

    /// <summary>
    /// Şoförün yükü teslim aldığını bildirir; durumu <c>OnWay</c> yapar.
    /// Yalnızca yüke atanmış şoför çağırabilir.
    /// </summary>
    [HttpPost("{id:guid}/pickup")]
    [Authorize(Roles = "Driver")]
    public async Task<IActionResult> Pickup(Guid id)
    {
        var driverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(driverIdClaim, out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        try
        {
            await _loadService.PickupAsync(id, driverId);
            return Ok(new { Message = "Yük teslim alındı. İyi yolculuklar!" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Durum güncellenirken bir hata oluştu.", Details = ex.Message });
        }
    }

    // ── POST api/loads/{id}/deliver ────────────────────────────────────────────

    /// <summary>
    /// Şoförün yükü teslim ettiğini bildirir; durumu <c>Delivered</c> yapar.
    /// Yalnızca yüke atanmış ve yolda olan şoför çağırabilir.
    /// </summary>
    [HttpPost("{id:guid}/deliver")]
    [Authorize(Roles = "Driver")]
    public async Task<IActionResult> Deliver(Guid id)
    {
        var driverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(driverIdClaim, out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        try
        {
            await _loadService.DeliverAsync(id, driverId);
            return Ok(new { Message = "Yük başarıyla teslim edildi. Teşekkürler!" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Durum güncellenirken bir hata oluştu.", Details = ex.Message });
        }
    }
}
