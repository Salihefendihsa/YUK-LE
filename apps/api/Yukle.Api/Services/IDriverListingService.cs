using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Yukle.Api.DTOs;

namespace Yukle.Api.Services;

/// <summary>
/// Şoför "Boş Araç" ilanı CRUD ve listeleme operasyonları için servis sözleşmesi.
/// (Bu dalga: CRUD + listeleme. Müşteri teklifi/eşleşme sonraki dalga.)
/// </summary>
public interface IDriverListingService
{
    /// <summary>Yeni şoför ilanı oluşturur ve oluşturulan kaydın ID'sini döner.</summary>
    Task<Guid> CreateAsync(CreateDriverListingDto dto, int driverId);

    /// <summary>
    /// Durumu Active olan ilanları döner. Opsiyonel çıkış/varış şehri filtresi uygulanır.
    /// </summary>
    Task<List<DriverListingDto>> GetActiveAsync(string? fromCity, string? toCity);

    /// <summary>Belirli bir şoförün tüm ilanları (tüm durumlar), en yeni üstte.</summary>
    Task<List<DriverListingDto>> GetMineAsync(int driverId);

    /// <summary>Belirli bir ID'ye sahip ilanın detayı; bulunamazsa null.</summary>
    Task<DriverListingDto?> GetByIdAsync(Guid id);

    /// <summary>
    /// Şoförün kendi ilanını iptal eder (Status → Cancelled).
    /// Bulunamazsa <see cref="KeyNotFoundException"/>, sahibi değilse
    /// <see cref="UnauthorizedAccessException"/>, zaten aktif değilse
    /// <see cref="InvalidOperationException"/> fırlatır.
    /// </summary>
    Task CancelAsync(Guid id, int driverId);

    // ── Teklif / Eşleşme ──────────────────────────────────────────────────────

    /// <summary>
    /// Müşteri, yayında olan bir şoför ilanına kendi AÇIK (Active, atanmamış) yükünü teklif eder.
    /// Oluşturulan teklifin ID'sini döner.
    /// </summary>
    Task<Guid> CreateOfferAsync(Guid listingId, CreateListingOfferDto dto, int customerId);

    /// <summary>İlan sahibi şoför, ilanına gelen teklifleri görür (sahiplik doğrulamalı).</summary>
    Task<List<ListingOfferDto>> GetOffersForListingAsync(Guid listingId, int driverId);

    /// <summary>Müşterinin gönderdiği tüm teklifler, en yeni üstte.</summary>
    Task<List<MyListingOfferDto>> GetMyOffersAsync(int customerId);

    /// <summary>
    /// İlan sahibi şoför teklifi kabul eder. MEVCUT atama+escrow hattıyla (BidService.AcceptBidAsync
    /// ile birebir) yük bu şoföre atanır, escrow hold konur; ilan Eşleşti olur; aynı ilandaki diğer
    /// bekleyen teklifler reddedilir. Atomik (transaction) çalışır.
    /// </summary>
    Task AcceptOfferAsync(Guid offerId, int driverId);

    /// <summary>İlan sahibi şoför bekleyen bir teklifi reddeder (Status → Rejected).</summary>
    Task RejectOfferAsync(Guid offerId, int driverId);

    /// <summary>Müşteri kendi bekleyen teklifini geri çeker (Status → Withdrawn).</summary>
    Task WithdrawOfferAsync(Guid offerId, int customerId);

    // ── Admin moderasyon ──────────────────────────────────────────────────────

    /// <summary>
    /// Admin: TÜM ilanları (her durum, her şoför) döner; şoför adı + teklif sayısı + durum.
    /// Opsiyonel <paramref name="status"/> filtresi (Active/Matched/Cancelled/Expired).
    /// </summary>
    Task<List<AdminDriverListingDto>> GetAllForAdminAsync(string? status);

    /// <summary>Admin: belirtilen ilana gelen tüm teklifleri döner (sahiplik kontrolü yok).</summary>
    Task<List<ListingOfferDto>> GetOffersForAdminAsync(Guid listingId);

    /// <summary>
    /// Admin moderasyon: YALNIZ Active ilanı Cancelled yapar; o ilandaki Pending teklifleri
    /// Rejected yapar; şoföre ve ilgili müşterilere bildirim gönderir. Matched/zaten iptal/expired
    /// ilanda <see cref="InvalidOperationException"/> fırlatır (atama/escrow çözme bu dalgada yok).
    /// Etkilenen teklif sayısını döner.
    /// </summary>
    Task<int> AdminCancelListingAsync(Guid listingId);
}
