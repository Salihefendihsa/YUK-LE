using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.Models;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LocationController(YukleDbContext context, INotificationService notificationService) : ControllerBase
{
  private const double ProximityThresholdKm = 1.0;
  private const double ArrivalThresholdKm = 0.2;

  [HttpPost("update")]
  [Authorize(Policy = "RequireActiveDriver")]
  public async Task<IActionResult> Update([FromBody] LocationUpdateRequest request)
  {
    var driverId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    var user = await context.Users.FirstOrDefaultAsync(u => u.Id == driverId);
    if (user is null) return NotFound();

    user.LastKnownLatitude = request.Latitude;
    user.LastKnownLongitude = request.Longitude;
    user.LastLocationUpdate = DateTime.UtcNow;

    var load = await context.Loads
      .FirstOrDefaultAsync(l => l.Id == request.LoadId && l.DriverId == driverId);

    if (load is not null)
    {
      var destLat = load.Destination.Y;
      var destLng = load.Destination.X;
      var distanceKm = Haversine(request.Latitude, request.Longitude, destLat, destLng);

      if (!load.ProximityNotified && distanceKm <= ProximityThresholdKm)
      {
        load.ProximityNotified = true;
        await notificationService.SendAsync(
          load.UserId,
          "Yükünüz yaklaşıyor",
          "Yükünüz yaklaşıyor, yaklaşık 1 km kaldı.");
      }

      if (load.Status == LoadStatus.OnWay && distanceKm < ArrivalThresholdKm)
      {
        load.Status = LoadStatus.Arrived;
        await notificationService.SendAsync(
          driverId,
          "Hedefe ulaştınız",
          "Varış noktasına ulaşıldı. Yükü teslim edebilirsiniz.");
        await notificationService.SendAsync(
          load.UserId,
          "Yükünüz vardı",
          "Aracınız varış noktasına ulaştı. Teslimat sürecini başlatabilirsiniz.");
      }
    }

    await context.SaveChangesAsync();
    return Ok(new { Message = "Konum güncellendi." });
  }

  [HttpGet("driver/{loadId:guid}")]
  [Authorize(Roles = "Customer,Admin")]
  public async Task<IActionResult> GetDriverLocation(Guid loadId)
  {
    var requester = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    var load = await context.Loads.Include(l => l.Driver).FirstOrDefaultAsync(l => l.Id == loadId);
    if (load is null || load.DriverId is null) return NotFound();
    if (!User.IsInRole("Admin") && load.UserId != requester) return Forbid();
    var driver = load.Driver!;
    return Ok(new
    {
      driver.Id,
      driver.FullName,
      driver.LastKnownLatitude,
      driver.LastKnownLongitude,
      driver.LastLocationUpdate
    });
  }

  private static double Haversine(double lat1, double lon1, double lat2, double lon2)
  {
    const double R = 6371.0;
    var dLat = (lat2 - lat1) * Math.PI / 180.0;
    var dLon = (lon2 - lon1) * Math.PI / 180.0;
    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
    return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
  }
}

public sealed class LocationUpdateRequest
{
  public double Latitude { get; set; }
  public double Longitude { get; set; }
  public Guid LoadId { get; set; }
}
