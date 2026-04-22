using System;

namespace Yukle.Api.Models
{
    public enum UserRole
    {
        Customer,
        Driver,
        Admin
    }

    /// <summary>
    /// Şoför/kullanıcı hesabının Gemini AI tabanlı belge denetim yaşam döngüsü.
    /// </summary>
    public enum ApprovalStatus
    {
        /// <summary>Henüz evrak yüklenmemiş veya denetim bekleniyor.</summary>
        Pending,

        /// <summary>Tekil bir belge AI tarafından onaylandı; tüm belgeler tamamlanmadı.</summary>
        Approved,

        /// <summary>Bir veya daha fazla belge AI tarafından reddedildi (süre dolmuş, mühür yok, deforme vb.).</summary>
        Rejected,

        /// <summary>Tüm zorunlu belgeler (Ehliyet + SRC + Psikoteknik) AI tarafından onaylandı; hesap aktif.</summary>
        Active,

        /// <summary>AI servisi zaman aşımına uğradı veya teknik hata döndü; operatörün manuel gözden geçirmesi gerekiyor.</summary>
        ManualApprovalRequired,

        /// <summary>
        /// <b>v2.5.6 — Gri Alan.</b> AI servisi çalıştı ancak kararı %100 net değil
        /// (düşük çözünürlük, mühür belirsizliği, confidence 50-85 arası).
        /// Otomatik red yerine admin panelinden manuel inceleme kuyruğuna alınır.
        /// </summary>
        PendingReview
    }

    public class User
    {
        // Erişim ve Güvenlik
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
        public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // SMS / OTP doğrulama
        public string VerificationCode { get; set; } = string.Empty;
        public DateTime? VerificationCodeExpiry { get; set; }
        public bool IsPhoneVerified { get; set; } = false;

        // ── v2.5.4 · Refresh Token Mekanizması ────────────────────────────────
        //
        // Access token kısa ömürlü (7 gün) ve içinde IsActive claim'i olduğu için,
        // şoför evrak onayından sonra yeni bir access token almadan operasyonel
        // uç noktalara erişemez (bkz. 2.5.3 RequireActiveDriver policy).
        //
        // Refresh token burada saklanır ve her /auth/refresh-token çağrısında
        // rotation ile yenilenir (eski token üzerine yazılır → çalınmış bir refresh
        // token en fazla bir kez kullanılabilir). Null ise kullanıcı "oturumu kapalı"
        // sayılır ve yeniden login gerekir.

        /// <summary>
        /// Son login'de (veya son refresh'te) üretilen base64 encoded kriptografik
        /// rastgele dizge. Veritabanında düz metin saklanır çünkü şifre değildir;
        /// çalınması halinde rotation sayesinde tek kullanımlıktır.
        /// </summary>
        public string? RefreshToken { get; set; }

        /// <summary>
        /// Refresh token'ın UTC son geçerlilik zamanı. Aşıldığında refresh isteği
        /// 401 ile reddedilir ve kullanıcı yeniden şifre girmek zorundadır.
        /// </summary>
        public DateTime? RefreshTokenExpiryTime { get; set; }

        // Rol
        public UserRole Role { get; set; }

        // Mali Kimlik ve Vergi Zırhı
        public bool IsCorporate { get; set; }
        public string TaxNumberOrTCKN { get; set; } = string.Empty;

        // Firebase Cloud Messaging — mobil push bildirimleri için cihaz token'ı
        public string? FcmToken { get; set; }

        // Iyzico Entegrasyon Katmanı
        public string? SubMerchantKey { get; set; }

        // ── Yapay Zeka Onay Mekanizması (v2.5.1) ──────────────────────────────
        public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;

        /// <summary>
        /// Hesabın yük kabul edebilir durumda olup olmadığı.
        /// <b>KURAL:</b> Bu alan yalnızca Gemini AI tüm zorunlu belgeleri
        /// <c>IsValid=true</c> olarak işaretledikten sonra <c>true</c> yapılır.
        /// Hiçbir kod yolu AI analizi tamamlanmadan bu alanı <c>true</c>'ya çekemez.
        /// </summary>
        public bool IsActive { get; set; } = false;

        /// <summary>Son AI denetiminin şoföre döndürdüğü sebep mesajı (reddedilirse dolu olur).</summary>
        public string? LastValidationMessage { get; set; }

        // ── v2.5.6 · Manuel Onay & Gri Alan Alanları ──────────────────────────
        //
        // Gemini kararsız kaldığında (düşük çözünürlük, mühür belirsizliği, düşük
        // confidence), hesap Rejected yerine PendingReview statüsüne alınır. Aşağıdaki
        // iki alan admin dashboard'unun (Faz 4.5.5) kullanımı içindir.

        /// <summary>
        /// Operatörün/admin'in manuel inceleme sırasında bırakacağı not.
        /// PendingReview durumu oluştuğunda AI'ın belirsizlik gerekçesi (kullanıcı dostu
        /// özet metin) buraya ön değer olarak yazılır; admin üzerine yazabilir.
        /// </summary>
        public string? AdminReviewNote { get; set; }

        /// <summary>
        /// Gemini'nin kararsız kalma nedenine dair yapılandırılmış detaylar (JSON).
        /// Şema: <c>{ isValid, isSealDetected, confidenceScore, validationMessage,
        /// documentType, timestampUtc }</c>. Admin panelinde teknik delil olarak gösterilir
        /// ve sonraki AI eğitim döngülerinde (evaluation dataset) kullanılabilir.
        /// </summary>
        public string? AiInferenceDetails { get; set; }

        // ── Şoför Belgeleri: Bireysel Onay Durumu ─────────────────────────────
        public bool IsDriverLicenseApproved { get; set; }
        public bool IsSrcApproved           { get; set; }
        public bool IsPsychotechnicalApproved { get; set; }

        // ── Şoför Belgeleri: Geçerlilik Tarihleri ─────────────────────────────
        public DateTime? DriverLicenseExpiry    { get; set; }
        public DateTime? SrcExpiry              { get; set; }
        public DateTime? PsychotechnicalExpiry  { get; set; }

        /// <summary>
        /// Ehliyet/SRC için yetkili araç sınıfları (virgülle ayrılmış, ör. "B,C,CE").
        /// Gemini <c>DocumentClasses</c> dizisinden dönüştürülür.
        /// </summary>
        public string? LicenseClasses { get; set; }

        // Cüzdan ve Finansal Takip
        public decimal WalletBalance { get; set; }
        public decimal PendingBalance { get; set; }

        // Navigation Properties (İlişkisel Koleksiyonlar)
        public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
        public ICollection<Load> OwnedLoads { get; set; } = new List<Load>();
        public ICollection<Load> CarriedLoads { get; set; } = new List<Load>();
        public ICollection<Bid> Bids { get; set; } = new List<Bid>();
    }
}
