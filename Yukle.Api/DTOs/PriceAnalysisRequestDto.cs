using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs;

public class PriceAnalysisRequestDto
{
    [Required(ErrorMessage = "Rota zorunludur (örn. 'İstanbul/Kadıköy → Ankara/Çankaya').")]
    public string Route { get; set; } = string.Empty;

    [Required]
    [Range(0.01, 50_000, ErrorMessage = "Ağırlık 0,01 ile 50.000 kg arasında olmalıdır.")]
    public double Weight { get; set; }

    [Required(ErrorMessage = "Yük türü zorunludur.")]
    public string CargoType { get; set; } = string.Empty;
}
