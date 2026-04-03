using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Yukle.Api.DTOs;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
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
    }
}
