using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;
using Yukle.Api.Services;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;

namespace Yukle.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("global-policy")]
public class AdminController : ControllerBase
{
    private readonly YukleDbContext _context;
    private readonly ILogger<AdminController> _logger;
    private readonly IDistributedCache _cache;
    private readonly IChatModerationService _chatModerationService;

    public AdminController(
        YukleDbContext context,
        ILogger<AdminController> logger,
        IDistributedCache cache,
        IChatModerationService chatModerationService)
    {
        _context = context;
        _logger = logger;
        _cache = cache;
        _chatModerationService = chatModerationService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var totalUsers = await _context.Users.CountAsync(u => u.Role == UserRole.Customer || u.Role == UserRole.Driver);
        var activeLoads = await _context.Loads.CountAsync(l => l.Status == LoadStatus.Active);
        var pendingReviews = await _context.Users.CountAsync(u => u.Role == UserRole.Driver && u.ApprovalStatus == ApprovalStatus.PendingReview);
        var totalVolume = await _context.PaymentTransactions.SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var recentActions = await _context.AdminActionLogs
            .AsNoTracking()
            .OrderByDescending(x => x.TimestampUtc)
            .Take(10)
            .Select(x => new
            {
                x.Id,
                x.AdminId,
                x.TargetUserId,
                x.Action,
                x.Note,
                x.TimestampUtc
            })
            .ToListAsync();

        var dbHealthy = await _context.Database.CanConnectAsync();
        bool redisHealthy;
        try
        {
            var key = "admin:healthcheck";
            await _cache.SetStringAsync(key, DateTime.UtcNow.ToString("O"), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30)
            });
            redisHealthy = await _cache.GetStringAsync(key) is not null;
        }
        catch
        {
            redisHealthy = false;
        }

        return Ok(new
        {
            totalUsers,
            activeLoadCount = activeLoads,
            pendingReviewCount = pendingReviews,
            totalTransactionVolume = totalVolume,
            systemStatus = new
            {
                api = "Online",
                db = dbHealthy ? "Online" : "Offline",
                redis = redisHealthy ? "Online" : "Offline"
            },
            recentActions
        });
    }

    /// <summary>
    /// PendingReview (Gri Alan) statüsündeki şoförleri ve ai delillerini getirir.
    /// Düşük skorlu, incelemeye daha çok muhtaç profiller (confidenceScore ASC) en üstte döner.
    /// </summary>
    [HttpGet("pending-reviews")]
    public async Task<IActionResult> GetPendingReviews()
    {
        var pendingUsers = await _context.Users
            .AsNoTracking()
            .Where(u => u.ApprovalStatus == ApprovalStatus.PendingReview && u.Role == UserRole.Driver)
            .Select(u => new
            {
                u.Id,
                // KVKK gereği şifreli olan alanlar plain olarak döner çünkü _context bunu saydam çözer
                u.FullName,
                u.Phone,
                u.TaxNumberOrTCKN,
                u.Email,
                u.CreatedAt,
                u.AdminReviewNote,
                u.AiInferenceDetails
            })
            .ToListAsync();

        if (pendingUsers.Count == 0)
        {
            return Ok(new List<object>());
        }

        // AiInferenceDetails parse işlemi ve RAM üstünde sıralama
        // Bekleyen kuyruk görece küçük olduğu için (örn. hepi topu 50-100 kişi olur) bellek üstünde sıralama problemsizdir.
        var sortedResult = pendingUsers
            .Select(u =>
            {
                double confidence = 100.0; // JSON sorunluysa veya yoksa en az şüpheli say (en alta it)
                if (!string.IsNullOrWhiteSpace(u.AiInferenceDetails))
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(u.AiInferenceDetails);
                        if (doc.RootElement.TryGetProperty("ConfidenceScore", out var confProp) && 
                            confProp.TryGetDouble(out var parsedConf))
                        {
                            confidence = parsedConf;
                        }
                    }
                    catch
                    {
                        // JSON parse error, ignore
                    }
                }

                return new
                {
                    User = u,
                    Confidence = confidence
                };
            })
            .OrderBy(x => x.Confidence) // En şüpheli profili ilk ver
            .Select(x => x.User)
            .ToList();

        return Ok(sortedResult);
    }

    [HttpGet("drivers")]
    public async Task<IActionResult> GetDrivers([FromQuery] string? status = null)
    {
        var query = _context.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Driver);

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalized = status.Trim().ToLowerInvariant();
            query = normalized switch
            {
                "active" => query.Where(u => u.ApprovalStatus == ApprovalStatus.Active),
                "review" => query.Where(u => u.ApprovalStatus == ApprovalStatus.PendingReview || u.ApprovalStatus == ApprovalStatus.ManualApprovalRequired),
                "rejected" => query.Where(u => u.ApprovalStatus == ApprovalStatus.Rejected),
                _ => query
            };
        }

        var data = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Phone,
                u.Email,
                u.IsActive,
                ApprovalStatus = u.ApprovalStatus.ToString(),
                Vehicle = _context.Vehicles.Where(v => v.DriverId == u.Id).Select(v => v.Plate).FirstOrDefault(),
                Rating = 5.0
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers()
    {
        var data = await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Customer)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Phone,
                u.Email,
                u.IsActive,
                totalLoadCount = _context.Loads.Count(l => l.UserId == u.Id),
                totalSpent = _context.Loads.Where(l => l.UserId == u.Id && l.Status == LoadStatus.Delivered).Sum(l => (decimal?)l.Price) ?? 0m
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpPost("users/{userId}/toggle-active")]
    public async Task<IActionResult> ToggleUserActive(int userId)
    {
        var user = await _context.Users.SingleOrDefaultAsync(x => x.Id == userId);
        if (user is null)
            throw new ApplicationException("Kullanıcı bulunamadı.");

        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();
        return Ok(new { user.Id, user.IsActive });
    }

    [HttpGet("loads")]
    public async Task<IActionResult> GetLoads([FromQuery] string? status = null, [FromQuery] string? q = null)
    {
        var query = _context.Loads.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<LoadStatus>(status, true, out var parsed))
            query = query.Where(l => l.Status == parsed);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLowerInvariant();
            query = query.Where(l => l.FromCity.ToLower().Contains(term)
                                  || l.ToCity.ToLower().Contains(term)
                                  || l.Description.ToLower().Contains(term));
        }

        var data = await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                l.Id,
                l.FromCity,
                l.ToCity,
                Status = l.Status.ToString(),
                l.Price,
                l.CreatedAt
            })
            .ToListAsync();
        return Ok(data);
    }

    [HttpPost("loads/{loadId:guid}/cancel")]
    public async Task<IActionResult> CancelLoad(Guid loadId)
    {
        var load = await _context.Loads.SingleOrDefaultAsync(x => x.Id == loadId);
        if (load is null)
            throw new ApplicationException("İlan bulunamadı.");

        load.Status = LoadStatus.Cancelled;
        await _context.SaveChangesAsync();
        return Ok(new { load.Id, Status = load.Status.ToString() });
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments()
    {
        var data = await _context.PaymentTransactions
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.LoadId,
                p.TransactionId,
                p.Amount,
                Status = p.Status.ToString(),
                p.CreatedAt,
                p.UpdatedAt
            })
            .ToListAsync();
        return Ok(data);
    }

    [HttpPost("payments/{paymentId:guid}/release")]
    public async Task<IActionResult> ReleasePayment(Guid paymentId)
    {
        var payment = await _context.PaymentTransactions.SingleOrDefaultAsync(x => x.Id == paymentId);
        if (payment is null)
            throw new ApplicationException("Ödeme kaydı bulunamadı.");

        payment.Status = PaymentStatus.Released;
        payment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { payment.Id, Status = payment.Status.ToString() });
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs()
    {
        var data = await _context.AdminActionLogs
            .AsNoTracking()
            .OrderByDescending(l => l.TimestampUtc)
            .Take(200)
            .Select(l => new
            {
                l.Id,
                l.AdminId,
                l.TargetUserId,
                l.Action,
                l.Note,
                l.TimestampUtc
            })
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("system")]
    public async Task<IActionResult> GetSystemStatus()
    {
        var canConnect = await _context.Database.CanConnectAsync();
        var pendingWorkerJobs = await _context.UetdsOutboxes.CountAsync(x => x.Status == OutboxStatus.Pending);
        return Ok(new
        {
            api = "Online",
            db = canConnect ? "Online" : "Offline",
            workers = new
            {
                uetdsPending = pendingWorkerJobs
            }
        });
    }

    [HttpGet("blocked-messages")]
    public IActionResult GetBlockedMessages()
    {
        var data = _chatModerationService.GetBlockedMessages(200);
        return Ok(data);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var users = await _context.Users.GroupBy(u => u.Role).Select(g => new { Role = g.Key.ToString(), Count = g.Count() }).ToListAsync();
        var totalVolume = await _context.PaymentTransactions.SumAsync(p => (decimal?)p.Amount) ?? 0m;
        var monthCommission = await _context.PaymentTransactions.Where(p => p.CreatedAt >= monthStart && p.Status == PaymentStatus.Released).SumAsync(p => (decimal?)p.Amount) ?? 0m;
        return Ok(new
        {
            Users = users,
            NewToday = await _context.Users.CountAsync(u => u.CreatedAt >= today),
            ActiveLoads = await _context.Loads.CountAsync(l => l.Status == LoadStatus.Active),
            DeliveredToday = await _context.Loads.CountAsync(l => l.Status == LoadStatus.Delivered && l.DeliveryDate >= today),
            TotalVolume = totalVolume,
            MonthlyCommission = monthCommission * 0.1m,
            PendingReviews = await _context.Users.CountAsync(u => u.ApprovalStatus == ApprovalStatus.PendingReview),
            ReportedChats = _chatModerationService.GetBlockedMessages(500).Count
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? role = null, [FromQuery] string? status = null, [FromQuery] string? q = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole)) query = query.Where(u => u.Role == parsedRole);
        if (!string.IsNullOrWhiteSpace(status))
            query = status.ToLowerInvariant() switch
            {
                "active" => query.Where(u => u.IsActive),
                "suspended" => query.Where(u => !u.IsActive),
                _ => query
            };
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(u => u.FullName.Contains(q) || u.Email.Contains(q) || u.Phone.Contains(q));
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(u => u.CreatedAt).Skip((Math.Max(page, 1) - 1) * Math.Max(pageSize, 1)).Take(Math.Max(pageSize, 1)).Select(u => new
        {
            u.Id, u.FullName, u.Email, u.Phone, Role = u.Role.ToString(), u.IsActive, u.CreatedAt
        }).ToListAsync();
        return Ok(new { Total = total, Items = items });
    }

    [HttpPut("users/{userId:int}/suspend")]
    public async Task<IActionResult> SuspendUser(int userId, [FromBody] SuspendRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Reason)) return BadRequest(new { Message = "Askıya alma sebebi zorunludur." });
        user.IsActive = false;
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Kullanıcı askıya alındı." });
    }

    [HttpPut("users/{userId:int}/activate")]
    public async Task<IActionResult> ActivateUser(int userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();
        user.IsActive = true;
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Kullanıcı aktif edildi." });
    }

    [HttpGet("chats")]
    public IActionResult GetChats()
    {
        var blocked = _chatModerationService.GetBlockedMessages(500);
        var grouped = blocked.GroupBy(x => x.LoadId).Select(g => new { LoadId = g.Key, MessageCount = g.Count(), LastMessageAt = g.Max(x => x.TimestampUtc) }).OrderByDescending(x => x.MessageCount);
        return Ok(grouped);
    }

    [HttpGet("chats/{loadId:guid}")]
    public async Task<IActionResult> GetChatByLoad(Guid loadId)
    {
        var messages = await _context.ChatMessages.Where(c => c.LoadId == loadId).OrderBy(c => c.CreatedAt).ToListAsync();
        var blocked = _chatModerationService.GetBlockedMessages(500).Where(x => Guid.TryParse(x.LoadId, out var gid) && gid == loadId);
        return Ok(new { Messages = messages, BlockedMessages = blocked });
    }

    [HttpGet("drivers/{id:int}/stats")]
    public async Task<IActionResult> DriverStats(int id)
    {
        var delivered = await _context.Loads.Where(l => l.DriverId == id && l.Status == LoadStatus.Delivered).ToListAsync();
        return Ok(new
        {
            TotalTrips = delivered.Count,
            TotalWeight = delivered.Sum(l => l.Weight),
            TotalEarnings = delivered.Sum(l => l.Price),
            TopRoutes = delivered.GroupBy(l => $"{l.FromCity}->{l.ToCity}").Select(g => new { Route = g.Key, Count = g.Count() }).OrderByDescending(x => x.Count).Take(5)
        });
    }

    [HttpGet("customers/{id:int}/stats")]
    public async Task<IActionResult> CustomerStats(int id)
    {
        var loads = await _context.Loads.Where(l => l.UserId == id).ToListAsync();
        return Ok(new
        {
            TotalLoads = loads.Count,
            Delivered = loads.Count(x => x.Status == LoadStatus.Delivered),
            Cancelled = loads.Count(x => x.Status == LoadStatus.Cancelled),
            TotalSpend = loads.Sum(x => x.Price)
        });
    }

    /// <summary>
    /// PendingReview statüsündeki kullanıcı hakkında son kararı verip kaydeder.
    /// </summary>
    [HttpPost("reviews/{userId}/decide")]
    public async Task<IActionResult> DecideOnReview(int userId, [FromBody] AdminReviewDecisionDto decision)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var adminIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(adminIdClaim, out int adminId))
            throw new ApplicationException("Geçerli bir admin oturumu bulunamadı.");

        var targetUser = await _context.Users.SingleOrDefaultAsync(u => u.Id == userId);
        if (targetUser == null)
            throw new ApplicationException("Kullanıcı bulunamadı.");

        if (targetUser.ApprovalStatus != ApprovalStatus.PendingReview)
            throw new ApplicationException($"Geçersiz işlem: Bu kullanıcı PendingReview statüsünde değil (Mevcut: {targetUser.ApprovalStatus}).");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Durumu güncelle
            if (decision.IsApproved)
            {
                targetUser.ApprovalStatus = ApprovalStatus.Active;
                targetUser.IsActive = true;
                targetUser.LastValidationMessage = "Belgeleriniz admin tarafından manuel incelenmiş ve onaylanmıştır.";
                
                // AiInferenceDetails'dan ilgili belge tiplerine göre checkmark koymak gerekir.
                // Basitlik için ve Phase 1 tasarımı gereği, AdminReviewPending manuel onaylandığında "genel bir aktiflik" veriyoruz 
                // ya da zorunlu belgelerin flag'lerini (IsDriverLicenseApproved vb.) true yaparız.
                targetUser.IsDriverLicenseApproved = true;
                targetUser.IsSrcApproved = true;
                targetUser.IsPsychotechnicalApproved = true;
            }
            else
            {
                targetUser.ApprovalStatus = ApprovalStatus.Rejected;
                targetUser.IsActive = false;
                targetUser.LastValidationMessage = decision.Reason;
                // İsteğe bağlı olarak geçmiş onaylı flagleri false'a da çekebilirsiniz.
            }

            targetUser.AdminReviewNote = decision.Reason;

            // 2. Audit Log (AdminActionLog) yazdır
            var logEntry = new AdminActionLog
            {
                AdminId = adminId,
                TargetUserId = targetUser.Id,
                Action = decision.IsApproved ? "Approve" : "Reject",
                Note = decision.Reason,
                TimestampUtc = DateTime.UtcNow
            };

            await _context.AdminActionLogs.AddAsync(logEntry);
            
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation(
                "Admin Kararı (Audit): AdminId={AdminId}, TargetUserId={TargetUserId}, Action={Action}, Reason={Reason}",
                adminId, targetUser.Id, logEntry.Action, decision.Reason
            );

            return Ok(new { message = "İşlem başarıyla gerçekleştirildi ve loglandı." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Admin kararını (userId: {UserId}) kaydederken hata oluştu.", userId);
            throw new ApplicationException("Kayıt işlemi sırasında bir hata oluştu, geri alındı.");
        }
    }
}

public sealed class SuspendRequest
{
    public string Reason { get; set; } = string.Empty;
}
