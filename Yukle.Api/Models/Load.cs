using NetTopologySuite.Geometries;

namespace Yukle.Api.Models;

public class Load
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Weight { get; set; }

    
    public string OriginAddress { get; set; } = string.Empty;
    public Point? OriginLocation { get; set; }
    
    public string DestinationAddress { get; set; } = string.Empty;
    public Point? DestinationLocation { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
