using System;
using NetTopologySuite.Geometries;

namespace Yukle.Api.Models
{
    public class Load
    {
        // Kimlik & İlişki
        public int Id { get; set; }
        public int OwnerId { get; set; }
        public User Owner { get; set; } = null!;

        public int? DriverId { get; set; }
        public User? Driver { get; set; }

        public int? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        // Mekânsal Veriler (PostGIS / NetTopologySuite)
        public Point Origin { get; set; } = null!;
        public Point Destination { get; set; } = null!;
        public string OriginAddress { get; set; } = string.Empty;
        public string DestinationAddress { get; set; } = string.Empty;

        // Yük ve Finans
        public string Title { get; set; } = string.Empty;
        public decimal Weight { get; set; }
        public decimal Volume { get; set; }
        public decimal Price { get; set; }

        public CargoType Type { get; set; }
        public LoadStatus Status { get; set; } = LoadStatus.Active;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PickupDate { get; set; }

        // Navigation Property: Bu yüke gelen teklifler
        public ICollection<Bid> Bids { get; set; } = new List<Bid>();
    }
}
