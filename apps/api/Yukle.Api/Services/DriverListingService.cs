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

    private readonly YukleDbContext _context;

    public DriverListingService(YukleDbContext context)
    {
        _context = context;
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
