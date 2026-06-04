# Navlonix (YÜK-LE) — Sistem Genel Bakış

> Kod okunarak doğrulanmış referans doküman. Tarih: 2026-06-04.
> Marka: **Navlonix** (repo/iç ad: YÜK-LE / YUK-LE).
> Amaç: *"Fabrikaları güvenilir tır şoförleriyle saniyeler içinde buluşturan, yapay zekâ destekli lojistik pazaryeri."* Fabrika/müşteri yük ilanı açar, AI adil fiyat hesaplar, şoförler teklif verir, kabul → sefer → canlı takip → QR ile teslim → cüzdan/komisyon mahsuplaşması.

⚠️ **Doküman drift uyarısı:** Kök README ve Figma brief'i mobili "Flutter" diye anlatır. **Gerçek kod Expo / React Native'dir** (bu dokümanda kod esas alınmıştır).

---

## 1) MİMARİ — Monorepo

`apps/` altında 4 uygulama + `infra/` + `docs/`:

| Uygulama | Teknoloji | Görev | Backend ile iletişim |
|---|---|---|---|
| **apps/api** (`Yukle.Api`) | .NET 9 Web API, **tek proje / modüler monolit** (Clean Architecture *değil*) | Tüm iş mantığı, DB, auth, AI, realtime | — (kendisi backend) |
| **apps/web** | React 19 + **Vite 8** SPA, react-router 7, Zustand, axios, Leaflet, SignalR | Müşteri + Şoför + **Admin** panel (asıl operasyon arayüzü) | `http://localhost:5151/api` (REST) + `/hubs/*` (SignalR) |
| **apps/mobile/yukle-mobile** | **Expo SDK 54 / React Native 0.81**, expo-router (drawer), Zustand, axios, react-native-maps + Leaflet | Müşteri + Şoför + Admin (mobil), web ile yüksek parity | `:5151/api` + SignalR (emülatör: `10.0.2.2`) |
| **apps/marketing** | **Next.js 16** (App Router), Tailwind v4, GSAP | Halka açık tek sayfa tanıtım/landing sitesi | Yok (sadece `/login`,`/register`'a link — henüz wire'lı değil) |

**Haberleşme:** Web ve mobil, **aynı .NET API'sine** REST (`/api/...`) + gerçek-zaman için **SignalR** (`/hubs/notifications`, `/hubs/tracking`, `/hubs/chat`) ile bağlanır. JWT (HMAC-SHA512, 7 gün) + refresh-token rotasyonu kullanılır; SignalR WebSocket'te token `?access_token=` query ile geçer. Marketing sitesi bağımsızdır, sadece kullanıcıyı web SPA'nın auth ekranlarına yönlendirmek için tasarlanmış (cross-app link henüz tam bağlı değil).

> Not: Mimari "modüler monolit" — `Users` tablosunda roller; ayrı `drivers`/`factories` tablosu yok.

---

## 2) BACKEND (apps/api/Yukle.Api)

### 2.1 Ana Entity'ler (Models/)
Önemli: **ayrı `Trip`/`Sefer`, `Offer`, `Document`, `OTP` entity'si YOK.** "Sefer" durumu doğrudan `Load.Status` üzerinde, OTP doğrulama alanları `User` içinde tutulur.

