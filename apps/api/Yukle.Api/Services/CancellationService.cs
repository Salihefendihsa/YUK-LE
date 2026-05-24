using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Infrastructure;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public sealed class CancellationService(
    YukleDbContext           context,
    IPaymentService          paymentService,
    INotificationService     notifications,
    IConfiguration           configuration,
    ILogger<CancellationService> logger) : ICancellationService
{
    public async Task<CancelLoadResultDto> CancelAsync(
        Guid loadId, int actorUserId, bool isAdmin, string? reason,
        CancellationToken ct = default)
    {
        var opts = CancellationOptions.FromConfiguration(configuration);

        var strategy = context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(ct);
            try
            {
                var result = await CancelCoreAsync(loadId, actorUserId, isAdmin, reason, opts, ct);
                await context.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                await SendNotificationsAsync(result, ct);
                return result.Dto;
            }
            catch
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        });
    }

    private sealed record CancelCoreResult(CancelLoadResultDto Dto, List<(int UserId, string Title, string Message, NotificationType Type)> Notifications);

    private async Task<CancelCoreResult> CancelCoreAsync(
        Guid loadId, int actorUserId, bool isAdmin, string? reason,
        CancellationOptions opts, CancellationToken ct)
    {
        await PostgresRowLock.LockLoadAsync(context, loadId, ct);

        var load = await context.Loads
            .Include(l => l.Bids)
            .FirstOrDefaultAsync(l => l.Id == loadId, ct)
            ?? throw new InvalidOperationException("Ilan bulunamadi.");

        if (!isAdmin && load.UserId != actorUserId)
            throw new UnauthorizedAccessException("Bu ilani iptal etme yetkiniz yok.");

        if (load.Status == LoadStatus.Cancelled)
        {
            return new CancelCoreResult(new CancelLoadResultDto
            {
                LoadId           = loadId,
                Status           = LoadStatus.Cancelled.ToString(),
                Message          = "Ilan zaten iptal edilmis.",
                AlreadyCancelled = true
            }, []);
        }

        var hasAcceptedBid = load.Bids.Any(b => b.Status == BidStatus.Accepted);

        if (isAdmin)
        {
            if (!LoadCancellationRules.CanAdminCancel(load, opts))
                throw new InvalidOperationException(LoadCancellationRules.BlockMessageForStatus(load.Status));
        }
        else
        {
            if (!LoadCancellationRules.CanCustomerCancel(load, opts, hasAcceptedBid))
                throw new InvalidOperationException(LoadCancellationRules.BlockMessageForStatus(load.Status));
        }

        var needsRefund = isAdmin && load.Status == LoadStatus.Assigned && load.DriverId is not null;

        var acceptedBidAmount = load.Bids
            .Where(b => b.Status == BidStatus.Accepted)
            .Select(b => b.Amount)
            .FirstOrDefault();

        var acceptedDriverId = load.DriverId;
        var pendingDriverIds = load.Bids
            .Where(b => b.Status == BidStatus.Pending)
            .Select(b => b.DriverId)
            .Distinct()
            .ToList();

        load.Status              = LoadStatus.Cancelled;
        load.CancelledAt         = DateTime.UtcNow;
        load.CancellationReason  = reason?.Trim();
        load.CancelledBy         = actorUserId;

        var closedBids = 0;
        foreach (var bid in load.Bids.Where(b => b.Status is BidStatus.Pending or BidStatus.Accepted))
        {
            bid.Status      = bid.Status == BidStatus.Accepted ? BidStatus.Cancelled : BidStatus.Rejected;
            bid.CloseReason = LoadCancellationRules.LoadCancelledCloseReason;
            closedBids++;
        }

        decimal? refundAmount = null;
        if (needsRefund)
        {
            var refund = await paymentService.RefundEscrowAsync(
                loadId, load.UserId, acceptedBidAmount, opts.RefundPercent, opts.CancellationFee, ct);

            if (refund is not null)
            {
                if (refund.AlreadyRefunded)
                    refundAmount = 0m;
                else
                    refundAmount = refund.RefundAmount;
            }
        }

        var message = needsRefund && refundAmount.HasValue
            ? $"Ilan iptal edildi. Bloke tutar iade edildi ({refundAmount.Value:N2} TL)."
            : "Ilan iptal edildi.";

        logger.LogInformation(
            "Load cancelled LoadId={LoadId} Actor={ActorId} Admin={IsAdmin} Refund={Refund:N2} ClosedBids={Bids}",
            loadId, actorUserId, isAdmin, refundAmount ?? 0m, closedBids);

        var notifs = BuildNotifications(load.UserId, isAdmin, acceptedDriverId, pendingDriverIds, refundAmount);

        return new CancelCoreResult(new CancelLoadResultDto
        {
            LoadId       = loadId,
            Status       = LoadStatus.Cancelled.ToString(),
            Message      = message,
            RefundAmount = refundAmount,
            ClosedBids   = closedBids
        }, notifs);
    }

    private static List<(int UserId, string Title, string Message, NotificationType Type)> BuildNotifications(
        int customerUserId, bool isAdmin, int? acceptedDriverId,
        IReadOnlyList<int> pendingDriverIds, decimal? refundAmount)
    {
        var list = new List<(int, string, string, NotificationType)>();

        if (isAdmin && acceptedDriverId is int driverId)
        {
            list.Add((driverId, "Ilan iptal edildi",
                "Ilan yonetici tarafindan iptal edildi.", NotificationType.Load));
        }

        foreach (var pid in pendingDriverIds)
            list.Add((pid, "Ilan iptal edildi", "Ilan iptal edildi.", NotificationType.Bid));

        if (isAdmin && refundAmount is > 0)
        {
            list.Add((customerUserId, "Bloke tutar iade edildi",
                $"Iptal nedeniyle {refundAmount.Value:N2} TL hesabiniza iade edildi.",
                NotificationType.Payment));
        }

        return list;
    }

    private async Task SendNotificationsAsync(CancelCoreResult result, CancellationToken ct)
    {
        foreach (var (userId, title, message, type) in result.Notifications)
            await notifications.SendNotificationAsync(userId, title, message, type);
    }
}
