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
    public class AiController : ControllerBase
    {
        private readonly GeminiService _geminiService;

        public AiController(GeminiService geminiService)
        {
            _geminiService = geminiService;
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
    }
}
