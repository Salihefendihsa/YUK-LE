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

        // ── Phase 4.2 · Teslimat QR (Delivery) HMAC Mekanizması ──────────────

        public string GenerateDeliveryQrToken(Guid loadId)
        {
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var payload = $"{loadId:N}:{timestamp}";

            var signature = ComputeHmacSha256(payload);
            
            // Format: payload.signature (url-safe kullanılabilsin diye düz base64)
            return $"{payload}.{signature}";
        }

        public bool ValidateDeliveryQrToken(string token, out Guid loadId)
        {
            loadId = Guid.Empty;

            if (string.IsNullOrWhiteSpace(token)) return false;

            var parts = token.Split('.');
            if (parts.Length != 2) return false;

            var payload = parts[0];
            var providedSignature = parts[1];

            // 1. İmza doğrulama (bütünlük kontrolü)
            var expectedSignature = ComputeHmacSha256(payload);
            if (providedSignature != expectedSignature)
                return false;

            // 2. Payload parçalama
            var payloadParts = payload.Split(':');
            if (payloadParts.Length != 2) return false;

            if (!Guid.TryParseExact(payloadParts[0], "N", out var parsedLoadId))
                return false;

            if (!long.TryParse(payloadParts[1], out var timestamp))
                return false;

            // 3. Süre kontrolü (15 dakika)
            var generatedTime = DateTimeOffset.FromUnixTimeSeconds(timestamp);
            if (DateTimeOffset.UtcNow - generatedTime > TimeSpan.FromMinutes(15))
                return false; // Token süresi dolmuş

            // 4. Gelecek zamana ait imza olamaz (saat senkronizasyonu payı hariç)
            if (generatedTime > DateTimeOffset.UtcNow.AddMinutes(1))
                return false;

            loadId = parsedLoadId;
            return true;
        }

        private string ComputeHmacSha256(string content)
        {
            var keyString = _config["Jwt:Key"];
            if (string.IsNullOrEmpty(keyString))
                throw new ApplicationException("JWT Key yapılandırması bulunamadı.");

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(keyString));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(content));
            
            // Base64UrlEncode işlemi (mobil tarafta url parser'a takılmaması için)
            return Convert.ToBase64String(hashBytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        }
    }
}
