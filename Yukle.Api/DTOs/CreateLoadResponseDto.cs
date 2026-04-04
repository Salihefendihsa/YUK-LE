namespace Yukle.Api.DTOs;

/// <summary>
/// Yük oluşturma endpoint'inin (POST /api/loads) tam yanıtı.
/// Yük bilgilerinin yanı sıra Gemini tarafından belirlenen "Adil Navlun" analizini içerir.
/// </summary>
public sealed class CreateLoadResponseDto
{
    /// <summary>Oluşturulan yükün tam özet bilgisi (AI fiyat alanları dahil).</summary>
    public LoadListDto Load { get; init; } = null!;

    /// <summary>
    /// Gemini AI'ın hesapladığı "Adil Navlun" analizi.
    /// Polly fallback devredeyse matematiksel model sonucu burada gelir.
    /// </summary>
    public AiMarketAnalysisDto AiMarketAnalysis { get; init; } = null!;
}

/// <summary>
/// Yük ilanı kartına eklenen piyasa analizi özeti.
/// Kullanıcı arayüzünde "AI Piyasa Değeri" bölümü olarak gösterilmelidir.
/// </summary>
public sealed class AiMarketAnalysisDto
{
    /// <summary>Gemini'nin önerdiği orta nokta fiyat (TL).</summary>
    public decimal RecommendedPrice { get; init; }

    /// <summary>Şoförün "ancak kurtardığı" kırmızı çizgi (TL).</summary>
    public decimal MinPrice         { get; init; }

    /// <summary>Piyasanın kabul edebileceği tavan fiyat (TL).</summary>
    public decimal MaxPrice         { get; init; }

    /// <summary>Yakıt payı, zorluk payı ve şoför net karına dair Gemini analizi.</summary>
    public string  Reasoning        { get; init; } = string.Empty;

    /// <summary>Kullanılan karayolu mesafesi (km). OSRM veya Haversine hesabı.</summary>
    public double  DistanceKm       { get; init; }

    /// <summary>Kullanılan Motorin fiyatı (TL/lt). DB'den veya fallback sabitten.</summary>
    public decimal FuelPriceTl      { get; init; }

    /// <summary>
    /// True ise fiyat Gemini API'den; False ise matematiksel fallback modelinden geldi.
    /// </summary>
    public bool    IsAiGenerated    { get; init; }

    // ── Şoför Maliyet Dökümü ─────────────────────────────────────────────────

    /// <summary>Toplam tahmini yakıt gideri (TL).</summary>
    public decimal FuelCost           { get; init; }

    /// <summary>Tahmini otoyol ve köprü masrafları (TL).</summary>
    public decimal TollCost           { get; init; }

    /// <summary>Tahmini araç yıpranma payı / amortisman (TL).</summary>
    public decimal AmortizationCost   { get; init; }

    /// <summary>Şoförün cebine kalacak tahmini net kazanç (TL).</summary>
    public decimal EstimatedNetProfit { get; init; }
}
