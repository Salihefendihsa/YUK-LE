<p align="center">
  <img src="docs/assets/yukle-banner.png" alt="YÜK-LE Banner" width="100%"/>
</p>

<h1 align="center">🚛 YÜK-LE</h1>

<p align="center">
  <strong>Fabrikalar ile Güvenilir Tır Şoförlerini Saniyeler İçinde Buluşturan<br/>Yapay Zeka Destekli Yeni Nesil Lojistik Pazaryeri</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/.NET-9.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET 9"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Flutter-3.x-02569B?style=for-the-badge&logo=flutter&logoColor=white" alt="Flutter"/></a>
  <a href="#"><img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/></a>
  <a href="#"><img src="https://img.shields.io/badge/PostGIS-3.4-5CAE58?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostGIS"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Gemini_AI-1.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI"/></a>
  <a href="#"><img src="https://img.shields.io/badge/SignalR-RealTime-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt="SignalR"/></a>
  <a href="#"><img src="https://img.shields.io/badge/İyzico-Escrow-1A1A2E?style=for-the-badge&logoColor=white" alt="İyzico"/></a>
  <a href="#"><img src="https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge" alt="License"/></a>
</p>

<p align="center">
  <a href="#-proje-hakkında">Hakkında</a> •
  <a href="#-temel-özellikler">Özellikler</a> •
  <a href="#-sistem-mimarisi">Mimari</a> •
  <a href="#-teknoloji-yığını">Teknolojiler</a> •
  <a href="#-kurulum">Kurulum</a> •
  <a href="#-ekran-görüntüleri">Ekran Görüntüleri</a> •
  <a href="#-katkıda-bulunma">Katkı</a>
</p>

---

## 📖 Proje Hakkında

**YÜK-LE**, endüstriyel yük taşımacılığını dijitalleştiren, B2B/B2C lojistik pazaryeri vizyonudur. Fabrikalar yük ilanı oluşturur, yapay zeka ile hesaplanan adil fiyat üzerinden şoförler teklif verir; tam teşekküllü ödeme (escrow), U-ETDS ve teslimat kanıtı gibi katmanlar **yol haritasında** tanımlıdır; backend şu an **tek bir ASP.NET Core** projesinde (`Yukle.Api`) modüler monolit olarak geliştirilmektedir.

### 🎯 Çözdüğümüz Problem

| Geleneksel Yöntem | YÜK-LE ile |
|---|---|
| ❌ Telefon/WhatsApp ile şoför arama | ✅ Konum bazlı anlık eşleştirme (PostGIS + OSRM) |
| ❌ Pazarlık ve güvensiz fiyatlama | ✅ AI destekli adil taban fiyat |
| ❌ Nakit ödeme riski | ✅ Escrow ile güvenli ödeme *(yol haritası)* |
| ❌ Evrak kontrolü manuel | ✅ Gemini Vision ile otonom onay + KVKK uyumlu şifreleme |
| ❌ Takip yok, belirsizlik | ✅ Gerçek zamanlı canlı takip (SignalR) |
| ❌ Vergi/fatura karmaşası | ✅ Otomatik stopaj ve komisyon *(yol haritası)* |
| ❌ U-ETDS'ye manuel bildirim | ✅ Outbox Pattern ile otonom iletim *(yol haritası)* |

---

## 🌟 Temel Özellikler

### 🤖 Yapay Zeka Motoru (Gemini 1.5 Flash & Pro Vision)

- **Dinamik Adil Taban Fiyat:** Güncel yakıt fiyatları + mesafe + araç tipi + güzergah zorluğu analiz edilerek piyasa koşullarına uygun fiyat hesaplanır
- **Otonom Evrak Onayı:** Şoför ehliyeti, SRC, psikoteknik vb. evraklar Gemini Vision ile analiz edilir; kimlik doğrulama, gri alan (manuel inceleme) ve KVKK maskeleme kuralları backend’de uygulanır
- **Akıllı Eşleştirme:** Aktif yükler ve şoför bağlamı için Gemini ile uyumluluk skoru