| Entity | PK | Önemli alanlar |
|---|---|---|
| **User** | `int` | FullName/Phone/Email, PasswordHash/Salt (BCrypt), `Role`, OTP: `VerificationCode`+`VerificationCodeExpiry`+`IsPhoneVerified`, RefreshToken, **AI onay**: `ApprovalStatus`+`IsActive`+`AiInferenceDetails`(JSON), şoför belge bayrakları/expiry'leri, **cüzdan**: `WalletBalance`/`PendingBalance`, `AverageRating`, son konum (`LastKnownLatitude/Longitude`), `FcmToken`, `TaxNumberOrTCKN`(AES-256 şifreli) |
| **Load** (Yük/İlan) | `Guid` | FromCity/District→ToCity/District, **PostGIS** `Origin`/`Destination` (`geometry(Point,4326)`), Weight/Volume/`LoadType`/`RequiredVehicleType`, PickupDate/DeliveryDate, `Price`+Currency, **AI**: `AiSuggestedPrice`/`AiMinPrice`/`AiMaxPrice`/`AiPriceReasoning`, `Status`, iptal alanları, `UserId`(Owner), `DriverId`, `VehicleId` |
| **Bid** (Teklif) | `int` | `LoadId`, `DriverId`, `Amount`, `Status`, `Note`, `CloseReason` |
| **Vehicle** (Araç) | `int` | `DriverId`, `Plate`(unique), `Type`, `Capacity`, `IsActive` |
| **PaymentTransaction** (Ödeme/Escrow) | `Guid` | `LoadId`, `TransactionId`(harici), `Amount`, `Status` |
| **WalletAuditLog** | `long` | `UserId`, `LoadId`, `Amount`, `Type`, BalanceBefore/After, Reason (ledger) |
| **Rating** | `Guid` | `LoadId`, `GivenByUserId`→`GivenToUserId`, `Score`(1-5), `RaterRole`. Unique: (LoadId, GivenByUserId) |
| **ChatMessage** | `Guid` | `LoadId`(FK yok), Sender bilgileri, `Message`, `IsBlocked`+`BlockReason` (moderasyon) |
| **Notification** | `int` | `UserId`, Title/Message, `Type`, `IsRead`, `RelatedEntityId` |
| **DeliveryAddress** | `Guid` | `UserId`, adres defteri alanları, Lat/Lng, `IsDefault` |
| **FuelPrice** | `int` | `PlateCode`(il), `City`, `PriceTL`, `FuelType`, `Date`, `Source` |
| **AdminActionLog** | `int` | `AdminId`, `TargetUserId`, `Action`, `Note` (admin denetim izi) |
| **UetdsOutbox** | `Guid` | `LoadId`, `Payload`(JSON), `Status`, RetryCount (devlet U-ETDS bildirimi — outbox pattern, **mock**) |

### 2.2 Roller ve Durum Enum'ları (Enums.cs / ilgili dosyalar)
- **UserRole**: `Customer`(0=Müşteri), `Driver`(1=Şoför), `Admin`(2)
- **ApprovalStatus**: Pending, Approved, Rejected, Active, ManualApprovalRequired, PendingReview
- **LoadStatus** (= sefer yaşam döngüsü): `Active → Assigned → OnWay → Arrived → Delivered` (+ `Cancelled`)
- **BidStatus**: Pending, Accepted, Rejected, Cancelled
- **PaymentStatus**: Pending, Blocked, Released, Refunded, Failed
- **VehicleType**: TIR, Kamyon, Kamyonet, Panelvan · **LoadType**: Paletli, Dökme, SoğukZincir, TehlikeliMadde, Parsiyel
- **FuelType**: Motorin, Benzin, Lpg · **WalletAuditLogType**: Hold, Release, Commission, CustomerCommission, Tax, Refund · **NotificationType**: Load, Bid, Payment, System, Document, Proximity

### 2.3 İlişkiler (YukleDbContext.OnModelCreating)
- Load → User(Owner) Cascade; Load → User(Driver) Restrict; Load → Vehicle SetNull
- Bid → Load Cascade; Bid → User(Driver) Restrict
- Vehicle → User Cascade (Plate unique)
- Rating → Load Cascade; → GivenBy/GivenTo Restrict (rater başına yük başına tek puan)
- PaymentTransaction → Load **Restrict** (ödeme kaydı yük silinse de yaşar); UetdsOutbox → Load Restrict
- ChatMessage / WalletAuditLog: ham (FK navigation yok)
- **KVKK AES-256**: `User.FullName/Phone/TaxNumberOrTCKN` EF ValueConverter ile şifreli; Phone deterministik IV (unique index korunsun diye)
- **PostGIS**: yalnız `Load.Origin`/`Destination` gerçek `geometry(Point,4326)`. Diğer konumlar (User, DeliveryAddress) düz `double` + Haversine.

