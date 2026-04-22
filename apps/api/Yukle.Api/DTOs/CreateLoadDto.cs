using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Yukle.Api.Models;

namespace Yukle.Api.DTOs;

/// <summary>
/// Yeni yük ilanı oluşturmak için kullanılan veri transfer nesnesi.
/// Tüm koordinat, rota, yük özelliği ve zamanlama alanlarını kapsar.
/// </summary>
public sealed class CreateLoadDto : IValidatableObject
{
    // ── Çıkış Noktası ─────────────────────────────────────────────────────────

    [Required(ErrorMessage = "Yükleme şehri zorunludur.")]
    [StringLength(100, ErrorMessage = "Yükleme şehri en fazla 100 karakter olabilir.")]
    public string FromCity { get; set; } = string.Empty;

    [Required(ErrorMessage = "Yükleme ilçesi zorunludur.")]
    [StringLength(100, ErrorMessage = "Yükleme ilçesi en fazla 100 karakter olabilir.")]
    public string FromDistrict { get; set; } = string.Empty;

    // ── Varış Noktası ─────────────────────────────────────────────────────────

    [Required(ErrorMessage = "Teslimat şehri zorunludur.")]
    [StringLength(100, ErrorMessage = "Teslimat şehri en fazla 100 karakter olabilir.")]
    public string ToCity { get; set; } = string.Empty;

    [Required(ErrorMessage = "Teslimat ilçesi zorunludur.")]
    [StringLength(100, ErrorMessage = "Teslimat ilçesi en fazla 100 karakter olabilir.")]
    public string ToDistrict { get; set; } = string.Empty;

    // ── GPS Koordinatları ─────────────────────────────────────────────────────

    [Required(ErrorMessage = "Yükleme noktası enlemi zorunludur.")]
    [Range(-90.0, 90.0, ErrorMessage = "Yükleme enlemi -90 ile 90 arasında olmalıdır.")]
    public double FromLatitude { get; set; }

    [Required(ErrorMessage = "Yükleme noktası boylamı zorunludur.")]
    [Range(-180.0, 180.0, ErrorMessage = "Yükleme boylamı -180 ile 180 arasında olmalıdır.")]
    public double FromLongitude { get; set; }

    [Required(ErrorMessage = "Teslimat noktası enlemi zorunludur.")]
    [Range(-90.0, 90.0, ErrorMessage = "Teslimat enlemi -90 ile 90 arasında olmalıdır.")]
    public double ToLatitude { get; set; }

    [Required(ErrorMessage = "Teslimat noktası boylamı zorunludur.")]
    [Range(-180.0, 180.0, ErrorMessage = "Teslimat boylamı -180 ile 180 arasında olmalıdır.")]
    public double ToLongitude { get; set; }

    // ── Yük Özellikleri ───────────────────────────────────────────────────────

    [StringLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Ağırlık zorunludur.")]
    [Range(0.1, 100_000, ErrorMessage = "Ağırlık 0,1 ile 100.000 kg arasında olmalıdır.")]
    public double Weight { get; set; }

    /// <summary>Metreküp cinsinden hacim. Opsiyoneldir.</summary>
    [Range(0.01, 10_000, ErrorMessage = "Hacim 0,01 ile 10.000 m³ arasında olmalıdır.")]
    public double? Volume { get; set; }

    /// <summary>Ondalık hassasiyeti 18,2 olan fiyat bilgisi.</summary>
    [Required(ErrorMessage = "Fiyat zorunludur.")]
    [Range(0.01, 10_000_000, ErrorMessage = "Fiyat 0,01 ile 10.000.000 arasında olmalıdır.")]
    public decimal Price { get; set; }

    /// <summary>ISO 4217 para birimi kodu. Varsayılan: TRY.</summary>
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Para birimi 3 karakterli ISO kodu olmalıdır (örn. TRY, USD, EUR).")]
    public string Currency { get; set; } = "TRY";

    // ── Zamanlama ─────────────────────────────────────────────────────────────

    [Required(ErrorMessage = "Alım tarihi zorunludur.")]
    public DateTime PickupDate { get; set; }

    [Required(ErrorMessage = "Teslim tarihi zorunludur.")]
    public DateTime DeliveryDate { get; set; }

    // ── Yük ve Araç Tipleri ───────────────────────────────────────────────────

    [Required(ErrorMessage = "Araç tipi zorunludur.")]
    public VehicleType RequiredVehicleType { get; set; }

    [Required(ErrorMessage = "Yük türü zorunludur.")]
    public LoadType LoadType { get; set; }

    // ── IValidatableObject ────────────────────────────────────────────────────

    /// <summary>
    /// DataAnnotations kapsamı dışında kalan çapraz alan doğrulamaları.
    /// - PickupDate bugünden önce olamaz.
    /// - DeliveryDate, PickupDate'den önce olamaz.
    /// </summary>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var today = DateTime.UtcNow.Date;

        if (PickupDate.Date < today)
            yield return new ValidationResult(
                "Alım tarihi bugünden önce olamaz.",
                [nameof(PickupDate)]);

        if (DeliveryDate.Date < PickupDate.Date)
            yield return new ValidationResult(
                "Teslim tarihi, alım tarihinden önce olamaz.",
                [nameof(DeliveryDate)]);
    }
}
