<p align="center">
  <img src="docs/assets/yukle-banner.png" alt="YÜK-LE Banner" width="100%"/>
</p>

<h1 align="center">🚛 YÜK-LE</h1>

<p align="center">
  <strong>Fabrikalar ile Güvenilir Tır Şoförlerini Saniyeler İçinde Buluşturan<br/>Yapay Zeka Destekli Yeni Nesil Lojistik Pazaryeri</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET 8"/></a>
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

**YÜK-LE**, endüstriyel yük taşımacılığını dijitalleştiren, uçtan uca otonom, B2B/B2C lojistik pazaryeri ve escrow ödeme platformudur. Fabrikalar yük ilanı oluşturur, yapay zeka ile hesaplanan adil fiyat üzerinden şoförler teklif verir ve tüm süreç — ödeme, evrak onayı, canlı takip, teslimat kanıtı ve vergi hesaplaması dahil — tamamen otonom çalışır.

### 🎯 Çözdüğümüz Problem

| Geleneksel Yöntem | YÜK-LE ile |
|---|---|
| ❌ Telefon/WhatsApp ile şoför arama | ✅ Konum bazlı anlık eşleştirme |
| ❌ Pazarlık ve güvensiz fiyatlama | ✅ AI destekli adil taban fiyat |
| ❌ Nakit ödeme riski | ✅ Escrow ile güvenli ödeme |
| ❌ Evrak kontrolü manuel | ✅ Gemini Vision ile otonom onay |
| ❌ Takip yok, belirsizlik | ✅ Gerçek zamanlı canlı takip |
| ❌ Vergi/fatura karmaşası | ✅ Otomatik stopaj ve komisyon |
| ❌ U-ETDS'ye manuel bildirim | ✅ Outbox Pattern ile otonom iletim |

---

## 🌟 Temel Özellikler

### 🤖 Yapay Zeka Motoru (Gemini 1.5 Flash & Vision)
- **Dinamik Adil Taban Fiyat:** Güncel yakıt fiyatları + mesafe + araç tipi + güzergah zorluğu analiz edilerek piyasa koşullarına uygun fiyat hesaplanır
- **Otonom Evrak Onayı:** Şoför ehliyeti, araç ruhsatı, K1/K2 belgesi gibi evraklar Gemini Vision ile analiz edilip otomatik onaylanır
- **Akıllı Eşleştirme:** Fabrika lokasyonuna en yakın, uygun araç tipine sahip şoförler önceliklendirilir

### 📍 Coğrafi Bilgi Sistemi (PostGIS)
- **Konum Bazlı Eşleştirme:** Yarıçap tabanlı şoför keşfi
- **Rota Optimizasyonu:** Gerçek yol mesafesi hesaplama
- **Adaptif GPS Frekansı:** İvmeölçer + 500m geofencing kurallarıyla şoför telefon bataryası korunur

### ⚡ Gerçek Zamanlı İşlemler (SignalR)
- **Canlı Konum Takibi:** Yükün anlık konumunu harita üzerinde izleme
- **Anlık Teklifleşme:** Şoförler ilanı gördüğü anda fiyat teklifi gönderir
- **Durum Bildirimleri:** Yükleme, taşıma, teslimat aşamalarında push bildirim

### 💰 Finansal Altyapı
- **İyzico Escrow:** Ödeme güvenli havuzda tutulur, teslimat kanıtıyla serbest bırakılır
- **QR Kodlu Teslimat Kanıtı:** Alıcı QR okutarak teslimatı onaylar
- **Otomatik Hakediş:** Kurumsal → fatura bazlı, bireysel → stopaj vergisi kesilmiş net ödeme
- **Platform Komisyonu:** Her işlemden otomatik ayrıştırma

### 📋 Yasal Uyumluluk
- **U-ETDS Entegrasyonu:** Ulaştırma Bakanlığı'na Outbox Pattern ile kesintisiz, garantili veri iletimi
- **K Belgesi Takibi:** Şoför yetki belgelerinin geçerlilik kontrolü
- **Dijital Taşıma Senedi:** Tüm taşıma işlemleri dijital senet ile kayıt altına alınır

