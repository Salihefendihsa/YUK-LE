using System;
using System.Collections.Generic;

namespace Yukle.Api.Models;

public class Load
{
    // ── Kimlik ────────────────────────────────────────────────────────────────
    public Guid Id { get; set; } = Guid.NewGuid();

    // ── Rota ──────────────────────────────────────────────────────────────────
    public string FromCity { get; set; }     = string.Empty;
    public string FromDistrict { get; set; } = string.Empty;
    public string ToCity { get; set; }       = string.Empty;
    public string ToDistrict { get; set; }   = string.Empty;

    // ── Özellikler ────────────────────────────────────────────────────────────
    public string Description { get; set; } = string.Empty;
    public double Weight { get; set; }
    public double Volume { get; set; }
    public LoadType Type { get; set; }
    public VehicleType? RequiredVehicleType { get; set; }

    // ── Zamanlama ─────────────────────────────────────────────────────────────
    public DateTime PickupDate { get; set; }
    public DateTime DeliveryDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Finansal ──────────────────────────────────────────────────────────────
    public decimal Price { get; set; }
    public string Currency { get; set; } = "TRY";

    // ── Durum ─────────────────────────────────────────────────────────────────
    public LoadStatus Status { get; set; } = LoadStatus.Active;

    // ── İlişkiler ─────────────────────────────────────────────────────────────
    public int UserId { get; set; }
    public User Owner { get; set; } = null!;

    public int? DriverId { get; set; }
    public User? Driver { get; set; }

    public int? VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }

    // Navigation: Bu yüke gelen teklifler
    public ICollection<Bid> Bids { get; set; } = new List<Bid>();
}
