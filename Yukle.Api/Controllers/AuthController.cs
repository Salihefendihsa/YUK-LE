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

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto request)
        {
            try
            {
                var user = await _authService.RegisterAsync(request);
                
                // Güvenlik: Hassas alanları istemciye göndermiyoruz
                user.PasswordHash = Array.Empty<byte>();
                user.PasswordSalt = Array.Empty<byte>();

                return Ok(user);
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

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto request)
        {
            try
            {
                var token = await _authService.LoginAsync(request);
                return Ok(new { Token = token });
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
    }
}
