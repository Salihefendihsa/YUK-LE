using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Yukle.Api.DTOs;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

/// <summary>
/// Yük tekliflerini yöneten RESTful controller.
/// Sınıf seviyesinde JWT zorunludur; her endpoint rol bazında ayrıca kısıtlanır.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class BidsController : ControllerBase
{
    private readonly IBidService _bidService;

    public BidsController(IBidService bidService)
    {
        _bidService = bidService;
    }

    // ── POST api/bids/submit ──────────────────────────────────────────────────

    /// <summary>
    /// Giriş yapmış şoförün belirtilen yük ilanına teklif vermesini sağlar.
    /// DriverId JWT claim'lerinden okunur; DTO'dan alınmaz.
    /// </summary>
    [HttpPost("submit")]
    [Authorize(Roles = "Driver")]
    public async Task<IActionResult> SubmitBid([FromBody] CreateBidDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var driverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(driverIdClaim, out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        try
        {
            var bid = await _bidService.SubmitBidAsync(dto, driverId);
            return CreatedAtAction(nameof(SubmitBid), new { id = bid.Id }, new
            {
                Message  = "Teklifiniz başarıyla iletildi.",
                BidId    = bid.Id,
                LoadId   = bid.LoadId,
                Amount   = bid.Amount,
                Status   = bid.Status.ToString(),
                CreatedAt = bid.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Teklif gönderilirken bir hata oluştu.", Details = ex.Message });
        }
    }

    // ── GET api/bids/load/{loadId} ────────────────────────────────────────────

    /// <summary>
    /// Yük sahibinin (Customer) kendi ilanına gelen tüm teklifleri listeler.
    /// Sahiplik doğrulaması servis katmanında yapılır; başkasının ilanına erişilemez.
    /// </summary>
    [HttpGet("load/{loadId:guid}")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> GetBidsByLoad(Guid loadId)
    {
        var customerIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(customerIdClaim, out var customerId))
            return Unauthorized(new { Message = "Geçerli bir kullanıcı kimliği bulunamadı." });

        try
        {
            var bids = await _bidService.GetBidsByLoadIdAsync(loadId, customerId);
            return Ok(bids);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Teklifler listelenirken bir hata oluştu.", Details = ex.Message });
        }
    }

    // ── POST api/bids/{id}/accept ─────────────────────────────────────────────

    /// <summary>
    /// Yük sahibinin (Customer) beklemedeki bir teklifi kabul etmesini sağlar.
    /// Atomik: teklif onaylanır, yük atanır, diğer teklifler reddedilir.
    /// Sahiplik ve durum doğrulaması servis katmanında yapılır.
    /// </summary>
    [HttpPost("{id:int}/accept")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> AcceptBid(int id)
    {
        var customerIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(customerIdClaim, out var customerId))
            return Unauthorized(new { Message = "Geçerli bir kullanıcı kimliği bulunamadı." });

        try
        {
            await _bidService.AcceptBidAsync(id, customerId);
            return Ok(new { Message = "Teklif kabul edildi, yük şoföre atandı." });
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
            return StatusCode(500, new { Message = "Teklif kabul edilirken bir hata oluştu.", Details = ex.Message });
        }
    }
}
