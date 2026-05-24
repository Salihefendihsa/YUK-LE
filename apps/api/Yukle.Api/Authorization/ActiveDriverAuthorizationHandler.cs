using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.Models;

namespace Yukle.Api.Authorization;

public sealed class ActiveDriverRequirement : IAuthorizationRequirement;

/// <summary>
/// JWT'deki stale IsActive claim yerine DB'den güncel durumu okur;
/// admin onayı sonrası yeniden login gerekmeden etki eder.
/// </summary>
public sealed class ActiveDriverAuthorizationHandler(YukleDbContext db)
    : AuthorizationHandler<ActiveDriverRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ActiveDriverRequirement requirement)
    {
        if (!context.User.IsInRole(nameof(UserRole.Driver)))
            return;

        var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
            return;

        var isActive = await db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId && u.Role == UserRole.Driver)
            .Select(u => u.IsActive)
            .FirstOrDefaultAsync();

        if (isActive)
            context.Succeed(requirement);
    }
}
