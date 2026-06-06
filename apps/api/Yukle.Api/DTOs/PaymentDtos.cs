namespace Yukle.Api.DTOs;

/// <summary>
/// Bir yüke ait emanet (escrow) ödeme bilgisi. Mevcut <c>PaymentTransaction</c> +
/// komisyon hesaplayıcıdan TÜRETİLİR (yeni tablo yok). Komisyon şeffaflığı için
/// brüt/komisyon/net kalemlerini taşır.
/// </summary>
public class PaymentInfoDto
{
    public Guid     LoadId           { get; set; }
    public int      CustomerId       { get; set; }
    public int?     DriverId         { get; set; }

    /// <summary>Brüt navlun (kabul edilen teklif tutarı).</summary>
    public decimal  GrossAmount      { get; set; }

    /// <summary>Müşterinin ödediği toplam (brüt + müşteri komisyonu) — emanete alınan.</summary>
    public decimal  CustomerTotal    { get; set; }

    /// <summary>Toplam platform komisyon oranı (şoför + müşteri), ör. 0.04 = %4.</summary>
    public decimal  CommissionRate   { get; set; }

    /// <summary>Toplam platform komisyon tutarı (platform geliri = müşteri payı + şoför payı).</summary>
    public decimal  CommissionAmount { get; set; }

    /// <summary>Müşteri hizmet bedeli (brüt üzerine eklenen pay).</summary>
    public decimal  CustomerCommission { get; set; }
    public decimal  CustomerCommissionRate { get; set; }

    /// <summary>Şoför komisyonu (brütten kesilen pay).</summary>
    public decimal  DriverCommission { get; set; }
    public decimal  DriverCommissionRate { get; set; }

    /// <summary>Stopaj/vergi kesintisi (varsa).</summary>
    public decimal  Withholding      { get; set; }

    /// <summary>Şoföre aktarılan net tutar.</summary>
    public decimal  NetAmount        { get; set; }

    /// <summary>Held (emanette) | Released (ödendi) | Refunded (iade).</summary>
    public string   Status           { get; set; } = string.Empty;

    public DateTime CreatedAt        { get; set; }
    public DateTime? ReleasedAt      { get; set; }
}

/// <summary>Admin gelir özeti (toplam platform komisyonu / emanetteki tutar).</summary>
public class PaymentRevenueSummaryDto
{
    public decimal TotalPlatformRevenue { get; set; } // serbest bırakılan ödemelerden komisyon
    public decimal HeldEscrowTotal      { get; set; } // emanette bekleyen müşteri toplamı
    public decimal ReleasedGrossTotal   { get; set; } // teslim edilip ödenen brüt toplam
    public int     HeldCount            { get; set; }
    public int     ReleasedCount        { get; set; }
}
