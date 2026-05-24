namespace Yukle.Api.Services;

public static class WalletRefundAudit
{
  public const string CustomerRefundReasonPrefix = "Iptal/Iade REFUND load=";
  public const string HoldReversalReasonPrefix   = "Iptal/Iade hold reversal";
  public const string CommissionReversalSuffix   = "commission reversal (iptal)";

  public static string CustomerRefundReason(Guid loadId) => $"{CustomerRefundReasonPrefix}{loadId}";
}
