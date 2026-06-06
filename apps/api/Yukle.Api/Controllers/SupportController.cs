using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

/// <summary>
/// Destek talepleri: AI chatbot (Gemini) + insan operatör (admin) aynı thread'de.
/// Akış: kullanıcı mesaj atar → AI cevaplar (best-effort) → kullanıcı isterse
/// operatöre aktarır → admin yanıtlar. Tüm mesajlar tek thread'de tutulur.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SupportController : ControllerBase
{
    private readonly YukleDbContext       _context;
    private readonly IGeminiService       _gemini;
    private readonly INotificationService _notifications;
    private readonly ILogger<SupportController> _logger;

    public SupportController(
        YukleDbContext       context,
        IGeminiService       gemini,
        INotificationService notifications,
        ILogger<SupportController> logger)
    {
        _context       = context;
        _gemini        = gemini;
        _notifications = notifications;
        _logger        = logger;
    }

    private const string AiFallbackReply =
        "Şu anda yapay zeka asistanımıza ulaşamıyorum. Sorun devam ederse \"İnsan operatöre aktar\" " +
        "diyerek destek ekibimize bağlanabilirsiniz; en kısa sürede dönüş yapacağız.";

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool IsAdmin => User.IsInRole("Admin");

    // ── POST /Support/tickets — yeni talep + ilk AI cevabı ───────────────────
    [HttpPost("tickets")]
    public async Task<IActionResult> CreateTicket([FromBody] CreateSupportTicketDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { Message = "Mesaj boş olamaz." });

        var userId = CurrentUserId;
        var now    = DateTime.UtcNow;

        var subject = string.IsNullOrWhiteSpace(dto.Subject)
            ? Truncate(dto.Message.Trim(), 80)
            : Truncate(dto.Subject.Trim(), 200);

        var ticket = new SupportTicket
        {
            UserId        = userId,
            Subject       = subject,
            Status        = SupportTicketStatus.Answered, // AI birazdan cevaplayacak
            CreatedAt     = now,
            LastMessageAt = now,
            SlaDeadline   = now.AddHours(24)
        };

        var userMsg = new SupportMessage
        {
            TicketId   = ticket.Id,
            SenderId   = userId,
            SenderRole = SupportSenderRole.User,
            Content    = dto.Message.Trim(),
            CreatedAt  = now
        };
        ticket.Messages.Add(userMsg);

        // AI cevabı (best-effort) — başarısızsa nazik fallback, çekirdek akış çökmez.
        var aiText = await SafeAiReplyAsync(dto.Message.Trim(), Array.Empty<SupportChatTurn>());
        ticket.Messages.Add(new SupportMessage
        {
            TicketId   = ticket.Id,
            SenderId   = 0,
            SenderRole = SupportSenderRole.AI,
            Content    = aiText,
            CreatedAt  = DateTime.UtcNow
        });
        ticket.LastMessageAt = DateTime.UtcNow;

        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();

        var detail = await BuildDetailAsync(ticket.Id);
        return Ok(detail);
    }

    // ── POST /Support/tickets/{id}/messages — mesaj ekle (kullanıcı/admin) ───
    [HttpPost("tickets/{id:guid}/messages")]
    public async Task<IActionResult> PostMessage(Guid id, [FromBody] CreateSupportMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
            return BadRequest(new { Message = "Mesaj boş olamaz." });

        var ticket = await _context.SupportTickets
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket is null) return NotFound();

        var userId  = CurrentUserId;
        var isAdmin = IsAdmin;

        if (!isAdmin && ticket.UserId != userId)
            return Forbid();

        var now = DateTime.UtcNow;

        // Mesaj eklemeden ÖNCE durumu değerlendirebilmek için thread anlık görüntüsü.
        var priorMessages = ticket.Messages.OrderBy(m => m.CreatedAt).ToList();

        if (isAdmin)
        {
            // Operatör yanıtı → Answered + kullanıcıya bildirim.
            _context.SupportMessages.Add(new SupportMessage
            {
                TicketId   = ticket.Id,
                SenderId   = userId,
                SenderRole = SupportSenderRole.Admin,
                Content    = dto.Content.Trim(),
                CreatedAt  = now
            });
            ticket.Status        = SupportTicketStatus.Answered;
            ticket.LastMessageAt = now;
            await _context.SaveChangesAsync();

            await SafeNotifyAsync(ticket.UserId,
                "Destek talebinize yanıt geldi",
                $"\"{ticket.Subject}\" talebinize destek ekibi yanıt verdi.",
                ticket.Id);

            return Ok(await BuildDetailAsync(ticket.Id));
        }

        // ── Kullanıcı mesajı ──────────────────────────────────────────────────
        _context.SupportMessages.Add(new SupportMessage
        {
            TicketId   = ticket.Id,
            SenderId   = userId,
            SenderRole = SupportSenderRole.User,
            Content    = dto.Content.Trim(),
            CreatedAt  = now
        });
        ticket.LastMessageAt = now;

        // İnsan modu: talep operatöre aktarılmış (Open) veya thread'de admin mesajı varsa.
        var humanMode = ticket.Status == SupportTicketStatus.Open
                        || priorMessages.Any(m => m.SenderRole == SupportSenderRole.Admin);

        if (humanMode)
        {
            // Operatör bekleniyor — AI cevaplamaz, admin'e haber ver.
            ticket.Status = SupportTicketStatus.Open;
            await _context.SaveChangesAsync();
            await NotifyAdminsAsync(
                "Destek talebinde yeni mesaj",
                $"\"{ticket.Subject}\" talebinde kullanıcı yeni bir mesaj yazdı.",
                ticket.Id);
        }
        else
        {
            // AI modu — önceki turları ver, AI cevaplasın (best-effort).
            var history = priorMessages.Select(ToTurn).ToList();

            var aiText = await SafeAiReplyAsync(dto.Content.Trim(), history);
            _context.SupportMessages.Add(new SupportMessage
            {
                TicketId   = ticket.Id,
                SenderId   = 0,
                SenderRole = SupportSenderRole.AI,
                Content    = aiText,
                CreatedAt  = DateTime.UtcNow
            });
            ticket.Status        = SupportTicketStatus.Answered;
            ticket.LastMessageAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(await BuildDetailAsync(ticket.Id));
    }

    // ── POST /Support/tickets/{id}/escalate — insan operatöre aktar ──────────
    [HttpPost("tickets/{id:guid}/escalate")]
    public async Task<IActionResult> Escalate(Guid id)
    {
        var ticket = await _context.SupportTickets
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket is null) return NotFound();
        if (!IsAdmin && ticket.UserId != CurrentUserId) return Forbid();

        var now = DateTime.UtcNow;
        ticket.Status        = SupportTicketStatus.Open;
        ticket.LastMessageAt = now;

        // Bilgilendirme mesajı (sistem/AI tonu) — thread'de görünür.
        _context.SupportMessages.Add(new SupportMessage
        {
            TicketId   = ticket.Id,
            SenderId   = 0,
            SenderRole = SupportSenderRole.AI,
            Content    = "Talebiniz destek ekibimize iletildi. En kısa sürede bir operatör dönüş yapacaktır. " +
                         "Hedefimiz 24 saat içinde yanıt vermektir.",
            CreatedAt  = now
        });

        await _context.SaveChangesAsync();

        await NotifyAdminsAsync(
            "Yeni destek talebi (operatör)",
            $"\"{ticket.Subject}\" talebi operatör yanıtı bekliyor.",
            ticket.Id);

        return Ok(await BuildDetailAsync(ticket.Id));
    }

    // ── PATCH /Support/tickets/{id}/status — admin durum güncelle ────────────
    [HttpPatch("tickets/{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateSupportStatusDto dto)
    {
        if (!Enum.TryParse<SupportTicketStatus>(dto.Status, ignoreCase: true, out var newStatus))
            return BadRequest(new { Message = "Geçersiz durum değeri." });

        var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket is null) return NotFound();

        ticket.Status = newStatus;
        await _context.SaveChangesAsync();

        if (newStatus is SupportTicketStatus.Resolved or SupportTicketStatus.Closed)
        {
            await SafeNotifyAsync(ticket.UserId,
                "Destek talebiniz kapatıldı",
                $"\"{ticket.Subject}\" talebiniz çözüldü olarak işaretlendi.",
                ticket.Id);
        }

        return Ok(await BuildDetailAsync(ticket.Id));
    }

    // ── GET /Support/tickets/mine — kullanıcının kendi talepleri ─────────────
    [HttpGet("tickets/mine")]
    public async Task<IActionResult> Mine()
    {
        var userId = CurrentUserId;
        var tickets = await _context.SupportTickets
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.LastMessageAt)
            .Select(t => new
            {
                t.Id, t.UserId, t.Subject, t.Status, t.CreatedAt, t.LastMessageAt, t.SlaDeadline,
                LastMessage = t.Messages.OrderByDescending(m => m.CreatedAt).Select(m => m.Content).FirstOrDefault(),
                Count = t.Messages.Count
            })
            .ToListAsync();

        var now = DateTime.UtcNow;
        var result = tickets.Select(t => new SupportTicketSummaryDto
        {
            Id            = t.Id,
            UserId        = t.UserId,
            UserName      = string.Empty,
            Subject       = t.Subject,
            Status        = t.Status.ToString(),
            CreatedAt     = t.CreatedAt,
            LastMessageAt = t.LastMessageAt,
            SlaDeadline   = t.SlaDeadline,
            IsOverdue     = t.Status == SupportTicketStatus.Open && t.SlaDeadline < now,
            LastMessagePreview = Truncate(t.LastMessage ?? string.Empty, 120),
            MessageCount  = t.Count
        }).ToList();

        return Ok(result);
    }

    // ── GET /Support/tickets — admin liste (açık üstte, SLA sıralı) ──────────
    [HttpGet("tickets")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdminList()
    {
        var raw = await _context.SupportTickets
            .Select(t => new
            {
                t.Id, t.UserId, t.Subject, t.Status, t.CreatedAt, t.LastMessageAt, t.SlaDeadline,
                LastMessage = t.Messages.OrderByDescending(m => m.CreatedAt).Select(m => m.Content).FirstOrDefault(),
                Count = t.Messages.Count
            })
            .ToListAsync();

        var userIds = raw.Select(r => r.UserId).Distinct().ToList();
        var names = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName })
            .ToDictionaryAsync(u => u.Id, u => u.FullName);

        var now = DateTime.UtcNow;
        var result = raw
            .Select(t => new SupportTicketSummaryDto
            {
                Id            = t.Id,
                UserId        = t.UserId,
                UserName      = names.TryGetValue(t.UserId, out var n) ? n : $"Kullanıcı #{t.UserId}",
                Subject       = t.Subject,
                Status        = t.Status.ToString(),
                CreatedAt     = t.CreatedAt,
                LastMessageAt = t.LastMessageAt,
                SlaDeadline   = t.SlaDeadline,
                IsOverdue     = t.Status == SupportTicketStatus.Open && t.SlaDeadline < now,
                LastMessagePreview = Truncate(t.LastMessage ?? string.Empty, 120),
                MessageCount  = t.Count
            })
            // Açık (operatör bekleyen) talepler üstte, en yakın SLA önce; diğerleri en yeni mesaj.
            .OrderByDescending(t => t.Status == "Open")
            .ThenBy(t => t.Status == "Open" ? t.SlaDeadline : DateTime.MaxValue)
            .ThenByDescending(t => t.LastMessageAt)
            .ToList();

        return Ok(result);
    }

    // ── GET /Support/tickets/open-count — admin rozet sayacı ─────────────────
    [HttpGet("tickets/open-count")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> OpenCount()
    {
        var count = await _context.SupportTickets
            .CountAsync(t => t.Status == SupportTicketStatus.Open);
        return Ok(new { count });
    }

    // ── GET /Support/tickets/{id} — detay (thread) ───────────────────────────
    [HttpGet("tickets/{id:guid}")]
    public async Task<IActionResult> Detail(Guid id)
    {
        var ticket = await _context.SupportTickets.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);
        if (ticket is null) return NotFound();
        if (!IsAdmin && ticket.UserId != CurrentUserId) return Forbid();

        return Ok(await BuildDetailAsync(id));
    }

    // ── Yardımcılar ──────────────────────────────────────────────────────────

    private async Task<SupportTicketDetailDto> BuildDetailAsync(Guid ticketId)
    {
        var ticket = await _context.SupportTickets.AsNoTracking()
            .Include(t => t.Messages)
            .FirstAsync(t => t.Id == ticketId);

        var ownerName = await _context.Users
            .Where(u => u.Id == ticket.UserId)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync() ?? $"Kullanıcı #{ticket.UserId}";

        var now = DateTime.UtcNow;
        return new SupportTicketDetailDto
        {
            Id            = ticket.Id,
            UserId        = ticket.UserId,
            UserName      = ownerName,
            Subject       = ticket.Subject,
            Status        = ticket.Status.ToString(),
            CreatedAt     = ticket.CreatedAt,
            LastMessageAt = ticket.LastMessageAt,
            SlaDeadline   = ticket.SlaDeadline,
            IsOverdue     = ticket.Status == SupportTicketStatus.Open && ticket.SlaDeadline < now,
            Messages = ticket.Messages
                .OrderBy(m => m.CreatedAt)
                .Select(m => new SupportMessageDto
                {
                    Id         = m.Id,
                    SenderId   = m.SenderId,
                    SenderRole = m.SenderRole.ToString(),
                    SenderName = m.SenderRole switch
                    {
                        SupportSenderRole.AI    => "Navlonix Asistan",
                        SupportSenderRole.Admin => "Destek Ekibi",
                        _                       => ownerName
                    },
                    Content   = m.Content,
                    CreatedAt = m.CreatedAt
                })
                .ToList()
        };
    }

    private static SupportChatTurn ToTurn(SupportMessage m) =>
        new(m.SenderRole == SupportSenderRole.User ? "user" : "model", m.Content);

    private async Task<string> SafeAiReplyAsync(string message, IReadOnlyList<SupportChatTurn> history)
    {
        try
        {
            var reply = await _gemini.GetSupportAssistantReplyAsync(message, history);
            return string.IsNullOrWhiteSpace(reply) ? AiFallbackReply : reply!;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Destek AI cevabı alınamadı — fallback kullanıldı.");
            return AiFallbackReply;
        }
    }

    private async Task NotifyAdminsAsync(string title, string message, Guid ticketId)
    {
        try
        {
            var adminIds = await _context.Users
                .Where(u => u.Role == UserRole.Admin)
                .Select(u => u.Id)
                .ToListAsync();

            foreach (var adminId in adminIds)
                await _notifications.SendNotificationAsync(adminId, title, message, NotificationType.System, ticketId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Admin destek bildirimi gönderilemedi (best-effort).");
        }
    }

    private async Task SafeNotifyAsync(int userId, string title, string message, Guid ticketId)
    {
        try
        {
            await _notifications.SendNotificationAsync(userId, title, message, NotificationType.System, ticketId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Kullanıcı destek bildirimi gönderilemedi (best-effort).");
        }
    }

    private static string Truncate(string s, int max)
        => string.IsNullOrEmpty(s) ? s : (s.Length <= max ? s : s[..max].TrimEnd() + "…");
}
