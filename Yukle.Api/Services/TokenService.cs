using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Yukle.Api.Models;

namespace Yukle.Api.Services
{
    public class TokenService : ITokenService
    {
        // v2.5.4 — refresh token entropy size. 64 bayt = 512 bit → base64'te ~88 karakter,
        // çarpışma olasılığı pratikte sıfır.
        private const int RefreshTokenByteLength = 64;

        private readonly IConfiguration _config;

        public TokenService(IConfiguration config)
        {
            _config = config;
        }

        public string CreateToken(User user)
        {
            // v2.5.3 — JWT Yetkilendirme Bariyeri Claim'leri
            //
            // "IsActive" claim'i RequireActiveDriver policy'sinin aradığı değerdir.
            // bool.ToString() "True"/"False" üretir; policy değeri ordinal olarak karşılaştırır,
            // bu yüzden T-F büyük yazımı kesinlikle korunmalıdır.
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Phone),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim("IsActive", user.IsActive.ToString()),           // "True" / "False"
                new Claim("ApprovalStatus", user.ApprovalStatus.ToString())
            };

            var keyString = _config["Jwt:Key"];
            if (string.IsNullOrEmpty(keyString))
            {
                throw new ApplicationException("JWT Key yapılandırması bulunamadı.");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7), // 7 günlük geçerlilik süresi
                SigningCredentials = creds,
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        // ── v2.5.4 · Refresh Token Üretimi ─────────────────────────────────────
        //
        // RNGCryptoServiceProvider artık obsolete; .NET 6+ RandomNumberGenerator.Fill
        // statik API'si ile aynı CSPRNG'yi kullanır (OpenSSL / Windows BCrypt).
        public string GenerateRefreshToken()
        {
            Span<byte> buffer = stackalloc byte[RefreshTokenByteLength];
            RandomNumberGenerator.Fill(buffer);
            return Convert.ToBase64String(buffer);
        }

        // ── v2.5.4 · Süresi Dolmuş Token'dan Principal Çözümleme ───────────────
        //
        // Refresh akışının tehlikeli tarafı: istemci elinde "süresi dolmuş ama benim"
        // diyebileceği bir token ile gelir. İmzayı doğrulayıp içeriği güvenle
        // okuruz; lifetime kontrolünü kapatırız (aksi halde zaten süresi dolmuş
        // olduğu için exception atar). Algoritma kontrolü EN KRİTİK adımdır —
        // "none" algorithm attack'ı burada kesinlikle engellenir.
        public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return null;

            var keyString = _config["Jwt:Key"];
            if (string.IsNullOrEmpty(keyString))
                return null;

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidIssuer              = _config["Jwt:Issuer"],
                ValidateAudience         = true,
                ValidAudience            = _config["Jwt:Audience"],
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString)),
                ValidateLifetime         = false,   // TEK farklı nokta — süresi dolmuşa izin ver
                ClockSkew                = TimeSpan.Zero
            };

            var handler = new JwtSecurityTokenHandler();

            try
            {
                var principal = handler.ValidateToken(
                    token, validationParameters, out SecurityToken securityToken);

                // JWT header "alg" değeri HS512 olmalı. Başka algoritma (özellikle "none")
                // görürsek token sahte/bozuk sayılır.
                if (securityToken is not JwtSecurityToken jwt ||
                    !string.Equals(jwt.Header.Alg,
                                   SecurityAlgorithms.HmacSha512,
                                   StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                return principal;
            }
            catch
            {
                // İmza bozuk, issuer/audience uyumsuz, token formatı hatalı vb. — hepsi null.
                return null;
            }
        }
    }
}
