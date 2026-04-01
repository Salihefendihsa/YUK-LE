using Yukle.Api.Models;

namespace Yukle.Api.DTOs;

public class CreateLoadDto
{
    public string Title { get; set; } = string.Empty;
    public int OwnerId { get; set; }
    public decimal Weight { get; set; }
    public decimal Volume { get; set; }
    public decimal Price { get; set; }
    public CargoType Type { get; set; }

    // Mekânsal: Koordinatlar
    public double OriginLat { get; set; }
    public double OriginLng { get; set; }
    public string OriginAddress { get; set; } = string.Empty;

    public double DestLat { get; set; }
    public double DestLng { get; set; }
    public string DestinationAddress { get; set; } = string.Empty;
}
