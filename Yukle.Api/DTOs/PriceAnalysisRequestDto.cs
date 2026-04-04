using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs;

/// <summary>
/// Gemini AI navlun fiyat analizi istek gövdesi.
/// <para>
/// <b>Akıllı Mod</b> (önerilen): <c>OriginLat/Lng</c> + <c>DestLat/Lng</c> + <c>FromCity</c> + <c>ToCity</c>
/// verilirse OSRM mesafe hesaplar, DB'den güncel mazot fiyatını çeker — elle girişe gerek kalmaz.
/// </para>
/// <para>
/// <b>Manuel Mod</b> (geriye dönük uyumluluk): <c>Distance</c> ve <c>FuelPrice</c> doğrudan girilir.
/// </para>
/// </summary>
public class PriceAnalysisRequestDto
{
    // ── Araç & Yük (her iki modda zorunlu) ───────────────────────────────────

    [Required(ErrorMessage = "Araç tipi zorunludur (TIR, Kamyon, Kamyonet, Panelvan).")]
    public string VehicleType { get; set; } = string.Empty;

    [Required]
    [Range(0.01, 50_000, ErrorMessage = "Ağırlık 0,01 ile 50.000 kg arasında olmalıdır.")]
    public double Weight { get; set; }

    // ── Akıllı Mod: Koordinatlar (opsiyonel, OSRM mesafesi için) ─────────────

    /// <summary>Kalkış enlemi. <c>DestLat/Lng</c> ile birlikte verilirse OSRM sorgulanır.</summary>
    public double? OriginLat { get; set; }

    /// <summary>Kalkış boylamı.</summary>
    public double? OriginLng { get; set; }

    /// <summary>Varış enlemi.</summary>
    public double? DestLat { get; set; }

    /// <summary>Varış boylamı.</summary>
    public double? DestLng { get; set; }

    /// <summary>
    /// Kalkış ili — DB'den yakıt fiyatı çekmek ve Gemini'ye bölgesel bağlam vermek için kullanılır.
    /// Akıllı mod için önerilir.
    /// </summary>
    public string? FromCity { get; set; }

    /// <summary>Varış ili — Gemini'ye güzergah bağlamı için kullanılır.</summary>
    public string? ToCity { get; set; }

    // ── Manuel Mod: Elle Girilen Değerler (opsiyonel, fallback) ──────────────

    /// <summary>
    /// Karayolu mesafesi (km). Koordinat verilmezse zorunludur.
    /// Koordinat verilirse bu değer göz ardı edilir.
    /// </summary>
    [Range(1, 20_000, ErrorMessage = "Mesafe 1 ile 20.000 km arasında olmalıdır.")]
    public double? Distance { get; set; }

    /// <summary>
    /// Yakıt fiyatı (TL/litre). <c>null</c> bırakılırsa DB'den güncel fiyat otomatik çekilir.
    /// </summary>
    [Range(0.01, 500, ErrorMessage = "Yakıt fiyatı 0,01 ile 500 TL/litre arasında olmalıdır.")]
    public decimal? FuelPrice { get; set; }

    // ── Ek Bağlam ─────────────────────────────────────────────────────────────

    /// <summary>
    /// İsteğe bağlı güzergah bağlamı (FromCity/ToCity'den türetilir, elle de girilebilir).
    /// Ör: "Doğu Anadolu dağlık arazi", "İstanbul şehir içi trafiği".
    /// </summary>
    public string? Route { get; set; }

    // ── Yardımcı: Koordinat seti tam mı? ────────────────────────────────────

    /// <summary>Dört koordinat alanı da dolu mu?</summary>
    public bool HasCoordinates =>
        OriginLat.HasValue && OriginLng.HasValue &&
        DestLat.HasValue   && DestLng.HasValue;
}
