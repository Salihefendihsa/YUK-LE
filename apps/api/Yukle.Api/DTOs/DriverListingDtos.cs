using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Yukle.Api.Models;

namespace Yukle.Api.DTOs;

/// <summary>
/// Şoförün "Boş Araç" ilanı oluşturması için kullanılan veri transfer nesnesi.
/// Koordinat sırası CreateLoadDto ile aynı: Latitude/Longitude ayrı alanlar.
/// </summary>
public sealed class CreateDriverListingDto : IValidatableObject
{
    // ── Çıkış ─────────────────────────────────────────────────────────────────
    [Required(ErrorMessage = "Çıkış şehri zorunludur.")]
    [StringLength(100, ErrorMessage = "Çıkış şehri en fazla 100 karakter olabilir.")]
    public string OriginCity { get; set; } = string.Empty;

    [Required(ErrorMessage = "Çıkış ilçesi zorunludur.")]
    [StringLength(100, ErrorMessage = "Çıkış ilçesi en fazla 100 karakter olabilir.")]
    public string OriginDistrict { get; set; } = string.Empty;

    [Required(ErrorMessage = "Çıkış noktası enlemi zorunludur.")]
    [Range(-90.0, 90.0, ErrorMessage = "Çıkış enlemi -90 ile 90 arasında olmalıdır.")]
    public double OriginLatitude { get; set; }

    [Required(ErrorMessage = "Çıkış noktası boylamı zorunludur.")]
    [Range(-180.0, 180.0, ErrorMessage = "Çıkış boylamı -180 ile 180 arasında olmalıdır.")]
    public double OriginLongitude { get; set; }

    // ── Varış ─────────────────────────────────────────────────────────────────
    [Required(ErrorMessage = "Varış şehri zorunludur.")]
    [StringLength(100, ErrorMessage = "Varış şehri en fazla 100 karakter olabilir.")]
    public string DestinationCity { get; set; } = string.Empty;

    [Required(ErrorMessage = "Varış ilçesi zorunludur.")]
    [StringLength(100, ErrorMessage = "Varış ilçesi en fazla 100 karakter olabilir.")]
    public string DestinationDistrict { get; set; } = string.Empty;

    [Required(ErrorMessage = "Varış noktası enlemi zorunludur.")]
    [Range(-90.0, 90.0, ErrorMessage = "Varış enlemi -90 ile 90 arasında olmalıdır.")]
    public double DestinationLatitude { get; set; }

    [Required(ErrorMessage = "Varış noktası boylamı zorunludur.")]
    [Range(-180.0, 180.0, ErrorMessage = "Varış boylamı -180 ile 180 arasında olmalıdır.")]
    public double DestinationLongitude { get; set; }

    // ── Müsaitlik & Araç ────────────────────────────────────────────────────────
    [Required(ErrorMessage = "Müsaitlik tarihi zorunludur.")]
    public DateTime AvailableFrom { get; set; }

    [Required(ErrorMessage = "Araç tipi zorunludur.")]
    public VehicleType VehicleType { get; set; }

    [StringLength(200, ErrorMessage = "Kapasite notu en fazla 200 karakter olabilir.")]
    public string? CapacityNote { get; set; }

    [StringLength(1000, ErrorMessage = "Not en fazla 1000 karakter olabilir.")]
    public string? Notes { get; set; }

    // ── Çapraz alan doğrulama ───────────────────────────────────────────────────
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (AvailableFrom.Date < DateTime.UtcNow.Date)
            yield return new ValidationResult(
                "Müsaitlik tarihi bugünden önce olamaz.",
                [nameof(AvailableFrom)]);
    }
}

/// <summary>Şoför "Boş Araç" ilanının liste/detay görünümü.</summary>
public sealed class DriverListingDto
{
    public Guid Id { get; set; }

    public int DriverId { get; set; }
    public string DriverName { get; set; } = string.Empty;

    public string OriginCity { get; set; }     = string.Empty;
    public string OriginDistrict { get; set; } = string.Empty;
    // NTS convention: Origin.Y = enlem, Origin.X = boylam
    public double OriginLat { get; set; }
    public double OriginLng { get; set; }

    public string DestinationCity { get; set; }     = string.Empty;
    public string DestinationDistrict { get; set; } = string.Empty;
    public double DestinationLat { get; set; }
    public double DestinationLng { get; set; }

    public DateTime AvailableFrom { get; set; }
    public string VehicleType { get; set; } = string.Empty;

    public string? CapacityNote { get; set; }
    public string? Notes { get; set; }

    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
