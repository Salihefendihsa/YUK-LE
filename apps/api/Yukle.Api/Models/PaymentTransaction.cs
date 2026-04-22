using System;

namespace Yukle.Api.Models;

public enum PaymentStatus
{
    Pending,
    Blocked,
    Released,
    Refunded,
    Failed
}

/// <summary>
/// <b>Faz 4.1 — İyzico (Mock) Escrow Takibi</b>
/// </summary>
public class PaymentTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Ödemenin ait olduğu yük ilanı</summary>
    public Guid LoadId { get; set; }
    public Load Load { get; set; } = null!;

    /// <summary>İyzico veya Mock servisten dönen dış işlem numarası</summary>
    public string TransactionId { get; set; } = string.Empty;

    /// <summary>Bloke edilen toplam tutar</summary>
    public decimal Amount { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
