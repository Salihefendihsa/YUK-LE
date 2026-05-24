using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettlementController(IWalletSettlementCalculator calculator) : ControllerBase
{
    /// <summary>Ödeme dökümü önizlemesi (oranlar config'ten).</summary>
    [HttpGet("preview")]
    public IActionResult Preview([FromQuery] decimal amount, [FromQuery] bool driverIsCorporate = false)
    {
        if (amount <= 0)
            return BadRequest(new { message = "Tutar sıfırdan büyük olmalıdır." });

        var settlement = calculator.Calculate(amount, driverIsCorporate);
        return Ok(settlement);
    }
}
