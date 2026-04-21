using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Yukle.Api.DTOs;
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
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var response = await _authService.LoginAsync(request);
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
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            await _authService.VerifyOtpAsync(request);
            return Ok(new { Message = "Telefon numarası başarıyla doğrulandı aga!", IsPhoneVerified = true });
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
    }
}
