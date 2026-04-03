using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Yukle.Api.DTOs;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LoadController : ControllerBase
{
    private readonly LoadService _loadService;

    public LoadController(LoadService loadService)
    {
        _loadService = loadService;
    }

    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> CreateLoad([FromBody] LoadCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var id = await _loadService.CreateLoadAsync(dto);
            return Ok(new { Message = "Yük ilanı oluşturuldu.", LoadId = id });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Yük oluşturulurken bir hata oluştu.", Details = ex.Message });
        }
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAllLoads()
    {
        var loads = await _loadService.GetActiveLoadsAsync();
        return Ok(loads);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetLoadById(Guid id)
    {
        var load = await _loadService.GetLoadByIdAsync(id);
        if (load is null)
            return NotFound(new { Message = "Yük bulunamadı." });

        return Ok(load);
    }
}