### 2.4 Önemli Endpoint'ler (Controllers/) — tümü `api/[controller]`
- **AuthController**: `register`, `login`, `google`, `refresh-token`, `verify-otp`, `resend-otp`, `forgot-password`, `reset-password`, `change-password`, `upload-document`(şoför belge → Gemini OCR)
- **LoadsController** (`[Authorize]`): `POST /Loads`(Customer, oluştururken Gemini "Adil Navlun" fiyatı mühürlenir), `GET /active`, `GET /{id}`, `POST /{id}/cancel`, `PUT /{id}`, `POST /{id}/pickup`(aktif şoför), `GET /{id}/delivery-qr`(15dk HMAC), `POST /{id}/deliver`(QR + GPS yakınlık + escrow release), `GET /history`, `GET /driver-history`
- **BidsController**: `POST /submit`(aktif şoför, owner'a SignalR push), `GET /load/{id}`, `GET /driver`, `POST /{id}/cancel`, `POST /{id}/accept`(Customer — atomik: yük Assigned + diğer teklifler reddedilir + escrow hold)
- **LocationController**: `POST /update`(şoför GPS; yakınlık 1km + varış 0.2km → Arrived), `GET /driver/{loadId}`
- **AiController**: `POST /ocr`, `/ocr/enqueue`, `/price-suggestion`, `/price-suggestion/enqueue`, `GET /load/{id}/price-suggestion`
- **MatchingController** (policy: aktif şoför): `GET /recommended`("Senin İçin Önerilenler", Gemini skor), `GET /load/{id}`
- **WalletController** / **SettlementController**: cüzdan özeti, işlemler, komisyon önizleme. (Son kullanıcı için ayrı PaymentsController yok; ödeme içeride MockPaymentService ile.)
- **AdminController** (`[Authorize(Roles=Admin)]`): dashboard, `pending-reviews`(belge kuyruğu), `reviews/{userId}/decide`(onay/red), drivers/customers/users/loads/payments(+release), logs, system, chats, active-drivers, ratings, suspend/activate/warn/note...
- Diğer: DashboardController, ChatController, RatingsController, NotificationsController, DeliveryAddressesController, UsersController (driver IBAN `^TR\d{24}$`), SystemController (`/System/status` — public).

### 2.5 Auth Akışı
1. **Register** → SMS rate-limit (3/dk, sonra 15dk kara liste) → telefon/email tekillik → BCrypt hash → 6 haneli OTP üret (Dev'de sabit **`123456`**) → `IsPhoneVerified=false` → SMS gönder (NetgsmSmsService).
2. **Verify-OTP** → brute-force sayaç (3 hata/dk kilit) → kod eşleşme + expiry → tek kullanımlık. **Müşteri** anında `IsActive=Active`; **şoför** belge/admin onayına kadar pasif.
3. **Login** → telefon/email + BCrypt → `IsPhoneVerified=false` ise **403** (`requiresVerification`) → değilse access+refresh token. Refresh rotasyonu: eski token geçersizleşir, sabit-zaman karşılaştırma (replay savunması).
4. **Yetki**: `[Authorize(Roles=...)]` + **`RequireActiveDriver`** policy'si — JWT claim'e güvenmez, **DB'den canlı `IsActive` okur** (admin onay/askıya alma re-login gerektirmeden etkili olur).
5. **Şoför belge onayı** (tek aktivasyon yolu): Gemini Pro Vision OCR → teknik hata `ManualApprovalRequired`, gri bölge (confidence 50-85) `PendingReview`, geçersiz/süresi dolmuş/kimlik uyuşmazlığı `Rejected`. Tüm zorunlu belgeler (Ehliyet+SRC+Psikoteknik) onaylı → `IsActive=true`.

### 2.6 Gemini AI (GeminiServiceClient, Polly resilience: retry×3 → circuit breaker → 10s timeout)
1. **Adil navlun fiyatı** (Flash): OSRM mesafe + DB yakıt fiyatı + Gemini → fuelCost/tollCost/amortisman/netKar; MinFiyat=maliyet×1.40, MaxFiyat=öneri×1.20. Tutarsızsa `FreightPricingEngine` ile matematiksel fallback. Yük oluşturmada otomatik çalışır.
2. **Belge denetimi/OCR** (Pro Vision, multimodal): mühür/imza/hologram, expiry, lisans sınıfı, 0-100 confidence → onay mantığını besler.
3. **Akıllı eşleştirme** (Flash): aktif yükleri şoför geçmişi/aracına göre 0-100 skorlar.
- **Async kuyruk**: `/enqueue` → `GeminiTaskQueue` (bounded Channel) → `GeminiQueueProcessor` (~30 RPM throttle) → sonuç SignalR ile kullanıcıya push.

### 2.7 SignalR (canlı takip / bildirim / chat) — hepsi `/hubs/*`, `[Authorize]`
- **NotificationHub** `/hubs/notifications`: grup = userId. Sunucu→istemci push: `ReceiveNotification`, `ReceiveBid`, `PriceAnalyzed`, `Gemini*Result`...
- **TrackingHub** `/hubs/tracking`: `JoinLoadGroup`, `UpdateLocation`(şoför → `ReceiveLocation` + Haversine varış → `OnLoadArrived`), `GetLastLocation`. Son konum cache'te 24s buffer.
- **ChatHub** `/hubs/chat`: yük başına oda. `SendMessage` → moderasyon (`ContainsBlockedContent`); engellenen mesaj `IsBlocked=true` saklanır + gönderene hata.
- ⚠️ **Backplane şu an in-memory** (`AddDistributedMemoryCache` + default SignalR). Kod yorumları Redis diyor ama **gerçek Redis backplane bağlı değil** — prod açığı (kodda işaretli).

### 2.8 Arka plan servisleri (BackgroundServices/)
- **AdminSeederJob**: her açılışta idempotent admin upsert (`admin@navlonix.com` / `Admin123!`); telefon çakışmasını sentetik `admin-<guid>` ile çözer; test kullanıcıları (`test@navlonix.com`, `sofor@navlonix.com` / `Test123!`) best-effort.
- **DemoProvaSeederJob**: test müşterisine 6 senaryo yük (Active/Assigned/OnWay/Delivered/Cancelled), demo teklif + mock escrow, canlı harita için 1 OnWay yük + simüle şoför konumu.
- **FuelPriceUpdateWorker**: açılışta + periyodik il bazlı yakıt fiyatı çeker (Opet client → `FuelPrices`).
- **UetdsBackgroundWorker**: 2 dk'da outbox işler (devlet bildirimi — **mock**).
- **DocumentCleanupJob**: KVKK saklama; gece 02:00 UTC, 30 günden eski `PendingReview`/`Rejected` kullanıcıları siler.
- **GeminiQueueProcessor**: AI kuyruk drenajı.

### 2.9 DB (PostgreSQL 16 + PostGIS)
- Npgsql + NetTopologySuite, `EnableRetryOnFailure(5)`. PostGIS extension migration'da etkin.
- Unique index'ler: User.Phone/Email, Vehicle.Plate, Rating(LoadId,GivenByUserId), filtered partial unique (müşteri iadesi tekilliği).
- Composite index'ler: Users(Role,ApprovalStatus) [onay kuyruğu], Notification(UserId,IsRead), ChatMessage(LoadId,CreatedAt), FuelPrice(City,FuelType,Date)...

---

## 3) ANA AKIŞ (uçtan uca)

| # | Adım | Aktör | Ekran (web/mobil) | Endpoint / Hub | Tablo/Durum |
|---|---|---|---|---|---|
| 1 | İlan aç | Müşteri | LoadCreate / create-load (3 adım sihirbaz) | `POST /Loads` | `Load` (Status=**Active**, Origin/Destination PostGIS) |
| 2 | AI fiyat önerisi | Sistem (Gemini Flash) | Sihirbaz içi canlı önizleme | `POST /Ai/price-suggestion` → oluşturmada mühürlenir | `Load.AiSuggestedPrice/Min/Max/Reasoning` |
| 3 | Teklif ver | Şoför | Yük panosu / load-detail | `POST /Bids/submit` → owner'a SignalR `ReceiveBid` | `Bid` (Status=Pending) |
| 4 | Teklif kabul | Müşteri | Bids / load-detail | `POST /Bids/{id}/accept` (atomik) | Bid→**Accepted**, diğerleri Rejected, Load→**Assigned**+DriverId, escrow **Hold** (`PaymentTransaction`/`WalletAuditLog`) |
| 5 | Yük al (pickup) | Şoför | ActiveLoad / active-load | `POST /Loads/{id}/pickup` | Load→**OnWay** |
| 6 | Canlı takip | Şoför→Müşteri/Admin | LiveMap (Leaflet/native maps) | `POST /Location/update` + TrackingHub; müşteri 20s polling `GET /Location/driver/{id}` | `User.LastKnownLat/Lng`; 0.2km'de Load→**Arrived** + `OnLoadArrived` |
| 7 | Teslim (QR) | Şoför | active-load QR tara | `GET /delivery-qr` (müşteri) + `POST /Loads/{id}/deliver` (QR token + GPS ≤0.5km) | Load→**Delivered**, escrow **Release**, `UetdsOutbox` yazılır |
| 8 | Ödeme/mahsuplaşma | Sistem/Admin | Wallet / admin payments | `MockPaymentService`; admin `POST /payments/{id}/release` | `PaymentTransaction.Status`, `WalletAuditLog` (komisyon/vergi/release) |
| 9 | Puanlama | İki taraf | rate driver/customer | `POST /Ratings/submit` (sadece Delivered) | `Rating`, `User.AverageRating` |

> ⚠️ Ödeme **gerçek değil**: `MockPaymentService` (escrow hold/release simülasyonu). Ne web ne mobilde gerçek kart/iyzico/3D-secure checkout var — model "hold → release + komisyon mahsuplaşma". U-ETDS de mock.

---

## 4) WEB vs MOBİL — Parity

**Genel:** Mobil, üç rolün de **neredeyse tüm web özelliklerini** kapsar (admin dahil). Her ikisi de aynı `:5151` API'sine bağlı, JWT+refresh (Zustand persist; web localStorage `yükle-auth`, mobil AsyncStorage `yukle-auth`).

| Özellik | Web | Mobil | Not |
|---|---|---|---|
| Login/Register/OTP/forgot/admin-login | ✅ | ✅ | Mobil register 3 adım, rol toggle |
| Yük oluştur + AI fiyat | ✅ | ✅ | İki tarafta da debounce'lu canlı AI önizleme |
| Teklif (gönder/kabul) | ✅ | ✅ | Mobilde kabulde settlement önizleme |
| Sefer/canlı takip | ✅ (Track + ActiveLoad) | ✅ (load-detail/active-load'a gömülü) | GPS: web 20s polling, mobil 10s push |
| Harita | Leaflet/OSM | native react-native-maps + web Leaflet | Android'de gerçek Maps key gerek |
| Chat (SignalR) | ✅ | ✅ | |
| QR teslim | ✅ | ✅ (kamera tarama) | |
| Belge/OCR | ✅ | ✅ (image-picker) | |
| Cüzdan/settlement | ✅ | ✅ (salt görüntü) | İkisinde de **withdraw/cashout yok** |
| Bildirim | ✅ REST | ✅ REST + **SignalR push** | |
| Admin panel | ✅ tam | ✅ tam | Mobilde admin load-detail teklif/harita göstermez (tasarım) |
| Landing/marketing + legal sayfalar | ✅ (3D landing, KVKK/Gizlilik) | ❌ (sadece WelcomeScreen; onam'lar register'da checkbox) | |

**Web'deki bilinen boşluklar (stub):**
- `driver/Bids.tsx` → route var ama **PlaceholderPage** (şoför "tekliflerim" listesi stub).
- `driver/Track.tsx` → stub + route'ta değil (ölü kod; takip ActiveLoad'da).
- `notificationHub.ts` tanımlı ama **hiç kullanılmıyor** (web bildirimleri sadece REST).
- Settings/profil bazı "yakında" placeholder'ları.

**Mobil'deki bilinen boşluklar:**
- **Customer Analytics** = tek kasıtlı sahte ekran (hardcoded `DEMO_*`, "YAKINDA"; `// TODO Faz 4+` gerçek API bağlanınca). Web'de Analytics sayfası var.
- Wallet salt görüntü (cashout yok). Admin load-detail teklif/harita yok (tasarım kararı).
- `PlaceholderScreen` bileşeni var ama hiçbir route kullanmıyor (boş ekran yok).

---

## 5) INFRA & DEPLOY

### 5.1 `infra/docker-compose.yml` (`yukle-net` bridge)
| Servis | Image | Port (host→cont.) | Volume | Not |
|---|---|---|---|---|
| **postgres** (PostGIS) | postgis/postgis:16-3.4-alpine | 5432→5432 | `yukle_pgdata` | user=postgres, pw=`adb16adb`, db=`yukledb` |
| **redis** | redis:7-alpine | 6379→6379 | `yukle_redisdata` | pw=`YukleRedis123!` (kod henüz Redis'i kullanmıyor — in-memory) |
| **seq** (loglama) | datalust/seq:latest | 5341→80 | — | Serilog buraya yazar |
| **api** | `../apps/api/Yukle.Api/Dockerfile` | 5000→8080 | — | `ASPNETCORE_ENVIRONMENT=Production`, Host=postgres/redis (container içi) |

### 5.2 Native vs Docker DB durumu (ÖNEMLİ — bu makinede)
Bu geliştirme makinesinde **iki ayrı PostgreSQL** mevcut:
- **Native PostgreSQL** (host kurulumu, `localhost:5432`) — **17 tablo**, admin seed'li. **Local `dotnet run` (appsettings `Host=localhost`) buna bağlanır** → runbook gerçekte bunu kullanıyor.
- **Docker `yukle-postgres`** (compose, named volume `infra_yukle_pgdata`) — sadece containerized api (`Host=postgres`) için. `5432` çakışması: eski/orphan **`yukle-postgis`** container'ı (Mart, anonim volume, 10 tablo) portu tutuyor; compose postgres "Created"da kalabiliyor.
- Sonuç: **Local geliştirmede docker postgres'e ihtiyaç yok**; native PG yeterli. Karışıklığı önlemek için ileride tek kaynağa indirmek (ya hep native ya hep docker) önerilir.

### 5.3 Deploy
- **Üretim deploy YAPILANDIRMASI YOK.** `vercel.json`/Netlify/Render/Fly yok.
- Tek Dockerfile: `apps/api/Yukle.Api/Dockerfile` (.NET 9 multi-stage, 8080). Web/marketing için Dockerfile yok.
- **CI** (`.github/workflows/main.yml`, "Navlonix CI", sadece build): `build-api` (dotnet build) + `build-web` (`vite build`). **Test yok, deploy yok, marketing/mobil build edilmiyor.**
- **Vercel**, marketing README'sinde bahsedilir ama **yapılandırılmamış / aspirasyonel**. Migration'lar container başlarken otomatik uygulanmaz.

---

## 6) MEVCUT DURUM — Ne bitti, ne eksik

### ✅ Çalışan / tamamlanmış
- **Backend**: auth (JWT+refresh+OTP), rol/policy (canlı DB IsActive), Gemini (fiyat/OCR/eşleştirme + Polly + async kuyruk), tüm temel controller'lar, PostGIS yük koordinatları, SignalR 3 hub, KVKK AES-256, RFC 7807 hata, fuel price worker, U-ETDS outbox (mock), seeder'lar.
- **Web**: tüm roller gerçek endpoint'lere bağlı; yük oluşturma+AI, teklif/kabul, canlı takip+Leaflet, QR teslim, chat (SignalR), cüzdan, **kapsamlı admin paneli**.
- **Mobil**: auth, yük+AI, teklif, sefer yaşam döngüsü+10s GPS takip, harita, chat, QR, OCR belge, cüzdan görüntü, ratings, bildirim (REST+SignalR), **tam admin paneli**.

### ⚠️ Eksik / mock / aspirasyonel
- **Ödeme gerçek değil** (MockPaymentService). Gerçek İyzico/kart checkout iki tarafta da yok. Cüzdanda cashout yok.
- **U-ETDS** mock. **Redis backplane** kodda bağlı değil (in-memory) — yatay ölçeklemede kayıp riski.
- **Mobil Customer Analytics** sahte/demo (gerçek API bekliyor).
- **Web**: `driver/Bids` stub, `driver/Track` ölü kod, `notificationHub` kullanılmıyor, bazı Settings "yakında".
- **Marketing**: tek landing; web SPA'ya cross-app login/register handoff bağlı değil.
- **DevOps**: gerçek deploy yok; CI yalnız api+web build (test/deploy yok); migration auto-apply yok; `docs/assets/` (banner) eksik; README/Figma "Flutter" diyor ama mobil RN (doc drift).

### Çalıştırma özeti (runbook)
- Docker: redis (+ istenirse seq/postgres). Local API: `apps/api/Yukle.Api`'de `ASPNETCORE_URLS=http://0.0.0.0:5151; dotnet run` → native PG'ye bağlanır, admin seed eder.
- Web: `apps/web` → `npm run dev` (Vite, :5173). Mobil: `apps/mobile/yukle-mobile` → `npx expo start`.
- Test girişleri: admin `admin@navlonix.com`/`Admin123!`, müşteri `test@navlonix.com`, şoför `sofor@navlonix.com` (`Test123!`); Dev OTP sabit `123456`.

---
*Bu doküman kod okunarak üretildi (Models/, Controllers/, Services/, Hubs/, BackgroundServices/, Program.cs, DbContext, web src/, mobile app/+src/, infra/, docs/, README, CI).*
