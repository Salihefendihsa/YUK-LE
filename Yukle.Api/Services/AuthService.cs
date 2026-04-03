using System;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public class AuthService : IAuthService
{
    // ── SMS / Kara Liste Limitleri ─────────────────────────────────────────────
    private const int    SmsCounterLimit    = 3;
    private const string MsgBlacklisted     = "Bot şüphesiyle 15 dakika boyunca engellendiniz aga!";
    private const string MsgCounterExceeded = "Çok fazla istek yaptın, 15 dakika boyunca kara listeye alındın!";
    private static readonly TimeSpan SmsCounterWindow   = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan SmsBlacklistWindow = TimeSpan.FromMinutes(15);

    // ── OTP Brute-Force Limitleri ──────────────────────────────────────────────
    private const int    OtpFailLimit    = 3;
    private const string MsgOtpLocked   = "Çok fazla hatalı deneme yaptın aga! 1 dakika bekle sonra tekrar dene.";
    private static readonly TimeSpan OtpBruteWindow = TimeSpan.FromMinutes(1);

    private readonly YukleDbContext  _context;
    private readonly ITokenService   _tokenService;
    private readonly ISmsService     _smsService;
    private readonly IDistributedCache _cache;

    public AuthService(
        YukleDbContext     context,
        ITokenService      tokenService,
        ISmsService        smsService,
        IDistributedCache  cache)
    {
        _context      = context;
        _tokenService = tokenService;
        _smsService   = smsService;
        _cache        = cache;
    }

    // ── Yardımcı: Redis'ten int sayaç oku ─────────────────────────────────────
    private async Task<int> GetCounterAsync(string key)
    {
        string? raw = await _cache.GetStringAsync(key);
        return raw is not null && int.TryParse(raw, out int val) ? val : 0;
    }

    // ── Yardımcı: Redis'e int sayaç yaz ───────────────────────────────────────
    private Task SetCounterAsync(string key, int value, TimeSpan ttl) =>
        _cache.SetStringAsync(key, value.ToString(), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl
        });

    // ──────────────────────────────────────────────────────────────────────────
    // SMS Kara Liste + Sayaç Koruması (RegisterAsync ve ileride ResendOtpAsync)
    // ──────────────────────────────────────────────────────────────────────────
    private async Task EnforceSmsRateLimitAsync(string phone)
    {
        string blacklistKey = $"Blacklist_{phone}";
        string counterKey   = $"SmsCounter_{phone}";

        // ADIM 1 – Kara liste kontrolü
        if (await _cache.GetAsync(blacklistKey) is not null)
            throw new ApplicationException(MsgBlacklisted);

        // ADIM 2 – Sayaç kontrolü
        int count = await GetCounterAsync(counterKey);

        // ADIM 3 – Sınır aşıldıysa kara listeye al
        if (count >= SmsCounterLimit)
        {
            await _cache.SetStringAsync(blacklistKey, "1", new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = SmsBlacklistWindow
            });
            throw new ApplicationException(MsgCounterExceeded);
        }

        // ADIM 4 – Sayacı artır, 1 dk TTL
        await SetCounterAsync(counterKey, count + 1, SmsCounterWindow);
    }

    // ──────────────────────────────────────────────────────────────────────────
    public async Task<User> RegisterAsync(UserRegisterDto dto)
    {
        string phone = dto.Phone.Trim();

        await EnforceSmsRateLimitAsync(phone);

        // Mükerrer kontrol
        bool isDuplicate = await _context.Users
            .AnyAsync(u => u.Phone == phone || u.Email == dto.Email);

        if (isDuplicate)
            throw new ApplicationException("Bu telefon/email ile daha önce kayıt olunmuş aga!");

        byte[] passwordHash = Encoding.UTF8.GetBytes(
            BCrypt.Net.BCrypt.HashPassword(dto.Password));

        string otp     = _smsService.GenerateSixDigitOtp();
        var    utcNow  = DateTime.UtcNow;

        var user = new User
        {
            FullName               = dto.FullName,
            Phone                  = phone,
            Email                  = dto.Email,
            PasswordHash           = passwordHash,
            PasswordSalt           = Array.Empty<byte>(),
            IsCorporate            = dto.IsCorporate,
            TaxNumberOrTCKN        = dto.TaxNumberOrTCKN,
            Role                   = Enum.TryParse<UserRole>(dto.Role, out var parsedRole)
                                         ? parsedRole
                                         : UserRole.Customer,
            CreatedAt              = utcNow,
            VerificationCode       = otp,
            VerificationCodeExpiry = utcNow.AddMinutes(5),
            IsPhoneVerified        = false
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        await _smsService.SendOtpAsync(phone, otp);

        return user;
    }

    // ──────────────────────────────────────────────────────────────────────────
    public async Task VerifyOtpAsync(VerifyOtpDto dto)
    {
        string phone    = dto.Phone.Trim();
        string bruteKey = $"VerifyLimit_{phone}";

        // ── Brute-Force koruması ───────────────────────────────────────────────
        int failCount = await GetCounterAsync(bruteKey);
        if (failCount >= OtpFailLimit)
            throw new ApplicationException(MsgOtpLocked);

        var user = await _context.Users
            .SingleOrDefaultAsync(u => u.Phone == phone);

        if (user is null)
            throw new ApplicationException("Telefon numarası veya kod hatalı aga!");

        if (user.IsPhoneVerified)
            throw new ApplicationException("Bu telefon numarası zaten doğrulanmış aga!");

        if (string.IsNullOrEmpty(user.VerificationCode) || user.VerificationCodeExpiry is null)
            throw new ApplicationException("Geçerli bir doğrulama kodu talebi bulunamadı aga!");

        if (DateTime.UtcNow > user.VerificationCodeExpiry.Value)
            throw new ApplicationException("Doğrulama kodunun süresi dolmuş aga!");

        // Yanlış kod: sayacı artır
        if (!string.Equals(dto.Code.Trim(), user.VerificationCode, StringComparison.Ordinal))
        {
            await SetCounterAsync(bruteKey, failCount + 1, OtpBruteWindow);
            throw new ApplicationException("Telefon numarası veya kod hatalı aga!");
        }

        // ── Başarılı doğrulama ─────────────────────────────────────────────────
        await _cache.RemoveAsync(bruteKey);          // brute-force sayacı sıfırla

        user.IsPhoneVerified        = true;
        user.VerificationCode       = string.Empty;  // kodu tek kullanımlık kıl
        user.VerificationCodeExpiry = null;

        await _context.SaveChangesAsync();
    }

    // ──────────────────────────────────────────────────────────────────────────
    public async Task<string> LoginAsync(UserLoginDto dto)
    {
        var user = await _context.Users
            .SingleOrDefaultAsync(u => u.Phone == dto.Phone);

        if (user is null)
            throw new ApplicationException("Telefon numarası veya şifre hatalı aga!");

        string storedHash = Encoding.UTF8.GetString(user.PasswordHash);
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, storedHash))
            throw new ApplicationException("Telefon numarası veya şifre hatalı aga!");

        return _tokenService.CreateToken(user);
    }
}
