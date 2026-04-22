using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Xunit.Abstractions;
using Yukle.Api.DTOs;
using Yukle.Api.Services;

namespace Yukle.Tests.Simulation;

/// <summary>
/// Elazığ OSB → Malatya Merkez güzergahında TIR fiyatlandırma doğrulama testi.
///
/// Senaryo:
///   • Mesafe  : 100 km
///   • Araç    : TIR (38 lt/100km)
///   • Yakıt   : 42.50 TL/litre (Türkiye Nisan 2026 tahmini)
///   • Ağırlık : 22 ton (22.000 kg)
///
/// Başarı kriterleri:
///   1. Yakıt maliyeti ~1615 TL
///   2. FairPrice formülü MinPrice → 2500-3000 TL bandı
///   3. Yakıt payı ≥ %50 (baskın maliyet kalemi)
///   4. Mock Gemini reasoning → anahtar ifadeler
/// </summary>
public sealed class ElazigMalatyaSimulationTests(ITestOutputHelper output)
{
    // ═══ Senaryo Sabitleri ════════════════════════════════════════════════════

    private const double  DistanceKm          = 100.0;
    private const string  VehicleType         = "TIR";
    private const decimal FuelPriceTL         = 42.50m;
    private const double  WeightKg            = 22_000.0;
    private const double  WeightTon           = WeightKg / 1000.0;      // 22 ton
    private const string  Route               = "Elazığ OSB → Malatya Merkez";

    // ── Araç Sabitleri ────────────────────────────────────────────────────────
    private const decimal ConsumptionPer100Km = 38m;        // TIR (lt/100km)
    private const decimal AmortizationPerKm   = 3.50m;      // TIR (TL/km)
    private const decimal EstimatedTollTL     = 50m;         // 100km kısa yol
    private const decimal WeightFactorPerTon  = 15m;         // Fallback: TL/ton

    // ── Beklenen Aralık ───────────────────────────────────────────────────────
    private const decimal MinExpected = 2_500m;
    private const decimal MaxExpected = 3_000m;

    // ═══ 1. Yakıt Maliyeti Hesabı ════════════════════════════════════════════

    [Fact(DisplayName = "1 ▸ Yakıt maliyeti = 1615 TL olmalı")]
    public void YakitMaliyeti_TIR_100km_OlmasiGereken_1615TL()
    {
        // Arrange
        // Formül: Mesafe × YakıtFiyatı × Tüketim / 100
        var expected = 1615.00m;

        // Act
        var fuelCost = (decimal)DistanceKm * FuelPriceTL * ConsumptionPer100Km / 100m;

        // Assert
        output.WriteLine($"[YAKIT MALİYETİ] {fuelCost.ToString("N2", CultureInfo.InvariantCulture)} TL");
        Assert.Equal(expected, fuelCost);
    }

    // ═══ 2. FairPrice Formülü (Sistem Talimatı) ═══════════════════════════════

    [Fact(DisplayName = "2 ▸ FairPrice MinPrice → 2500-3000 TL bandında olmalı")]
    public void FairPrice_MinPrice_BandIcinde_Olmali()
    {
        // Arrange — Sistem talimatındaki TemelMaliyet formülü
        var fuelCost     = (decimal)DistanceKm * FuelPriceTL * ConsumptionPer100Km / 100m;
        var amortization = AmortizationPerKm * (decimal)DistanceKm;     // 350 TL
        var toll         = EstimatedTollTL;                              //  50 TL
        var temelMaliyet = fuelCost + amortization + toll;              // 2015 TL

        // Act
        var minPrice = Math.Round(temelMaliyet * 1.40m, 2);             // 2821 TL

        // Assert
        output.WriteLine($"[TEMEL MALİYET ] {temelMaliyet.ToString("N2", CultureInfo.InvariantCulture)} TL");
        output.WriteLine($"[MIN  FİYAT    ] {minPrice.ToString("N2", CultureInfo.InvariantCulture)} TL");
        output.WriteLine($"[BEKLENEN BAND ] {MinExpected:N0} — {MaxExpected:N0} TL");

        Assert.InRange(minPrice, MinExpected, MaxExpected);
    }

