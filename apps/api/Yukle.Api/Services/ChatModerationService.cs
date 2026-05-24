using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;

namespace Yukle.Api.Services;

public sealed record BlockedMessageRecord(
    string SenderId,
    string SenderName,
    string LoadId,
    string Message,
    DateTime TimestampUtc);

public interface IChatModerationService
{
    bool ContainsBlockedContent(string message);
    Task<IReadOnlyList<BlockedMessageRecord>> GetBlockedMessagesAsync(
        int take = 200,
        CancellationToken cancellationToken = default);
}

public sealed class ChatModerationService(YukleDbContext context) : IChatModerationService
{
    private static readonly string[] BlockedTerms =
    [
        "salak", "aptal", "gerizekalı", "geri zekalı", "it", "eşek", "pislik",
        "seni gebertirim", "öldürürüm", "tehdit", "ırkçı", "hain", "şerefsiz",
        "hakaret", "ulan", "lan", "manyak", "defol", "rezil"
    ];

    public bool ContainsBlockedContent(string message)
    {
        if (string.IsNullOrWhiteSpace(message)) return false;

        var normalized = message.ToLowerInvariant();
        return BlockedTerms.Any(term => normalized.Contains(term, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<IReadOnlyList<BlockedMessageRecord>> GetBlockedMessagesAsync(
        int take = 200,
        CancellationToken cancellationToken = default)
    {
        var rows = await context.ChatMessages
            .AsNoTracking()
            .Where(m => m.IsBlocked)
            .OrderByDescending(m => m.BlockedAt ?? m.CreatedAt)
            .Take(take)
            .Select(m => new BlockedMessageRecord(
                m.SenderUserId.ToString(),
                m.SenderName,
                m.LoadId.ToString(),
                m.Message,
                m.BlockedAt ?? m.CreatedAt))
            .ToListAsync(cancellationToken);

        return rows;
    }
}
