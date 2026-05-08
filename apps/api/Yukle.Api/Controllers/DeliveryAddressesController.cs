using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.Models;

namespace Yukle.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer")]
public class DeliveryAddressesController(YukleDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var items = await context.DeliveryAddresses.Where(a => a.UserId == userId).OrderByDescending(a => a.IsDefault).ThenBy(a => a.Title).ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DeliveryAddress request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        request.Id = Guid.NewGuid();
        request.UserId = userId;
        request.CreatedAt = DateTime.UtcNow;
        await context.DeliveryAddresses.AddAsync(request);
        await context.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] DeliveryAddress request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var item = await context.DeliveryAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (item is null) return NotFound();
        item.Title = request.Title;
        item.CompanyName = request.CompanyName;
        item.ContactPerson = request.ContactPerson;
        item.ContactPhone = request.ContactPhone;
        item.Address = request.Address;
        item.City = request.City;
        item.District = request.District;
        item.Latitude = request.Latitude;
        item.Longitude = request.Longitude;
        item.IsDefault = request.IsDefault;
        await context.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var item = await context.DeliveryAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (item is null) return NotFound();
        context.DeliveryAddresses.Remove(item);
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("{id:guid}/set-default")]
    public async Task<IActionResult> SetDefault(Guid id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var items = await context.DeliveryAddresses.Where(a => a.UserId == userId).ToListAsync();
        foreach (var i in items) i.IsDefault = i.Id == id;
        await context.SaveChangesAsync();
        return Ok(new { Message = "Varsayılan adres güncellendi." });
    }
}