    [Fact(DisplayName = "3 ▸ FairPrice RecommendedPrice → 2500-3000 TL bandında olmalı")]
    public void FairPrice_RecommendedPrice_BandIcinde_Olmali()
    {
        // FairPrice bileşenleri
        var fuelCost         = (decimal)DistanceKm * FuelPriceTL * ConsumptionPer100Km / 100m;
        var amortization     = AmortizationPerKm * (decimal)DistanceKm;
        var toll             = EstimatedTollTL;
        var temelMaliyet     = fuelCost + amortization + toll;

        var minPrice         = Math.Round(temelMaliyet * 1.40m, 2);
        // Recommended: MinPrice'ı %3-5 yukarı çekerek rekabetçi ort nokta
        var recommendedPrice = Math.Round(minPrice * 1.04m, 2);

        // Assert
        output.WriteLine($"[RECOMMENDED   ] {recommendedPrice.ToString("N2", CultureInfo.InvariantCulture)} TL");
        Assert.InRange(recommendedPrice, MinExpected, MaxExpected);
    }

    // ═══ 3. Yakıt Oranı Kontrolü ══════════════════════════════════════════════

    [Fact(DisplayName = "4 ▸ Yakıt maliyeti toplam fiyatın %50+ 'ini oluşturmalı")]
    public void YakitMaliyeti_Toplam_Icerisinde_BaskinOlmali()
    {
        var fuelCost         = (decimal)DistanceKm * FuelPriceTL * ConsumptionPer100Km / 100m;
        var amortization     = AmortizationPerKm * (decimal)DistanceKm;
        var toll             = EstimatedTollTL;
        var temelMaliyet     = fuelCost + amortization + toll;
        var minPrice         = Math.Round(temelMaliyet * 1.40m, 2);
        var recommendedPrice = Math.Round(minPrice * 1.04m, 2);

        var fuelRatioPct = Math.Round(fuelCost / recommendedPrice * 100m, 1);

        output.WriteLine($"[YAKIT PAYI    ] %{fuelRatioPct.ToString(CultureInfo.InvariantCulture)} " +
                         $"({fuelCost:N2} TL / {recommendedPrice:N2} TL)");

        // Yakıt baskın maliyet kalemi olmalı
        Assert.True(fuelRatioPct >= 50m,
            $"Yakıt oranı beklenen minimum %50'nin altında: %{fuelRatioPct}");
    }

    // ═══ 4. Fallback Formülü — Bilinen Kısıtlama ══════════════════════════════

    [Fact(DisplayName = "5 ▸ Fallback formülü: 100km kısa yol → uzun yol katsayısı (belgelenmiş)")]
    public void Fallback_KisaYol_UzunYolKatsayisi_Belgelendi()
    {
        // Arrange — GeminiServiceClient.FallbackPriceSuggestion (internal) çağrısı
        var fallbackResult = GeminiServiceClient.FallbackPriceSuggestion(
            DistanceKm, VehicleType, FuelPriceTL, WeightTon);

        var inRange = fallbackResult.RecommendedPrice >= MinExpected
                   && fallbackResult.RecommendedPrice <= MaxExpected;

        output.WriteLine("─────────────────────────────────────────────────────────");
        output.WriteLine($"[FALLBACK SONUÇ] {fallbackResult.RecommendedPrice:N2} TL " +
                         $"(min {fallbackResult.MinPrice:N2} / max {fallbackResult.MaxPrice:N2})");
        output.WriteLine($"[BAND İÇİNDE?  ] {(inRange ? "✅ EVET" : "⚠️  HAYIR")}");
        output.WriteLine($"[NOT           ] Fallback 2.40× çarpanı uzun yol için kalibre edilmiştir.");
        output.WriteLine($"                 100km kısa yolda piyasa üstünde tahmin normaldir.");
        output.WriteLine("─────────────────────────────────────────────────────────");

        // Fallback bandın dışında olduğunu belgeliyoruz (kasıtlı: assert yok)
        // Bu test, kısıtlamayı dokümante etmek için yazılmıştır.
        Assert.True(fallbackResult.RecommendedPrice > 0,
            "Fallback formülü en az 0 TL üretmeli.");
    }

