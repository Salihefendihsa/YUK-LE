using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Added as requested
    public class BidController : ControllerBase
    {
        private readonly BidService _bidService;

        public BidController(BidService bidService)
        {
            _bidService = bidService;
        }

        [HttpPost]
        [Authorize(Roles = "Driver")]
        public IActionResult PlaceBid()
        {
            return Ok(new { Message = "Teklif verme işlemi (Demo)" });
        }

        [HttpPost("{id}/accept")]
        [Authorize(Roles = "Customer")] // Teklifi yük sahibi kabul eder
        public async Task<IActionResult> AcceptBid(int id)
        {
            try
            {
                await _bidService.AcceptBidAsync(id);
                return Ok(new { Message = "Teklif kabul edildi, yük atandı." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
