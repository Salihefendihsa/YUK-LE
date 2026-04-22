using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs;

public class DeliverRequestDto
{
    [Required]
    public double TargetLat { get; set; }

    [Required]
    public double TargetLng { get; set; }

    [Required]
    public string QrToken { get; set; } = string.Empty;
}
