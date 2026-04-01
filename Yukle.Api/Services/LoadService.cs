using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public class LoadService
{
    private readonly YukleDbContext _context;

    public LoadService(YukleDbContext context)
    {
        _context = context;
    }

    public async Task<int> CreateLoadAsync(CreateLoadDto dto)
    {
        // SRID 4326 = WGS84 (Standart GPS). Point format: (Longitude, Latitude)
        var origin = new Point(dto.OriginLng, dto.OriginLat) { SRID = 4326 };
        var destination = new Point(dto.DestLng, dto.DestLat) { SRID = 4326 };

        var load = new Load
        {
            Title = dto.Title,
            OwnerId = dto.OwnerId,
            Weight = dto.Weight,
            Volume = dto.Volume,
            Price = dto.Price,
            Type = dto.Type,
            Origin = origin,
            Destination = destination,
            OriginAddress = dto.OriginAddress,
            DestinationAddress = dto.DestinationAddress,
            CreatedAt = DateTime.UtcNow
        };

        _context.Loads.Add(load);
        await _context.SaveChangesAsync();

        return load.Id;
    }

    public async Task<List<Load>> GetAllLoadsAsync()
    {
        return await _context.Loads.Where(l => l.Status == LoadStatus.Active).ToListAsync();
    }

    public async Task<List<Load>> GetNearbyLoadsAsync(Point userLoc, double radiusKm)
    {
        var radiusMeters = radiusKm * 1000;
        // KRİTİK: Coordinate 4326 (WGS84) üzerinden kilometre/metre ölçümü yapmak için, geometry kolonlarının geography tipine açıkça (explicit) dönüştürülmesi gereklidir.
        // Npgsql.EntityFrameworkCore.PostgreSQL ST_DWithin'i doğrudan geography'e çevirmediği için performans ve doğruluk adına en iyi yol parametrik RAW SQL'dir.
        
        return await _context.Loads
            .FromSqlInterpolated($"SELECT * FROM \"Loads\" WHERE \"Status\" = 0 AND ST_DWithin(\"Origin\"::geography, ST_SetSRID(ST_MakePoint({userLoc.X}, {userLoc.Y}), 4326)::geography, {radiusMeters})")
            .ToListAsync();
    }
}
