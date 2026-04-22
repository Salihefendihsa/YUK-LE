using System;
using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs;

/// <summary>
/// Şoförün bir yük ilanına teklif vermek için gönderdiği veri transfer nesnesi.
/// DriverId güvenlik gereği DTO'ya dahil edilmez; JWT claim'lerinden okunur.
/// </summary>
public sealed class CreateBidDto
{
    [Required(ErrorMessage = "Yük ID'si zorunludur.")]
    public Guid LoadId { get; set; }

    [Required(ErrorMessage = "Teklif tutarı zorunludur.")]
    [Range(0.01, 10_000_000, ErrorMessage = "Teklif tutarı 0,01 ile 10.000.000 arasında olmalıdır.")]
    public decimal Amount { get; set; }

    [StringLength(500, ErrorMessage = "Not en fazla 500 karakter olabilir.")]
    public string? Note { get; set; }
}
