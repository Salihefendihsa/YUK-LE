using System.Collections.Concurrent;

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
    void AddBlockedMessage(BlockedMessageRecord record);
    IReadOnlyList<BlockedMessageRecord> GetBlockedMessages(int take = 200);
}

public sealed class ChatModerationService : IChatModerationService
{
    private readonly ConcurrentQueue<BlockedMessageRecord> _blockedMessages = new();

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

    public void AddBlockedMessage(BlockedMessageRecord record)
    {
        _blockedMessages.Enqueue(record);
        while (_blockedMessages.Count > 500)
            _blockedMessages.TryDequeue(out _);
    }

    public IReadOnlyList<BlockedMessageRecord> GetBlockedMessages(int take = 200)
        => _blockedMessages.Reverse().Take(take).ToList();
}
