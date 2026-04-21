using System;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
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

    // ── v2.5.2 · Şoför Kimlik Uyuşmazlık / Geçerlilik Mesajları ───────────────
    private const string MsgIdentityMismatch =
        "Yüklediğiniz belgedeki kimlik bilgileri, kayıtlı profil bilgilerinizle uyuşmuyor.";
    private const string MsgDocumentExpired =
        "Belgenin geçerlilik süresi dolmuştur.";

    // ── v2.5.6 · Manuel Onay (Gri Alan) Parametreleri ────────────────────────
    //
    // Confidence grey band: bu aralıktaki kararlar otomatik uygulanmaz, admin incelemesi.
    //   >  GreyBandUpperBound (85) → AI kararı uygulanır (IsValid olduğu gibi).
    //   >= GreyBandLowerBound (50) && <= 85 → PendingReview.
    //   <  GreyBandLowerBound (50) → AI net red sayılır (zaten IsValid=false olur).
    private const double GreyBandLowerBound = 50.0;
    private const double GreyBandUpperBound = 85.0;

    // AI'ın ValidationMessage'ı içinde "belirsizlik" sinyali taşıyan kelime grupları.
    // Gemini prompt'u bu cümleleri doğrudan (veya çok yakın biçimde) üretir; her birisi
    // otomatik ret yerine manuel inceleme gerektiğine işaret eder.
    private static readonly string[] AmbiguityKeywords =
    [
        "düşük çözünürlük",
        "okunabilirlik",           // "okunabilirlik zayıf", "okunabilirliği düşük"
        "kalitesi yetersiz",
        "yeniden fotoğraflanmalı",
        "bulanık",
        "mühür tespit edilemedi",  // prompt'un standart cümlesi
        "mühür tam tespit edilemedi",
        "mühür belirsiz",
        "fiziksel doğrulama",
        "manuel kontrol",
        "format standardı sapmaları"
    ];

    // Şoföre dönülecek UX metni — tek tip, KVKK-dostu, süreç netleyici
    private const string MsgPendingReview =
        "Belgeniz yapay zeka tarafından net olarak doğrulanamadı. Sistemimiz sizi " +
        "manuel inceleme sırasına aldı. Lütfen 24 saat içinde tekrar kontrol ediniz.";

    // Admin dashboard queue'sunda arayacağı sabit log etiketi (structured logging).
    // Kibana/Seq/CloudWatch sorgularında "MANUAL_REVIEW_REQUIRED" ile filtrelenir.
    private const string LogTagManualReview = "MANUAL_REVIEW_REQUIRED";

    // ── v2.5.4 · Refresh Token Parametreleri ──────────────────────────────────
    private const int AccessTokenLifetimeDays   = 7;   // TokenService.CreateToken içindeki değer ile aynı
    private const int RefreshTokenLifetimeDays  = 7;

    // Generic (kimliği sızdırmayan) hata mesajları — istemciye tam neden söylenmez,
    // aksi halde saldırgan geçerli access token + yanlış refresh token kombinasyonu
    // ile kullanıcı listesi enumerate edebilir.
    private const string MsgRefreshInvalid =
        "Oturum doğrulanamadı. Lütfen tekrar giriş yapın.";
    private const string MsgRefreshExpired =
        "Oturum süresi doldu. Lütfen tekrar giriş yapın.";

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
    // v2.5.3 — Login artık yalın string token yerine LoginResponseDto döner.
    // JWT payload IsActive + ApprovalStatus claim'lerini taşır (TokenService içinde);
    // DTO ise mobil istemcinin login ekranından sonra doğru rotaya geçmesi için aynı
    // bilgileri düz JSON alanları olarak da iletir.
    //
    // v2.5.4 — Yanıta refresh token ve son geçerlilik zamanı da eklendi. Her login
    // yeni bir refresh token üretir ve DB'ye yazar — önceki refresh token iptal olur.
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<LoginResponseDto> LoginAsync(UserLoginDto dto)
    {
        var user = await _context.Users
            .SingleOrDefaultAsync(u => u.Phone == dto.Phone);

        if (user is null)
            throw new ApplicationException("Telefon numarası veya şifre hatalı aga!");

        string storedHash = Encoding.UTF8.GetString(user.PasswordHash);
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, storedHash))
            throw new ApplicationException("Telefon numarası veya şifre hatalı aga!");

        return await IssueTokensAsync(user);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // v2.5.4 · Refresh Token Akışı
    //
    // Güvenli token yenileme protokolü:
    //   1. Süresi dolmuş access token'ın İMZASINI doğrula (lifetime hariç).
    //   2. Token'daki NameIdentifier claim'inden userId çöz.
    //   3. DB'den kullanıcıyı çek; DB'deki refresh token ile istemcinin sunduğu
    //      refresh token FixedTimeEquals ile karşılaştır (timing-attack koruması).
    //   4. DB'deki refresh token'ın süresi dolmamış olmalı.
    //   5. Her başarılı refresh → rotation: yeni access + yeni refresh üret, DB'de
    //      eski refresh'in üzerine yaz. Eski refresh bir daha çalışmaz.
    //
    // Hata durumlarında tek tip "Oturum doğrulanamadı" mesajı döneriz; detay
    // sızdırmak kimlik enumerate saldırılarına kapı açar. Loglarda ayrıntı tutulur.
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<LoginResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto)
    {
        // 1. Access token imzasını doğrula (lifetime bakmadan)
        var principal = _tokenService.GetPrincipalFromExpiredToken(dto.AccessToken);
        if (principal is null)
        {
            _logger.LogWarning("Refresh reddedildi: AccessToken imzası/formatı geçersiz.");
            throw new ApplicationException(MsgRefreshInvalid);
        }

        // 2. UserId çöz
        string? userIdClaim = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out int userId))
        {
            _logger.LogWarning("Refresh reddedildi: NameIdentifier claim'i çözümlenemedi.");
            throw new ApplicationException(MsgRefreshInvalid);
        }

        // 3. Kullanıcıyı çek
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            _logger.LogWarning("Refresh reddedildi: UserId={UserId} DB'de bulunamadı.", userId);
            throw new ApplicationException(MsgRefreshInvalid);
        }

        // 4. DB'deki refresh token gönderilenle eşleşiyor mu (constant-time)
        if (string.IsNullOrEmpty(user.RefreshToken) ||
            user.RefreshTokenExpiryTime is null)
        {
            _logger.LogWarning(
                "Refresh reddedildi: UserId={UserId} için DB'de refresh token yok (oturum kapalı).",
                userId);
            throw new ApplicationException(MsgRefreshInvalid);
        }

        if (!FixedTimeEqualsString(user.RefreshToken, dto.RefreshToken))
        {
            // Olası token çalınması senaryosu: saldırgan eski bir refresh ile geldi.
            // Savunmacı adım — hesabın tüm refresh token'ını geçersiz kıl (replay kes).
            user.RefreshToken           = null;
            user.RefreshTokenExpiryTime = null;
            await _context.SaveChangesAsync();

            _logger.LogWarning(
                "Refresh reddedildi: UserId={UserId} için refresh token UYUŞMUYOR. " +
                "Potansiyel token çalınması — oturum tamamen kapatıldı.",
                userId);
            throw new ApplicationException(MsgRefreshInvalid);
        }

        // 5. Süresi dolmuş mu
        if (user.RefreshTokenExpiryTime.Value < DateTime.UtcNow)
        {
            _logger.LogInformation(
                "Refresh reddedildi: UserId={UserId} refresh token süresi dolmuş (Expiry={Expiry:O}).",
                userId, user.RefreshTokenExpiryTime.Value);
            throw new ApplicationException(MsgRefreshExpired);
        }

        // 6. Rotation — yeni çift üret, DB'ye yaz
        _logger.LogInformation(
            "Refresh başarılı: UserId={UserId}, IsActive={Active}, ApprovalStatus={Status}",
            userId, user.IsActive, user.ApprovalStatus);

        return await IssueTokensAsync(user);
    }

    // ── Yardımcı (v2.5.4): Access + Refresh token çifti üret ve DB'ye yaz ─────
    private async Task<LoginResponseDto> IssueTokensAsync(User user)
    {
        string accessToken  = _tokenService.CreateToken(user);
        string refreshToken = _tokenService.GenerateRefreshToken();

        DateTime accessExpires  = DateTime.UtcNow.AddDays(AccessTokenLifetimeDays);
        DateTime refreshExpires = DateTime.UtcNow.AddDays(RefreshTokenLifetimeDays);

        user.RefreshToken           = refreshToken;
        user.RefreshTokenExpiryTime = refreshExpires;

        await _context.SaveChangesAsync();

        return new LoginResponseDto
        {
            Token                  = accessToken,
            Expiration             = accessExpires,
            RefreshToken           = refreshToken,
            RefreshTokenExpiration = refreshExpires,
            UserId                 = user.Id,
            FullName               = user.FullName,
            Role                   = user.Role.ToString(),
            IsPhoneVerified        = user.IsPhoneVerified,
            IsActive               = user.IsActive,
            ApprovalStatus         = user.ApprovalStatus
        };
    }

    // ── Yardımcı (v2.5.4): Timing-safe string eşitliği ────────────────────────
    //
    // Düz string.Equals, ilk farklı karakterde erken çıkar — saldırgan yanıt
    // süresini ölçerek refresh token'ı byte-byte tahmin edebilir. FixedTimeEquals
    // uzunluklar eşit olduğunda sabit süreli karşılaştırma yapar.
    private static bool FixedTimeEqualsString(string a, string b)
    {
        byte[] aBytes = Encoding.UTF8.GetBytes(a);
        byte[] bBytes = Encoding.UTF8.GetBytes(b);
        if (aBytes.Length != bBytes.Length) return false;
        return CryptographicOperations.FixedTimeEquals(aBytes, bBytes);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // v2.5.1 — Şoför Belge Onay Akışı (Gemini Pro Vision + Güvenli Aktivasyon)
    // ──────────────────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    /// <remarks>
    /// <b>v2.5.5 — KVKK Process &amp; Delete Protocol.</b><br/>
    /// <paramref name="imageBytes"/> parametresi, controller katmanında IFormFile'dan
    /// <see cref="System.IO.MemoryStream"/> aracılığıyla üretilmiş RAM-only veridir.
    /// Bu metot içinde disk'e hiçbir yazma (File.*/FileStream) yapılmaz — yalnızca
    /// <see cref="IGeminiService.AnalyzeDocumentAsync"/> çağrısına paslanır ve çağrı
    /// döndüğünde dizi referansı GC için aday olur. OCR'dan elde edilen PII (Ad-Soyad,
    /// TCKN) <see cref="Models.User.TaxNumberOrTCKN"/> kolonunda AES-256 şifreli
    /// olarak persist edilir.
    /// </remarks>
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

        // ── 3. v2.5.6 · GRİ ALAN DENETİMİ (Red'den ÖNCE gelir) ───────────────
        //
        // AI kararı kesin değilse (confidence 50-85 bandında YA DA validation message'da
        // belirsizlik kelimeleri varsa), otomatik red vermek adil değildir — belge
        // gerçekten geçerli olabilir, sadece görsel kalite düşüktür. Bu durumda hesap
        // PendingReview'a alınır ve admin kuyruğuna düşer.
        if (IsGreyArea(ocr))
        {
            await MarkPendingReviewAsync(user, documentType, ocr);

            // Şoföre UX mesajı dönülür — controller 202 Accepted ile cevaplar.
            // ApplicationException fırlatmıyoruz çünkü bu bir "hata" değil, ara durum.
            return BuildResponse(user, documentType, ocr,
                overrideMessage: MsgPendingReview);
        }

        // ── 4. Belge reddedildi (süresi dolmuş / mühür yok / deforme) ────────
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

        // ── 3.5. v2.5.2 · Kimlik Uyuşmazlık Kontrolü (Ad-Soyad + TC) ─────────
        //
        // Gemini belgeyi "geçerli" döndürse bile, üzerindeki kimlik bilgileri kayıtlı
        // profil ile örtüşmüyorsa başka birinin belgesi (veya sahte) yüklenmiş olabilir.
        // Bu kontrol tamamen C# tarafında yapılır — Python/harici kütüphane yoktur.
        // Ruhsat kişisel belge olmadığı için kapsam dışıdır.
        if (IsPersonalDocument(documentType) &&
            !IdentityMatchesUser(ocr, user))
        {
            user.ApprovalStatus        = ApprovalStatus.Rejected;
            user.IsActive              = false;
            user.LastValidationMessage = MsgIdentityMismatch;
            ApplyDocumentRejection(user, documentType);

            await _context.SaveChangesAsync();

            // KVKK: Log'da OCR'dan okunan Ad-Soyad'ı DÜZ METİN olarak yazmıyoruz;
            // sadece maskelenmiş versiyonu kayda geçer (ör. "A***t Y*****z"). Bu
            // teşhis için yeterli, sızıntıda kimlik için anlamsızdır.
            _logger.LogWarning(
                "Kimlik uyuşmazlığı tespit edildi: UserId={UserId}, DocType={DocType}, OcrName={OcrName}",
                userId, documentType, MaskPii(ocr.FullName));

            throw new ApplicationException(MsgIdentityMismatch);
        }

        // ── 3.6. v2.5.2 · Geçerlilik Süresi (C# tarafı teyit kontrolü) ───────
        //
        // Gemini ExpiryDate'i geçmiş tarih olarak dönmüş ama IsValid=true gelmişse
        // (AI'nın yorum hatası), C# tarafında son bir güvenlik ağı olarak ret ederiz.
        if (ocr.ExpiryDate is DateTime expiryDate && expiryDate < DateTime.UtcNow)
        {
            user.ApprovalStatus        = ApprovalStatus.Rejected;
            user.IsActive              = false;
            user.LastValidationMessage = MsgDocumentExpired;
            ApplyDocumentRejection(user, documentType);

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Belge süresi dolmuş (C# teyit): UserId={UserId}, DocType={DocType}, Expiry={Expiry:O}",
                userId, documentType, expiryDate);

            throw new ApplicationException(MsgDocumentExpired);
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

    // ── Yardımcı: Manuel onay işaretleme (teknik hata) ────────────────────────
    private async Task MarkManualApprovalRequiredAsync(User user, string reason)
    {
        user.ApprovalStatus        = ApprovalStatus.ManualApprovalRequired;
        user.IsActive              = false;  // Asla true yapılmaz
        user.LastValidationMessage = reason;

        await _context.SaveChangesAsync();
    }

    // ── v2.5.6 · Gri Alan Tespiti ─────────────────────────────────────────────
    /// <summary>
    /// Gemini kararının "kararsız" (grey area) olup olmadığını belirler.
    /// İki sinyal birleşik OR ile çalışır:
    /// <list type="bullet">
    ///   <item><b>Confidence sinyali:</b> 50-85 aralığındaki her skor gri alandır.</item>
    ///   <item><b>Mesaj sinyali:</b> <c>IsValid=false</c> VE validationMessage içinde
    ///       belirsizlik anahtar kelimesi varsa gri alandır — "süre dolmuş" gibi net red
    ///       mesajları bu listede yoktur, dolayısıyla normal red yoluna düşer.</item>
    /// </list>
    /// </summary>
    private static bool IsGreyArea(DocumentOcrResultDto ocr)
    {
        // 1) Confidence Bant Kontrolü
        if (ocr.ConfidenceScore is double score &&
            score >= GreyBandLowerBound &&
            score <= GreyBandUpperBound)
        {
            return true;
        }

        // 2) Mesaj Anahtar Kelime Kontrolü (yalnızca red durumlarında anlamlıdır)
        if (!ocr.IsValid && !string.IsNullOrWhiteSpace(ocr.ValidationMessage))
        {
            string msg = ocr.ValidationMessage.ToLowerInvariant();
            if (AmbiguityKeywords.Any(kw => msg.Contains(kw, StringComparison.OrdinalIgnoreCase)))
                return true;
        }

        return false;
    }

    // ── v2.5.6 · PendingReview statüsüne çekme ───────────────────────────────
    /// <summary>
    /// Hesabı PendingReview'a alır, AI çıkarım detaylarını JSON olarak persist eder,
    /// admin için özet not hazırlar ve yapılandırılmış log girdisi üretir.
    /// Hiçbir durumda <see cref="User.IsActive"/>=true yapılmaz.
    /// </summary>
    private async Task MarkPendingReviewAsync(
        User                 user,
        DocumentType         documentType,
        DocumentOcrResultDto ocr)
    {
        user.ApprovalStatus        = ApprovalStatus.PendingReview;
        user.IsActive              = false;
        user.LastValidationMessage = MsgPendingReview;

        // Admin için kısa açıklama: confidence + AI mesajının ilk 200 karakteri.
        // UI'da uzun alanları kesmek gerekirse bu not güvenli bir preview sağlar.
        string aiMsgPreview = string.IsNullOrWhiteSpace(ocr.ValidationMessage)
            ? "AI mesaj yok"
            : ocr.ValidationMessage.Length > 200
                ? ocr.ValidationMessage[..200] + "…"
                : ocr.ValidationMessage;

        user.AdminReviewNote =
            $"[{documentType}] Confidence={ocr.ConfidenceScore?.ToString("F0") ?? "N/A"} | " +
            $"IsValid={ocr.IsValid} | Seal={ocr.IsSealDetected} | " +
            $"AI: {aiMsgPreview}";

        // Yapılandırılmış, KVKK-uyumlu delil JSON'ı (Ad-Soyad/TCKN YOKTUR — zaten DTO'nun
        // kimlik alanları burada serialize edilmez).
        user.AiInferenceDetails = JsonSerializer.Serialize(new
        {
            DocumentType      = documentType.ToString(),
            IsValid           = ocr.IsValid,
            IsSealDetected    = ocr.IsSealDetected,
            ConfidenceScore   = ocr.ConfidenceScore,
            ValidationMessage = ocr.ValidationMessage,
            ExpiryDate        = ocr.ExpiryDate,
            DocumentClasses   = ocr.DocumentClasses,
            TimestampUtc      = DateTime.UtcNow
        }, new JsonSerializerOptions { WriteIndented = false });

        await _context.SaveChangesAsync();

        // Structured logging — admin dashboard ve merkezi log sistemi (Seq/Kibana)
        // "MANUAL_REVIEW_REQUIRED" etiketiyle bu girdiyi kolayca listeleyebilir.
        _logger.LogWarning(
            "{Tag} — UserId={UserId}, DocType={DocType}, Confidence={Confidence}, " +
            "IsValid={IsValid}, Reason={Reason}",
            LogTagManualReview,
            user.Id,
            documentType,
            ocr.ConfidenceScore?.ToString("F0") ?? "N/A",
            ocr.IsValid,
            ocr.ValidationMessage ?? "[boş]");
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

    // ── Yardımcı (v2.5.2): Hangi belgeler kişisel kimlik taşır ───────────────
    /// <summary>
    /// Ehliyet, SRC ve Psikoteknik belgeler şoförün kendi kimliğini içerir; bu yüzden
    /// kimlik uyuşmazlık kontrolüne tabidir. Ruhsat (VehicleRegistration) araç belgesi
    /// olduğu için bu kontrolün dışındadır.
    /// </summary>
    private static bool IsPersonalDocument(DocumentType type)
        => type is DocumentType.DriverLicense
                or DocumentType.SrcCertificate
                or DocumentType.Psychotechnical;

    // ── Yardımcı (v2.5.2): OCR kimlik bilgisi kullanıcı ile eşleşiyor mu ─────
    private static bool IdentityMatchesUser(DocumentOcrResultDto ocr, User user)
        => FullNamesMatch(ocr.FullName, user.FullName)
        && IdentityNumbersMatch(ocr.IdNumber, user.TaxNumberOrTCKN);

    // ── Yardımcı (v2.5.2): Türkçe-duyarlı ad-soyad eşleştirme ────────────────
    /// <summary>
    /// OCR'dan gelen ad-soyad ile kullanıcı kaydındaki ad-soyadı büyük/küçük harf ve
    /// Türkçe karakter (İ/ı, Ç, Ğ, Ö, Ş, Ü) farkından bağımsız biçimde karşılaştırır.
    /// Önce normalize edilir (ASCII'ye indirgeme, çoklu boşluk kırpma), sonra
    /// <c>OrdinalIgnoreCase</c> ile karşılaştırılır.
    /// </summary>
    private static bool FullNamesMatch(string? ocrFullName, string? userFullName)
    {
        if (string.IsNullOrWhiteSpace(ocrFullName) || string.IsNullOrWhiteSpace(userFullName))
            return false;

        string a = NormalizeName(ocrFullName);
        string b = NormalizeName(userFullName);
        return string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
    }

    // ── Yardımcı (v2.5.2): TC Kimlik No eşleştirme ───────────────────────────
    /// <summary>
    /// İki kimlik numarasını sadece rakamlar üzerinden karşılaştırır (boşluk/tire
    /// gibi süsleri göz ardı eder). 11 haneden farklıysa geçersiz sayılır.
    /// </summary>
    private static bool IdentityNumbersMatch(string? ocrId, string? userId)
    {
        if (string.IsNullOrWhiteSpace(ocrId) || string.IsNullOrWhiteSpace(userId))
            return false;

        string digitsOcr  = new string(ocrId.Where(char.IsDigit).ToArray());
        string digitsUser = new string(userId.Where(char.IsDigit).ToArray());

        return digitsOcr.Length == 11
            && digitsUser.Length == 11
            && string.Equals(digitsOcr, digitsUser, StringComparison.Ordinal);
    }

    // ── Yardımcı (v2.5.2): Türkçe karakter normalizasyonu ────────────────────
    /// <summary>
    /// Türkçe karakterleri ASCII karşılıklarına çevirir, birden çok boşluğu teke
    /// indirger, baş/son boşlukları kırpar ve sonucu büyük harfe (invariant) getirir.
    /// Böylece "İbrahim Öztürk" ile "IBRAHIM OZTURK" gibi varyasyonlar eşleşir.
    /// </summary>
    private static string NormalizeName(string input)
    {
        var sb = new StringBuilder(input.Length);
        bool lastWasSpace = false;

        foreach (char c in input.Trim())
        {
            char mapped = c switch
            {
                'İ' or 'I' or 'ı' or 'i' => 'I',
                'Ç' or 'ç'               => 'C',
                'Ğ' or 'ğ'               => 'G',
                'Ö' or 'ö'               => 'O',
                'Ş' or 'ş'               => 'S',
                'Ü' or 'ü'               => 'U',
                _                        => char.ToUpperInvariant(c)
            };

            if (char.IsWhiteSpace(mapped))
            {
                if (lastWasSpace) continue;
                lastWasSpace = true;
                sb.Append(' ');
            }
            else
            {
                lastWasSpace = false;
                sb.Append(mapped);
            }
        }

        return sb.ToString();
    }

    // ── Yardımcı (v2.5.5): Log'larda PII maskeleme ────────────────────────────
    /// <summary>
    /// <b>KVKK Data Masking.</b> Log'lara kişisel veri (Ad-Soyad, TCKN gibi) düz
    /// metin olarak yazılmaz. Bu helper, boşluklarla ayrılmış her kelimenin ilk
    /// harfini bırakıp kalanını <c>*</c> karakteriyle değiştirir. Örn:
    /// <list type="bullet">
    ///   <item>"Ahmet Yılmaz"  → "A**** Y*****"</item>
    ///   <item>"12345678901"   → "1*********1" (TCKN)</item>
    ///   <item>null / ""       → "[null]"</item>
    /// </list>
    /// Teşhis/iz sürme için yeterlidir, kimlik inference için yetersizdir.
    /// </summary>
    internal static string MaskPii(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "[null]";

        var trimmed = value.Trim();

        // Sayısal veri (TCKN vb.): ilk + son karakter açık, arası yıldız
        if (trimmed.All(char.IsDigit))
        {
            if (trimmed.Length <= 2) return new string('*', trimmed.Length);
            return trimmed[0] + new string('*', trimmed.Length - 2) + trimmed[^1];
        }

        // İsim / çok kelimeli değer: her kelime için ilk harfi tut, kalanı maskele
        var parts = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var masked = parts.Select(p =>
            p.Length <= 1
                ? p
                : p[0] + new string('*', p.Length - 1));

        return string.Join(' ', masked);
    }

    // ── Yardımcı: Response DTO inşası ─────────────────────────────────────────
    //
    // overrideMessage parametresi v2.5.6 ile eklendi: Gri alan senaryosunda
    // Gemini'nin teknik ValidationMessage'ı yerine, şoföre gösterilecek net UX
    // metni (MsgPendingReview) geçirilir. Diğer tüm çağrılar parametresiz çalışır.
    private static DriverDocumentUploadResultDto BuildResponse(
        User                  user,
        DocumentType          documentType,
        DocumentOcrResultDto? ocr,
        string?               overrideMessage = null)
    {
        var classes = ocr?.DocumentClasses ?? Array.Empty<string>();
        return new DriverDocumentUploadResultDto(
            DocumentType:      documentType,
            IsDocumentValid:   ocr?.IsValid ?? false,
            ValidationMessage: overrideMessage
                               ?? ocr?.ValidationMessage
                               ?? user.LastValidationMessage,
            ApprovalStatus:    user.ApprovalStatus,
            IsAccountActive:   user.IsActive,
            ExpiryDate:        ocr?.ExpiryDate,
            DocumentClasses:   classes);
    }
}
