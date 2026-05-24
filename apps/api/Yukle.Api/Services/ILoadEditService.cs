using Yukle.Api.DTOs;

namespace Yukle.Api.Services;

public interface ILoadEditService
{
    Task<UpdateLoadResultDto> UpdateAsync(
        Guid loadId, int actorUserId, bool isAdmin, CreateLoadDto dto,
        CancellationToken ct = default);
}
