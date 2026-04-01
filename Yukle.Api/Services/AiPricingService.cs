using System.Threading.Tasks;
using Yukle.Api.Models;

namespace Yukle.Api.Services
{
    public class AiPricingService
    {
        private readonly GeminiService _geminiService;

        public AiPricingService(GeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        public async Task<string> AnalyzePriceAsync(Load load)
        {
            // İki nokta arasındaki kuş uçuşu mesafeyi (derece) alıp yaklaşık kilometreye çevirir (1 derece ≈ 111 km)
            double distanceDegree = load.Origin.Distance(load.Destination);
            double estimatedDistanceKm = distanceDegree * 111;

            return await _geminiService.AnalyzePriceAsync(estimatedDistanceKm, (double)load.Weight, load.Type.ToString());
        }
    }
}
