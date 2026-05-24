using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;

namespace Yukle.Api.Infrastructure;

/// <summary>PostgreSQL satir kilidi — es zamanli iptal/iade yarisini engeller.</summary>
public static class PostgresRowLock
{
    private static bool IsPostgres(YukleDbContext ctx) =>
        ctx.Database.IsRelational()
        && ctx.Database.ProviderName?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true;

    public static async Task LockLoadAsync(YukleDbContext ctx, Guid loadId, CancellationToken ct = default)
    {
        if (!IsPostgres(ctx)) return;
        await ctx.Database.ExecuteSqlRawAsync(
            @"SELECT ""Id"" FROM ""Loads"" WHERE ""Id"" = {0} FOR UPDATE", [loadId], ct);
    }

    public static async Task LockPaymentForLoadAsync(YukleDbContext ctx, Guid loadId, CancellationToken ct = default)
    {
        if (!IsPostgres(ctx)) return;
        await ctx.Database.ExecuteSqlRawAsync(
            @"SELECT ""Id"" FROM ""PaymentTransactions"" WHERE ""LoadId"" = {0} FOR UPDATE", [loadId], ct);
    }
}
