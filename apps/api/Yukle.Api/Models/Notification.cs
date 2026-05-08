using System;

namespace Yukle.Api.Models;

/// <summary>
/// Uygulama içi bildirim kaydı. İleride SignalR veya push ile gerçek zamanlı
/// iletilebilir; şimdilik DB'ye yazılır ve kullanıcı polling ile okur.
/// </summary>
public class Notification
{
    public int      Id        { get; set; }

    public int      UserId    { get; set; }
    public User     User      { get; set; } = null!;

    public string   Title     { get; set; } = string.Empty;
    public string   Message   { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.System;
    public Guid? RelatedEntityId { get; set; }

    public bool     IsRead    { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum NotificationType
{
    Load = 0,
    Bid = 1,
    Payment = 2,
    System = 3,
    Document = 4,
    Proximity = 5
}
