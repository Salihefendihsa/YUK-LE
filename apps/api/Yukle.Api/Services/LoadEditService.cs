using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public sealed class LoadEditService(
    YukleDbContext       context,
    ILoadService         loadService,
    PricingService       pricingService,
    IRouteService        routeService,
    INotificationService notifications,
    ILogger<LoadEditService> logger) : ILoadEditService
{
    private static readonly GeometryFactory GeometryFactory =
        new(new PrecisionModel(), 4326);

    public async Task<UpdateLoadResultDto> UpdateAsync(
        Guid loadId, int actorUserId, bool isAdmin, CreateLoadDto dto,
        CancellationToken ct = default)
    {
        var strategy = context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(ct);
            UpdateLoadResultDto result;
            List<int> notifyDriverIds;
            try
            {
                (result, notifyDriverIds) = await UpdateCoreAsync(loadId, actorUserId, isAdmin, dto, ct);
                await context.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
            }
            catch
            {
                await transaction.RollbackAsync(ct);
                throw;
            }

            foreach (var driverId in notifyDriverIds)
            {
                await notifications.SendNotificationAsync(
                    driverId,
                    "Ilan guncellendi",
                    "Ilan guncellendi, teklifinizi gozden gecirin.",
                    NotificationType.Bid,
                    loadId);
            }

            return result;
        });
    }

    private async Task<(UpdateLoadResultDto Result, List<int> NotifyDriverIds)> UpdateCoreAsync(
        Guid loadId, int actorUserId, bool isAdmin, CreateLoadDto dto,
        CancellationToken ct)
    {
        var load = await context.Loads
            .Include(l => l.Bids)
            .FirstOrDefaultAsync(l => l.Id == loadId, ct)
            ?? throw new InvalidOperationException("Ilan bulunamadi.");

        if (!isAdmin && load.UserId != actorUserId)
            throw new UnauthorizedAccessException("Bu ilani duzenleme yetkiniz yok.");

        var hasAcceptedBid = load.Bids.Any(b => b.Status == BidStatus.Accepted);
        if (!LoadCancellationRules.CanEdit(load, hasAcceptedBid))
            throw new InvalidOperationException("Kabul edilmis veya aktif olmayan ilan duzenlenemez.");

        var materialBefore = SnapshotMaterial(load);
        ApplyFields(load, dto);
        var materialAfter  = SnapshotMaterial(load);
        var materialChanged = !MaterialEquals(materialBefore, materialAfter);

        var openBidDriverIds = load.Bids
            .Where(b => b.Status == BidStatus.Pending)
            .Select(b => b.DriverId)
            .Distinct()
            .ToList();

        if (materialChanged)
        {
            await RecalculateAiPriceAsync(load, dto, ct);
        }

        var updated = await loadService.GetLoadByIdAsync(loadId)
            ?? throw new InvalidOperationException("Ilan okunamadi.");

        var notify = materialChanged && openBidDriverIds.Count > 0 ? openBidDriverIds : [];

        logger.LogInformation(
            "Load updated LoadId={LoadId} MaterialChanged={Material} NotifyDrivers={Count}",
            loadId, materialChanged, notify.Count);

        return (new UpdateLoadResultDto
        {
            Load             = updated,
            MaterialChanged  = materialChanged,
            NotifiedDrivers  = notify.Count > 0,
            Message          = materialChanged
                ? "Ilan guncellendi. Onerilen fiyat yenilendi."
                : "Ilan guncellendi."
        }, notify);
    }

    private async Task RecalculateAiPriceAsync(Load load, CreateLoadDto dto, CancellationToken ct)
    {
        try
        {
            var vehicleType = dto.RequiredVehicleType.ToString();
            var fuelPrice   = await pricingService.ResolveFuelUnitPriceAsync(dto.FromCity, vehicleType, ct: ct);
            var osrmKm      = await routeService.GetDistanceKmAsync(
                dto.FromLatitude, dto.FromLongitude,
                dto.ToLatitude, dto.ToLongitude, ct);

            var distanceKm = osrmKm ?? Haversine(
                dto.FromLatitude, dto.FromLongitude,
                dto.ToLatitude, dto.ToLongitude);

            var suggestion = await pricingService.GetSmartPriceAsync(
                dto.FromLatitude, dto.FromLongitude,
                dto.ToLatitude, dto.ToLongitude,
                vehicleType, dto.Weight,
                dto.FromCity, dto.ToCity,
                load.UserId.ToString(),
                manualDistanceKm: distanceKm,
                fuelPriceOverride: fuelPrice,
                volumeM3: dto.Volume ?? 0,
                ct: ct);

            load.AiSuggestedPrice = suggestion.RecommendedPrice;
            load.AiMinPrice         = suggestion.MinPrice;
            load.AiMaxPrice         = suggestion.MaxPrice;
            load.AiPriceReasoning   = suggestion.Reasoning ?? string.Empty;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "AI fiyat yenileme basarisiz LoadId={LoadId}", load.Id);
        }
    }

    private static void ApplyFields(Load load, CreateLoadDto dto)
    {
        load.Origin              = GeometryFactory.CreatePoint(new Coordinate(dto.FromLongitude, dto.FromLatitude));
        load.Destination         = GeometryFactory.CreatePoint(new Coordinate(dto.ToLongitude, dto.ToLatitude));
        load.FromCity            = dto.FromCity.Trim();
        load.FromDistrict        = dto.FromDistrict.Trim();
        load.ToCity              = dto.ToCity.Trim();
        load.ToDistrict          = dto.ToDistrict.Trim();
        load.Description         = dto.Description?.Trim() ?? string.Empty;
        load.Weight              = dto.Weight;
        load.Volume              = dto.Volume ?? 0;
        load.Type                = dto.LoadType;
        load.RequiredVehicleType = dto.RequiredVehicleType;
        load.PickupDate          = dto.PickupDate;
        load.DeliveryDate        = dto.DeliveryDate;
        load.Price               = dto.Price;
        load.Currency            = dto.Currency.ToUpperInvariant();
    }

    private sealed record MaterialSnapshot(
        string FromCity, string FromDistrict, string ToCity, string ToDistrict,
        double FromLat, double FromLng, double ToLat, double ToLng,
        double Weight, double Volume, VehicleType? VehicleType,
        DateTime PickupDate, DateTime DeliveryDate);

    private static MaterialSnapshot SnapshotMaterial(Load load) => new(
        load.FromCity, load.FromDistrict, load.ToCity, load.ToDistrict,
        load.Origin.Y, load.Origin.X, load.Destination.Y, load.Destination.X,
        load.Weight, load.Volume, load.RequiredVehicleType,
        load.PickupDate, load.DeliveryDate);

    private static bool MaterialEquals(MaterialSnapshot a, MaterialSnapshot b)
        => a.FromCity == b.FromCity
        && a.FromDistrict == b.FromDistrict
        && a.ToCity == b.ToCity
        && a.ToDistrict == b.ToDistrict
        && Math.Abs(a.FromLat - b.FromLat) < 0.0001
        && Math.Abs(a.FromLng - b.FromLng) < 0.0001
        && Math.Abs(a.ToLat - b.ToLat) < 0.0001
        && Math.Abs(a.ToLng - b.ToLng) < 0.0001
        && Math.Abs(a.Weight - b.Weight) < 0.01
        && Math.Abs(a.Volume - b.Volume) < 0.01
        && a.VehicleType == b.VehicleType
        && a.PickupDate == b.PickupDate
        && a.DeliveryDate == b.DeliveryDate;

    private static double Haversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLon = (lon2 - lon1) * Math.PI / 180.0;
        var a    = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                 + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0)
                 * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
