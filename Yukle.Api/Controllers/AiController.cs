using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;
using Yukle.Api.DTOs;
using Yukle.Api.Services;

namespace Yukle.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly GeminiService _geminiService;
        private readonly AiPricingService _aiPricingService;
        private readonly Data.YukleDbContext _context;

        public AiController(GeminiService geminiService, AiPricingService aiPricingService, Data.YukleDbContext context)
        {
            _geminiService = geminiService;
            _aiPricingService = aiPricingService;
            _context = context;
        }

        [HttpPost("ocr-license")]
        public async Task<IActionResult> ProcessDriverLicense(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Geçerli bir görsel yüklenmedi.");

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var imageBytes = memoryStream.ToArray();

            var result = await _geminiService.ProcessDriverLicenseAsync(imageBytes);

            return Ok(result);
        }

        [HttpPost("price-analysis")]
        public async Task<IActionResult> AnalyzePrice([FromBody] PriceAnalysisRequestDto request)
        {
            if (request == null)
                return BadRequest("Geçersiz istek parametreleri.");

            var result = await _geminiService.AnalyzePriceAsync(request.Distance, request.Weight, request.CargoType);

            return Ok(new { EstimatedPriceAnalysis = result });
        }

        [HttpGet("load/{id}/price-suggestion")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> SuggestPriceForLoad(int id)
        {
            var load = await _context.Loads.FindAsync(id);
            if (load == null) return NotFound("Yük bulunamadı.");

            var suggestion = await _aiPricingService.AnalyzePriceAsync(load);
            return Ok(new { LoadId = id, Suggestion = suggestion });
        }
    }
}
