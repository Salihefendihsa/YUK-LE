using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.DTOs;
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
    public async Task<IActionResult> Create([FromBody] UpsertDeliveryAddressDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var request = MapToEntity(dto, userId);
        await context.DeliveryAddresses.AddAsync(request);
        await context.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertDeliveryAddressDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var item = await context.DeliveryAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (item is null) return NotFound();
        ApplyDto(item, dto);
        await context.SaveChangesAsync();
        return Ok(item);
    }

    private static DeliveryAddress MapToEntity(UpsertDeliveryAddressDto dto, int userId) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        CreatedAt = DateTime.UtcNow,
        Title = dto.Title.Trim(),
        CompanyName = dto.CompanyName.Trim(),
        ContactPerson = dto.ContactPerson.Trim(),
        ContactPhone = dto.ContactPhone.Trim(),
        Address = dto.Address.Trim(),
        City = dto.City.Trim(),
        District = dto.District.Trim(),
        Latitude = dto.Latitude,
        Longitude = dto.Longitude,
        IsDefault = dto.IsDefault,
    };

    private static void ApplyDto(DeliveryAddress item, UpsertDeliveryAddressDto dto)
    {
        item.Title = dto.Title.Trim();
        item.CompanyName = dto.CompanyName.Trim();
        item.ContactPerson = dto.ContactPerson.Trim();
        item.ContactPhone = dto.ContactPhone.Trim();
        item.Address = dto.Address.Trim();
        item.City = dto.City.Trim();
        item.District = dto.District.Trim();
        item.Latitude = dto.Latitude;
        item.Longitude = dto.Longitude;
        item.IsDefault = dto.IsDefault;
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
