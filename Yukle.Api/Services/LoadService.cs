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

    public LoadService(YukleDbContext context, INotificationService notifications)
    {
        _context       = context;
        _notifications = notifications;
    }

    public async Task<Guid> CreateLoadAsync(CreateLoadDto dto, int userId)
    {
        var origin      = _geometryFactory.CreatePoint(new Coordinate(dto.FromLongitude, dto.FromLatitude));
        var destination = _geometryFactory.CreatePoint(new Coordinate(dto.ToLongitude,   dto.ToLatitude));

        var load = new Load
        {
            Origin      = origin,
            Destination = destination,
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

    public async Task<List<LoadListDto>> GetActiveLoadsAsync()
    {
        return await _context.Loads
            .Where(l => l.Status == LoadStatus.Active)
            .Select(l => new LoadListDto
            {
                Id             = l.Id,
                FromCity       = l.FromCity,
                FromDistrict   = l.FromDistrict,
                ToCity         = l.ToCity,
                ToDistrict     = l.ToDistrict,
                Description    = l.Description,
                Weight         = l.Weight,
                Volume         = l.Volume,
                Type           = l.Type,
                PickupDate     = l.PickupDate,
                DeliveryDate   = l.DeliveryDate,
                CreatedAt      = l.CreatedAt,
                Price          = l.Price,
                Currency       = l.Currency,
                Status         = l.Status,
                OwnerId        = l.UserId,
                OwnerFullName  = l.Owner.FullName,
                BidCount       = l.Bids.Count
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
                Id             = l.Id,
                FromCity       = l.FromCity,
                FromDistrict   = l.FromDistrict,
                ToCity         = l.ToCity,
                ToDistrict     = l.ToDistrict,
                Description    = l.Description,
                Weight         = l.Weight,
                Volume         = l.Volume,
                Type           = l.Type,
                PickupDate     = l.PickupDate,
                DeliveryDate   = l.DeliveryDate,
                CreatedAt      = l.CreatedAt,
                Price          = l.Price,
                Currency       = l.Currency,
                Status         = l.Status,
                OwnerId        = l.UserId,
                OwnerFullName  = l.Owner.FullName,
                BidCount       = l.Bids.Count
            })
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    // ── PickupAsync ───────────────────────────────────────────────────────────

    public async Task PickupAsync(Guid loadId, int driverId)
    {
        var load = await _context.Loads.FindAsync(loadId)
            ?? throw new InvalidOperationException("Yük bulunamadı.");

        if (load.DriverId != driverId)
            throw new UnauthorizedAccessException("Bu yük size atanmamış.");

        if (load.Status != LoadStatus.Assigned)
            throw new InvalidOperationException(
                $"Yük 'Assigned' durumunda değil. Mevcut durum: {load.Status}.");

        load.Status = LoadStatus.OnWay;
        await _context.SaveChangesAsync();
    }

    // ── DeliverAsync ──────────────────────────────────────────────────────────

    public async Task DeliverAsync(Guid loadId, int driverId)
    {
        var load = await _context.Loads.FindAsync(loadId)
            ?? throw new InvalidOperationException("Yük bulunamadı.");

        if (load.DriverId != driverId)
            throw new UnauthorizedAccessException("Bu yük size atanmamış.");

        if (load.Status != LoadStatus.OnWay)
            throw new InvalidOperationException(
                $"Yük 'OnWay' durumunda değil. Mevcut durum: {load.Status}.");

        load.Status = LoadStatus.Delivered;
        await _context.SaveChangesAsync();

        // Teslimat bildirimleri — SignalR ile anlık push
        await _notifications.SendAsync(
            driverId,
            "Teslimat Tamamlandı 🎉",
            "Tebrikler! Yükü başarıyla teslim ettin. Yeni ilanlara göz atabilirsin.");

        await _notifications.SendAsync(
            load.UserId,
            "Yükünüz Teslim Edildi ✅",
            $"Yükünüz başarıyla teslim edildi. İyi işler için teşekkürler!");
    }
}
