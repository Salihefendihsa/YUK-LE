using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public class LoadService : ILoadService
{
    // SRID 4326 = WGS 84 (GPS koordinat sistemi).
    // NTS koordinat sırası: (Longitude, Latitude) — X=Boylam, Y=Enlem.
    private static readonly GeometryFactory _geometryFactory =
        new GeometryFactory(new PrecisionModel(), 4326);

    private readonly YukleDbContext       _context;
    private readonly INotificationService _notifications;
    private readonly IPaymentService      _paymentService;

    public LoadService(YukleDbContext context, INotificationService notifications, IPaymentService paymentService)
    {
        _context       = context;
        _notifications = notifications;
        _paymentService = paymentService;
    }

    public async Task<Guid> CreateLoadAsync(CreateLoadDto dto, int userId)
    {
        var origin      = _geometryFactory.CreatePoint(new Coordinate(dto.FromLongitude, dto.FromLatitude));
        var destination = _geometryFactory.CreatePoint(new Coordinate(dto.ToLongitude,   dto.ToLatitude));

        var load = new Load
        {
            Origin              = origin,
            Destination         = destination,
            FromCity            = dto.FromCity.Trim(),
            FromDistrict        = dto.FromDistrict.Trim(),
            ToCity              = dto.ToCity.Trim(),
            ToDistrict          = dto.ToDistrict.Trim(),
            Description         = dto.Description?.Trim() ?? string.Empty,
            Weight              = dto.Weight,
            Volume              = dto.Volume ?? 0,
            Type                = dto.LoadType,
            RequiredVehicleType = dto.RequiredVehicleType,
            PickupDate          = dto.PickupDate,
            DeliveryDate        = dto.DeliveryDate,
            Price               = dto.Price,
            Currency            = dto.Currency.ToUpperInvariant(),
            UserId              = userId,
            Status              = LoadStatus.Active,
            CreatedAt           = DateTime.UtcNow
        };

        await _context.Loads.AddAsync(load);
        await _context.SaveChangesAsync();

        return load.Id;
    }

    public async Task UpdateAiPriceAsync(
        Guid    loadId,
        decimal suggested,
        decimal min,
        decimal max,
        string  reasoning)
    {
        var load = await _context.Loads.FindAsync(loadId);
        if (load is null) return;

        load.AiSuggestedPrice  = suggested;
        load.AiMinPrice        = min;
        load.AiMaxPrice        = max;
        load.AiPriceReasoning  = reasoning;

        await _context.SaveChangesAsync();
    }

    public async Task<List<LoadListDto>> GetActiveLoadsAsync()
    {
        return await _context.Loads
            .Where(l => l.Status == LoadStatus.Active)
            .Select(l => new LoadListDto
            {
                Id               = l.Id,
                FromCity         = l.FromCity,
                FromDistrict     = l.FromDistrict,
                ToCity           = l.ToCity,
                ToDistrict       = l.ToDistrict,
                Description      = l.Description,
                Weight           = l.Weight,
                Volume           = l.Volume,
                Type             = l.Type,
                PickupDate       = l.PickupDate,
                DeliveryDate     = l.DeliveryDate,
                CreatedAt        = l.CreatedAt,
                Price            = l.Price,
                Currency         = l.Currency,
                Status           = l.Status,
                OwnerId          = l.UserId,
                OwnerFullName    = l.Owner.FullName,
                DriverId         = l.DriverId,
                DestinationLat   = l.Destination.Y,
                DestinationLng   = l.Destination.X,
                BidCount         = l.Bids.Count,
                AiSuggestedPrice = l.AiSuggestedPrice,
                AiMinPrice       = l.AiMinPrice,
                AiMaxPrice       = l.AiMaxPrice,
                AiPriceReasoning = l.AiPriceReasoning
            })
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<LoadListDto?> GetLoadByIdAsync(Guid id)
    {
        return await _context.Loads
            .Where(l => l.Id == id)
            .Select(l => new LoadListDto
            {
                Id               = l.Id,
                FromCity         = l.FromCity,
                FromDistrict     = l.FromDistrict,
                ToCity           = l.ToCity,
                ToDistrict       = l.ToDistrict,
                Description      = l.Description,
                Weight           = l.Weight,
                Volume           = l.Volume,
                Type             = l.Type,
                PickupDate       = l.PickupDate,
                DeliveryDate     = l.DeliveryDate,
                CreatedAt        = l.CreatedAt,
                Price            = l.Price,
                Currency         = l.Currency,
                Status           = l.Status,
                OwnerId          = l.UserId,
                OwnerFullName    = l.Owner.FullName,
                DriverId         = l.DriverId,
                DestinationLat   = l.Destination.Y,
                DestinationLng   = l.Destination.X,
                BidCount         = l.Bids.Count,
                AiSuggestedPrice = l.AiSuggestedPrice,
                AiMinPrice       = l.AiMinPrice,
                AiMaxPrice       = l.AiMaxPrice,
                AiPriceReasoning = l.AiPriceReasoning
            })
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    // ── PickupAsync ───────────────────────────────────────────────────────────

    public async Task PickupAsync(Guid loadId, int driverId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var load = await _context.Loads.FindAsync(loadId)
                ?? throw new InvalidOperationException("Yük bulunamadı.");

            if (load.DriverId != driverId)
                throw new UnauthorizedAccessException("Bu yük size atanmamış.");

            if (load.Status != LoadStatus.Assigned)
                throw new InvalidOperationException(
                    $"Yük 'Assigned' durumunda değil. Mevcut durum: {load.Status}.");

            load.Status = LoadStatus.OnWay;

            // Faz 4.3: Bakanlık Yük Kabul Bildirimi
            var outbox = new UetdsOutbox
            {
                LoadId = loadId,
                Payload = $"{{\"Event\":\"PickUp\", \"DriverId\": {driverId}, \"LoadId\": \"{loadId}\", \"Timestamp\": \"{DateTime.UtcNow:O}\"}}",
                Status = OutboxStatus.Pending
            };
            await _context.UetdsOutboxes.AddAsync(outbox);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ── DeliverAsync ──────────────────────────────────────────────────────────

    public async Task DeliverAsync(Guid loadId, int driverId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var load = await _context.Loads.FindAsync(loadId)
                ?? throw new InvalidOperationException("Yük bulunamadı.");

            if (load.DriverId != driverId)
                throw new UnauthorizedAccessException("Bu yük size atanmamış.");

            if (load.Status != LoadStatus.OnWay)
                throw new InvalidOperationException(
                    $"Yük 'OnWay' durumunda değil. Mevcut durum: {load.Status}.");

            load.Status = LoadStatus.Delivered;

            // Faz 4.3: Bakanlık Yük Teslim Bildirimi
            var outbox = new UetdsOutbox
            {
                LoadId = loadId,
                Payload = $"{{\"Event\":\"Delivery\", \"DriverId\": {driverId}, \"LoadId\": \"{loadId}\", \"Timestamp\": \"{DateTime.UtcNow:O}\"}}",
                Status = OutboxStatus.Pending
            };
            await _context.UetdsOutboxes.AddAsync(outbox);

            // Faz 4.1: İyzico (Mock) Havuzdaki Ödemeyi Şoföre Aktar (Release)
            bool paymentReleased = await _paymentService.ReleasePaymentAsync(loadId, driverId);
            if (!paymentReleased)
            {
                // Ödeme aktarımı başarısız olduysa tesim statüsü rollback edilir (Consistency)
                throw new InvalidOperationException("Ödeme dağıtımı başarısız oldu. İşlem geri alınıyor.");
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Teslimat bildirimleri — SignalR ile anlık push (İşlem tamamlandıktan sonra)
            await _notifications.SendAsync(
                driverId,
                "Teslimat Tamamlandı 🎉",
                "Tebrikler! Yükü başarıyla teslim ettin. Bakiyen hesabına aktarıldı.");

            await _notifications.SendAsync(
                load.UserId,
                "Yükünüz Teslim Edildi ✅",
                $"Yükünüz başarıyla teslim edildi. İyi işler için teşekkürler!");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ── UpdateStatusAsync ─────────────────────────────────────────────────────

    public async Task UpdateStatusAsync(Guid loadId, LoadStatus newStatus)
    {
        var load = await _context.Loads.FindAsync(loadId)
            ?? throw new InvalidOperationException("Yük bulunamadı.");

        load.Status = newStatus;
        await _context.SaveChangesAsync();
    }
}