### 📍 Coğrafi Bilgi Sistemi (PostGIS)

- **Konum Bazlı Veri:** Yük çıkış/varış noktaları `geometry(Point, 4326)` olarak saklanır
- **Rota Optimizasyonu:** OSRM ile gerçek karayolu mesafesi (fallback: Haversine)
- **Adaptif GPS & Geofencing:** *(yol haritası — mobil taraf)*

### ⚡ Gerçek Zamanlı İşlemler (SignalR)

- **Canlı Konum Takibi:** Yükün anlık konumu (harita entegrasyonu istemci tarafında)
- **Anlık Teklifleşme:** Teklif bildirimleri SignalR + DB bildirimleri
- **Durum Bildirimleri:** FCM push *(Firebase yapılandırması gerekir)*

### 💰 Finansal Altyapı *(yol haritası)*

- **İyzico Escrow**, **QR teslimat kanıtı**, **otomatik hakediş** — henüz backend’de tam entegre değildir; README’deki “Gelecek Planları” bölümüne bakın.

### 📋 Yasal Uyumluluk *(yol haritası)*

- **U-ETDS Outbox**, **dijital taşıma senedi** — planlanmıştır.

---

## 🏗 Sistem Mimarisi

**Gerçek yapı (v2.5.6+):** Tek bir **.NET 9** Web API projesi (`Yukle.Api`) — **modüler monolit** (ileride katmanlara bölünmeye uygun klasörler: `Controllers/`, `Services/`, `Data/`, `Hubs/`, `Infrastructure/`, `Exceptions/`). Ayrı `Domain` / `Application` / `Infrastructure` projeleri **yok**.

```
┌──────────────────────────────────────────────────────────────────┐
│              📱 Mobil / Web İstemciler (Flutter / SPA)              │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTPS / WSS (SignalR)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Yukle.Api (.NET 9)                             │
│   Controllers · Services · EF Core · SignalR Hubs · Background    │
│   Jobs · Gemini · JWT + Policy (RequireActiveDriver) · RFC 7807   │
└──────────────────────┬───────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PostgreSQL   │ │ Redis        │ │ Google Gemini │
│ + PostGIS    │ │ Cache+SignalR│ │ Generative API│
└──────────────┘ └──────────────┘ └──────────────┘
```

Üretimde önüne **reverse proxy** (Nginx, Traefik) ve **API Gateway** eklenebilir; şu an doğrudan Kestrel veya Docker üzerinden servis edilir.

---

## 🛠 Teknoloji Yığını

### Backend (mevcut)

| Teknoloji | Kullanım Amacı |
|---|---|
| **.NET 9 Web API** | Ana uygulama sunucusu, RESTful API |
| **Entity Framework Core 9** | ORM, PostgreSQL + EF migrations |
| **PostgreSQL 16 + PostGIS** | İlişkisel veri + coğrafi tipler |
| **SignalR + Redis backplane** | Gerçek zamanlı hub’lar |
| **Redis** | `IDistributedCache`, OTP, rate limit |
| **JWT Bearer + Refresh Token** | Kimlik doğrulama ve oturum yenileme |
| **Google Gemini API** | Fiyat önerisi, evrak OCR, eşleştirme |
| **Polly (Http.Resilience)** | Gemini HTTP istemcisi dayanıklılığı |
| **BCrypt** | Şifre hash |
| **ASP.NET Core IExceptionHandler** | Merkezi hata yönetimi, **RFC 7807 ProblemDetails** |
| **AES-256 (KVKK)** | TCKN alanı için şifreli saklama (EF `ValueConverter`) |

### Mobil *(planlanan / ayrı repo olabilir)*

| Teknoloji | Kullanım Amacı |
|---|---|
| **Flutter 3.x** | Cross-platform mobil uygulama |
| **Dart** | Uygulama dili |
| **Google Maps SDK** | Harita ve konum servisleri |

