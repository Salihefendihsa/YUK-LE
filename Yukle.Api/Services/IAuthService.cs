using System.Threading.Tasks;
using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Services
{
    /// <summary>
    /// Kimlik doğrulama ve şoför evrak onay sözleşmesi.
    /// Testlerde mock edilebilir, üretimde <see cref="AuthService"/> tarafından karşılanır.
    /// </summary>
    public interface IAuthService
    {
        Task<User>   RegisterAsync(UserRegisterDto dto);
        Task<string> LoginAsync(UserLoginDto dto);
        Task         VerifyOtpAsync(VerifyOtpDto dto);

        // ── v2.5.1 · Şoför Belge Onay Akışı ───────────────────────────────────

        /// <summary>
        /// Şoför belgesini (Ehliyet / SRC / Psikoteknik) Gemini Pro Vision AI'ına analiz
        /// için ileten ve <see cref="DocumentOcrResultDto"/> sonucuna göre hesap durumunu
        /// güvenli biçimde güncelleyen akış yönetici metot.
        /// <para>
        /// <b>Kesin Güvenlik Kuralı:</b> Hiçbir kod yolu AI analizi <c>IsValid=true</c>
        /// dönmeden <see cref="User.IsActive"/> alanını <c>true</c> yapamaz.
        /// </para>
        /// <para>
        /// Karar ağacı:
        /// <list type="bullet">
        ///   <item><c>RequiresManualReview=true</c> → <c>ApprovalStatus = ManualApprovalRequired</c>, hata loglanır.</item>
        ///   <item><c>IsValid=false</c>              → <c>ApprovalStatus = Rejected</c>, <c>ValidationMessage</c> ile ApplicationException fırlatılır.</item>
        ///   <item><c>IsValid=true</c>               → Belge alanları DB'ye yazılır; tüm zorunlular onaylıysa <c>ApprovalStatus = Active</c>, <c>IsActive = true</c>.</item>
        /// </list>
        /// </para>
        /// </summary>
        /// <param name="userId">Bearer token'dan çözümlenen şoför <c>User.Id</c>'si.</param>
        /// <param name="documentType">Yüklenen belge tipi.</param>
        /// <param name="imageBytes">Belge görseli (base64'e çevrilmeden önceki binary).</param>
        /// <param name="mimeType">MIME type (image/jpeg, image/png, image/webp).</param>
        Task<DriverDocumentUploadResultDto> UploadDriverDocumentAsync(
            int          userId,
            DocumentType documentType,
            byte[]       imageBytes,
            string       mimeType);
    }
}
