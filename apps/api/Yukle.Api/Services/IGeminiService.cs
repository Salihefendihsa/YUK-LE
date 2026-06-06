using Yukle.Api.DTOs;

namespace Yukle.Api.Services;

/// <summary>
/// Gemini Generative AI API ile iletişim kuran servisin sözleşmesi.
/// Testlerde mock edilebilir, üretimde <see cref="GeminiServiceClient"/> tarafından karşılanır.
/// </summary>
public interface IGeminiService
{
    // ── Fiyat Analizi ─────────────────────────────────────────────────────────

    /// <summary>
    /// Structured-prompting ile Gemini Flash modelinden "Adil Navlun Fiyatı" hesaplar.
    /// Prompt, şoför kâr marjı (%40 alt sınır) ve piyasa tavanı (%20 üst sınır) kısıtlarını içerir.
    /// </summary>
    /// <param name="distance">Km cinsinden mesafe.</param>
    /// <param name="vehicleType">Araç tipi (TIR, Kamyon, Kamyonet, Panelvan).</param>
    /// <param name="fuelPrice">Anlık dizel fiyatı (TL/litre).</param>
    /// <param name="weightTon">Yük ağırlığı <b>ton</b> cinsinden.</param>
    /// <param name="route">
    /// İsteğe bağlı güzergah bağlamı (ör: "İstanbul → Erzurum", "Doğu Anadolu dağlık arazi").
    /// </param>
    /// <param name="volumeM3">Yük hacmi (m³); hacimsel agirlik hesabi icin.</param>
    Task<AiPriceSuggestionDto> CalculateFairPriceAsync(
        double  distance,
        string  vehicleType,
        decimal fuelPrice,
        double  weightTon,
        string? route = null,
        double  volumeM3 = 0);

    /// <summary>
    /// <see cref="CalculateFairPriceAsync"/> için geriye dönük uyumlu sarmalayıcı.
    /// <paramref name="weight"/> kg cinsinden alınır, ton'a dönüştürülerek iletilir.
    /// </summary>
    Task<AiPriceSuggestionDto> GetPriceSuggestionAsync(
        double  distance,
        string  vehicleType,
        decimal fuelPrice,
        double  weight,
        string? route = null,
        double  volumeM3 = 0);

    // ── Evrak OCR ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Ehliyet, SRC veya ruhsat görselini Gemini Flash multimodal modeline göndererek
    /// yapılandırılmış JSON döner.
    /// </summary>
    Task<DocumentOcrResultDto> AnalyzeDocumentAsync(
        byte[]       imageBytes,
        DocumentType documentType = DocumentType.DriverLicense,
        string       mimeType     = "image/jpeg");

    // ── Smart Matching ────────────────────────────────────────────────────────

    /// <summary>
    /// Şoförün geçmiş rota deneyimlerini ve araç kapasitesini,
    /// aday yüklerle karşılaştırarak kişiselleştirilmiş eşleşme puanları üretir.
    /// <para>
    /// Gemini'ye "Lojistik İK ve Operasyon Uzmanı" kimliği verilir.
    /// Analiz kriterleri: Bölge uzmanlığı, Yük uyumluluğu, Araç uygunluğu, Geçmiş başarı.
    /// </para>
    /// <para>
    /// Şoförün geçmişi yoksa (yeni şoför) matematiksel fallback devreye girer;
    /// araç tipine göre baz puan + motivasyon mesajı üretilir.
    /// </para>
    /// </summary>
    Task<List<DriverMatchResultDto>> AnalyzeDriverMatchAsync(
        DriverMatchContextDto context,
        CancellationToken     ct = default);

    // ── Destek Asistanı (Chatbot) ─────────────────────────────────────────────

    /// <summary>
    /// Navlonix destek chatbot'u için Gemini'den serbest-metin Türkçe cevap üretir.
    /// Sistem promptu platformun gerçek davranışına dayanır (ilan/teklif/teslim/escrow vb.).
    /// <para>
    /// Best-effort: Gemini erişilemez/timeout/hata durumunda <c>null</c> döner — çağıran
    /// taraf nazik bir fallback mesajı kullanmalıdır. ASLA exception fırlatmaz.
    /// </para>
    /// </summary>
    /// <param name="userMessage">Kullanıcının son mesajı.</param>
    /// <param name="history">Önceki konuşma turları (en eskiden yeniye).</param>
    Task<string?> GetSupportAssistantReplyAsync(
        string                          userMessage,
        IReadOnlyList<SupportChatTurn>  history,
        CancellationToken               ct = default);
}

/// <summary>
/// Destek sohbetinde tek bir konuşma turu. <paramref name="Role"/> Gemini şemasına uygun
/// olmalıdır: kullanıcı için "user", asistan/operatör için "model".
/// </summary>
public sealed record SupportChatTurn(string Role, string Content);
