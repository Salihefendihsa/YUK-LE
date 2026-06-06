using Yukle.Api.Models;

namespace Yukle.Api.DTOs;

// ── İstek (request) gövdeleri ────────────────────────────────────────────────

/// <summary>Yeni destek talebi açma (ilk kullanıcı mesajı).</summary>
public class CreateSupportTicketDto
{
    /// <summary>Opsiyonel başlık; boşsa ilk mesajdan türetilir.</summary>
    public string? Subject { get; set; }

    /// <summary>Kullanıcının ilk mesajı (zorunlu).</summary>
    public string Message { get; set; } = string.Empty;
}

/// <summary>Mevcut bir talebe mesaj ekleme (kullanıcı veya admin).</summary>
public class CreateSupportMessageDto
{
    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// Admin talebin durumunu günceller (Resolved/Closed vb.).
/// Status, enum adı (örn. "Resolved") veya sayısal değer olarak kabul edilir —
/// MVC'de global string-enum converter olmadığı için string alınıp parse edilir.
/// </summary>
public class UpdateSupportStatusDto
{
    public string Status { get; set; } = string.Empty;
}

// ── Yanıt (response) gövdeleri ───────────────────────────────────────────────

public class SupportMessageDto
{
    public Guid   Id         { get; set; }
    public int    SenderId   { get; set; }
    public string SenderRole { get; set; } = string.Empty; // "User" | "Admin" | "AI"
    public string SenderName { get; set; } = string.Empty;
    public string Content    { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>Talep özeti (liste görünümü).</summary>
public class SupportTicketSummaryDto
{
    public Guid     Id            { get; set; }
    public int      UserId        { get; set; }
    public string   UserName      { get; set; } = string.Empty;
    public string   Subject       { get; set; } = string.Empty;
    public string   Status        { get; set; } = string.Empty; // enum adı
    public DateTime CreatedAt     { get; set; }
    public DateTime LastMessageAt { get; set; }
    public DateTime SlaDeadline   { get; set; }
    public bool     IsOverdue     { get; set; }
    public string?  LastMessagePreview { get; set; }
    public int      MessageCount  { get; set; }
}

/// <summary>Talep detayı (tam thread).</summary>
public class SupportTicketDetailDto
{
    public Guid     Id            { get; set; }
    public int      UserId        { get; set; }
    public string   UserName      { get; set; } = string.Empty;
    public string   Subject       { get; set; } = string.Empty;
    public string   Status        { get; set; } = string.Empty;
    public DateTime CreatedAt     { get; set; }
    public DateTime LastMessageAt { get; set; }
    public DateTime SlaDeadline   { get; set; }
    public bool     IsOverdue     { get; set; }
    public List<SupportMessageDto> Messages { get; set; } = new();
}