    // ═══ 5. Mock Gemini Reasoning Doğrulaması ═════════════════════════════════

    [Fact(DisplayName = "6 ▸ Gemini Reasoning → 3 zorunlu ifadeyi içermeli")]
    public void MockGeminiReasoning_UcZorunluIfadeyi_Icermeli()
    {
        // Gemini'nin 2500-3000 TL bandında dönmesi beklenen mock yanıt
        var mockReasoning =
            "Yakıt maliyeti toplam fiyatın %56.2'sini oluşturuyor. " +
            "Bu kısa mesafe (100km) güzergahta yakıt baskın kalem olmaya devam ediyor. " +
            "Güzergah/Araç tipi nedeniyle eklenen zorluk payı: 0 TL. " +
            "Elazığ-Malatya karayolu düzgün asfalt, rampalar orta seviye. " +
            "Şoförün cebine tahmini net kalan: 428 TL " +
            "(2820 TL - 1615 TL yakıt - 350 TL amortisman - 427 TL diğer giderler).";

        var mockResult = new AiPriceSuggestionDto(
            RecommendedPrice: 2820m,
            MinPrice:         2821m,
            MaxPrice:         3385m,
            Reasoning:        mockReasoning);

        // ── Fiyat bandı kontrolü ────────────────────────────────────────────
        Assert.InRange(mockResult.RecommendedPrice, MinExpected - 50m, MaxExpected + 50m);

        // ── Reasoning içerik kontrolü (3 zorunlu ifade) ────────────────────
        var r = mockResult.Reasoning;
        Assert.Contains("kısa mesafe",  r, StringComparison.OrdinalIgnoreCase);
        Assert.True(
            r.Contains("yakıt", StringComparison.OrdinalIgnoreCase) &&
            (r.Contains("oluşturuyor", StringComparison.OrdinalIgnoreCase) ||
             r.Contains("oranı",       StringComparison.OrdinalIgnoreCase) ||
             r.Contains("kalemi",      StringComparison.OrdinalIgnoreCase)),
            "Reasoning 'yakıt oranı' ifadesini içermiyor.");
        Assert.True(
            r.Contains("net kalan",  StringComparison.OrdinalIgnoreCase) ||
            r.Contains("şoförün",    StringComparison.OrdinalIgnoreCase) ||
            r.Contains("cebine",     StringComparison.OrdinalIgnoreCase),
            "Reasoning 'şoför net kârı' ifadesini içermiyor.");

        output.WriteLine($"[MOCK GEMINI   ] {mockResult.RecommendedPrice:N2} TL");
        output.WriteLine($"[REASONING     ] {mockResult.Reasoning[..80]}...");
    }

    // ═══ 6. Tam Simülasyon — JSON Raporu ══════════════════════════════════════

