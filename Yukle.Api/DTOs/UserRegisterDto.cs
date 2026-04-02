using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs
{
    public class UserRegisterDto
    {
        [Required(ErrorMessage = "Ad Soyad alanı zorunludur.")]
        [StringLength(100, ErrorMessage = "Ad Soyad en fazla 100 karakter olabilir.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Telefon numarası zorunludur.")]
        [RegularExpression(@"^\d{10,15}$", ErrorMessage = "Lütfen geçerli bir telefon numarası giriniz (sadece rakamlar, 10-15 hane arası).")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "E-posta adresi zorunludur.")]
        [EmailAddress(ErrorMessage = "Lütfen geçerli bir e-posta adresi giriniz.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre zorunludur.")]
        [MinLength(6, ErrorMessage = "Şifre en az 6 karakter olmalıdır.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Rol alanı zorunludur.")]
        public string Role { get; set; } = "Customer"; // Beklenen Değerler: Customer, Driver

        [Required(ErrorMessage = "Kurumsal hesap durumu belirtilmelidir.")]
        public bool IsCorporate { get; set; }

        [Required(ErrorMessage = "Vergi Numarası veya TCKN zorunludur.")]
        public string TaxNumberOrTCKN { get; set; } = string.Empty;
    }
}
