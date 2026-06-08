using System;
using NetTopologySuite.Geometries;

namespace Yukle.Api.Models;

/// <summary>
/// Şoför "Boş Araç" ilanı — şoför, belirli bir güzergâh ve müsaitlik için boş aracını
/// ilan eder. Müşteri bu ilanı görüp (sonraki dalga) teklif verebilir.
/// Coğrafi alanlar <see cref="Load"/> ile BİREBİR aynı kalıptadır:
/// NTS <c>Point</c>, SRID 4326, koordinat sırası (Longitude=X, Latitude=Y).
/// </summary>
public class DriverListing
{
    // ── Kimlik ────────────────────────────────────────────────────────────────
    public Guid Id { get; set; } = Guid.NewGuid();

    // ── Sahip (şoför) ───────────────────────────────────────────────────────────
    public int DriverId { get; set; }
    public User Driver { get; set; } = null!;

    // ── Çıkış ─────────────────────────────────────────────────────────────────
    public string OriginCity { get; set; }     = string.Empty;
    public string OriginDistrict { get; set; } = string.Empty;

    /// <summary>Boş aracın bulunduğu/çıkış noktası. geometry(Point, 4326) olarak saklanır.</summary>
    public Point Origin { get; set; } = null!;

    // ── Varış ─────────────────────────────────────────────────────────────────
    public string DestinationCity { get; set; }     = string.Empty;
    public string DestinationDistrict { get; set; } = string.Empty;

    /// <summary>Gitmeyi hedeflediği varış noktası. geometry(Point, 4326) olarak saklanır.</summary>
    public Point Destination { get; set; } = null!;

    // ── Müsaitlik & Araç ────────────────────────────────────────────────────────
    public DateTime AvailableFrom { get; set; }
    public VehicleType VehicleType { get; set; }

    /// <summary>Kapasite notu (örn. "10 ton / 20 m³ boş"). Opsiyonel.</summary>
    public string? CapacityNote { get; set; }

    /// <summary>Serbest not. Opsiyonel.</summary>
    public string? Notes { get; set; }

    // ── Durum ─────────────────────────────────────────────────────────────────
    public DriverListingStatus Status { get; set; } = DriverListingStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
