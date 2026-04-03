using System.Threading.Tasks;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public class AiPricingService
{
    private readonly GeminiService _geminiService;

    public AiPricingService(GeminiService geminiService)
    {
        _geminiService = geminiService;
    }

    public async Task<string> AnalyzePriceAsync(Load load)
    {
        // GPS koordinatları kaldırıldı; rota şehir/ilçe metni üzerinden AI'ya aktarılır.
        string route = $"{load.FromCity}/{load.FromDistrict} → {load.ToCity}/{load.ToDistrict}";
        return await _geminiService.AnalyzePriceAsync(route, load.Weight, load.Type.ToString());
    }
}
