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
        // 4326 is SRID for GPS (WGS84). Point format is (Longitude, Latitude)
        var origin = new Point(dto.OriginLng, dto.OriginLat) { SRID = 4326 };
        var destination = new Point(dto.DestLng, dto.DestLat) { SRID = 4326 };

        var load = new Load
        {
            Title = dto.Title,
            Description = dto.Description,
            Weight = dto.Weight,
            OriginLocation = origin,
            DestinationLocation = destination,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Loads.Add(load);
        await _context.SaveChangesAsync();

        return load.Id;
    }

    public async Task<List<Load>> GetAllLoadsAsync()
    {
        // Return all loads and their spatial locations
        return await _context.Loads.ToListAsync();
    }
}
