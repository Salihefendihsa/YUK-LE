namespace Yukle.Api.Models;

/// <summary>
/// Il bazli guncel yakit birim fiyati (plaka kodu anahtar).
/// </summary>
public class FuelPrice
{
    public int      Id        { get; set; }

    /// <summary>Il plaka kodu (01-81) — fiyatlandirma join anahtari.</summary>
    public int?     PlateCode { get; set; }

    /// <summary>Turkiye il adi (goruntuleme / geriye donuk uyumluluk).</summary>
    public string   City      { get; set; } = string.Empty;

    /// <summary>Litre veya kWh basina fiyat (TL) — Amount.</summary>
    public decimal  PriceTL   { get; set; }

    /// <summary>Yakıt türü: Motorin (mazot), Benzin veya LPG.</summary>
    public FuelType FuelType  { get; set; } = FuelType.Motorin;

    /// <summary>Fiyatın geçerli olduğu tarih (UTC gün bazlı).</summary>
    public DateOnly Date      { get; set; }

    /// <summary>Kaydın DB'ye yazıldığı zaman damgası (UTC).</summary>
    public DateTime FetchedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Verinin kaynağı: "CollectAPI", "Manual", "Cache" vb.</summary>
    public string   Source    { get; set; } = string.Empty;
}
