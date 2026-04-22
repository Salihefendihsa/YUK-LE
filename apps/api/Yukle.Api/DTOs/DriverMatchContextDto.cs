namespace Yukle.Api.DTOs;

// ═════════════════════════════════════════════════════════════════════════════
// GIRDI: Gemini Smart Matching için şoför bağlamı
// ═════════════════════════════════════════════════════════════════════════════

/// <summary>
/// <c>AnalyzeDriverMatchAsync</c> metoduna gönderilen tam bağlam.
/// Şoförün kimliği, aracı, geçmiş rotaları ve eşleştirilecek aday yükler burada toplanır.
/// </summary>
public sealed class DriverMatchContextDto
{
    /// <summary>Şoförün adı soyadı — Gemini'nin samimi hitabı için.</summary>
    public string DriverName        { get; set; } = string.Empty;

    /// <summary>Aktif araç tipi (TIR, Kamyon, Kamyonet, Panelvan).</summary>
    public string VehicleType       { get; set; } = string.Empty;

    /// <summary>Araç kapasitesi (ton). Yük ağırlığı uyum kontrolü için kullanılır.</summary>
    public double VehicleCapacityTon{ get; set; }

    /// <summary>
    /// True ise şoförün teslim edilmiş yük geçmişi yok.
    /// Gemini'ye fallback talimatı verilir; matematiksel fallback da bu flagi kullanır.
    /// </summary>
    public bool IsNewDriver         { get; set; }

    /// <summary>Son 10 başarıyla teslim edilmiş yükün rotası ve türü.</summary>
    public List<DriverRouteHistoryItem> RecentRoutes  { get; set; } = [];

    /// <summary>Şoföre önerilecek aktif yük ilanları (max 15 aday).</summary>
    public List<CandidateLoadItem>      CandidateLoads{ get; set; } = [];
}

/// <summary>Bir teslim edilmiş yükün özet rota ve tip bilgisi.</summary>
public sealed class DriverRouteHistoryItem
{
    public string   FromCity     { get; set; } = string.Empty;
    public string   ToCity       { get; set; } = string.Empty;
    /// <summary>Yük türü (Paletli, Dökme, SoğukZincir, TehlikeliMadde, Parsiyel).</summary>
    public string   LoadType     { get; set; } = string.Empty;
    /// <summary>İlgili yükü taşıdığında kullandığı araç tipi.</summary>
    public string   VehicleType  { get; set; } = string.Empty;
    public DateTime CompletedAt  { get; set; }
}

/// <summary>Gemini'ye gönderilecek aday yük özeti. Gerçek Guid yerine kısa anahtar kullanılır.</summary>
public sealed class CandidateLoadItem
{
    /// <summary>Gemini'nin yanıtta kullanacağı kısa anahtar (örn: "l1", "l2").</summary>
    public string  Key                  { get; set; } = string.Empty;

    /// <summary>Gerçek yük ID'si — key-GUID eşlemesi controller'da tutulur.</summary>
    public Guid    LoadId               { get; set; }
    public string  FromCity             { get; set; } = string.Empty;
    public string  ToCity               { get; set; } = string.Empty;
    public string  LoadType             { get; set; } = string.Empty;
    public string  RequiredVehicleType  { get; set; } = string.Empty;
    public double  WeightTon            { get; set; }
    public double  DistanceKm           { get; set; }
    public decimal Price                { get; set; }
    public decimal AiSuggestedPrice     { get; set; }
}

// ═════════════════════════════════════════════════════════════════════════════
// ÇIKTI: Gemini Smart Matching sonucu (tek yük için)
// ═════════════════════════════════════════════════════════════════════════════

/// <summary>
/// Gemini'nin bir aday yük için ürettiği eşleşme analizi.
/// </summary>
public sealed class DriverMatchResultDto
{
    /// <summary>Eşleştirilen yükün ID'si.</summary>
    public Guid   LoadId              { get; set; }

    /// <summary>0–100 arası uyumluluk puanı. ≥80: Yüksek, 50–79: Orta, <50: Normal.</summary>
    public int    MatchScore          { get; set; }

    /// <summary>
    /// Gemini'nin şoföre doğrudan "Aga" diye hitap ederek yazdığı kişiselleştirilmiş gerekçe.
    /// Yeni şoförler için motivasyon mesajı içerir.
    /// </summary>
    public string PersonalizedReason  { get; set; } = string.Empty;

    /// <summary>Görsel öncelik etiketi: "Yüksek", "Orta" veya "Normal".</summary>
    public string PriorityTag         { get; set; } = "Normal";

    /// <summary>True ise analiz Gemini'den, False ise matematiksel fallback'ten geldi.</summary>
    public bool   IsAiGenerated       { get; set; } = true;
}

// ═════════════════════════════════════════════════════════════════════════════
// BİRLEŞİK YANIT: Şoföre dönen yük + eşleşme analizi çifti
// ═════════════════════════════════════════════════════════════════════════════

/// <summary>
/// Matching endpoint'inin tek satır yanıtı.
/// Yük bilgisi ve Gemini analizi birlikte sunulur — istemci tekrar API çağırmaz.
/// </summary>
public sealed class LoadWithMatchDto
{
    public LoadListDto         Load  { get; set; } = null!;
    public DriverMatchResultDto Match { get; set; } = null!;
}
