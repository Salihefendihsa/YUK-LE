# YÜK-LE — Sistem Mimarisi Genel Bakış

## 🏛 Katmanlı Mimari (Clean Architecture)

YÜK-LE projesi, **Clean Architecture** prensipleri üzerine inşa edilmiştir:

### Katmanlar

1. **Domain Layer** — İş kuralları, entity'ler, value object'ler
2. **Application Layer** — CQRS (Command/Query), use case'ler, DTO'lar
3. **Infrastructure Layer** — Veritabanı, dış servis entegrasyonları
4. **API Layer** — HTTP endpoint'leri, SignalR Hub'ları, middleware'ler
5. **Mobile (Flutter)** — Cross-platform mobil uygulama

## 🔄 Veri Akışı

```
Fabrika/Şoför (Flutter App)
        │
        ▼
   API Gateway (.NET 8 Web API)
        │
   ┌────┼────────────────┐
   ▼    ▼                ▼
 CQRS  SignalR Hub    Middleware
   │    (Gerçek         (Auth, Logging,
   │     Zamanlı)        Rate Limiting)
   ▼
Application Layer (MediatR)
   │
   ├─► Domain Events
   ├─► Validators (FluentValidation)
   │
   ▼
Infrastructure Layer
   │
   ├─► PostgreSQL + PostGIS (EF Core)
   ├─► Redis (Cache + Queue)
   ├─► Gemini AI (Fiyat + Evrak)
   ├─► İyzico (Escrow Ödeme)
   └─► U-ETDS (Outbox Pattern)
```

## 🗄 Veritabanı Şeması (Temel Tablolar)

- `users` — Kullanıcılar (fabrika, şoför, admin)
- `drivers` — Şoför profilleri, araç bilgileri
- `factories` — Fabrika profilleri
- `loads` — Yük ilanları
- `bids` — Teklifler
- `shipments` — Taşıma süreçleri
- `payments` — Ödeme kayıtları
- `documents` — Evrak kayıtları
- `locations` — PostGIS konum verileri
- `outbox_messages` — U-ETDS bildirim kuyruğu

## 🔐 Güvenlik

- JWT + Refresh Token kimlik doğrulama
- Role-based authorization (Fabrika, Şoför, Admin)
- Rate limiting ve API throttling
- Escrow ile güvenli ödeme
- HTTPS/TLS zorunlu
