using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Yukle.Api.DTOs;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

/// <summary>
/// Şoför "Boş Araç" ilanı CRUD ve listeleme operasyonlarını yöneten controller.
/// Bu dalga: ilan açma/iptal + listeleme. Müşteri teklifi/eşleşme sonraki dalga.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("global-policy")]
public sealed class DriverListingController(
    IDriverListingService listingService) : ControllerBase
{
    // ── POST api/DriverListing ─────────────────────────────────────────────────

    /// <summary>Şoför yeni "Boş Araç" ilanı açar. Yalnızca aktif (onaylı) şoför.</summary>
    [HttpPost]
    [Authorize(Policy = "RequireActiveDriver")]
    public async Task<IActionResult> Create([FromBody] CreateDriverListingDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        var id = await listingService.CreateAsync(dto, driverId);
        var created = await listingService.GetByIdAsync(id);
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    // ── GET api/DriverListing ──────────────────────────────────────────────────

    /// <summary>
    /// Yayında (Active) olan şoför ilanlarını listeler. Opsiyonel <c>fromCity</c>/<c>toCity</c>
    /// (çıkış/varış şehri) filtresi uygulanır. Müşteri/şoför/admin erişebilir.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Customer,Driver,Admin")]
    public async Task<IActionResult> GetActive(
        [FromQuery] string? fromCity = null,
        [FromQuery] string? toCity = null)
    {
        var items = await listingService.GetActiveAsync(fromCity, toCity);
        return Ok(new { Total = items.Count, Items = items });
    }

    // ── GET api/DriverListing/mine ─────────────────────────────────────────────

    /// <summary>Giriş yapan şoförün kendi ilanları (tüm durumlar).</summary>
    [HttpGet("mine")]
    [Authorize(Roles = "Driver")]
    public async Task<IActionResult> GetMine()
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        var items = await listingService.GetMineAsync(driverId);
        return Ok(new { Total = items.Count, Items = items });
    }

    // ── GET api/DriverListing/{id} ─────────────────────────────────────────────

    /// <summary>Belirli bir şoför ilanının detayı.</summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Customer,Driver,Admin")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var listing = await listingService.GetByIdAsync(id);
        if (listing is null)
            return NotFound(new { Message = $"'{id}' ID'sine sahip şoför ilanı bulunamadı." });
        return Ok(listing);
    }

    // ── POST api/DriverListing/{id}/cancel ─────────────────────────────────────

    /// <summary>Şoför kendi ilanını iptal eder (Status → Cancelled).</summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "Driver")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        try
        {
            await listingService.CancelAsync(id, driverId);
            return Ok(new { Message = "İlan iptal edildi." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    // ── POST api/DriverListing/{id}/offers ─────────────────────────────────────

    /// <summary>Müşteri, yayında olan bir şoför ilanına kendi açık yükünü teklif eder.</summary>
    [HttpPost("{id:guid}/offers")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> CreateOffer(Guid id, [FromBody] CreateListingOfferDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var customerId))
            return Unauthorized(new { Message = "Geçerli bir müşteri kimliği bulunamadı." });

        try
        {
            var offerId = await listingService.CreateOfferAsync(id, dto, customerId);
            return Ok(new { Id = offerId, Message = "Teklifiniz iletildi." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    // ── GET api/DriverListing/{id}/offers ──────────────────────────────────────

    /// <summary>İlan sahibi şoför, ilanına gelen teklifleri görür.</summary>
    [HttpGet("{id:guid}/offers")]
    [Authorize(Roles = "Driver")]
    public async Task<IActionResult> GetOffers(Guid id)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        try
        {
            var items = await listingService.GetOffersForListingAsync(id, driverId);
            return Ok(new { Total = items.Count, Items = items });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Message = ex.Message });
        }
    }

    // ── GET api/DriverListing/offers/mine ──────────────────────────────────────

    /// <summary>Müşterinin gönderdiği tüm teklifler.</summary>
    [HttpGet("offers/mine")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> GetMyOffers()
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var customerId))
            return Unauthorized(new { Message = "Geçerli bir müşteri kimliği bulunamadı." });

        var items = await listingService.GetMyOffersAsync(customerId);
        return Ok(new { Total = items.Count, Items = items });
    }

    // ── POST api/DriverListing/offers/{offerId}/accept ─────────────────────────

    /// <summary>
    /// İlan sahibi şoför teklifi kabul eder; yük bu şoföre atanır (mevcut atama+escrow hattı),
    /// ilan Eşleşti olur, diğer bekleyen teklifler reddedilir.
    /// </summary>
    [HttpPost("offers/{offerId:guid}/accept")]
    [Authorize(Roles = "Driver")]
    public async Task<IActionResult> AcceptOffer(Guid offerId)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        try
        {
            await listingService.AcceptOfferAsync(offerId, driverId);
            return Ok(new { Message = "Teklif kabul edildi. Yük size atandı." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    // ── POST api/DriverListing/offers/{offerId}/reject ─────────────────────────

    /// <summary>İlan sahibi şoför bekleyen bir teklifi reddeder.</summary>
    [HttpPost("offers/{offerId:guid}/reject")]
    [Authorize(Roles = "Driver")]
    public async Task<IActionResult> RejectOffer(Guid offerId)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        try
        {
            await listingService.RejectOfferAsync(offerId, driverId);
            return Ok(new { Message = "Teklif reddedildi." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    // ── POST api/DriverListing/offers/{offerId}/withdraw ───────────────────────

    /// <summary>Müşteri kendi bekleyen teklifini geri çeker.</summary>
    [HttpPost("offers/{offerId:guid}/withdraw")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> WithdrawOffer(Guid offerId)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var customerId))
            return Unauthorized(new { Message = "Geçerli bir müşteri kimliği bulunamadı." });

        try
        {
            await listingService.WithdrawOfferAsync(offerId, customerId);
            return Ok(new { Message = "Teklif geri çekildi." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
