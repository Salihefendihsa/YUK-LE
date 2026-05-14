using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs;

public sealed class ForgotPasswordRequest
{
    [Required(ErrorMessage = "Telefon numarası zorunludur.")]
    [RegularExpression(@"^\d{10,15}$", ErrorMessage = "Geçerli bir telefon numarası giriniz.")]
    public string Phone { get; set; } = string.Empty;
}

public sealed class ResetPasswordRequest
{
    [Required(ErrorMessage = "Telefon numarası zorunludur.")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "OTP kodu zorunludur.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "OTP 6 haneli olmalıdır.")]
    public string OtpCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Yeni şifre zorunludur.")]
    [MinLength(8, ErrorMessage = "Şifre en az 8 karakter olmalıdır.")]
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class ChangePasswordRequest
{
    [Required(ErrorMessage = "Mevcut şifre zorunludur.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Yeni şifre zorunludur.")]
    [MinLength(8, ErrorMessage = "Şifre en az 8 karakter olmalıdır.")]
    public string NewPassword { get; set; } = string.Empty;
}
