using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Linq;
using System.Security.Claims;
using Yukle.Api.DTOs;
using Yukle.Api.Exceptions;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService   _authService;
        private readonly IGeminiService _geminiService;

        public AuthController(
            IAuthService   authService,
            IGeminiService geminiService)
        {
            _authService   = authService;
            _geminiService = geminiService;
        }

        [AllowAnonymous]
        [EnableRateLimiting("login-policy")]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                await _authService.ForgotPasswordAsync(request);
                return Ok(new { success = true });
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [AllowAnonymous]
        [EnableRateLimiting("login-policy")]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                await _authService.ResetPasswordAsync(request);
                return Ok(new { success = true });
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [Authorize]
        [EnableRateLimiting("global-policy")]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Unauthorized(new { message = "Oturum doğrulanamadı." });

            try
            {
                await _authService.ChangePasswordAsync(userId, request);
                return Ok(new { success = true, message = "Şifre güncellendi." });
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [AllowAnonymous]
        [EnableRateLimiting("login-policy")]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto request)
        {
            var user = await _authService.RegisterAsync(request);

            user.PasswordHash = Array.Empty<byte>();
            user.PasswordSalt = Array.Empty<byte>();
            user.VerificationCode = string.Empty;
            user.VerificationCodeExpiry = null;

            return Ok(user);
        }

        [AllowAnonymous]
        [EnableRateLimiting("login-policy")]   // Phase 2.2: 5 istek/dk, IP bazlı
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                var response = await _authService.LoginAsync(request);
                return Ok(response);
            }
            catch (PhoneVerificationRequiredException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = ex.Message,
                    requiresVerification = true,
                    phone = MaskPhoneForVerification(ex.Phone)
                });
            }
        }

        [AllowAnonymous]
        [EnableRateLimiting("login-policy")]
        [HttpPost("google")]
        public async Task<IActionResult> LoginWithGoogle([FromBody] GoogleLoginDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var response = await _authService.LoginWithGoogleAsync(request);
            return Ok(response);
        }

        [AllowAnonymous]
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var response = await _authService.RefreshTokenAsync(request);
            return Ok(response);
        }

        [AllowAnonymous]
        [EnableRateLimiting("otp-policy")]     // Phase 2.2: 3 istek/dk, IP bazlı
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                await _authService.VerifyOtpAsync(request);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            if (string.Equals(request.Purpose, "PasswordReset", StringComparison.OrdinalIgnoreCase))
                return Ok(new { success = true, message = "OTP doğrulandı." });

            return Ok(new { Message = "Telefon numarası başarıyla doğrulandı.", IsPhoneVerified = true });
        }

        [Authorize(Roles = "Driver")]
        [HttpPost("upload-document")]
        [RequestSizeLimit(15 * 1024 * 1024)]
        public async Task<IActionResult> UploadDocument(
            IFormFile                file,
            [FromQuery] DocumentType docType = DocumentType.DriverLicense)
        {
            if (file is null || file.Length == 0)
                return BadRequest(new { Message = "Geçerli bir belge görseli yüklenmedi." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { Message = "Kullanıcı kimliği alınamadı." });

            var mimeType = file.ContentType switch
            {
                "image/png"  => "image/png",
                "image/webp" => "image/webp",
                _            => "image/jpeg"
            };

            // KVKK Process & Delete Protocol (v2.5.5): RAM-only, disk yok.
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var imageBytes = ms.ToArray();

            _ = _geminiService;

            var result = await _authService.UploadDriverDocumentAsync(
                userId, docType, imageBytes, mimeType);

            if (result.ApprovalStatus == Models.ApprovalStatus.ManualApprovalRequired ||
                result.ApprovalStatus == Models.ApprovalStatus.PendingReview)
            {
                return Accepted(new
                {
                    result.DocumentType,
                    result.ApprovalStatus,
                    result.IsAccountActive,
                    Message = result.ValidationMessage
                              ?? "Hesabınız manuel inceleme için işaretlendi."
                });
            }

            return Ok(result);
        }

        private static string MaskPhoneForVerification(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return "5XXXXXXXXX";

            var digits = new string(phone.Where(char.IsDigit).ToArray());
            if (digits.StartsWith("90") && digits.Length == 12)
                digits = digits[2..];
            else if (digits.StartsWith("0") && digits.Length == 11)
                digits = digits[1..];

            if (digits.Length != 10)
                return "5XXXXXXXXX";

            return $"{digits[0]}XXXXXXXXX";
        }
    }
}