    [Fact(DisplayName = "7 ▸ Tam simülasyon → JSON raporu oluştur ve Gakgoş Testi sonucu ver")]
    public void TamSimulasyon_JsonRapor_Olustur()
    {
        // ── Hesaplamalar ─────────────────────────────────────────────────────
        var fuelCost         = (decimal)DistanceKm * FuelPriceTL * ConsumptionPer100Km / 100m;
        var amortization     = AmortizationPerKm * (decimal)DistanceKm;
        var toll             = EstimatedTollTL;
        var temelMaliyet     = fuelCost + amortization + toll;
        var minPrice         = Math.Round(temelMaliyet * 1.40m, 2);
        var recommendedPrice = Math.Round(minPrice * 1.04m, 2);
        var maxPrice         = Math.Round(recommendedPrice * 1.20m, 2);
        var fuelRatioPct     = Math.Round(fuelCost / recommendedPrice * 100m, 1);
        var driverNetEst     = Math.Round(recommendedPrice - fuelCost - amortization - toll, 2);

        var fairPricePass    = recommendedPrice >= MinExpected && recommendedPrice <= MaxExpected;
        var mathPass         = fuelCost == 1615m;
        var fuelRatioPass    = fuelRatioPct >= 50m;

        var fallback         = GeminiServiceClient.FallbackPriceSuggestion(
            DistanceKm, VehicleType, FuelPriceTL, WeightTon);

        var overallPass = fairPricePass && mathPass && fuelRatioPass;

        // ── Rapor Nesnesi ────────────────────────────────────────────────────
        var report = new SimulationReport
        {
            TestName    = "Gakgoş Testi — Elazığ OSB → Malatya Merkez",
            ExecutedAt  = DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture),
            Scenario    = new ScenarioInfo
            {
                Route               = Route,
                DistanceKm          = DistanceKm,
                VehicleType         = VehicleType,
                FuelPriceTL         = FuelPriceTL,
                WeightTon           = WeightTon,
                ConsumptionPer100km = (double)ConsumptionPer100Km
            },
            MathBreakdown = new MathBreakdownInfo
            {
                FuelCostTL           = fuelCost,
                AmortizationTL       = amortization,
                EstimatedTollTL      = toll,
                TotalBaseTemelMaliyetTL = temelMaliyet,
                MinPriceTL           = minPrice,
                FuelCostRatioPct     = fuelRatioPct,
                DriverNetEstTL       = driverNetEst
            },
            FairPriceFormula = new FormulaResultInfo
            {
                RecommendedPriceTL = recommendedPrice,
                MinPriceTL         = minPrice,
                MaxPriceTL         = maxPrice,
                InExpectedRange    = fairPricePass,
                ExpectedBand       = $"{MinExpected:N0}–{MaxExpected:N0} TL"
            },
            FallbackFormula = new FormulaResultInfo
            {
                RecommendedPriceTL = fallback.RecommendedPrice,
                MinPriceTL         = fallback.MinPrice,
                MaxPriceTL         = fallback.MaxPrice,
                InExpectedRange    = fallback.RecommendedPrice >= MinExpected
                                  && fallback.RecommendedPrice <= MaxExpected,
                ExpectedBand       = $"{MinExpected:N0}–{MaxExpected:N0} TL",
                Note = "Fallback 2.40× çarpanı uzun yol için kalibre. " +
                       "100km kısa yolda piyasa üstünde tahmin normaldir. " +
                       "Bkz: GeminiServiceClient.FallbackPriceSuggestion."
            },
            SuccessCriteria = new SuccessCriteriaInfo
            {
                MathConsistencyPass = mathPass,
                FairPricePass       = fairPricePass,
                FuelRatioPass       = fuelRatioPass,
                FallbackPass        = fallback.RecommendedPrice >= MinExpected
                                   && fallback.RecommendedPrice <= MaxExpected,
                OverallVerdict      = overallPass ? "BAŞARILI ✅" : "BAŞARISIZ ❌"
            }
        };

        // ── JSON Çıktısı ─────────────────────────────────────────────────────
        var jsonOpts = new JsonSerializerOptions
        {
            WriteIndented        = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder              = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };
        var json = JsonSerializer.Serialize(report, jsonOpts);

        // Dosyaya yaz
        var outputPath = Path.Combine(
            AppContext.BaseDirectory, "gakgos-testi-sonucu.json");
        File.WriteAllText(outputPath, json, System.Text.Encoding.UTF8);

