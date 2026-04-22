using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Yukle.Api.DTOs;
using Yukle.Api.Hubs;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

/// <summary>
/// Yük tekliflerini yöneten RESTful controller.
/// Sınıf seviyesinde JWT zorunludur; her endpoint rol bazında ayrıca kısıtlanır.
/// Teklif oluşturulduğunda yük sahibine IHubContext üzerinden anlık SignalR bildirimi gönderilir.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("global-policy")]   // Phase 2.2: TokenBucket, 10 istek/sn
public sealed class BidsController(
    IBidService                        bidService,
    ILoadService                       loadService,
    IHubContext<NotificationHub>       hubContext,
    ILogger<BidsController>            logger) : ControllerBase
{
    private readonly IBidService                  _bidService  = bidService;
    private readonly ILoadService                 _loadService = loadService;
    private readonly IHubContext<NotificationHub> _hubContext  = hubContext;
    private readonly ILogger<BidsController>      _logger      = logger;

    // ── POST api/bids/submit ──────────────────────────────────────────────────

    /// <summary>
    /// Giriş yapmış şoförün belirtilen yük ilanına teklif vermesini sağlar.
    /// Teklif kaydedildikten sonra yük sahibine SignalR üzerinden anlık bildirim fırlatılır.
    /// DriverId ve şoför adı JWT claim'lerinden okunur; DTO'dan alınmaz.
    /// </summary>
    [HttpPost("submit")]
    [Authorize(Policy = "RequireActiveDriver")]   // v2.5.3 — Teklif vermek için AI onayı zorunlu
    public async Task<IActionResult> SubmitBid([FromBody] CreateBidDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var driverIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(driverIdClaim, out var driverId))
            return Unauthorized(new { Message = "Geçerli bir sürücü kimliği bulunamadı." });

        var bid = await _bidService.SubmitBidAsync(dto, driverId);

        await SendBidPushAsync(bid.Id, bid.LoadId, bid.Amount, bid.CreatedAt, driverId);

        return CreatedAtAction(nameof(SubmitBid), new { id = bid.Id }, new
        {
            Message   = "Teklifiniz başarıyla iletildi.",
            BidId     = bid.Id,
            LoadId    = bid.LoadId,
            Amount    = bid.Amount,
            Status    = bid.Status.ToString(),
            CreatedAt = bid.CreatedAt
        });
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

        var bids = await _bidService.GetBidsByLoadIdAsync(loadId, customerId);
        return Ok(bids);
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

        await _bidService.AcceptBidAsync(id, customerId);
        return Ok(new { Message = "Teklif kabul edildi, yük şoföre atandı." });
    }

    // =========================================================================
    // Yardımcı: Çift Kanallı Push (Dual-Track)
    // =========================================================================

    /// <summary>
    /// Yeni teklif geldiğinde yük sahibine iki ayrı SignalR event'i paralel olarak fırlatır:
    /// <list type="bullet">
    ///   <item><c>ReceiveNotification</c> — popup/sesli uyarı kanalı.</item>
    ///   <item><c>ReceiveBid</c>          — UI güncelleme kanalı; liste tekrar çekilmeden yeni satır eklenir.</item>
    /// </list>
    /// Hata durumunda ana teklif akışı engellenmez; sessizce loglanır.
    /// </summary>
    private async Task SendBidPushAsync(
        int      bidId,
        Guid     loadId,
        decimal  amount,
        DateTime createdAt,
        int      driverId)
    {
        try
        {
            var load       = await _loadService.GetLoadByIdAsync(loadId);
            var driverName = User.FindFirstValue(ClaimTypes.Name) ?? $"Şoför #{driverId}";

            if (load is null)
            {
                _logger.LogWarning(
                    "SendBidPush: Load {LoadId} not found, push skipped.", loadId);
                return;
            }

            var ownerGroup = load.OwnerId.ToString();

            // ── Kanal 1: ReceiveNotification — popup/uyarı ────────────────────
            var notificationPush = _hubContext.Clients
                .Group(ownerGroup)
                .SendAsync("ReceiveNotification", new
                {
                    Title   = "Yeni Teklif!",
                    Message = $"{driverName} yükünüze teklif verdi.",
                    BidId   = bidId,
                    LoadId  = loadId
                });

            // ── Kanal 2: ReceiveBid — sessiz UI güncellemesi ──────────────────
            // DriverRating henüz User modelinde tanımlı değil; rating sistemi
            // ileride eklendiğinde bu alan otomatik dolacak.
            var uiPush = _hubContext.Clients
                .Group(ownerGroup)
                .SendAsync("ReceiveBid", new
                {
                    BidId        = bidId,
                    Amount       = amount,
                    DriverName   = driverName,
                    DriverRating = (double?)null,
                    LoadId       = loadId,
                    CreatedAt    = createdAt
                });

            // İki push paralel; birini diğeri beklemiyor.
            await Task.WhenAll(notificationPush, uiPush);

            _logger.LogInformation(
                "Real-time notification sent to Owner {OwnerId} for Load {LoadId}.",
                load.OwnerId, loadId);

            _logger.LogInformation(
                "UI Update event 'ReceiveBid' sent to Client {OwnerId}.",
                load.OwnerId);
        }
        catch (Exception ex)
        {
            // Bildirim hatası ana teklif akışını asla engellememelidir.
            _logger.LogError(ex,
                "Failed to send real-time push for Bid {BidId} / Load {LoadId}.",
                bidId, loadId);
        }
    }
}
