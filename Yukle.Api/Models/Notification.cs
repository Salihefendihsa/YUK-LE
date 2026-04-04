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

    public bool     IsRead    { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
