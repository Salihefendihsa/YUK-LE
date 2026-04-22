using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs
{
    public class UserLoginDto
    {
        [Required(ErrorMessage = "Telefon numarası alanı zorunludur.")]
        [RegularExpression(@"^\d{10,15}$", ErrorMessage = "Lütfen geçerli bir telefon numarası giriniz (sadece rakamlar, 10-15 hane arası).")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre alanı zorunludur.")]
        public string Password { get; set; } = string.Empty;
    }
}
