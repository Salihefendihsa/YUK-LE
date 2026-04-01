using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Yukle.Api.DTOs;

namespace Yukle.Api.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly string _apiKey;
        private readonly string _flashModel;
        private readonly string _proModel;

        public GeminiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            
            _apiKey = _configuration["GeminiAI:ApiKey"] ?? throw new ArgumentException("Gemini API Key is missing");
            _flashModel = _configuration["GeminiAI:Model"] ?? "gemini-3-flash";
            _proModel = _configuration["GeminiAI:HighProModel"] ?? "gemini-3-pro";
        }

        public async Task<LicenseOcrResultDto?> ProcessDriverLicenseAsync(byte[] imageBytes)
        {
            var base64Image = Convert.ToBase64String(imageBytes);
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_flashModel}:generateContent?key={_apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new object[]
                        {
                            new { text = "Bu ehliyet üzerindeki bilgileri sadece JSON formatında çıkar." },
                            new
                            {
                                inlineData = new
                                {
                                    mimeType = "image/jpeg",
                                    data = base64Image
                                }
                            }
                        }
                    }
                }
            };

            var response = await _httpClient.PostAsJsonAsync(url, requestBody);
            response.EnsureSuccessStatusCode();

            // JSON ayrıştırması proje ihtiyacına ve modelin verdiği cevaba göre detaylandırılabilir.
            // Örnek bir JSON dönüşü varsayılarak deserialize yapısı kuruldu.
            var responseContent = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseContent);
            
            var textResult = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text").GetString();

            if (string.IsNullOrWhiteSpace(textResult))
                return new LicenseOcrResultDto();

            // Gemini bazen markdown "```json" şeklinde geri döner, onu temizle
            textResult = textResult.Replace("```json", "").Replace("```", "").Trim();
            
            return JsonSerializer.Deserialize<LicenseOcrResultDto>(textResult, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }

        public async Task<string> AnalyzePriceAsync(double distance, double weight, string cargoType)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_proModel}:generateContent?key={_apiKey}";
            
            var prompt = $"Mesafeye ({distance} km), ağırlığa ({weight} kg) ve yük tipine ({cargoType}) göre piyasa verilerini analiz et ve Tahmini Fiyat Önerisi ver.";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var response = await _httpClient.PostAsJsonAsync(url, requestBody);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            
            using var doc = JsonDocument.Parse(responseContent);
            var textResult = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text").GetString();

            return textResult ?? string.Empty;
        }
    }
}
