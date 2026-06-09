using System;

namespace Yukle.Api.Models;

/// <summary>
/// Müşterinin bir şoför "Boş Araç" ilanına (<see cref="DriverListing"/>) kendi AÇIK yükünü
/// (<see cref="Load"/>) teklif etmesi. Şoför kabul edince yük o şoföre atanır (mevcut
/// atama+escrow hattı: <c>BidService.AcceptBidAsync</c> ile birebir) ve ilan Eşleşti olur.
/// </summary>
public class ListingOffer
{
    // ── Kimlik ────────────────────────────────────────────────────────────────
    public Guid Id { get; set; } = Guid.NewGuid();

    // ── Hedef ilan (şoför boş araç ilanı) ───────────────────────────────────────
    public Guid DriverListingId { get; set; }
    public DriverListing DriverListing { get; set; } = null!;

    // ── Teklif edilen yük ───────────────────────────────────────────────────────
    public Guid LoadId { get; set; }
    public Load Load { get; set; } = null!;

    // ── Teklifi veren müşteri ───────────────────────────────────────────────────
    public int CustomerId { get; set; }
    public User Customer { get; set; } = null!;

    // ── Teklif detayları ────────────────────────────────────────────────────────
    /// <summary>Önerilen navlun. Opsiyonel; null ise escrow'da yükün mevcut fiyatı kullanılır.</summary>
    public decimal? Amount { get; set; }

    /// <summary>Serbest not. Opsiyonel, en fazla 1000 karakter.</summary>
    public string? Note { get; set; }

    // ── Durum & Zaman ───────────────────────────────────────────────────────────
    public ListingOfferStatus Status { get; set; } = ListingOfferStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
