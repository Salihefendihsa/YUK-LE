using System;

namespace Yukle.Api.Models
{
    public enum UserRole
    {
        Customer,
        Driver,
        Admin
    }

    public enum ApprovalStatus
    {
        Pending,
        Approved,
        Rejected
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

        // Iyzico Entegrasyon Katmanı
        public string? SubMerchantKey { get; set; }

        // Yapay Zeka Onay Mekanizması
        public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;

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
