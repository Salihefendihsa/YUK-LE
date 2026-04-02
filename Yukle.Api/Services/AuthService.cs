using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.Models;
using Yukle.Api.DTOs;

namespace Yukle.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly YukleDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthService(YukleDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        public async Task<User> RegisterAsync(UserRegisterDto dto)
        {
            try
            {
                if (await _context.Users.AnyAsync(u => u.Phone == dto.Phone))
                    throw new ApplicationException("Bu telefon numarası zaten kullanımda.");

                if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                    throw new ApplicationException("Bu e-posta adresi zaten kullanımda.");

                string passwordHashString = BCrypt.Net.BCrypt.HashPassword(dto.Password);
                byte[] passwordHashBytes = Encoding.UTF8.GetBytes(passwordHashString);

                var user = new User
                {
                    FullName = dto.FullName,
                    Phone = dto.Phone,
                    Email = dto.Email,
                    PasswordHash = passwordHashBytes,
                    PasswordSalt = Array.Empty<byte>(), // BCrypt salt'ı hash'in içinde tutar, bu alan geriye dönük uyumluluk veya başka amaçlar için boş bırakılabilir veya kaldırılabilir.
                    IsCorporate = dto.IsCorporate,
                    TaxNumberOrTCKN = dto.TaxNumberOrTCKN,
                    Role = Enum.TryParse<UserRole>(dto.Role, out var role) ? role : UserRole.Customer,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                return user;
            }
            catch (Exception ex)
            {
                // TODO: İleride ILogger eklendiğinde loglama yapılabilir.
                throw new ApplicationException($"Kayıt işlemi sırasında bir hata oluştu: {ex.Message}", ex);
            }
        }

        public async Task<string> LoginAsync(UserLoginDto dto)
        {
            try
            {
                var user = await _context.Users.SingleOrDefaultAsync(u => u.Phone == dto.Phone)
                    ?? throw new ApplicationException("Geçersiz telefon numarası veya şifre.");

                string storedPasswordHashString = Encoding.UTF8.GetString(user.PasswordHash);

                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, storedPasswordHashString);

                if (!isPasswordValid)
                    throw new ApplicationException("Geçersiz telefon numarası veya şifre.");

                return _tokenService.CreateToken(user);
            }
            catch (Exception ex)
            {
                // TODO: İleride ILogger eklendiğinde loglama yapılabilir.
                throw new ApplicationException($"Giriş yaparken bir hata oluştu: {ex.Message}", ex);
            }
        }
    }
}
