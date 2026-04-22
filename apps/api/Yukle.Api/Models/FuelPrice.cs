namespace Yukle.Api.Models;

/// <summary>
/// İl bazlı günlük yakıt fiyat kaydı.
/// <c>FuelPriceUpdateWorker</c> tarafından her gün CollectAPI'dan çekilerek güncellenir.
/// </summary>
public class FuelPrice
{
    public int      Id        { get; set; }

    /// <summary>Türkiye il adı — Türkçe tam yazım (örn: "Elazığ", "Malatya").</summary>
    public string   City      { get; set; } = string.Empty;

    /// <summary>Litre başına fiyat (TL).</summary>
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
