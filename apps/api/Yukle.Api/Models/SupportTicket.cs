namespace Yukle.Api.Models;

/// <summary>
/// Destek talebi (ticket). Kullanıcı AI botla çözemediği bir konuyu insan operatöre
/// (admin) aktardığında oluşturulur. Mesajlar <see cref="SupportMessage"/> içinde tutulur.
/// </summary>
public class SupportTicket
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Talebi açan kullanıcı (User.Id). Müşteri veya şoför olabilir.</summary>
    public int UserId { get; set; }

    public string Subject { get; set; } = string.Empty;

    public SupportTicketStatus Status { get; set; } = SupportTicketStatus.Open;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Threade en son mesaj eklendiği an — admin sıralaması/sortlama için.</summary>
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

    /// <summary>SLA hedefi: <c>CreatedAt + 24h</c>. Geçilmişse "gecikmiş" sayılır.</summary>
    public DateTime SlaDeadline { get; set; } = DateTime.UtcNow.AddHours(24);

    public List<SupportMessage> Messages { get; set; } = new();
}

/// <summary>
/// Destek talebi yaşam döngüsü. Veritabanında integer olarak saklanır — üyeler
/// silinmez/yeniden sıralanmaz, yeni üyeler yalnızca sona eklenir.
/// </summary>
public enum SupportTicketStatus
{
    /// <summary>Açık — kullanıcı yanıt bekliyor (admin aksiyonu gerekli).</summary>
    Open = 0,

    /// <summary>Yanıtlandı — admin/operatör cevap verdi.</summary>
    Answered = 1,

    /// <summary>Çözüldü.</summary>
    Resolved = 2,

    /// <summary>Kapatıldı.</summary>
    Closed = 3
}
