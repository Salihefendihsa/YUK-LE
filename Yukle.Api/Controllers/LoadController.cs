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
    public async Task<IActionResult> CreateLoad([FromBody] CreateLoadDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var id = await _loadService.CreateLoadAsync(dto);
        return Ok(new { Message = "Yük veritabanına mühürlendi.", LoadId = id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAllLoads()
    {
        var loads = await _loadService.GetAllLoadsAsync();
        return Ok(loads);
    }
}
