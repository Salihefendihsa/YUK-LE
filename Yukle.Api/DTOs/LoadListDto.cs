using System;
using Yukle.Api.Models;

namespace Yukle.Api.DTOs;

/// <summary>
/// Yük listeleme ekranı için özet bilgi. Navigation property yüklemeden
/// doğrudan projeksiyon ile doldurulur; gereksiz JOIN'leri önler.
/// </summary>
public class LoadListDto
{
    public Guid   Id              { get; set; }

    // Rota özeti
    public string FromCity        { get; set; } = string.Empty;
    public string FromDistrict    { get; set; } = string.Empty;
    public string ToCity          { get; set; } = string.Empty;
    public string ToDistrict      { get; set; } = string.Empty;

    // Yük özeti
    public string Description     { get; set; } = string.Empty;
    public double Weight          { get; set; }
    public double Volume          { get; set; }
    public LoadType Type          { get; set; }

    // Zamanlama
    public DateTime PickupDate    { get; set; }
    public DateTime DeliveryDate  { get; set; }
    public DateTime CreatedAt     { get; set; }

    // Finansal
    public decimal Price          { get; set; }
    public string  Currency       { get; set; } = "TRY";

    // Durum
    public LoadStatus Status      { get; set; }

    // Sahip bilgisi
    public int    OwnerId         { get; set; }
    public string OwnerFullName   { get; set; } = string.Empty;

    // Atanan şoför (null → henüz şoför yok)
    public int?   DriverId        { get; set; }

    // Hedef koordinatlar — Haversine varış hesabı için gerekli
    // NTS convention: Destination.Y = enlem, Destination.X = boylam
    public double DestinationLat  { get; set; }
    public double DestinationLng  { get; set; }

    // Teklif sayısı (opsiyonel özet bilgi)
    public int BidCount           { get; set; }
}
