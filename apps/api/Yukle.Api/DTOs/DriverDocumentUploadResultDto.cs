using Yukle.Api.Models;

namespace Yukle.Api.DTOs;

/// <summary>
/// Şoför evrak yükleme sürecinin özet yanıtı (v2.5.1).
/// <para>
/// <c>AuthController</c> bu DTO'yu yalnızca AI onay sürecinin başarı/başarısızlık
/// gerekçesini kullanıcıya şeffaf biçimde iletmek için kullanır.
/// </para>
/// </summary>
/// <param name="DocumentType">Analiz edilen belge tipi (Ehliyet, SRC, Psikoteknik, Ruhsat).</param>
/// <param name="IsDocumentValid">AI kararı — belge geçerli ve kullanılabilir mi?</param>
/// <param name="ValidationMessage">AI'ın döndürdüğü analiz mesajı (reddedilme sebebi veya onay notu).</param>
/// <param name="ApprovalStatus">Hesabın güncel yaşam döngüsü durumu (Pending, Rejected, Active, ManualApprovalRequired).</param>
/// <param name="IsAccountActive">
/// Hesap yük kabul edebilir durumda mı? Yalnızca tüm zorunlu belgeler onaylandığında <c>true</c> döner.
/// </param>
/// <param name="ExpiryDate">Belgeden çıkarılan geçerlilik tarihi (ISO 8601, UTC).</param>
/// <param name="DocumentClasses">Ehliyet/SRC için yetkili sınıflar (ör. ["B", "C", "CE"]).</param>
public sealed record DriverDocumentUploadResultDto(
    DocumentType   DocumentType,
    bool           IsDocumentValid,
    string?        ValidationMessage,
    ApprovalStatus ApprovalStatus,
    bool           IsAccountActive,
    DateTime?      ExpiryDate,
    string[]       DocumentClasses);
