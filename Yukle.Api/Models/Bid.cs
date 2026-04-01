using System;

namespace Yukle.Api.Models
{
    public class Bid
    {
        // Kimlik & İlişki
        public int Id { get; set; }
        public int LoadId { get; set; }
        public Load Load { get; set; } = null!;

        public int DriverId { get; set; }
        public User Driver { get; set; } = null!;

        // Finansal Detaylar
        public decimal Amount { get; set; }

        // Durum ve Zaman
        public BidStatus Status { get; set; } = BidStatus.Pending;
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
