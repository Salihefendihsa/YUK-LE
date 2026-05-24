using Yukle.Api.DTOs;

namespace Yukle.Api.Services;

public interface ICancellationService
{
    Task<CancelLoadResultDto> CancelAsync(
        Guid loadId, int actorUserId, bool isAdmin, string? reason,
        CancellationToken ct = default);
}