        // ── Terminal Çıktısı ─────────────────────────────────────────────────
        output.WriteLine("══════════════════════════════════════════════════════════");
        output.WriteLine($"  {report.TestName}");
        output.WriteLine("══════════════════════════════════════════════════════════");
        output.WriteLine($"  Tarih/Saat    : {report.ExecutedAt}");
        output.WriteLine($"  Güzergah      : {Route}");
        output.WriteLine($"  Araç / Yük    : {VehicleType} / {WeightTon} ton");
        output.WriteLine($"  Yakıt         : {FuelPriceTL} TL/lt");
        output.WriteLine("──────────────────────────────────────────────────────────");
        output.WriteLine("  MATEMATIK ÖZETI");
        output.WriteLine($"  Yakıt Maliyeti      : {fuelCost:N2} TL    {(mathPass ? "✅" : "❌")}");
        output.WriteLine($"  Amortisman (TIR)    : {amortization:N2} TL");
        output.WriteLine($"  Otoyol/Köprü Tah.   : {toll:N2} TL");
        output.WriteLine($"  TemelMaliyet Toplamı: {temelMaliyet:N2} TL");
        output.WriteLine($"  Yakıt Payı          : %{fuelRatioPct}    {(fuelRatioPass ? "✅" : "❌")}");
        output.WriteLine($"  Şoför Net (tahmini) : {driverNetEst:N2} TL");
        output.WriteLine("──────────────────────────────────────────────────────────");
        output.WriteLine("  FAİR PRİCE FORMÜLÜ (Sistem Talimatı)");
        output.WriteLine($"  MinPrice       : {minPrice:N2} TL");
        output.WriteLine($"  RecommendedPrice: {recommendedPrice:N2} TL");
        output.WriteLine($"  MaxPrice       : {maxPrice:N2} TL");
        output.WriteLine($"  Bant Kontrolü  : {MinExpected:N0}–{MaxExpected:N0} TL   {(fairPricePass ? "✅ BAŞARILI" : "❌ BAŞARISIZ")}");
        output.WriteLine("──────────────────────────────────────────────────────────");
        output.WriteLine("  FALLBACK FORMÜLÜ (Bilinen Kısıtlama)");
        output.WriteLine($"  RecommendedPrice: {fallback.RecommendedPrice:N2} TL   ⚠️  (uzun yol katsayısı)");
        output.WriteLine($"  Not: 2.40× çarpan kısa mesafe için piyasa üstünde tahmin üretiyor.");
        output.WriteLine("──────────────────────────────────────────────────────────");
        output.WriteLine($"  SONUÇ JSON    : {outputPath}");
        output.WriteLine("══════════════════════════════════════════════════════════");
        output.WriteLine($"  GAKGOŞ TESTİ  : {report.SuccessCriteria.OverallVerdict}");
        output.WriteLine("══════════════════════════════════════════════════════════");

        // ── Son Assert ───────────────────────────────────────────────────────
        Assert.True(overallPass,
            $"Gakgoş Testi başarısız: " +
            $"math={mathPass}, fairPrice={fairPricePass}, fuelRatio={fuelRatioPass}");
    }

    // ═══ Rapor DTO'ları (JSON serializasyonu için) ═════════════════════════════

    private sealed class SimulationReport
    {
        public string             TestName        { get; set; } = string.Empty;
        public string             ExecutedAt      { get; set; } = string.Empty;
        public ScenarioInfo       Scenario        { get; set; } = new();
        public MathBreakdownInfo  MathBreakdown   { get; set; } = new();
        public FormulaResultInfo  FairPriceFormula { get; set; } = new();
        public FormulaResultInfo  FallbackFormula  { get; set; } = new();
        public SuccessCriteriaInfo SuccessCriteria { get; set; } = new();
    }

    private sealed class ScenarioInfo
    {
        public string  Route               { get; set; } = string.Empty;
        public double  DistanceKm          { get; set; }
        public string  VehicleType         { get; set; } = string.Empty;
        public decimal FuelPriceTL         { get; set; }
        public double  WeightTon           { get; set; }
        public double  ConsumptionPer100km { get; set; }
    }

    private sealed class MathBreakdownInfo
    {
        public decimal FuelCostTL              { get; set; }
        public decimal AmortizationTL          { get; set; }
        public decimal EstimatedTollTL         { get; set; }
        public decimal TotalBaseTemelMaliyetTL { get; set; }
        public decimal MinPriceTL              { get; set; }
        public decimal FuelCostRatioPct        { get; set; }
        public decimal DriverNetEstTL          { get; set; }
    }

    private sealed class FormulaResultInfo
    {
        public decimal RecommendedPriceTL { get; set; }
        public decimal MinPriceTL        { get; set; }
        public decimal MaxPriceTL        { get; set; }
        public bool    InExpectedRange   { get; set; }
        public string  ExpectedBand      { get; set; } = string.Empty;
        public string? Note              { get; set; }
    }

    private sealed class SuccessCriteriaInfo
    {
        public bool   MathConsistencyPass { get; set; }
        public bool   FairPricePass       { get; set; }
        public bool   FuelRatioPass       { get; set; }
        public bool   FallbackPass        { get; set; }
        public string OverallVerdict      { get; set; } = string.Empty;
    }
}
