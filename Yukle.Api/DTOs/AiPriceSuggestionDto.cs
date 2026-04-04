namespace Yukle.Api.DTOs;

/// <summary>
/// Gemini AI'ın lojistik parametrelerine göre ürettiği navlun fiyat önerisi.
/// <para>
/// Temel fiyat alanlarına ek olarak, şoförün ekranında gösterilecek detaylı
/// maliyet dökümü içerir: yakıt, otoyol/köprü, amortisman ve net kazanç.
/// </para>
/// <para>
/// <b>Kural</b>: <c>FuelCost + TollCost + AmortizationCost + EstimatedNetProfit ≈ RecommendedPrice</c>
/// </para>
/// Kaynak: <c>GeminiServiceClient.CalculateFairPriceAsync</c> veya
/// <c>GeminiServiceClient.FallbackPriceSuggestion</c>.
/// </summary>
public sealed record AiPriceSuggestionDto(
    /// <summary>Gemini'nin önerdiği "Adil Navlun" orta noktası (TL).</summary>
    decimal RecommendedPrice,

    /// <summary>Şoförün "ancak kurtardığı" kırmızı çizgi — MinPrice ≥ Yakıt × 1.40 (TL).</summary>
    decimal MinPrice,

    /// <summary>Piyasanın kabul edebileceği tavan fiyat — MaxPrice ≤ Recommended × 1.20 (TL).</summary>
    decimal MaxPrice,

    /// <summary>
    /// Gemini'nin şoföre doğrudan hitap eden analiz metni.
    /// Yakıt payı, zorluk payı ve net kazanç gerekçesini içerir.
    /// Fallback durumunda matematiksel formül özeti döner.
    /// </summary>
    string  Reasoning,

    // ── Maliyet Dökümü (şoför kartı için) ────────────────────────────────────

    /// <summary>Toplam tahmini yakıt gideri (TL). Hesap: Mesafe × Tüketim/100 × Yakıt Fiyatı.</summary>
    decimal FuelCost           = 0m,

    /// <summary>Tahmini otoyol ve köprü masrafları (TL). Türkiye 2026 tarife tahmini.</summary>
    decimal TollCost           = 0m,

    /// <summary>Tahmini araç yıpranma payı / amortisman (TL). Araç tipine göre TL/km × Mesafe.</summary>
    decimal AmortizationCost   = 0m,

    /// <summary>
    /// Şoförün cebine kalacak tahmini net kazanç (TL).
    /// Hesap: RecommendedPrice - FuelCost - TollCost - AmortizationCost.
    /// </summary>
    decimal EstimatedNetProfit = 0m
);
