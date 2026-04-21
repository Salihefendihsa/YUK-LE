# YÜK-LE — Sistem Mimarisi Genel Bakış

## Mevcut yapı (v2.5.6+): Modüler monolit

Backend **tek bir ASP.NET Core 9** projesi (`Yukle.Api`) olarak geliştirilir: **Single Project / Modular Monolith-ready**. İş mantığı `Services/`, HTTP yüzeyi `Controllers/` ve `Hubs/`, kalıcılık `Data/` (EF Core) ve `Migrations/` altında gruplanır. İleride ayrı `Application` / `Infrastructure` projelerine bölünmeye uygun sınırlar korunur; şu an **Clean Architecture ile çoklu proje** yapısı **kullanılmıyor**.

### Öne çıkan bileşenler

| Bileşen | Açıklama |
|--------|----------|
| **Kimlik** | JWT access token + refresh token (DB’de rotation), rol ve `RequireActiveDriver` policy |
| **Evrak** | Gemini Vision OCR, kimlik eşleştirme, gri alan → `PendingReview`, KVKK AES-256 (TCKN) |
| **Fiyatlandırma** | Gemini + OSRM + yakıt fiyatı tablosu; Polly ile HTTP dayanıklılığı |
| **Eşleştirme** | PostGIS yük konumları + Gemini skorlama |
| **Gerçek zamanlı** | SignalR hub’ları + Redis backplane |
| **Hatalar** | `IExceptionHandler` + RFC 7807 `ProblemDetails` |

## Veri akışı (özet)

```
İstemci (Flutter / SPA)
        │
        ▼  HTTPS
   Yukle.Api (Kestrel)
        │
   ┌────┼────────────────────┐
   ▼    ▼                    ▼
Controllers            SignalR Hubs
   │                        │
   ▼                        ▼
 Services              Redis (backplane)
   │
   ├─► EF Core → PostgreSQL + PostGIS
   ├─► Redis (cache, OTP, rate limit)
   └─► HttpClient → Gemini API, OSRM, CollectAPI
```

## Veritabanı (EF Core — ana tablolar)

Gerçek şema `YukleDbContext` ve migration’larla uyumludur; örnek tablolar:

- **`Users`** — Fabrika / şoför / roller, onay durumu, refresh token, FCM, KVKK alanları
- **`Loads`** — İlan, rota (PostGIS noktaları), AI fiyat alanları, durum
- **`Bids`** — Teklifler
- **`Vehicles`** — Şoför araçları
- **`Notifications`** — Uygulama içi bildirimler
- **`FuelPrices`** — İl bazlı yakıt fiyatı (worker ile güncellenir)

*(Ayrı `drivers` / `factories` tabloları yok; roller `Users` üzerinde tutulur.)*

## Güvenlik (uygulanan)

- JWT + refresh token rotasyonu
- Policy tabanlı yetkilendirme (`RequireActiveDriver`)
- TCKN için AES-256 EF `ValueConverter`
- Merkezi exception → istemciye teknik sızıntı olmadan RFC 7807 yanıtları

## Gelecek (dokümante edilmiş hedefler)

- İyzico escrow, U-ETDS outbox, QR teslimat
- İsteğe bağlı: MediatR/CQRS, FluentValidation, Serilog sink’leri, ayrı katman projeleri
