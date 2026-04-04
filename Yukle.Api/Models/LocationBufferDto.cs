namespace Yukle.Api.Models;

/// <summary>
/// Redis'te tamponlanan "son bilinen konum" verisi.
/// Müşteri haritayı ilk açtığında şoför aktif olmasa bile
/// bu kayıt üzerinden araç pozisyonu ekranda gösterilir.
/// </summary>
public sealed record LocationBufferDto(
    double   Lat,
    double   Lng,
    string   DriverId,
    DateTime Timestamp
);
