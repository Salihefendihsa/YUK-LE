using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Yukle.Api.DTOs;

namespace Yukle.Api.Services;

/// <summary>
/// Gemini Generative AI API ile tüm iletişimi yöneten merkezi istemci.
/// <list type="bullet">
///   <item><b>Fiyat Analizi</b> — Gemini Flash · Structured Prompting · Adil Navlun Uzmanı.</item>
///   <item><b>Evrak OCR</b>    — Gemini Flash · Multimodal · Ehliyet / SRC / Ruhsat.</item>
/// </list>
/// <para>
/// HttpClient, <c>Program.cs</c>'te Polly resilience pipeline ile sarmalanmıştır
/// (Retry × 3 Exponential Backoff + Circuit Breaker 5/30s + Timeout 10s).
/// </para>
/// Tüm hatalar fallback ile karşılanır — kullanıcıya asla ham exception yansımaz.
/// </summary>
public sealed class GeminiServiceClient(
    HttpClient                   httpClient,
    IConfiguration               configuration,
    ILogger<GeminiServiceClient> logger) : IGeminiService
{
    private readonly string _apiKey     = configuration["GeminiAI:ApiKey"]
                                          ?? throw new ArgumentException("GeminiAI:ApiKey eksik.");
    private readonly string _flashModel = configuration["GeminiAI:Model"]        ?? "gemini-1.5-flash";
    private readonly string _proModel   = configuration["GeminiAI:HighProModel"] ?? "gemini-1.5-pro";

    // JSON seçenekleri: Gemini camelCase döner, DTO PascalCase — her ikisini eşle.
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling              = JsonNumberHandling.AllowReadingFromString
    };

    // =========================================================================
    // Fiyat Analizi — CalculateFairPriceAsync (Structured Prompt · Flash)
    // =========================================================================

    /// <summary>
    /// Yapılandırılmış prompt tekniğiyle Gemini Flash'a "Adil Navlun Fiyatı" hesaplattırır.
    ///
    /// Prompt kısıtları:
    /// <list type="bullet">
    ///   <item>MinPrice ≥ Yakıt maliyeti × 1.40 (şoförün kırmızı çizgisi).</item>
    ///   <item>MaxPrice ≤ RecommendedPrice × 1.20 (piyasa tavanı).</item>
    /// </list>
    /// Tüm sayılar <see cref="CultureInfo.InvariantCulture"/> ile formatlanır — nokta/virgül karmaşası yoktur.
    /// </summary>
    public async Task<AiPriceSuggestionDto> CalculateFairPriceAsync(
        double  distance,
        string  vehicleType,
        decimal fuelPrice,
        double  weightTon,
        string? route = null)
    {
        try
        {
            // ── CultureInfo.InvariantCulture ile güvenli sayı formatlaması ────
            var distStr   = distance.ToString("F1", CultureInfo.InvariantCulture);
            var fuelStr   = fuelPrice.ToString("F2", CultureInfo.InvariantCulture);
            var weightStr = weightTon.ToString("F3", CultureInfo.InvariantCulture);
            var routeCtx  = string.IsNullOrWhiteSpace(route) ? "Belirtilmedi" : route;

            // Araç tipine özgü tüketim — prompt içinde ön-hesap olarak sunulur
            var consumption    = GetVehicleConsumption(vehicleType);
            var consumptionStr = consumption.ToString("F1", CultureInfo.InvariantCulture);

            // Ön-hesap yakıt maliyeti — Gemini'nin reasoning'ini sabitleyen referans nokta
            var fuelCost    = (decimal)distance * fuelPrice * consumption / 100m;
            var fuelCostStr = fuelCost.ToString("F2", CultureInfo.InvariantCulture);

            var userPrompt =
                $"HESAPLAMA GİRDİLERİ:\n" +
                $"- Mesafe                 : {distStr} km\n" +
                $"- Araç Tipi              : {vehicleType}\n" +
                $"- Güncel Yakıt Fiyatı    : {fuelStr} TL/litre\n" +
                $"- Araç Tüketimi          : {consumptionStr} lt/100 km\n" +
                $"- Ön-Hesap Yakıt Maliyeti: {fuelCostStr} TL\n" +
                $"  (= {distStr} km × {fuelStr} TL/lt × {consumptionStr} lt ÷ 100)\n" +
                $"- Yük Ağırlığı           : {weightStr} ton\n" +
                $"- Güzergah Bağlamı       : {routeCtx}\n\n" +
                "Tahmini Otoyol/Köprü giderleri ve Araç Amortismanını Türkiye 2026 piyasasına\n" +
                "göre kendin hesapla. Formülü ve 3 zorunlu soruyu Reasoning alanına yaz.\n" +
                "Adil Navlun Fiyatını hesapla.";

            var requestBody = new
            {
                system_instruction = new
                {
                    parts = new[] { new { text = FairPriceSystemInstruction } }
                },
                contents = new[]
                {
                    new { parts = new[] { new { text = userPrompt } } }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json",
                    temperature      = 0.15  // Kısıtlı prompt — düşük sıcaklıkla tutarlı sayılar
                }
            };

            var response = await httpClient.PostAsJsonAsync(BuildUrl(_flashModel), requestBody);
            response.EnsureSuccessStatusCode();

            var jsonText = await ExtractGeminiTextAsync(response);

            if (string.IsNullOrWhiteSpace(jsonText))
            {
                logger.LogWarning("Gemini Flash returned empty price text. Falling back.");
                return FallbackPriceSuggestion(distance, vehicleType, fuelPrice, weightTon);
            }

            var suggestion = JsonSerializer.Deserialize<GeminiPriceResponse>(
                CleanJson(jsonText), JsonOpts);

            if (suggestion is null)
            {
                logger.LogWarning("Gemini Flash price deserialized as null. Falling back.");
                return FallbackPriceSuggestion(distance, vehicleType, fuelPrice, weightTon);
            }

            // Toplam kısıt kontrolü: dört bileşen toplamı ≈ RecommendedPrice
            // Küçük yuvarlama farkları tolere edilir (±50 TL), büyük sapma varsa fallback değerler.
            var breakdown = suggestion.FuelCost + suggestion.TollCost
                          + suggestion.AmortizationCost + suggestion.EstimatedNetProfit;
            var gapRatio  = suggestion.RecommendedPrice > 0
                ? Math.Abs((double)(breakdown - suggestion.RecommendedPrice) / (double)suggestion.RecommendedPrice)
                : 1.0;

            // Gemini breakdown vermediyse ya da tutarsızsa, fallback breakdown uygula
            decimal finalFuel = suggestion.FuelCost;
            decimal finalToll = suggestion.TollCost;
            decimal finalAmort= suggestion.AmortizationCost;
            decimal finalNet  = suggestion.EstimatedNetProfit;

            if (gapRatio > 0.05 || (finalFuel == 0 && finalToll == 0 && finalAmort == 0))
            {
                // Breakdown tutarsız — fuelCost'u sabit hesapla, geri kalan net'e at
                var rebuildConsumption = GetVehicleConsumption(vehicleType);
                finalFuel  = Math.Round((decimal)distance / 100m * rebuildConsumption * fuelPrice, 2);
                finalToll  = Math.Round((decimal)distance * GetTollPerKm(vehicleType), 2);
                finalAmort = Math.Round((decimal)distance * GetAmortPerKm(vehicleType), 2);
                finalNet   = Math.Round(suggestion.RecommendedPrice - finalFuel - finalToll - finalAmort, 2);

                logger.LogDebug(
                    "Gemini breakdown tutarsız (gap %{Gap:F1}); matematiksel breakdown uygulandı.",
                    gapRatio * 100);
            }

            logger.LogInformation(
                "Gemini Flash (Adil Fiyat): {Rec} TL (min {Min} / max {Max}) | " +
                "Yakıt: {Fuel} TL, Otoyol: {Toll} TL, Amortisman: {Amort} TL, Net: {Net} TL — " +
                "{Dist}km {Vehicle} {WeightTon}t{RouteCtx}.",
                suggestion.RecommendedPrice, suggestion.MinPrice, suggestion.MaxPrice,
                finalFuel, finalToll, finalAmort, finalNet,
                distStr, vehicleType, weightStr,
                route is not null ? $" via {route}" : string.Empty);

            return new AiPriceSuggestionDto(
                suggestion.RecommendedPrice,
                suggestion.MinPrice,
                suggestion.MaxPrice,
                suggestion.Reasoning ?? string.Empty,
                FuelCost:           finalFuel,
                TollCost:           finalToll,
                AmortizationCost:   finalAmort,
                EstimatedNetProfit: finalNet);
        }
        catch (Polly.CircuitBreaker.BrokenCircuitException ex)
        {
            logger.LogWarning(
                "Gemini circuit breaker OPEN — serving fallback for {Dist}km {Vehicle}. Reason: {R}",
                distance, vehicleType, ex.Message);
            return FallbackPriceSuggestion(distance, vehicleType, fuelPrice, weightTon);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Gemini Flash price call failed. Applying fallback.");
            return FallbackPriceSuggestion(distance, vehicleType, fuelPrice, weightTon);
        }
    }

    // ── Matematiksel Prompt Mühendisliği — Adil Fiyat Uzmanı ─────────────────
    private const string FairPriceSystemInstruction =
        "Sen profesyonel bir Türkiye Lojistik Fiyatlandırma Uzmanı'sın (2026 piyasası).\n" +
        "Görevin: Verilen parametrelerden matematiksel olarak şoförü kurtaran ve " +
        "müşteriyi kaçırmayan 'Adil Navlun Fiyatı'nı hesaplamak.\n\n" +

        "═══ HESAPLAMA TEMELİ (ZORUNLU FORMÜL) ════════════════════════════════\n" +
        "TemelMaliyet =\n" +
        "    (Mesafe × YakıtFiyatı × AraçTüketimi / 100)     ← yakıt kalemi    [fuelCost]\n" +
        "  + TahminiOtoyolKöprüGiderleri                      ← Türkiye 2026 tarifesi [tollCost]\n" +
        "  + AraçAmortismanı                                   ← araç tipine göre TL/km: [amortizationCost]\n" +
        "      TIR ~3.50 TL/km | Kamyon ~2.50 TL/km | Kamyonet ~1.20 TL/km | Panelvan ~0.80 TL/km\n" +
        "  + ŞoförMinimumKârMarjı                             ← yakıt maliyetinin %40'ı [estimatedNetProfit]\n\n" +

        "═══ FİYAT KISITLARI (İhlal edilemez) ══════════════════════════════════\n" +
        "MinPrice         = TemelMaliyet × 1.40   ← şoförün kırmızı çizgisi\n" +
        "MaxPrice         = RecommendedPrice × 1.20 ← piyasa tavanı\n" +
        "RecommendedPrice = MinPrice ile MaxPrice arasında rekabetçi ve adil orta nokta\n\n" +

        "═══ MALİYET DÖKÜMÜ (ZORUNLU — 4 alan toplamı = RecommendedPrice) ═══\n" +
        "fuelCost           = Mesafe × YakıtFiyatı × AraçTüketimi / 100  (hesapla)\n" +
        "tollCost           = Türkiye 2026 otoyol/köprü tahmini           (hesapla)\n" +
        "amortizationCost   = Mesafe × Amortisman(TL/km)                  (hesapla)\n" +
        "estimatedNetProfit = RecommendedPrice - fuelCost - tollCost - amortizationCost\n" +
        "KURAL: fuelCost + tollCost + amortizationCost + estimatedNetProfit = recommendedPrice\n\n" +

        "═══ DİNAMİK DÜZELTME FAKTÖRLERİ ══════════════════════════════════════\n" +
        "• Dağlık/rampası arazi → yakıt tüketimini +%10–20 artır.\n" +
        "• İstanbul/büyükşehir içi → zaman maliyeti: +%8–12 ekle.\n" +
        "• Boş dönüş imkânı yüksek bölge → fiyatı -%5–10 kır.\n" +
        "• Ağır yük (>10 ton) → dingil vergisi + lastik aşınması: ton başına +50–80 TL ekle.\n" +
        "• Kış/olumsuz hava koşulları güzergahı → +%5–15 ekle.\n\n" +

        "═══ REASONING ALANI — SAMİMİ ŞOFÖRe HİTAP (3 ZORUNLU CEVAP) ═══════\n" +
        "Reasoning alanında şoföre doğrudan 'Aga' diye hitap ederek samimi ve anlaşılır yaz.\n" +
        "Teknik terimler yerine sokak dili kullan. Şu 3 soruyu yanıtla:\n" +
        "1. Yakıt payı: \"Aga bu yolda yakıtın seni X TL'ye mal olur, toplam fiyatın %Y'si.\"\n" +
        "2. Zorluk payı: \"[Güzergah/Araç tipi] nedeniyle X TL zorluk payı eklendi çünkü [1 cümle gerekçe].\"\n" +
        "3. Net kazanç: \"Mazot, otoyol ve amortisman düşünce cebine net tahminen X TL kalır. " +
        "[Boş dönüş, dönüş yükü gibi varsa ek yorum ekle.]\"\n\n" +

        "ÇIKTI: Sadece JSON, başka HİÇBİR şey yazma.\n" +
        "Şema (tüm alanlar sayısal, reasoning string):\n" +
        "{ \"recommendedPrice\": 0, \"minPrice\": 0, \"maxPrice\": 0, " +
        "\"fuelCost\": 0, \"tollCost\": 0, \"amortizationCost\": 0, " +
        "\"estimatedNetProfit\": 0, \"reasoning\": \"\" }";

    // =========================================================================
    // Fiyat Analizi — GetPriceSuggestionAsync (Geriye Dönük Uyumlu Sarmalayıcı)
    // =========================================================================

    /// <summary>
    /// <see cref="CalculateFairPriceAsync"/> için kg → ton dönüşümü yapan sarmalayıcı.
    /// Mevcut çağrı noktaları (controller, service) imza değişikliği gerektirmeden çalışır.
    /// </summary>
    public Task<AiPriceSuggestionDto> GetPriceSuggestionAsync(
        double  distance,
        string  vehicleType,
        decimal fuelPrice,
        double  weight,
        string? route = null)
        => CalculateFairPriceAsync(distance, vehicleType, fuelPrice, weight / 1000.0, route);

    // =========================================================================
    // Evrak OCR (Multimodal · Flash Model)
    // =========================================================================

    /// <summary>
    /// Sürücü belgesi, SRC sertifikası veya araç ruhsatı görselini analiz ederek
    /// yapılandırılmış JSON döner. Görsel base64 olarak Gemini Flash'a gönderilir.
    /// </summary>
    public async Task<DocumentOcrResultDto> AnalyzeDocumentAsync(
        byte[]       imageBytes,
        DocumentType documentType = DocumentType.DriverLicense,
        string       mimeType     = "image/jpeg")
    {
        try
        {
            var base64 = Convert.ToBase64String(imageBytes);

            var requestBody = new
            {
                system_instruction = new
                {
                    parts = new[] { new { text = GetDocumentSystemInstruction(documentType) } }
                },
                contents = new[]
                {
                    new
                    {
                        parts = new object[]
                        {
                            new { text = $"Bu {DocumentTypeLabel(documentType)} görselindeki bilgileri çıkar." },
                            new { inlineData = new { mimeType = mimeType, data = base64 } }
                        }
                    }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json",
                    temperature      = 0.1   // OCR deterministik olmalı
                }
            };

            var response = await httpClient.PostAsJsonAsync(BuildUrl(_flashModel), requestBody);
            response.EnsureSuccessStatusCode();

            var jsonText = await ExtractGeminiTextAsync(response);

            if (string.IsNullOrWhiteSpace(jsonText))
            {
                logger.LogWarning("Gemini OCR returned empty text for {DocType}.", documentType);
                return new DocumentOcrResultDto();
            }

            var result = JsonSerializer.Deserialize<DocumentOcrResultDto>(
                CleanJson(jsonText), JsonOpts);

            logger.LogInformation(
                "Gemini OCR completed for {DocType}. Name: {Name}",
                documentType, result?.FullName ?? "N/A");

            return result ?? new DocumentOcrResultDto();
        }
        catch (Polly.CircuitBreaker.BrokenCircuitException ex)
        {
            logger.LogWarning(
                "Gemini circuit breaker OPEN — OCR skipped for {DocType}. Reason: {R}",
                documentType, ex.Message);
            return new DocumentOcrResultDto();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Gemini OCR call failed for {DocType}.", documentType);
            return new DocumentOcrResultDto();
        }
    }

    // =========================================================================
    // Smart Matching — AnalyzeDriverMatchAsync (Lojistik İK Uzmanı · Flash)
    // =========================================================================

    /// <summary>
    /// Şoförün geçmişi ve aracına göre aday yükleri puanlar.
    /// Tek bir Gemini çağrısında tüm aday yükler değerlendirilir; karşılaştırmalı sıralama sağlanır.
    /// Yeni şoförler (geçmişsiz) doğrudan fallback'e yönlendirilir.
    /// </summary>
    public async Task<List<DriverMatchResultDto>> AnalyzeDriverMatchAsync(
        DriverMatchContextDto context,
        CancellationToken     ct = default)
    {
        // Yeni şoför veya aday yük yoksa → fallback
        if (context.IsNewDriver || context.CandidateLoads.Count == 0)
        {
            logger.LogInformation(
                "Smart Matching: Yeni şoför ({Name}) veya aday yük yok — fallback uygulandı.",
                context.DriverName);
            return MatchingFallback(context);
        }

        try
        {
            var userPrompt = BuildMatchingPrompt(context);

            var requestBody = new
            {
                system_instruction = new
                {
                    parts = new[] { new { text = MatchingSystemInstruction } }
                },
                contents = new[]
                {
                    new { parts = new[] { new { text = userPrompt } } }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json",
                    temperature      = 0.20  // Kişisellik için biraz yaratıcılık, ama tutarlı puan
                }
            };

            var response = await httpClient.PostAsJsonAsync(
                BuildUrl(_flashModel), requestBody, ct);
            response.EnsureSuccessStatusCode();

            var jsonText = await ExtractGeminiTextAsync(response);

            if (string.IsNullOrWhiteSpace(jsonText))
            {
                logger.LogWarning("Smart Matching: Gemini boş yanıt döndü — fallback uygulandı.");
                return MatchingFallback(context);
            }

            var raw = JsonSerializer.Deserialize<List<GeminiMatchEntry>>(
                CleanJson(jsonText), JsonOpts);

            if (raw is not { Count: > 0 })
            {
                logger.LogWarning("Smart Matching: Gemini yanıtı parse edilemedi — fallback uygulandı.");
                return MatchingFallback(context);
            }

            // key → Guid eşlemesi
            var keyMap = context.CandidateLoads.ToDictionary(c => c.Key, c => c.LoadId);

            var results = raw
                .Where(e => keyMap.ContainsKey(e.Key))
                .Select(e => new DriverMatchResultDto
                {
                    LoadId             = keyMap[e.Key],
                    MatchScore         = Math.Clamp(e.MatchScore, 0, 100),
                    PersonalizedReason = e.PersonalizedReason ?? string.Empty,
                    PriorityTag        = DeriveTag(e.MatchScore),
                    IsAiGenerated      = true
                })
                .ToList();

            // Gemini bazı yükleri atlayabilir — eksik olanları fallback ile tamamla
            var scored = results.Select(r => r.LoadId).ToHashSet();
            foreach (var candidate in context.CandidateLoads.Where(c => !scored.Contains(c.LoadId)))
            {
                results.Add(BuildFallbackEntry(candidate, context, isAi: false));
            }

            logger.LogInformation(
                "Smart Matching tamamlandı: {Count} yük puanlandı — şoför: {Name}",
                results.Count, context.DriverName);

            return results.OrderByDescending(r => r.MatchScore).ToList();
        }
        catch (Polly.CircuitBreaker.BrokenCircuitException ex)
        {
            logger.LogWarning(
                "Smart Matching: Circuit breaker AÇIK — fallback uygulandı. Şoför: {Name}. {R}",
                context.DriverName, ex.Message);
            return MatchingFallback(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Smart Matching: Gemini çağrısı başarısız — fallback uygulandı. Şoför: {Name}",
                context.DriverName);
            return MatchingFallback(context);
        }
    }

    // ── Matching System Instruction ───────────────────────────────────────────
    private const string MatchingSystemInstruction =
        "Sen YÜK-LE platformunun Lojistik İK ve Operasyon Uzmanı'sın.\n" +
        "Görevin: Bir şoförün geçmiş iş deneyimi ve araç kapasitesine göre, " +
        "sana verilen yük ilanlarının şoföre ne kadar uygun olduğunu puanlamak.\n\n" +

        "═══ DEĞERLENDİRME KRİTERLERİ (toplam 100 puan) ════════════════════\n" +
        "1. BÖLGE UZMANLIĞI (+30 pt): Şoför bu güzergahta veya bölgede daha önce çalışmış mı?\n" +
        "   - Aynı şehir çifti: +30 | Aynı bölge: +20 | İlk kez: +0\n" +
        "2. YÜK UYUMLULUĞU (+25 pt): Şoför daha önce bu tür yük taşımış mı?\n" +
        "   - Aynı yük türü: +25 | Benzer tür: +15 | Tamamen farklı: +5\n" +
        "3. ARAÇ UYGUNLUĞU (+25 pt): Yük ağırlığı araç kapasitesine uyuyor mu?\n" +
        "   - Kapasite içinde (≤%90): +25 | Sınırda (%90-100): +15 | Aşıyor: +0\n" +
        "4. GEÇMİŞ BAŞARI (+20 pt): Bu rotada veya benzer rotada kaç başarılı teslimat var?\n" +
        "   - 3+: +20 | 1-2: +12 | Yok: +0\n\n" +

        "═══ PERSONELİZE MESAJ KURALI ══════════════════════════════════════\n" +
        "PersonalizedReason alanında şoföre doğrudan 'Aga' diye hitap et.\n" +
        "Samimi, sokak dili, kısa (1-2 cümle). Puana göre ton:\n" +
        "- Yüksek (≥80): Coşkulu ve özgüvenli — 'Aga bu yük sanki senin için yazılmış!'\n" +
        "- Orta (50-79): Teşvik edici — 'Aga bu güzergahta deneyim kazanmak için iyi fırsat.'\n" +
        "- Normal (<50): Dürüst — 'Aga bu yük biraz farklı bölge, ama araç tipine uygun.'\n\n" +

        "ÇIKTI: Sadece JSON array, başka HİÇBİR şey yazma.\n" +
        "Şema: [{\"key\": \"l1\", \"matchScore\": 0, \"personalizedReason\": \"\"}]";

    // ── Prompt Builder ────────────────────────────────────────────────────────
    private static string BuildMatchingPrompt(DriverMatchContextDto ctx)
    {
        var sb = new System.Text.StringBuilder();

        sb.AppendLine("ŞOFÖRBİLGİSİ:");
        sb.AppendLine($"  İsim        : {ctx.DriverName}");
        sb.AppendLine($"  Araç Tipi   : {ctx.VehicleType}");
        sb.AppendLine($"  Kapasite    : {ctx.VehicleCapacityTon:F1} ton");
        sb.AppendLine();

        if (ctx.RecentRoutes.Count > 0)
        {
            sb.AppendLine($"SON {ctx.RecentRoutes.Count} BAŞARILI TESLİMAT:");
            foreach (var r in ctx.RecentRoutes)
            {
                sb.AppendLine($"  {r.FromCity} → {r.ToCity} | {r.LoadType} | {r.VehicleType} " +
                              $"| {r.CompletedAt:yyyy-MM-dd}");
            }
        }
        else
        {
            sb.AppendLine("GEÇMİŞ TESLİMAT: Yok (Yeni Şoför)");
        }

        sb.AppendLine();
        sb.AppendLine("ADAY YÜKLER (analiz et ve puanla):");

        foreach (var load in ctx.CandidateLoads)
        {
            sb.AppendLine(
                $"  [{load.Key}] {load.FromCity} → {load.ToCity} | {load.LoadType} | " +
                $"{load.RequiredVehicleType} | {load.WeightTon:F1} ton | " +
                $"{load.DistanceKm:F0} km | {load.Price:N0} TL");
        }

        sb.AppendLine();
        sb.AppendLine("Her aday yük için matchScore (0-100) ve personalizedReason üret.");
        sb.AppendLine("Tüm key değerlerini koru. Sadece JSON array döndür.");

        return sb.ToString();
    }

    // ── Fallback: Gemini erişilemez veya yeni şoför ──────────────────────────
    private static List<DriverMatchResultDto> MatchingFallback(DriverMatchContextDto ctx)
    {
        var results = new List<DriverMatchResultDto>();

        foreach (var candidate in ctx.CandidateLoads)
        {
            results.Add(BuildFallbackEntry(candidate, ctx, isAi: false));
        }

        return results.OrderByDescending(r => r.MatchScore).ToList();
    }

    private static DriverMatchResultDto BuildFallbackEntry(
        CandidateLoadItem     candidate,
        DriverMatchContextDto ctx,
        bool                  isAi)
    {
        // Araç tipi uyumu
        var vehicleMatch = string.Equals(
            candidate.RequiredVehicleType, ctx.VehicleType,
            StringComparison.OrdinalIgnoreCase);

        int score;
        string reason;

        if (ctx.IsNewDriver)
        {
            score  = vehicleMatch ? 70 : 40;
            reason = vehicleMatch
                ? $"Yeni Gakgoş, aramıza hoş geldin! {candidate.FromCity} → {candidate.ToCity} " +
                  $"güzergahı {ctx.VehicleType}'ına uygun, ilk yükünle tecrübe kazanmaya ne dersin?"
                : $"Yeni Gakgoş, aramıza hoş geldin! Bu yük için araç tipini kontrol et, " +
                  $"ama sen doğru yoldasın!";
        }
        else if (vehicleMatch)
        {
            score  = 60;
            reason = $"Aga araç tipin uygun ama bu güzergahta geçmiş verimiz yok şimdilik. " +
                     $"Denemeye değer olabilir!";
        }
        else
        {
            score  = 35;
            reason = $"Aga bu yük farklı bir araç tipi gerektiriyor, dikkat et.";
        }

        return new DriverMatchResultDto
        {
            LoadId             = candidate.LoadId,
            MatchScore         = score,
            PersonalizedReason = reason,
            PriorityTag        = DeriveTag(score),
            IsAiGenerated      = isAi
        };
    }

    private static string DeriveTag(int score) => score switch
    {
        >= 80 => "Yüksek",
        >= 50 => "Orta",
        _     => "Normal"
    };

    // ── Dahili Gemini Matching JSON şeması ────────────────────────────────────
    private sealed record GeminiMatchEntry(
        string  Key,
        int     MatchScore,
        string? PersonalizedReason);

    // =========================================================================
    // Fallback: Araç Tipine Özel Deterministik Model
    // =========================================================================

    /// <summary>
    /// Gemini erişilemediğinde veya circuit breaker açıkken devreye giren
    /// Türkiye piyasası deterministik fiyat modeli.
    /// <para>
    /// Breakdown alanları (FuelCost, TollCost, AmortizationCost, EstimatedNetProfit)
    /// tam olarak hesaplanır ve toplamları RecommendedPrice'a eşit olur.
    /// </para>
    /// <paramref name="weightTon"/> ton cinsindendir.
    /// </summary>
    internal static AiPriceSuggestionDto FallbackPriceSuggestion(
        double  distance,
        string  vehicleType,
        decimal fuelPrice,
        double  weightTon)
    {
        var vt   = vehicleType.ToUpperInvariant();
        var dist = (decimal)distance;
        var wTon = (decimal)weightTon;

        // ── Araç tipine özel sabitler ──────────────────────────────────────
        var consumptionPer100Km = GetVehicleConsumption(vehicleType);

        var overheadMultiplier = vt switch
        {
            "TIR"      => 2.40m,
            "KAMYON"   => 2.20m,
            "KAMYONET" => 1.80m,
            "PANELVAN" => 1.60m,
            _          => 2.20m
        };

        var weightFactorPerTon = vt switch
        {
            "TIR"      => 15m,
            "KAMYON"   => 12m,
            "KAMYONET" => 8m,
            "PANELVAN" => 5m,
            _          => 10m
        };

        var (minBand, maxBand) = vt switch
        {
            "TIR"      => (0.82m, 1.25m),
            "KAMYON"   => (0.85m, 1.22m),
            "KAMYONET" => (0.88m, 1.18m),
            "PANELVAN" => (0.90m, 1.15m),
            _          => (0.85m, 1.20m)
        };

        // ── Maliyet Bileşenleri (4 toplam = RecommendedPrice) ─────────────

        // 1. Yakıt gideri
        var fuelCost  = Math.Round(dist / 100m * consumptionPer100Km * fuelPrice, 2);

        // 2. Otoyol/Köprü — araç tipine göre TL/km tahmini
        var tollCost  = Math.Round(dist * GetTollPerKm(vehicleType), 2);

        // 3. Amortisman — araç tipine göre TL/km tahmini
        var amortCost = Math.Round(dist * GetAmortPerKm(vehicleType), 2);

        // 4. Ağırlık sürşarjı — ana fiyata entegre (net kâr üzerine eklenmez)
        var weightSurcharge = Math.Round(wTon * weightFactorPerTon, 2);

        // RecommendedPrice: (yakıt × genel_çarpan) + ağırlık_sürşarjı
        var recommended = Math.Round(fuelCost * overheadMultiplier + weightSurcharge, 2);
        var min         = Math.Round(recommended * minBand, 2);
        var max         = Math.Round(recommended * maxBand, 2);

        // 5. Net kâr = Önerilen fiyat - tüm giderler (garanti pozitif)
        var netProfit   = Math.Max(0m, Math.Round(recommended - fuelCost - tollCost - amortCost, 2));

        // ── Şoföre Samimi Reasoning ────────────────────────────────────────
        var distStr    = distance.ToString("F0", CultureInfo.InvariantCulture);
        var fuelStr    = fuelPrice.ToString("F2", CultureInfo.InvariantCulture);
        var wStr       = weightTon.ToString("F1", CultureInfo.InvariantCulture);
        var fuelPct    = recommended > 0
            ? Math.Round(fuelCost / recommended * 100, 0)
            : 0m;

        var reasoning =
            $"[Fallback Analiz] " +
            $"Aga bu yolda yakıtın seni {fuelCost:N0} TL'ye mal olur, " +
            $"toplam fiyatın %{fuelPct}'i. " +
            $"Otoyol/köprü tahminen {tollCost:N0} TL, " +
            $"araç amortismanı {amortCost:N0} TL. " +
            $"{distStr} km × {consumptionPer100Km} lt/100km × {fuelStr} TL/lt = {fuelCost:N0} TL yakıt. " +
            $"{wStr} ton yük için {weightSurcharge:N0} TL sürşarj eklendi. " +
            $"Mazot, otoyol ve amortisman düşünce cebine net tahminen {netProfit:N0} TL kalır. " +
            $"(Not: Bu tahmin AI analizi yerine matematiksel modelden geliyor.)";

        return new AiPriceSuggestionDto(
            RecommendedPrice:  recommended,
            MinPrice:          min,
            MaxPrice:          max,
            Reasoning:         reasoning,
            FuelCost:          fuelCost,
            TollCost:          tollCost,
            AmortizationCost:  amortCost,
            EstimatedNetProfit:netProfit);
    }

    // =========================================================================
    // Yardımcılar
    // =========================================================================

    private string BuildUrl(string model)
        => $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={_apiKey}";

    /// <summary>
    /// Araç tipine göre ortalama yakıt tüketimini lt/100km cinsinden döner.
    /// Hem prompt zenginleştirme hem fallback formülü tarafından kullanılır.
    /// </summary>
    private static decimal GetVehicleConsumption(string vehicleType)
        => vehicleType.ToUpperInvariant() switch
        {
            "TIR"      => 38m,
            "KAMYON"   => 28m,
            "KAMYONET" => 14m,
            "PANELVAN" => 10m,
            _          => 30m
        };

    /// <summary>Gemini yanıt zarfından metin içeriğini çıkarır.</summary>
    private static async Task<string?> ExtractGeminiTextAsync(HttpResponseMessage response)
    {
        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        return doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();
    }

    private static string GetDocumentSystemInstruction(DocumentType docType) => docType switch
    {
        DocumentType.DriverLicense =>
            "Sen bir lojistik evrak uzmanısın. " +
            "Gönderilen görseldeki sürücü belgesinden (Ad Soyad, TC Kimlik No, Belge No, " +
            "Ehliyet Sınıfı, Doğum Tarihi, Geçerlilik Tarihi, Düzenleyen Kurum) " +
            "bilgilerini ayıkla ve sadece JSON dön, başka hiçbir şey yazma. " +
            "Şema: { \"fullName\": \"\", \"tcIdentityNumber\": \"\", \"documentNumber\": \"\", " +
            "\"licenseClass\": \"\", \"birthDate\": \"\", \"validUntil\": \"\", \"issuingAuthority\": \"\" }",

        DocumentType.SrcCertificate =>
            "Sen bir lojistik evrak uzmanısın. " +
            "Gönderilen görseldeki SRC belgesinden (Ad Soyad, TC Kimlik No, Belge No, " +
            "Belge Türü, Geçerlilik Tarihi) bilgilerini ayıkla ve sadece JSON dön. " +
            "Şema: { \"fullName\": \"\", \"tcIdentityNumber\": \"\", \"documentNumber\": \"\", " +
            "\"documentType\": \"SRC\", \"validUntil\": \"\" }",

        DocumentType.VehicleRegistration =>
            "Sen bir lojistik evrak uzmanısın. " +
            "Gönderilen görseldeki araç ruhsatından (Ad Soyad, Plaka, Marka/Model, " +
            "Motor No, Şasi No, Tescil Tarihi) bilgilerini ayıkla ve sadece JSON dön. " +
            "Şema: { \"fullName\": \"\", \"documentNumber\": \"\", " +
            "\"documentType\": \"Ruhsat\", \"issuingAuthority\": \"\" }",

        _ =>
            "Sen bir evrak analiz uzmanısın. " +
            "Görseldeki tüm metin bilgilerini JSON formatında döndür."
    };

    private static string DocumentTypeLabel(DocumentType docType) => docType switch
    {
        DocumentType.DriverLicense       => "sürücü belgesi",
        DocumentType.SrcCertificate      => "SRC sertifikası",
        DocumentType.VehicleRegistration => "araç ruhsatı",
        _                                => "belge"
    };

    /// <summary>Gemini'nin olası markdown sarmalını temizler (double-defense).</summary>
    private static string CleanJson(string text)
        => text.Replace("```json", "").Replace("```", "").Trim();

    // ── Dahili Gemini JSON şeması ──────────────────────────────────────────────
    private sealed record GeminiPriceResponse(
        decimal  RecommendedPrice,
        decimal  MinPrice,
        decimal  MaxPrice,
        string?  Reasoning,
        decimal  FuelCost           = 0m,
        decimal  TollCost           = 0m,
        decimal  AmortizationCost   = 0m,
        decimal  EstimatedNetProfit = 0m);

    /// <summary>Araç tipine göre otoyol/köprü gideri tahmini (TL/km) — Türkiye 2026.</summary>
    private static decimal GetTollPerKm(string vehicleType)
        => vehicleType.ToUpperInvariant() switch
        {
            "TIR"      => 2.00m,
            "KAMYON"   => 1.50m,
            "KAMYONET" => 0.80m,
            "PANELVAN" => 0.50m,
            _          => 1.50m
        };

    /// <summary>Araç tipine göre amortisman/yıpranma payı (TL/km) — Türkiye 2026.</summary>
    private static decimal GetAmortPerKm(string vehicleType)
        => vehicleType.ToUpperInvariant() switch
        {
            "TIR"      => 3.50m,
            "KAMYON"   => 2.50m,
            "KAMYONET" => 1.20m,
            "PANELVAN" => 0.80m,
            _          => 2.50m
        };
}
