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
        return await _context.Loads.ToListAsync();
    }
}
