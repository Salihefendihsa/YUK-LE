using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public class DriverListingService : IDriverListingService
{
    // SRID 4326 = WGS 84 (GPS). NTS koordinat sırası: (Longitude=X, Latitude=Y).
    // LoadService ile BİREBİR aynı factory kalıbı.
    private static readonly GeometryFactory _geometryFactory =
        new GeometryFactory(new PrecisionModel(), 4326);

    private readonly YukleDbContext       _context;
    private readonly INotificationService _notifications;
    private readonly IPaymentService      _paymentService;

    public DriverListingService(
        YukleDbContext       context,
        INotificationService notifications,
        IPaymentService      paymentService)
    {
        _context        = context;
        _notifications  = notifications;
        _paymentService = paymentService;
    }

    public async Task<Guid> CreateAsync(CreateDriverListingDto dto, int driverId)
    {
        var origin      = _geometryFactory.CreatePoint(new Coordinate(dto.OriginLongitude, dto.OriginLatitude));
        var destination = _geometryFactory.CreatePoint(new Coordinate(dto.DestinationLongitude, dto.DestinationLatitude));

        var listing = new DriverListing
        {
            DriverId            = driverId,
            OriginCity          = dto.OriginCity.Trim(),
            OriginDistrict      = dto.OriginDistrict.Trim(),
            Origin              = origin,
            DestinationCity     = dto.DestinationCity.Trim(),
            DestinationDistrict = dto.DestinationDistrict.Trim(),
            Destination         = destination,
            AvailableFrom       = dto.AvailableFrom,
            VehicleType         = dto.VehicleType,
            CapacityNote        = string.IsNullOrWhiteSpace(dto.CapacityNote) ? null : dto.CapacityNote.Trim(),
            Notes               = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
            Status              = DriverListingStatus.Active,
            CreatedAt           = DateTime.UtcNow
        };

        await _context.DriverListings.AddAsync(listing);
        await _context.SaveChangesAsync();

        return listing.Id;
    }

    public async Task<List<DriverListingDto>> GetActiveAsync(string? fromCity, string? toCity)
    {
        var query = _context.DriverListings
            .Where(d => d.Status == DriverListingStatus.Active);

        if (!string.IsNullOrWhiteSpace(fromCity))
            query = query.Where(d => d.OriginCity == fromCity);
        if (!string.IsNullOrWhiteSpace(toCity))
            query = query.Where(d => d.DestinationCity == toCity);

        return await query
            .OrderBy(d => d.AvailableFrom)
            .Select(Projection)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<DriverListingDto>> GetMineAsync(int driverId)
    {
        return await _context.DriverListings
            .Where(d => d.DriverId == driverId)
            .OrderByDescending(d => d.CreatedAt)
            .Select(Projection)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<DriverListingDto?> GetByIdAsync(Guid id)
    {
        return await _context.DriverListings
            .Where(d => d.Id == id)
            .Select(Projection)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    public async Task CancelAsync(Guid id, int driverId)
    {
        var listing = await _context.DriverListings.FirstOrDefaultAsync(d => d.Id == id);
        if (listing is null)
            throw new KeyNotFoundException($"'{id}' ID'sine sahip şoför ilanı bulunamadı.");
        if (listing.DriverId != driverId)
            throw new UnauthorizedAccessException("Yalnızca kendi ilanınızı iptal edebilirsiniz.");
        if (listing.Status != DriverListingStatus.Active)
            throw new InvalidOperationException("Yalnızca yayında olan ilan iptal edilebilir.");

        listing.Status = DriverListingStatus.Cancelled;
        await _context.SaveChangesAsync();
    }

    // ── Teklif / Eşleşme ──────────────────────────────────────────────────────

    public async Task<Guid> CreateOfferAsync(Guid listingId, CreateListingOfferDto dto, int customerId)
    {
        // İlan var mı ve yayında mı?
        var listing = await _context.DriverListings
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == listingId)
            ?? throw new KeyNotFoundException($"'{listingId}' ID'sine sahip şoför ilanı bulunamadı.");

        if (listing.Status != DriverListingStatus.Active)
            throw new InvalidOperationException("Yalnızca yayında olan ilana teklif verilebilir.");

        // Yük var mı, müşteriye mi ait ve atanmamış (Active) mı?
        var load = await _context.Loads
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == dto.LoadId)
            ?? throw new InvalidOperationException("Belirtilen yük ilanı bulunamadı.");

        if (load.UserId != customerId)
            throw new UnauthorizedAccessException("Yalnızca kendi yükünüzü teklif edebilirsiniz.");

        if (load.Status != LoadStatus.Active)
            throw new InvalidOperationException(
                $"Bu yük teklif edilemez (atanmamış/aktif olmalı). Mevcut durum: {load.Status}.");

        // Aynı ilana aynı yük için zaten bekleyen teklif var mı?
        var alreadyOffered = await _context.ListingOffers.AnyAsync(o =>
            o.DriverListingId == listingId &&
            o.LoadId          == dto.LoadId &&
            o.Status          == ListingOfferStatus.Pending);

        if (alreadyOffered)
            throw new InvalidOperationException("Bu yük için bu ilana zaten bekleyen bir teklifiniz var.");

        var offer = new ListingOffer
        {
            DriverListingId = listingId,
            LoadId          = dto.LoadId,
            CustomerId      = customerId,
            Amount          = dto.Amount,
            Note            = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim(),
            Status          = ListingOfferStatus.Pending,
            CreatedAt       = DateTime.UtcNow
        };

        await _context.ListingOffers.AddAsync(offer);
        await _context.SaveChangesAsync();

        // Bildirim: ilan sahibi şoföre
        await _notifications.SendAsync(
            listing.DriverId,
            "Yeni Yük Teklifi 📦",
            "Bir müşteri boş araç ilanınıza yük teklif etti. Tekliflere göz atabilirsin.");

        return offer.Id;
    }

    public async Task<List<ListingOfferDto>> GetOffersForListingAsync(Guid listingId, int driverId)
    {
        // Sahiplik doğrulaması: ilan var mı ve bu şoföre mi ait?
        var listing = await _context.DriverListings
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == listingId)
            ?? throw new KeyNotFoundException($"'{listingId}' ID'sine sahip şoför ilanı bulunamadı.");

        if (listing.DriverId != driverId)
            throw new UnauthorizedAccessException("Bu ilana ait teklifleri görüntüleme yetkiniz yok.");

        return await _context.ListingOffers
            .Where(o => o.DriverListingId == listingId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new ListingOfferDto
            {
                Id              = o.Id,
                DriverListingId = o.DriverListingId,
                LoadId          = o.LoadId,
                CustomerId      = o.CustomerId,
                CustomerName    = o.Customer.FullName,
                FromCity        = o.Load.FromCity,
                FromDistrict    = o.Load.FromDistrict,
                ToCity          = o.Load.ToCity,
                ToDistrict      = o.Load.ToDistrict,
                LoadPrice       = o.Load.Price,
                Amount          = o.Amount,
                Note            = o.Note,
                Status          = o.Status.ToString(),
                CreatedAt       = o.CreatedAt
            })
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<MyListingOfferDto>> GetMyOffersAsync(int customerId)
    {
        return await _context.ListingOffers
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new MyListingOfferDto
            {
                Id              = o.Id,
                DriverListingId = o.DriverListingId,
                DriverName      = o.DriverListing.Driver.FullName,
                OriginCity      = o.DriverListing.OriginCity,
                DestinationCity = o.DriverListing.DestinationCity,
                LoadId          = o.LoadId,
                FromCity        = o.Load.FromCity,
                ToCity          = o.Load.ToCity,
                Amount          = o.Amount,
                Note            = o.Note,
                Status          = o.Status.ToString(),
                CreatedAt       = o.CreatedAt
            })
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task AcceptOfferAsync(Guid offerId, int driverId)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Guard 1: Teklif var mı? (Load + ilan ile birlikte)
            var offer = await _context.ListingOffers
                .Include(o => o.Load)
                .Include(o => o.DriverListing)
                .FirstOrDefaultAsync(o => o.Id == offerId)
                ?? throw new KeyNotFoundException("Teklif bulunamadı.");

            // Guard 2: İlan sahibi şoför mü?
            if (offer.DriverListing.DriverId != driverId)
                throw new UnauthorizedAccessException("Bu teklifi kabul etme yetkiniz yok.");

            // Guard 3: Teklif Pending mi?
            if (offer.Status != ListingOfferStatus.Pending)
                throw new InvalidOperationException(
                    $"Bu teklif kabul edilemez. Mevcut durum: {offer.Status}.");

            // Guard 4: İlan hâlâ Active mi? (race condition koruması)
            if (offer.DriverListing.Status != DriverListingStatus.Active)
                throw new InvalidOperationException(
                    $"Bu ilan artık aktif değil. Mevcut durum: {offer.DriverListing.Status}.");

            // Guard 5: Yük hâlâ Active mi? (race condition koruması)
            if (offer.Load.Status != LoadStatus.Active)
                throw new InvalidOperationException(
                    $"Bu yük ilanı artık aktif değil. Mevcut durum: {offer.Load.Status}.");

            // İşlem 1: Teklifi onayla
            offer.Status = ListingOfferStatus.Accepted;

            // İşlem 2: MEVCUT atama hattı (BidService.AcceptBidAsync ile BİREBİR) —
            //          yükü bu şoföre ata. Escrow, atanmış DriverId'yi okuduğu için
            //          HoldPaymentAsync çağrısından ÖNCE set edilmeli.
            offer.Load.Status   = LoadStatus.Assigned;
            offer.Load.DriverId = driverId;

            // İşlem 3: İlanı Eşleşti yap
            offer.DriverListing.Status = DriverListingStatus.Matched;

            // İşlem 4: Aynı ilandaki diğer Pending teklifleri reddet
            //          (ExecuteUpdateAsync öncesi bildirim için müşteri ID'lerini al)
            var rejectedCustomerIds = await _context.ListingOffers
                .Where(o => o.DriverListingId == offer.DriverListingId
                         && o.Id              != offerId
                         && o.Status          == ListingOfferStatus.Pending)
                .Select(o => o.CustomerId)
                .ToListAsync();

            await _context.ListingOffers
                .Where(o => o.DriverListingId == offer.DriverListingId
                         && o.Id              != offerId
                         && o.Status          == ListingOfferStatus.Pending)
                .ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, ListingOfferStatus.Rejected));

            // İşlem 5: MEVCUT escrow hattı (BidService.AcceptBidAsync ile BİREBİR method) —
            //          İyzico Mock Ödeme Havuzuna (Escrow) alma. Tutar: teklif tutarı, yoksa
            //          yükün mevcut fiyatı.
            var escrowAmount = offer.Amount ?? offer.Load.Price;
            bool paymentHoldSuccess = await _paymentService.HoldPaymentAsync(offer.LoadId, escrowAmount, "dummy_card_token");
            if (!paymentHoldSuccess)
            {
                throw new InvalidOperationException("Ödeme blokajı sağlanamadı. Lütfen kart limitinizi kontrol edin.");
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // ── Bildirimler (transaction dışında; hata olsa core işlem etkilenmez) ──

            // Kabul edilen müşteriye
            await _notifications.SendAsync(
                offer.CustomerId,
                "Teklifin Kabul Edildi! 🎉",
                "Boş araç ilanına verdiğin yük teklifi kabul edildi. Şoför atandı, süreç başladı.");

            // Reddedilen müşterilere
            foreach (var rejectedCustomerId in rejectedCustomerIds)
            {
                await _notifications.SendAsync(
                    rejectedCustomerId,
                    "Teklif Reddedildi",
                    "Şoför bu ilan için başka bir teklif kabul etti. Diğer ilanlara göz atabilirsin.");
            }
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
        });
    }

    public async Task RejectOfferAsync(Guid offerId, int driverId)
    {
        var offer = await _context.ListingOffers
            .Include(o => o.DriverListing)
            .FirstOrDefaultAsync(o => o.Id == offerId)
            ?? throw new KeyNotFoundException("Teklif bulunamadı.");

        if (offer.DriverListing.DriverId != driverId)
            throw new UnauthorizedAccessException("Bu teklifi reddetme yetkiniz yok.");

        if (offer.Status != ListingOfferStatus.Pending)
            throw new InvalidOperationException(
                $"Yalnızca bekleyen teklif reddedilebilir. Mevcut durum: {offer.Status}.");

        offer.Status = ListingOfferStatus.Rejected;
        await _context.SaveChangesAsync();

        await _notifications.SendAsync(
            offer.CustomerId,
            "Teklif Reddedildi",
            "Şoför, boş araç ilanına verdiğin yük teklifini reddetti.");
    }

    public async Task WithdrawOfferAsync(Guid offerId, int customerId)
    {
        var offer = await _context.ListingOffers
            .FirstOrDefaultAsync(o => o.Id == offerId)
            ?? throw new KeyNotFoundException("Teklif bulunamadı.");

        if (offer.CustomerId != customerId)
            throw new UnauthorizedAccessException("Bu teklifi geri çekme yetkiniz yok.");

        if (offer.Status != ListingOfferStatus.Pending)
            throw new InvalidOperationException(
                $"Yalnızca bekleyen teklif geri çekilebilir. Mevcut durum: {offer.Status}.");

        offer.Status = ListingOfferStatus.Withdrawn;
        await _context.SaveChangesAsync();
    }

    /// <summary>Entity → DTO projeksiyonu (EF Core'un SQL'e çevirebilmesi için Expression). NTS: Y=enlem, X=boylam.</summary>
    private static readonly Expression<Func<DriverListing, DriverListingDto>> Projection = d => new DriverListingDto
    {
        Id                  = d.Id,
        DriverId            = d.DriverId,
        DriverName          = d.Driver.FullName,
        OriginCity          = d.OriginCity,
        OriginDistrict      = d.OriginDistrict,
        OriginLat           = d.Origin.Y,
        OriginLng           = d.Origin.X,
        DestinationCity     = d.DestinationCity,
        DestinationDistrict = d.DestinationDistrict,
        DestinationLat      = d.Destination.Y,
        DestinationLng      = d.Destination.X,
        AvailableFrom       = d.AvailableFrom,
        VehicleType         = d.VehicleType.ToString(),
        CapacityNote        = d.CapacityNote,
        Notes               = d.Notes,
        Status              = d.Status.ToString(),
        CreatedAt           = d.CreatedAt
    };
}
