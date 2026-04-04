using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

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

    // ── Coğrafi Koordinatlar (PostGIS — SRID 4326) ────────────────────────────
    /// <summary>Yükün çıkış noktası. geometry(Point, 4326) olarak saklanır.</summary>
    public Point Origin { get; set; } = null!;

    /// <summary>Yükün varış noktası. geometry(Point, 4326) olarak saklanır.</summary>
    public Point Destination { get; set; } = null!;

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

    // ── Gemini AI Fiyat Analizi ───────────────────────────────────────────────
    /// <summary>Gemini'nin önerdiği "Adil Navlun" orta noktası. Null = henüz analiz yapılmadı.</summary>
    public decimal? AiSuggestedPrice { get; set; }

    /// <summary>Gemini'nin hesapladığı şoför kırmızı çizgisi (MinPrice).</summary>
    public decimal? AiMinPrice { get; set; }

    /// <summary>Gemini'nin hesapladığı piyasa tavanı (MaxPrice).</summary>
    public decimal? AiMaxPrice { get; set; }

    /// <summary>Gemini'nin fiyat gerekçesi — yakıt payı, zorluk payı, şoför net karı.</summary>
    public string? AiPriceReasoning { get; set; }

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
