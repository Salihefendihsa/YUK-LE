namespace Yukle.Api.Services;

public static class WalletRefundAudit
{
  public const string CustomerRefundReasonPrefix = "Iptal/Iade REFUND load=";
  public const string HoldReversalReasonPrefix   = "İptal veya iade — bekleyen tutar iptali";
  public const string CommissionReversalSuffix   = "komisyon iadesi (iptal)";

  public static string CustomerRefundReason(Guid loadId) => $"{CustomerRefundReasonPrefix}{loadId}";
}
