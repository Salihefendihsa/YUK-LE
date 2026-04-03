using System;
using System.ComponentModel.DataAnnotations;
using Yukle.Api.Models;

namespace Yukle.Api.DTOs;

public class LoadCreateDto
{
    // ── Rota ──────────────────────────────────────────────────────────────────
    [Required(ErrorMessage = "Yükleme şehri zorunludur.")]
    [StringLength(100, ErrorMessage = "Yükleme şehri en fazla 100 karakter olabilir.")]
    public string FromCity { get; set; } = string.Empty;

    [Required(ErrorMessage = "Yükleme ilçesi zorunludur.")]
    [StringLength(100, ErrorMessage = "Yükleme ilçesi en fazla 100 karakter olabilir.")]
    public string FromDistrict { get; set; } = string.Empty;

    [Required(ErrorMessage = "Teslimat şehri zorunludur.")]
    [StringLength(100, ErrorMessage = "Teslimat şehri en fazla 100 karakter olabilir.")]
    public string ToCity { get; set; } = string.Empty;

    [Required(ErrorMessage = "Teslimat ilçesi zorunludur.")]
    [StringLength(100, ErrorMessage = "Teslimat ilçesi en fazla 100 karakter olabilir.")]
    public string ToDistrict { get; set; } = string.Empty;

    // ── Özellikler ────────────────────────────────────────────────────────────
    [Required(ErrorMessage = "Yük açıklaması zorunludur.")]
    [StringLength(500, MinimumLength = 10, ErrorMessage = "Açıklama 10–500 karakter arasında olmalıdır.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Ağırlık zorunludur.")]
    [Range(0.01, 50_000, ErrorMessage = "Ağırlık 0,01 ile 50.000 kg arasında olmalıdır.")]
    public double Weight { get; set; }

    [Required(ErrorMessage = "Hacim zorunludur.")]
    [Range(0.01, 10_000, ErrorMessage = "Hacim 0,01 ile 10.000 m³ arasında olmalıdır.")]
    public double Volume { get; set; }

    [Required(ErrorMessage = "Yük türü zorunludur.")]
    public LoadType Type { get; set; }

    public VehicleType? RequiredVehicleType { get; set; }

    // ── Zamanlama ─────────────────────────────────────────────────────────────
    [Required(ErrorMessage = "Alım tarihi zorunludur.")]
    public DateTime PickupDate { get; set; }

    [Required(ErrorMessage = "Teslim tarihi zorunludur.")]
    public DateTime DeliveryDate { get; set; }

    // ── Finansal ──────────────────────────────────────────────────────────────
    [Required(ErrorMessage = "Fiyat zorunludur.")]
    [Range(0.01, 10_000_000, ErrorMessage = "Fiyat 0,01 ile 10.000.000 TRY arasında olmalıdır.")]
    public decimal Price { get; set; }

    [StringLength(3, MinimumLength = 3, ErrorMessage = "Para birimi 3 karakterli ISO kodu olmalıdır (örn. TRY, USD).")]
    public string Currency { get; set; } = "TRY";

    // ── Sahiplik ──────────────────────────────────────────────────────────────
    [Required(ErrorMessage = "Kullanıcı kimliği zorunludur.")]
    public int UserId { get; set; }
}
