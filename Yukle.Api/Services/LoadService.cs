using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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

    public async Task<Guid> CreateLoadAsync(LoadCreateDto dto)
    {
        var load = new Load
        {
            FromCity            = dto.FromCity.Trim(),
            FromDistrict        = dto.FromDistrict.Trim(),
            ToCity              = dto.ToCity.Trim(),
            ToDistrict          = dto.ToDistrict.Trim(),
            Description         = dto.Description.Trim(),
            Weight              = dto.Weight,
            Volume              = dto.Volume,
            Type                = dto.Type,
            RequiredVehicleType = dto.RequiredVehicleType,
            PickupDate          = dto.PickupDate,
            DeliveryDate        = dto.DeliveryDate,
            Price               = dto.Price,
            Currency            = dto.Currency.ToUpperInvariant(),
            UserId              = dto.UserId,
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
}