### Yapay Zeka & Dış Servisler

| Teknoloji | Kullanım Amacı |
|---|---|
| **Google Gemini 1.5 Flash** | Dinamik fiyat, akıllı eşleştirme |
| **Google Gemini Vision (Pro)** | Evrak analizi, OCR |
| **CollectAPI** *(yakıt fiyat worker)* | günlük mazot fiyatı çekimi |
| **OSRM** *(public router)* | Rota mesafesi |

### DevOps & Altyapı

| Teknoloji | Kullanım Amacı |
|---|---|
| **Docker & Docker Compose** | PostgreSQL + Redis + API (bkz. `docker-compose.yml`) |
| **Directory.Build.props** | Merkezi sürüm, `Authors`, `Company` |

---

## 🔮 Gelecek Planları (henüz kodda yok)

Aşağıdakiler README veya erken mimari taslaklarında geçmiş olabilir; **şu anki repoda yok** veya **sadece plan**:

- **Clean Architecture** ile ayrılmış `Domain` / `Application` / `Infrastructure` projeleri
- **MediatR** (CQRS), **FluentValidation**, **Serilog** (veya merkezi log sink)
- **İyzico** escrow, **U-ETDS** outbox, **QR** teslimat kanıtı
- **GitHub Actions** CI/CD, **Nginx** production SSL

---

## 📁 Proje Yapısı (gerçek)

```
YÜK-LE/
├── Directory.Build.props          # Merkezi Version / Authors / Company
├── docker-compose.yml             # postgres + redis + api (Dockerfile: Yukle.Api)
├── README.md
├── LICENSE
├── docs/
│   ├── architecture/
│   │   └── system-overview.md
│   └── assets/
├── Yukle.Api/
│   ├── Dockerfile
│   ├── Yukle.Api.sln              # Solution: Yukle.Api + Yukle.Tests
│   ├── Yukle.Api.csproj
│   ├── Program.cs
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   ├── Controllers/
│   ├── Data/
│   ├── DTOs/
│   ├── Hubs/
│   ├── Infrastructure/            # GlobalExceptionHandler (RFC 7807)
│   ├── Exceptions/                  # DomainException vb.
│   ├── Migrations/
│   ├── Models/
│   ├── Services/
│   └── BackgroundServices/
└── Yukle.Tests/
    └── Yukle.Tests.csproj
```

Flutter mobil uygulama bu monorepo içinde **zorunlu değildir**; ayrı bir depoda tutulabilir.

---

## 🚀 Kurulum

