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
        ManualApprovalRequired
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
