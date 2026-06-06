namespace Yukle.Api.Models;

/// <summary>
/// Bir destek talebine ait tek mesaj. Gönderen; kullanıcı, admin veya AI bot olabilir
/// (<see cref="SupportSenderRole"/>). AI ve admin mesajları aynı thread içinde akar.
/// </summary>
public class SupportMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TicketId { get; set; }
    public SupportTicket Ticket { get; set; } = null!;

    /// <summary>Gönderen User.Id. AI/sistem mesajlarında 0 olur.</summary>
    public int SenderId { get; set; }

    public SupportSenderRole SenderRole { get; set; } = SupportSenderRole.User;

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Mesajı gönderen taraf. Veritabanında integer olarak saklanır — üyeler
/// silinmez/yeniden sıralanmaz, yeni üyeler yalnızca sona eklenir.
/// </summary>
public enum SupportSenderRole
{
    /// <summary>Talebi açan kullanıcı.</summary>
    User = 0,

    /// <summary>İnsan operatör (admin).</summary>
    Admin = 1,

    /// <summary>Gemini tabanlı yapay zeka asistanı.</summary>
    AI = 2
}
