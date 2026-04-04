using System.Text.Json.Serialization;

namespace Yukle.Api.DTOs;

/// <summary>Desteklenen lojistik belge türleri.</summary>
public enum DocumentType
{
    DriverLicense,       // Sürücü belgesi (ehliyet)
    SrcCertificate,      // SRC mesleki yeterlilik belgesi
    VehicleRegistration  // Araç tescil belgesi (ruhsat)
}

/// <summary>
/// Gemini multimodal OCR analizinin çıktısı.
/// Tüm alanlar <c>null</c> olabilir (Gemini görselden okuyamazsa boş döner).
/// <c>[JsonPropertyName]</c> öznitelikleri Gemini'nin camelCase çıktısıyla eşleşir.
/// </summary>
public sealed class DocumentOcrResultDto
{
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

    /// <summary>Ehliyet sınıfı (B, CE, D vb.) — yalnızca DriverLicense için.</summary>
    [JsonPropertyName("licenseClass")]
    public string? LicenseClass { get; set; }

    /// <summary>Doğum tarihi (ISO 8601 string, ör: "1985-03-20").</summary>
    [JsonPropertyName("birthDate")]
    public string? BirthDate { get; set; }

    /// <summary>Geçerlilik/son kullanım tarihi.</summary>
    [JsonPropertyName("validUntil")]
    public string? ValidUntil { get; set; }

    /// <summary>Belgeyi düzenleyen kurum/nüfus müdürlüğü.</summary>
    [JsonPropertyName("issuingAuthority")]
    public string? IssuingAuthority { get; set; }
}
