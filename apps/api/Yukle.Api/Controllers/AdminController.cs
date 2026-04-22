using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;
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

    public AdminController(YukleDbContext context, ILogger<AdminController> logger)
    {
        _context = context;
        _logger = logger;
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
