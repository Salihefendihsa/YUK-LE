using System;

namespace Yukle.Api.Models;

public enum OutboxStatus
{
    Pending,
    Sent,
    Failed
}

/// <summary>
/// <b>Faz 4.3 — U-ETDS Outbox Pattern</b>
/// Bakanlık API'sindeki kesintilere karşı yasal bildirimleri güvenceye almak için kullanılır.
/// </summary>
public class UetdsOutbox
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid LoadId { get; set; }
    
    // Foreign key ilişkisine katı girmeyebiliriz, çünkü asenkron gönderim esnasında Load silinmiş dahi olsa bakanlığa log düşmeli.
    // Ancak veri tiplendirmesi için entity tanımında tutabiliriz (Restrict yapmalıyız).
    public Load Load { get; set; } = null!;

    /// <summary>U-ETDS servisine gönderilecek faydalı yük (JSON formatında)</summary>
    public string Payload { get; set; } = string.Empty;

    public OutboxStatus Status { get; set; } = OutboxStatus.Pending;

    public int RetryCount { get; set; } = 0;

    public string? LastErrorMessage { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ProcessedAt { get; set; }
}
