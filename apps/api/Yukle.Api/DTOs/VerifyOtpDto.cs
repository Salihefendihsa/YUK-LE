using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs;

public class VerifyOtpDto
{
    [Required(ErrorMessage = "Telefon numarası zorunludur.")]
    [RegularExpression(@"^\d{10,15}$", ErrorMessage = "Geçerli bir telefon numarası giriniz.")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Doğrulama kodu zorunludur.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Kod 6 haneli rakam olmalıdır.")]
    public string Code { get; set; } = string.Empty;
}
