using Microsoft.AspNetCore.Mvc;

namespace Yukle.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemController : ControllerBase
{
    [HttpGet("status")]
    public IActionResult GetStatus() => Ok(new
    {
        Message = "YÜK-LE API is Online (v1.0)",
        Environment = "Development",
        Framework = ".NET 9",
        ServerTime = DateTime.UtcNow
    });
}
