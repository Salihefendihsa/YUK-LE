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

    private readonly YukleDbContext     _context;
    private readonly ITokenService      _tokenService;
    private readonly ISmsService        _smsService;
    private readonly IDistributedCache  _cache;
    private readonly IGeminiService     _geminiService;   // v2.5.1 — Evrak Denetim AI
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        YukleDbContext       context,
        ITokenService        tokenService,
        ISmsService          smsService,
        IDistributedCache    cache,
        IGeminiService       geminiService,
        ILogger<AuthService> logger)
    {
        _context       = context;
        _tokenService  = tokenService;
        _smsService    = smsService;
        _cache         = cache;
        _geminiService = geminiService;
        _logger        = logger;
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

    // ──────────────────────────────────────────────────────────────────────────
    // v2.5.1 — Şoför Belge Onay Akışı (Gemini Pro Vision + Güvenli Aktivasyon)
    // ──────────────────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<DriverDocumentUploadResultDto> UploadDriverDocumentAsync(
        int          userId,
        DocumentType documentType,
        byte[]       imageBytes,
        string       mimeType)
    {
        // ── 0. Ön koşul: kullanıcı var mı ve şoför rolünde mi ────────────────
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Id == userId)
                   ?? throw new ApplicationException("Kullanıcı bulunamadı aga!");

        if (user.Role != UserRole.Driver)
            throw new ApplicationException("Yalnızca şoför rolündeki hesaplar belge yükleyebilir aga!");

        if (!user.IsPhoneVerified)
            throw new ApplicationException(
                "Belge yüklemeden önce telefon numaranı OTP ile doğrulaman gerekiyor aga!");

        // ── 1. Gemini Pro Vision ile evrak denetimi ──────────────────────────
        DocumentOcrResultDto ocr;
        try
        {
            ocr = await _geminiService.AnalyzeDocumentAsync(imageBytes, documentType, mimeType);
        }
        catch (Exception ex)
        {
            // GeminiServiceClient normalde istisnaları yutarak RequiresManualReview=true döner.
            // Bu dal; çağrı sırasında başka bir altyapı istisnası sızarsa yine güvenli taraftan
            // hesabı manuel onaya çeker — IsActive asla true olamaz.
            _logger.LogError(ex,
                "Gemini evrak denetimi beklenmedik şekilde throw etti. UserId={UserId}, DocType={DocType}.",
                userId, documentType);

            await MarkManualApprovalRequiredAsync(user,
                reason: "AI servisi geçici olarak yanıt vermedi, hesabınız manuel onay için işaretlendi.");

            return BuildResponse(user, documentType, ocr: null);
        }

        // ── 2. Teknik hata / timeout → Manuel onay ───────────────────────────
        if (ocr.RequiresManualReview)
        {
            _logger.LogWarning(
                "AI zaman aşımı/teknik hata: UserId={UserId}, DocType={DocType}, Msg={Msg}",
                userId, documentType, ocr.ValidationMessage);

            await MarkManualApprovalRequiredAsync(user,
                reason: ocr.ValidationMessage
                        ?? "AI analizi tamamlanamadı; hesabınız manuel onay için işaretlendi.");

            return BuildResponse(user, documentType, ocr);
        }

        // ── 3. Belge reddedildi (süresi dolmuş / mühür yok / deforme) ────────
        if (!ocr.IsValid)
        {
            user.ApprovalStatus        = ApprovalStatus.Rejected;
            user.IsActive              = false;  // Güvenlik: reddedilmiş belge ile asla aktif edilmez
            user.LastValidationMessage = ocr.ValidationMessage;

            ApplyDocumentRejection(user, documentType);

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Belge reddedildi: UserId={UserId}, DocType={DocType}, Sebep={Reason}",
                userId, documentType, ocr.ValidationMessage);

            // Controller'da BadRequest (400) olarak yakalanacak
            throw new ApplicationException(
                ocr.ValidationMessage
                ?? "Yüklenen belge AI denetiminden geçemedi. Lütfen geçerli bir belge yükleyin.");
        }

        // ── 4. Belge onaylandı — DB'ye yaz ve aktivasyon kontrolü yap ────────
        ApplyDocumentApproval(user, documentType, ocr);

        // Yeterli belge onaylandıysa hesap aktif edilir; aksi halde Pending kalır.
        // BU, IsActive=true için TEK YASAL YOL'dur.
        if (AreAllMandatoryDocumentsApproved(user))
        {
            user.ApprovalStatus        = ApprovalStatus.Active;
            user.IsActive              = true;
            user.LastValidationMessage = "Tüm zorunlu belgeler AI tarafından onaylandı.";
        }
        else
        {
            // Ara durum: en az bir belge onaylı ama tümü değil → Approved (aktif değil)
            user.ApprovalStatus = ApprovalStatus.Approved;
            user.IsActive       = false;
            user.LastValidationMessage = BuildPendingDocumentsMessage(user);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Belge onaylandı: UserId={UserId}, DocType={DocType}, Status={Status}, IsActive={Active}",
            userId, documentType, user.ApprovalStatus, user.IsActive);

        return BuildResponse(user, documentType, ocr);
    }

    // ── Yardımcı: Manuel onay işaretleme ──────────────────────────────────────
    private async Task MarkManualApprovalRequiredAsync(User user, string reason)
    {
        user.ApprovalStatus        = ApprovalStatus.ManualApprovalRequired;
        user.IsActive              = false;  // Asla true yapılmaz
        user.LastValidationMessage = reason;

        await _context.SaveChangesAsync();
    }

    // ── Yardımcı: Belge onayını DB alanlarına yaz ─────────────────────────────
    private static void ApplyDocumentApproval(
        User                 user,
        DocumentType         documentType,
        DocumentOcrResultDto ocr)
    {
        switch (documentType)
        {
            case DocumentType.DriverLicense:
                user.IsDriverLicenseApproved = true;
                user.DriverLicenseExpiry     = ocr.ExpiryDate;
                user.LicenseClasses          = ocr.DocumentClasses is { Length: > 0 }
                    ? string.Join(",", ocr.DocumentClasses)
                    : user.LicenseClasses;
                break;

            case DocumentType.SrcCertificate:
                user.IsSrcApproved = true;
                user.SrcExpiry     = ocr.ExpiryDate;
                break;

            case DocumentType.Psychotechnical:
                user.IsPsychotechnicalApproved = true;
                user.PsychotechnicalExpiry     = ocr.ExpiryDate;
                break;

            case DocumentType.VehicleRegistration:
                // Ruhsat şoför aktivasyonu için zorunlu değil; yalnızca bilgi olarak tutulur.
                break;
        }
    }

    // ── Yardımcı: Belge reddini DB alanlarına yaz ─────────────────────────────
    private static void ApplyDocumentRejection(User user, DocumentType documentType)
    {
        switch (documentType)
        {
            case DocumentType.DriverLicense:
                user.IsDriverLicenseApproved = false;
                user.DriverLicenseExpiry     = null;
                break;

            case DocumentType.SrcCertificate:
                user.IsSrcApproved = false;
                user.SrcExpiry     = null;
                break;

            case DocumentType.Psychotechnical:
                user.IsPsychotechnicalApproved = false;
                user.PsychotechnicalExpiry     = null;
                break;
        }
    }

    // ── Yardımcı: Zorunlu belgeler tamam mı ──────────────────────────────────
    /// <summary>
    /// Şoför hesabının aktif edilebilmesi için <b>zorunlu</b> üç belge:
    /// Ehliyet, SRC ve Psikoteknik. Ruhsat opsiyoneldir (araç bazlı ayrı akış).
    /// </summary>
    private static bool AreAllMandatoryDocumentsApproved(User user)
        => user.IsDriverLicenseApproved
        && user.IsSrcApproved
        && user.IsPsychotechnicalApproved
        && !IsDocumentExpired(user.DriverLicenseExpiry)
        && !IsDocumentExpired(user.SrcExpiry)
        && !IsDocumentExpired(user.PsychotechnicalExpiry);

    private static bool IsDocumentExpired(DateTime? expiry)
        => expiry is not null && expiry.Value.Date < DateTime.UtcNow.Date;

    private static string BuildPendingDocumentsMessage(User user)
    {
        var missing = new List<string>();
        if (!user.IsDriverLicenseApproved)     missing.Add("Ehliyet");
        if (!user.IsSrcApproved)               missing.Add("SRC");
        if (!user.IsPsychotechnicalApproved)   missing.Add("Psikoteknik");

        return missing.Count > 0
            ? $"Hesabın aktifleşmesi için hâlâ eksik belge(ler) var: {string.Join(", ", missing)}."
            : "Belge güncellendi, onay süreci devam ediyor.";
    }

    // ── Yardımcı: Response DTO inşası ─────────────────────────────────────────
    private static DriverDocumentUploadResultDto BuildResponse(
        User                  user,
        DocumentType          documentType,
        DocumentOcrResultDto? ocr)
    {
        var classes = ocr?.DocumentClasses ?? Array.Empty<string>();
        return new DriverDocumentUploadResultDto(
            DocumentType:      documentType,
            IsDocumentValid:   ocr?.IsValid ?? false,
            ValidationMessage: ocr?.ValidationMessage ?? user.LastValidationMessage,
            ApprovalStatus:    user.ApprovalStatus,
            IsAccountActive:   user.IsActive,
            ExpiryDate:        ocr?.ExpiryDate,
            DocumentClasses:   classes);
    }
}
