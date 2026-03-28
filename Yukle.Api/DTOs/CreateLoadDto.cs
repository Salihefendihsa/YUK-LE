namespace Yukle.Api.DTOs;

public class CreateLoadDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Weight { get; set; }
    
    public double OriginLat { get; set; }
    public double OriginLng { get; set; }
    
    public double DestLat { get; set; }
    public double DestLng { get; set; }
}