---

## 🏗 Sistem Mimarisi

```
┌──────────────────────────────────────────────────────────────────┐
│                        📱 FLUTTER MOBİL APP                      │
│              (Fabrika Paneli / Şoför Paneli / Admin)             │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTPS / WSS (SignalR)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    🌐 API GATEWAY / LOAD BALANCER                │
└──────────────────────┬───────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  📦 Yük &    │ │  🚛 Şoför &  │ │  💳 Ödeme &  │
│  İlan Servisi │ │  Konum Srv.  │ │  Finans Srv. │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    🐘 PostgreSQL + PostGIS                        │
│                    📨 Outbox Pattern (U-ETDS)                    │
│                    🔴 Redis Cache & Queue                        │
└──────────────────────────────────────────────────────────────────┘
        │                │                │
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  🤖 Gemini   │ │  💰 İyzico   │ │  🏛 U-ETDS   │
│  AI Engine   │ │  Payment     │ │  Gov. API    │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🛠 Teknoloji Yığını

### Backend
| Teknoloji | Kullanım Amacı |
|---|---|
| **.NET 8 Web API** | Ana uygulama sunucusu, RESTful API |
| **Entity Framework Core** | ORM, veritabanı yönetimi |
| **PostgreSQL 16** | İlişkisel veritabanı |
| **PostGIS 3.4** | Coğrafi sorgular, konum hesaplama |
| **SignalR** | Gerçek zamanlı iletişim (canlı takip, teklifleşme) |
| **Redis** | Önbellekleme, kuyruk yönetimi |
| **MediatR** | CQRS pattern, domain event yönetimi |
| **FluentValidation** | Giriş doğrulama |
| **Serilog** | Yapılandırılmış loglama |

### Mobil
| Teknoloji | Kullanım Amacı |
|---|---|
| **Flutter 3.x** | Cross-platform mobil uygulama |
| **Dart** | Uygulama programlama dili |
| **Google Maps SDK** | Harita ve konum servisleri |
| **Geolocator** | GPS konum takibi |
| **flutter_local_notifications** | Push bildirimleri |

### Yapay Zeka & Dış Servisler
| Teknoloji | Kullanım Amacı |
|---|---|
| **Google Gemini 1.5 Flash** | Dinamik fiyat hesaplama, akıllı eşleştirme |
| **Google Gemini Vision** | Evrak analizi, OCR doğrulama |
| **İyzico** | Escrow ödeme, alt üye işyeri yönetimi |
| **U-ETDS API** | Ulaştırma Bakanlığı yasal bildirim |

### DevOps & Altyapı
| Teknoloji | Kullanım Amacı |
|---|---|
| **Docker & Docker Compose** | Konteynerleştirme |
| **GitHub Actions** | CI/CD pipeline |
| **Nginx** | Reverse proxy, SSL |

---

## 📁 Proje Yapısı

```
YÜK-LE/
├── src/
│   ├── YukLe.API/                    # .NET 8 Web API katmanı
│   │   ├── Controllers/             # API endpoint'leri
│   │   ├── Hubs/                    # SignalR Hub'ları
│   │   ├── Middleware/              # Custom middleware'ler
│   │   └── Filters/                 # Action & Exception filtreleri
│   │
│   ├── YukLe.Application/           # İş mantığı katmanı (CQRS)
│   │   ├── Commands/               # Yazma işlemleri
│   │   ├── Queries/                # Okuma işlemleri
│   │   ├── DTOs/                   # Veri transfer nesneleri
│   │   └── Validators/            # FluentValidation kuralları
│   │
│   ├── YukLe.Domain/                # Domain modelleri
│   │   ├── Entities/               # Domain entity'leri
│   │   ├── Enums/                  # Enum tanımları
│   │   ├── Events/                 # Domain event'leri
│   │   └── ValueObjects/          # Value object'ler
│   │
│   ├── YukLe.Infrastructure/        # Altyapı katmanı
│   │   ├── Data/                   # EF Core DbContext & Migration
│   │   ├── Repositories/          # Repository implementasyonları
│   │   ├── Services/              # Dış servis entegrasyonları
│   │   │   ├── GeminiAI/         # Gemini API istemcisi
│   │   │   ├── Iyzico/           # İyzico ödeme servisi
│   │   │   └── UETDS/            # U-ETDS bildirimleri
│   │   └── Outbox/               # Outbox pattern implementasyonu
│   │
│   └── yukle_mobile/                # Flutter mobil uygulama
│       ├── lib/
│       │   ├── core/              # Ortak bileşenler
│       │   ├── features/          # Özellik modülleri
│       │   │   ├── auth/         # Kimlik doğrulama
│       │   │   ├── loads/        # Yük ilanları
│       │   │   ├── bidding/      # Teklifleşme
│       │   │   ├── tracking/     # Canlı takip
│       │   │   ├── payments/     # Ödeme yönetimi
│       │   │   └── documents/    # Evrak yönetimi
│       │   └── shared/           # Paylaşılan widget'lar
│       └── pubspec.yaml
│
├── tests/
│   ├── YukLe.UnitTests/            # Birim testleri
│   ├── YukLe.IntegrationTests/     # Entegrasyon testleri
│   └── YukLe.E2ETests/            # Uçtan uca testler
│
├── docs/
│   ├── api/                        # API dokümantasyonu
│   ├── architecture/               # Mimari diyagramlar
│   └── assets/                     # Görseller, banner
│
├── docker/
│   ├── Dockerfile                  # API container
│   ├── docker-compose.yml         # Tüm servisler
│   └── docker-compose.dev.yml    # Geliştirme ortamı
│
├── .github/
│   └── workflows/                 # CI/CD pipeline'ları
│
├── .gitignore
├── README.md
├── LICENSE
└── YukLe.sln                     # Solution dosyası
```

---

## 🚀 Kurulum

### Ön Gereksinimler
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Flutter 3.x](https://flutter.dev/docs/get-started/install)
- [PostgreSQL 16](https://www.postgresql.org/download/) + PostGIS
- [Docker](https://docs.docker.com/get-docker/) (opsiyonel)
- [Redis](https://redis.io/download) (opsiyonel)

### Hızlı Başlangıç

```bash
# 1. Repoyu klonlayın
git clone https://github.com/YOUR_USERNAME/YUK-LE.git
cd YUK-LE

