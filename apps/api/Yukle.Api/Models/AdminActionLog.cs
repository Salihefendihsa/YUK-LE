using System;

namespace Yukle.Api.Models;

/// <summary>
/// <b>v2.5.7 — Admin Denetim İzleri (Audit Log)</b>
/// <para>
/// Yapay zeka tarafından PendingReview (Gri Alan) statüsüne düşen başvuruların
/// adminler tarafından manuel incelenmesi sonucunda alınan aksiyonları kayıt altına alır.
/// KVKK ve sistem güvenliği gereği her işlem, kimin kimi ne zaman onayladığı detaylarıyla saklanır.
/// </para>
/// </summary>
public class AdminActionLog
{
    public int Id { get; set; }

    /// <summary>
    /// İşlemi gerçekleştiren Admin kullanıcısının Id'si
    /// </summary>
    public int AdminId { get; set; }
    public User Admin { get; set; } = null!;

    /// <summary>
    /// İşlem yapılan (Onaylanan/Reddedilen) kullanıcının Id'si
    /// </summary>
    public int TargetUserId { get; set; }
    public User TargetUser { get; set; } = null!;

    /// <summary>
    /// İşlem türü. Örn: "Approve", "Reject"
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Adminin işlemi yaparken girdiği manuel not. 
    /// (Reddedildiyse zorunlu olabilir)
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// İşlemin gerçekleştiği zaman (UTC)
    /// </summary>
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}
