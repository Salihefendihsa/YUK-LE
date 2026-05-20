using System;

namespace Yukle.Api.Models;

public class WalletAuditLog
{
    public long Id { get; set; }
    public int UserId { get; set; }
    public Guid LoadId { get; set; }
    public decimal Amount { get; set; }
    public WalletAuditLogType Type { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
