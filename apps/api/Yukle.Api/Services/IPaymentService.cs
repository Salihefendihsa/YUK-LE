using System;
using System.Threading.Tasks;

namespace Yukle.Api.Services;

public sealed record RefundEscrowResult(decimal RefundAmount, bool AlreadyRefunded);

public interface IPaymentService
{
    Task<bool> HoldPaymentAsync(Guid loadId, decimal amount, string creditCardToken);

    Task<bool> ReleasePaymentAsync(Guid loadId, int driverUserId);

    /// <summary>Escrow iadesi — cagiran transaction icinde olmali; satir kilidi disarida alinmis olabilir.</summary>
    Task<RefundEscrowResult?> RefundEscrowAsync(
        Guid loadId, int customerUserId, decimal bidAmount, decimal refundPercent, decimal cancellationFee,
        CancellationToken ct = default);
}
