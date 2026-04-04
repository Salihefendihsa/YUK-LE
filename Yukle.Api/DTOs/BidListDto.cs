using System;

namespace Yukle.Api.DTOs;

/// <summary>
/// Yük sahibinin kendi ilanına gelen teklifleri görüntülemesi için özet DTO.
/// Şoför kimlik bilgileri (ad, telefon) de dahildir.
/// </summary>
public sealed class BidListDto
{
    public int      Id             { get; set; }
    public decimal  Amount         { get; set; }
    public string?  Note           { get; set; }
    public DateTime OfferDate      { get; set; }
    public string   Status         { get; set; } = string.Empty;

    // Teklifi veren şoförün özet bilgileri
    public string   DriverFullName { get; set; } = string.Empty;
    public string   DriverPhone    { get; set; } = string.Empty;
}
