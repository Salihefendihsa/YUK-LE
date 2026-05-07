using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs;

public sealed class GoogleLoginDto
{
    [Required(ErrorMessage = "Google kimlik belirteci zorunludur.")]
    public string IdToken { get; set; } = string.Empty;
}
