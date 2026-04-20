using System.Text.Json.Serialization;

namespace Yukle.Api.DTOs;

/// <summary>Desteklenen lojistik belge türleri.</summary>
public enum DocumentType
{
    DriverLicense,        // Sürücü belgesi (ehliyet)
    SrcCertificate,       // SRC mesleki yeterlilik belgesi
    VehicleRegistration,  // Araç tescil belgesi (ruhsat)
    Psychotechnical       // Psikoteknik değerlendirme raporu
}

/// <summary>
/// Gemini <b>Pro Vision</b> modelinin (gemini-1.5-pro-latest ya da daha üst sürüm)
/// belge denetim çıktısı. Klasik OCR'ın ötesinde; belgenin fiziksel orijinalliği
/// (mühür/imza/hologram), hukuki geçerlilik tarihi ve sınıf uyumluluğu analiz edilir.
/// <para>
/// Tüm alanlar <c>null</c> veya boş olabilir — Gemini görselden okuyamadığında yapılandırılmış
/// hata mesajı <see cref="ValidationMessage"/> alanında iletilir ve <see cref="IsValid"/> = false dönülür.
/// </para>
/// <c>[JsonPropertyName]</c> öznitelikleri Gemini'nin camelCase şemasıyla birebir eşleşir.
/// </summary>
public sealed class DocumentOcrResultDto
{
    // ── Kimlik ve Belge Metinleri ──────────────────────────────────────────────

    /// <summary>Belgede yazılı ad soyad.</summary>
    [JsonPropertyName("fullName")]
    public string? FullName { get; set; }

    /// <summary>TC Kimlik numarası (11 hane).</summary>
    [JsonPropertyName("tcIdentityNumber")]
    public string? TcIdentityNumber { get; set; }

    /// <summary>Belge seri/kayıt numarası.</summary>
    [JsonPropertyName("documentNumber")]
    public string? DocumentNumber { get; set; }

    /// <summary>Belge türü etiketi (Gemini'nin döndürdüğü string).</summary>
    [JsonPropertyName("documentType")]
    public string? DocumentType { get; set; }

    /// <summary>
    /// Ehliyet sınıfı (B, CE, D vb.) — geriye dönük uyumluluk.
    /// Tek bir sınıf döner; çoklu sınıflar için <see cref="DocumentClasses"/> kullanın.
    /// </summary>
    [JsonPropertyName("licenseClass")]
    public string? LicenseClass { get; set; }

    /// <summary>Doğum tarihi (ISO 8601 string, ör: "1985-03-20").</summary>
    [JsonPropertyName("birthDate")]
    public string? BirthDate { get; set; }

    /// <summary>Geçerlilik/son kullanım tarihi (ham metin, Gemini'den geldiği hali).</summary>
    [JsonPropertyName("validUntil")]
    public string? ValidUntil { get; set; }

    /// <summary>Belgeyi düzenleyen kurum/nüfus müdürlüğü.</summary>
    [JsonPropertyName("issuingAuthority")]
    public string? IssuingAuthority { get; set; }

    // ── 2.5.0 · Güvenlik ve Hukuki Geçerlilik Alanları ────────────────────────

    /// <summary>
    /// Belge genel olarak geçerli ve kullanılabilir mi?
    /// <c>false</c> ise <see cref="ValidationMessage"/> nedenini içerir.
    /// Kriterler: geçerlilik tarihi, mühür/imza varlığı, belgenin okunabilirliği.
    /// </summary>
    [JsonPropertyName("isValid")]
    public bool IsValid { get; set; }

    /// <summary>
    /// Belge üzerinde resmi mühür, imza veya hologram tespit edildi mi?
    /// Fiziksel orijinallik göstergesi.
    /// </summary>
    [JsonPropertyName("isSealDetected")]
    public bool IsSealDetected { get; set; }

    /// <summary>
    /// Belgenin son kullanma tarihi (ISO 8601, UTC).
    /// Gemini <c>expiryDate</c> alanında YYYY-MM-DD formatında döner.
    /// </summary>
    [JsonPropertyName("expiryDate")]
    public DateTime? ExpiryDate { get; set; }

    /// <summary>
    /// Ehliyet/SRC için geçerli sınıflar (Örn: ["B", "C", "CE"]).
    /// Gemini tespit edemezse boş dizi döner.
    /// </summary>
    [JsonPropertyName("documentClasses")]
    public string[] DocumentClasses { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Belgenin durumuna dair AI analiz mesajı.
    /// Örn: "Geçerlilik tarihi dolmuş" · "Mühür tespit edilemedi, fiziksel doğrulama gerektirir".
    /// </summary>
    [JsonPropertyName("validationMessage")]
    public string? ValidationMessage { get; set; }

    /// <summary>
    /// <b>Dahili sinyal (v2.5.1)</b> — Gemini servisi zaman aşımına uğradığında
    /// veya teknik bir hata nedeniyle analiz tamamlanamadığında <c>true</c> olarak işaretlenir.
    /// <para>
    /// JSON'a serialize edilmez; yalnızca <c>AuthService</c> hesap durumunu
    /// <c>ManualApprovalRequired</c> olarak işaretlemek için tüketir.
    /// </para>
    /// Bu alan <c>true</c> iken <see cref="IsValid"/> daima <c>false</c>'dur; ancak
    /// <c>IsValid=false</c> her durumda teknik hata anlamına gelmez (normal ret de olabilir).
    /// </summary>
    [JsonIgnore]
    public bool RequiresManualReview { get; set; }
}
