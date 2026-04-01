namespace Yukle.Api.DTOs
{
    public class PriceAnalysisRequestDto
    {
        public double Distance { get; set; }
        public double Weight { get; set; }
        public string CargoType { get; set; } = string.Empty;
    }
}