### Ön Gereksinimler

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Docker Desktop](https://docs.docker.com/get-docker/) (PostgreSQL + Redis + isteğe bağlı API)
- [PostgreSQL 16 + PostGIS](https://postgis.net/) (Docker kullanmıyorsanız)
- [Redis](https://redis.io/) (Docker kullanmıyorsanız)

### Güvenlik: `appsettings` ve `user-secrets`

`appsettings.json` ve `appsettings.Development.json` **örnek / yerel geliştirme** içindir. **Üretim** veya **paylaşılan repoda** gerçek şifreler, JWT anahtarları, Gemini API anahtarları ve AES şifreleme anahtarları **tutulmamalıdır**.

- Geliştirme için: `dotnet user-secrets` (proje `UserSecretsId` ile `Yukle.Api.csproj` içinde tanımlıdır) veya ortam değişkenleri kullanın.
- Örnek: `cd Yukle.Api` → `dotnet user-secrets set "GeminiAI:ApiKey" "YOUR_KEY"`

### Hızlı Başlangıç (Docker ile tam yığın)

Depo kökünden:

```bash
git clone https://github.com/Salihefendihsa/YUK-LE.git
cd YUK-LE

# PostgreSQL + PostGIS, Redis ve API konteynerini başlatır
docker compose up -d --build

# API varsayılan olarak http://localhost:5000 (Kestrel 8080 → 5000 map)
```

`docker-compose.yml` içindeki `api` servisi `Yukle.Api/Dockerfile` ile derlenir. Veritabanı migration’ları konteyner ilk çalıştırmada **otomatik uygulanmaz**; yerel geliştirmede aşağıdaki adımı kullanın.

### Yerel geliştirme (sadece veritabanı + Redis Docker’da)

```bash
cd YUK-LE
docker compose up -d postgres redis

cd Yukle.Api
dotnet restore
dotnet ef database update
dotnet run
```

`ConnectionStrings:DefaultConnection` ve `ConnectionStrings:Redis` değerlerinin `appsettings.Development.json` veya `user-secrets` ile `localhost` üzerindeki Docker portlarına (5432, 6379) uyduğundan emin olun.

### Manuel kurulum (Docker yok)

```bash
cd Yukle.Api
dotnet restore
dotnet ef database update
dotnet run
```

`flutter` ile mobil uygulama ayrı bir projede ise:

```bash
cd yukle_mobile
flutter pub get
flutter run
```

### Ortam değişkenleri (örnek)

Üretimde yapılandırma genelde `ConnectionStrings__*`, `Jwt__Key`, `GeminiAI__ApiKey`, `Encryption__Key` vb. **ortam değişkenleri** ile verilir.

```env
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=yukledb;Username=postgres;Password=***
ConnectionStrings__Redis=localhost:6379,password=***,abortConnect=false
```

---

## 📸 Ekran Görüntüleri

> 🚧 Ekran görüntüleri yakında eklenecektir.

---

## 🗺 Yol Haritası

**Tamamlanan çekirdek özellikler (v2.5.6 / Phase 1.2 ile uyumlu):**

- [x] JWT + Refresh Token Auth
- [x] Gemini AI Document Analysis (Ehliyet/SRC)
- [x] KVKK Data Encryption (AES-256)
- [x] Global Exception Handling (RFC 7807)
- [x] AI-Powered Pricing Engine
- [x] Location-Based Matching Base (PostGIS)

---

- [x] Proje mimarisi tasarımı (modüler monolit — `Yukle.Api`)
- [x] Veritabanı şema tasarımı (PostgreSQL + PostGIS)
- [x] Kullanıcı kimlik doğrulama sistemi (JWT + Refresh Token)
- [x] Yük ilan oluşturma ve listeleme API'leri
- [x] Gemini AI ile dinamik fiyat hesaplama motoru
- [x] Konum bazlı şoför eşleştirme (PostGIS + OSRM tabanlı)
- [x] SignalR ile gerçek zamanlı teklifleşme / bildirimler
- [ ] İyzico Escrow ödeme entegrasyonu
- [ ] QR kodlu teslimat kanıt sistemi
- [ ] U-ETDS Outbox Pattern entegrasyonu
- [x] Gemini Vision ile evrak analizi (Ehliyet / SRC / psikoteknik vb.)
- [x] KVKK veri şifreleme (AES-256 TCKN)
- [x] Global Exception Handling (RFC 7807 ProblemDetails)
- [ ] Adaptif GPS & Geofencing
- [ ] Flutter mobil uygulama (Fabrika & Şoför)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Canlı ortam deployment

---

## 🤝 Katkıda bulunma

İç kullanım / tescilli proje kapsamında katkı süreçleri proje sahibi ile iletişimle yürütülür.

---

## 👥 Ekip

| Rol | İsim |
|---|---|
| **Proje Sahibi & Geliştirici** | Salih |

---

## 📄 Lisans

Bu proje tescilli bir yazılımdır. Tüm hakları saklıdır.  
İzinsiz kopyalama, dağıtma veya değiştirme yasaktır.

---

## 📞 İletişim

Sorularınız veya iş birliği teklifleriniz için:

- **GitHub:** [@Salihefendihsa](https://github.com/Salihefendihsa)

---

<p align="center">
  <strong>🚛 YÜK-LE — Yükünüz Güvende, Yolunuz Açık! 🛣️</strong>
</p>
