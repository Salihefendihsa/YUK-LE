using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs
{
    public class UserLoginDto
    {
        [Required(ErrorMessage = "Telefon numarası veya e-posta alanı zorunludur.")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre alanı zorunludur.")]
        public string Password { get; set; } = string.Empty;
    }
}
