using System.Security.Claims;
using Yukle.Api.Models;

namespace Yukle.Api.Services
{
    /// <summary>
    /// JWT üretim ve doğrulama sözleşmesi. Hem kısa ömürlü access token'ı
    /// hem de v2.5.4 refresh token akışı için gerekli yardımcıları barındırır.
    /// </summary>
    public interface ITokenService
    {
        /// <summary>
        /// Kullanıcının güncel (DB'den okunan) IsActive ve ApprovalStatus değerleriyle
        /// imzalı JWT üretir. 7 gün geçerlidir.
        /// </summary>
        string CreateToken(User user);

        /// <summary>
        /// <b>v2.5.4</b> — Kriptografik olarak güvenli, 64 byte rastgele dizge
        /// üretir ve base64 olarak döner. Tahmin edilemez olduğu için veritabanında
        /// düz metin saklanabilir.
        /// </summary>
        string GenerateRefreshToken();

        /// <summary>
        /// <b>v2.5.4</b> — Süresi dolmuş bir JWT'nin imzasını ve issuer/audience
        /// alanlarını doğrular; yaşam süresi (lifetime) kontrolü devre dışıdır.
        /// Refresh akışında token içindeki <c>NameIdentifier</c> claim'ini güvenle
        /// okumak için kullanılır. Token bozuksa / algoritma beklenenden farklıysa
        /// <c>null</c> döner.
        /// </summary>
        ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);

        /// <summary>
        /// <b>Faz 4.2</b> — Teslimat noktasına varıldığında fiziksel varlığı kantılamak 
        /// amacıyla müşteri (veya alıcı) cihazında üretilen, 15 dakika geçerli hafif HMAC-SHA256 imza.
        /// </summary>
        string GenerateDeliveryQrToken(Guid loadId);

        /// <summary>
        /// <b>Faz 4.2</b> — Şoför tarafından okutulan QR içerisindeki token'ın 
        /// doğruluğunu ve süresini kontrol eder. Geçerliyse out parametresinde LoadId döner.
        /// </summary>
        bool ValidateDeliveryQrToken(string token, out Guid loadId);
    }
}