# 2. Docker ile başlatın (önerilen)
docker-compose up -d

# 3. veya manuel kurulum
cd src/YukLe.API
dotnet restore
dotnet ef database update
dotnet run

# 4. Flutter mobil uygulamayı çalıştırın
cd src/yukle_mobile
flutter pub get
flutter run
```

### Ortam Değişkenleri

```env
# Database
DATABASE_URL=Host=localhost;Database=yukle;Username=postgres;Password=***

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# İyzico
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key

# U-ETDS
UETDS_USERNAME=your_username
UETDS_PASSWORD=your_password
```

---

## 📸 Ekran Görüntüleri

> 🚧 Ekran görüntüleri yakında eklenecektir.

---

## 🗺 Yol Haritası

- [x] Proje mimarisi tasarımı
- [x] Veritabanı şema tasarımı (PostgreSQL + PostGIS)
- [ ] Kullanıcı kimlik doğrulama sistemi (JWT + Refresh Token)
- [ ] Yük ilan oluşturma ve listeleme API'leri
- [ ] Gemini AI ile dinamik fiyat hesaplama motoru
- [ ] Konum bazlı şoför eşleştirme (PostGIS)
- [ ] SignalR ile gerçek zamanlı teklifleşme
- [ ] İyzico Escrow ödeme entegrasyonu
- [ ] QR kodlu teslimat kanıt sistemi
- [ ] U-ETDS Outbox Pattern entegrasyonu
- [ ] Gemini Vision ile evrak analizi
- [ ] Adaptif GPS & Geofencing
- [ ] Flutter mobil uygulama (Fabrika & Şoför)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Canlı ortam deployment

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

- **GitHub:** [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

---

<p align="center">
  <strong>🚛 YÜK-LE — Yükünüz Güvende, Yolunuz Açık! 🛣️</strong>
</p>
