namespace Yukle.Api.Models;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LoadId { get; set; }
    public int SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsBlocked { get; set; } = false;
    public string? BlockReason { get; set; }
    public DateTime? BlockedAt { get; set; }
}
