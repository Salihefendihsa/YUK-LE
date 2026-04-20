using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Yukle.Api.DTOs;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService         _authService;
        private readonly IGeminiService       _geminiService;   // v2.5.1 — Evrak Denetim AI
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IAuthService            authService,
            IGeminiService          geminiService,
            ILogger<AuthController> logger)
        {
            _authService   = authService;
            _geminiService = geminiService;
            _logger        = logger;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto request)
        {
            try
            {
                var user = await _authService.RegisterAsync(request);
                
                // Güvenlik: Hassas / OTP alanlarını istemciye göndermiyoruz
                user.PasswordHash = Array.Empty<byte>();
                user.PasswordSalt = Array.Empty<byte>();
                user.VerificationCode = string.Empty;
                user.VerificationCodeExpiry = null;

                return Ok(user);
            }
            catch (ApplicationException ex) when (
                ex.Message.Contains("engellendiniz") ||   // kara listede
                ex.Message.Contains("kara listeye"))      // yeni kara listeye alındı
            {
                return StatusCode(429, new { Message = ex.Message });
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Kayıt sırasında beklenmedik bir sunucu hatası oluştu.", Details = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var token = await _authService.LoginAsync(request);

                return Ok(new
                {
                    Token      = token,
                    Expiration = DateTime.UtcNow.AddDays(7)
                });
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Giriş işlemi sırasında beklenmedik bir sunucu hatası oluştu.", Details = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                await _authService.VerifyOtpAsync(request);
                return Ok(new { Message = "Telefon numarası başarıyla doğrulandı aga!", IsPhoneVerified = true });
            }
            catch (ApplicationException ex) when (ex.Message.Contains("Çok fazla hatalı deneme"))
            {
                return StatusCode(429, new { Message = ex.Message });
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "OTP doğrulaması sırasında beklenmedik bir sunucu hatası oluştu.", Details = ex.Message });
            }
        }

        // ── v2.5.1 · Şoför Belge Yükleme + AI Onay ──────────────────────────
        /// <summary>
        /// Şoförün evrak görseli (Ehliyet / SRC / Psikoteknik) Gemini Pro Vision AI'ına
        /// gönderilir; <see cref="DocumentOcrResultDto.IsValid"/> <c>true</c> olmadıkça
        /// hesap <c>IsActive</c> değeri kesinlikle <c>true</c> yapılmaz.
        /// <para>
        /// Yanıt kodları:
        /// <list type="bullet">
        ///   <item><b>200 OK</b>         — Belge onaylandı; hesap Active veya Approved.</item>
        ///   <item><b>400 BadRequest</b> — Belge reddedildi (süresi dolmuş, mühür yok, deforme); Message = <c>ValidationMessage</c>.</item>
        ///   <item><b>202 Accepted</b>   — AI servisi erişilemedi; hesap <b>ManualApprovalRequired</b> statüsüne çekildi.</item>
        ///   <item><b>401 Unauthorized</b> / <b>403 Forbidden</b> — Oturum/rol sorunu.</item>
        /// </list>
        /// </para>
        /// </summary>
        [Authorize(Roles = "Driver")]
        [HttpPost("upload-document")]
        [RequestSizeLimit(15 * 1024 * 1024)]
        public async Task<IActionResult> UploadDocument(
            IFormFile                file,
            [FromQuery] DocumentType docType = DocumentType.DriverLicense)
        {
            if (file is null || file.Length == 0)
                return BadRequest(new { Message = "Geçerli bir belge görseli yüklenmedi." });

            // Kimliği JWT'den çözümle
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { Message = "Kullanıcı kimliği alınamadı." });

            var mimeType = file.ContentType switch
            {
                "image/png"  => "image/png",
                "image/webp" => "image/webp",
                _            => "image/jpeg"
            };

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var imageBytes = ms.ToArray();

            try
            {
                // NOT: AuthService içinden IGeminiService.AnalyzeDocumentAsync çağrılır;
                // burada controller'a da IGeminiService enjekte edilmiştir çünkü ileride
                // asenkron sıraya alma / ön denetim gibi senaryolarda doğrudan erişim gerekir.
                // Tüm DB geçişi ve IsActive kuralı AuthService tarafından korunur.
                _ = _geminiService; // Enjekte edildiği derleyiciye kanıtlanır (şu an service içinden kullanılıyor).

                var result = await _authService.UploadDriverDocumentAsync(
                    userId, docType, imageBytes, mimeType);

                // Ara durumlar 202 ile sinyallenebilir; ana başarı 200.
                if (result.ApprovalStatus == Models.ApprovalStatus.ManualApprovalRequired)
                {
                    return Accepted(new
                    {
                        result.DocumentType,
                        result.ApprovalStatus,
                        result.IsAccountActive,
                        Message = result.ValidationMessage
                                  ?? "AI servisi erişilemedi; hesabınız manuel onay için işaretlendi."
                    });
                }

                return Ok(result);
            }
            catch (ApplicationException ex)
            {
                // IsValid=false → AuthService ValidationMessage ile throw eder.
                _logger.LogInformation(
                    "Evrak reddi (UserId={UserId}, DocType={DocType}): {Msg}",
                    userId, docType, ex.Message);

                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Evrak yükleme sırasında beklenmedik hata. UserId={UserId}, DocType={DocType}.",
                    userId, docType);

                return StatusCode(500, new
                {
                    Message = "Evrak yüklenirken beklenmedik bir sunucu hatası oluştu.",
                    Details = ex.Message
                });
            }
        }
    }
}
