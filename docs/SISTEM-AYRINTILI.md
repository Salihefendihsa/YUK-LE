# Navlonix (YÜK-LE) — Sistem Ayrıntılı Tanıtım

> **Bu doküman kimin için?** Projeyi hiç bilmeyen birine sistemi sıfırdan, baştan sona anlatmak için.
> **Yöntem:** Her açıklama gerçek koda (`dosya:satır`) dayanır; uydurma yoktur.
> **İlişkili dokümanlar:**
> - `docs/SISTEM-GENEL-BAKIS.md` — kısa referans/özet (burada derinleştirildi, tekrarlanmadı).
> - `docs/TUTARLILIK-DENETIMI.md` — bilinen kırık/eksik/sahte noktaların denetim raporu (15. bölümde özetlendi).
> **Marka:** Navlonix · **Repo/iç ad:** YÜK-LE / YUK-LE · **Tarih:** 2026-06-07
>
> Terimler ilk geçtiğinde parantezle açıklanır; toplu sözlük en sonda (16. bölüm).

---

## 1) GENEL BAKIŞ & AMAÇ

**Navlonix, yük taşıtmak isteyen fabrika/işletmeleri (müşteri) güvenilir tır şoförleriyle buluşturan, yapay zekâ destekli bir dijital lojistik pazaryeridir.**

Çözdüğü sorun: Türkiye'de yük taşımacılığı büyük ölçüde telefon/komisyoncu ağıyla, pazarlıkla, fiyatın belirsiz olduğu bir şekilde yürür. Navlonix bunu şeffaflaştırır:

- **Müşteri** bir yük ilanı açar (nereden nereye, ne kadar ağırlık, ne zaman).
- **Yapay zekâ (Gemini)** o güzergâh için yakıt, mesafe ve piyasaya göre **"adil navlun" (adil taşıma ücreti)** hesaplar — pazarlığın çıpası olur.
- **Şoförler** ilanı görüp teklif verir.
- Müşteri bir teklifi kabul eder → para **escrow'a (emanet hesabına)** kilitlenir → şoför yükü taşır → **canlı GPS takip** yapılır → varışta **QR kod** ile teslim onaylanır → para şoförün cüzdanına geçer, platform komisyonunu alır.

**Kullanıcı rolleri (3 tip):**

| Rol | Kim | Ne yapar |
|---|---|---|
| **Müşteri** (Customer) | Yük göndermek isteyen fabrika/işletme | İlan açar, teklif kabul eder, takip eder, teslimi onaylar, puan verir |
| **Şoför** (Driver) | Tır/kamyon sahibi taşıyıcı | Belge yükler/onay bekler, ilan keşfeder, teklif verir, taşır, kazanç toplar |
| **Admin** | Platform operatörü | Belge onayı, kullanıcı/ilan yönetimi, ödeme serbest bırakma, destek, denetim |

**Tek cümlelik değer önerisi:** *"Fabrikaları güvenilir tır şoförleriyle saniyeler içinde buluşturan, yapay zekânın adil fiyatı hesapladığı, parayı teslimat onayına kadar emanette tutan lojistik pazaryeri."*

---

## 2) MİMARİ

### 2.1 Monorepo (tek depoda birden çok uygulama)

Proje bir **monorepo**'dur (monorepo = birbiriyle ilişkili birden çok uygulamanın tek bir Git deposunda toplanması). Kök yapı:

```
YÜK-LE/
├── apps/
│   ├── api/        → .NET 9 backend (tüm beyin burada)
│   ├── web/        → React web uygulaması (müşteri+şoför+admin)
│   ├── mobile/     → Expo React Native mobil uygulama
│   └── marketing/  → Next.js tanıtım sitesi (landing page)
├── packages/
│   └── shared/     → web & mobil ortak TypeScript tipleri
├── infra/          → docker-compose (postgres, redis, seq, api)
└── docs/           → bu dokümanlar
```

### 2.2 Dört uygulama

| Uygulama | Teknoloji | Görevi | Backend'e nasıl bağlanır |
|---|---|---|---|
| **apps/api** (`Yukle.Api`) | **.NET 9** Web API, tek proje **modüler monolit** (tüm modüller tek çalıştırılabilir içinde; mikroservis değil) | Tüm iş mantığı, veritabanı, kimlik, AI, gerçek-zaman | Kendisi backend |
| **apps/web** | **React 19 + Vite 8** (Vite = hızlı web derleyici/geliştirme sunucusu), react-router 7, Zustand (durum yönetimi), axios (HTTP), Leaflet (harita), SignalR | Asıl operasyon arayüzü: 3 rolün de tam paneli (admin dahil) | `http://localhost:5151/api` (REST) + `/hubs/*` (SignalR) |
| **apps/mobile/yukle-mobile** | **Expo SDK 54 / React Native 0.81** (telefon uygulaması), expo-router, Zustand, axios, react-native-maps | 3 rolün mobil hâli, web ile yüksek **parite (özellik denkliği)** | `:5151/api` + SignalR (Android emülatöründe `10.0.2.2`) |
| **apps/marketing** | **Next.js 16** (App Router), Tailwind v4, GSAP (animasyon) | Halka açık tanıtım/landing sitesi | Yok — sadece web'in `/login`,`/register` ekranlarına link (henüz tam bağlı değil) |

### 2.3 Nasıl haberleşiyorlar

- **Web ve mobil aynı .NET API'sine** bağlanır. İki kanal var:
  1. **REST** (REST = HTTP istek/yanıtla veri alışverişi): `GET /api/Loads`, `POST /api/Bids/submit` gibi. Bir şey iste, cevabı al.
  2. **SignalR** (gerçek-zamanlı çift yönlü kanal — WebSocket üzerinden): sohbet, konum, bildirim gibi anlık olaylar için sunucu istemciyi kendisi uyarır. `/hubs/chat`, `/hubs/tracking`, `/hubs/notifications`.
- **Kimlik:** JWT (JWT = imzalı kimlik bileti; her isteğe iliştirilir) — HMAC-SHA512 ile imzalı, 7 gün ömürlü, refresh-token (yenileme bileti) ile yenilenir. SignalR'da token URL'de `?access_token=` ile geçer (`Program.cs:317-329`).
- **Marketing sitesi bağımsız**, sadece kullanıcıyı web'in giriş ekranlarına yönlendirmek için tasarlanmış (cross-app bağlantı henüz tam wire'lı değil).

### 2.4 Portlar ve deployment durumu

- **API:** `http://localhost:5151` (local geliştirme; `ASPNETCORE_URLS` ile). Docker'da 8080 (host 5000).
- **Web (Vite):** `:5173`. **Mobil (Expo):** Metro bundler `:8081` + cihaz/emülatör.
- **Veritabanı:** PostgreSQL 16 + PostGIS `:5432`. **Redis:** `:6379` (compose'da var ama kod henüz Redis'i kullanmıyor — bkz. 14. bölüm). **Seq** (log görüntüleme) `:5341`.
- **Deployment:** **Üretim deploy yapılandırması YOK.** Yalnız API için Dockerfile var; web/marketing için yok. CI (sürekli entegrasyon) sadece `api` ve `web` derler (test yok, deploy yok). Detay: `SISTEM-GENEL-BAKIS.md §5`.

---

## 3) VERİ MODELİ

Tüm tablolar tek PostgreSQL veritabanında (`Models/` klasöründeki C# sınıfları → EF Core ile tablolara eşlenir). **Önemli tasarım kararı:** ayrı `Sefer/Trip`, `Offer`, `Document`, `OTP` tablosu **yoktur**. "Sefer" doğrudan `Load.Status` üzerinde yaşar; OTP alanları `User` içindedir; belge onay bayrakları yine `User` içindedir.

### 3.1 Ana entity'ler (tablolar)

**User** (kullanıcı — `Models/User.cs`) — PK (birincil anahtar) `int`
- Kimlik: `FullName`, `Phone`, `Email`, `PasswordHash`/`PasswordSalt` (BCrypt ile şifrelenmiş parola)
- Rol: `Role` (Customer/Driver/Admin)
- OTP doğrulama: `VerificationCode`, `VerificationCodeExpiry`, `IsPhoneVerified` (`User.cs:52-54`)
- Oturum: `RefreshToken`, `RefreshTokenExpiryTime` (`User.cs:72-78`)
- **AI belge onayı:** `ApprovalStatus`, `IsActive`, `AiInferenceDetails` (JSON), `AdminReviewNote`, `LastValidationMessage` (`User.cs:94-126`)
- **Şoför belge bayrakları:** `IsDriverLicenseApproved`, `IsSrcApproved`, `IsPsychotechnicalApproved` + her birinin expiry tarihi + `LicenseClasses` (`User.cs:129-142`)
- **Cüzdan:** `WalletBalance` (kullanılabilir bakiye), `PendingBalance` (bekleyen/escrow'da olan), `AverageRating`, `TotalRatingCount` (`User.cs:145-148`)
- Konum: `LastKnownLatitude/Longitude`, `LastLocationUpdate` (`User.cs:149-151`)
- Mali: `IsCorporate` (kurumsal mı), `TaxNumberOrTCKN` (**AES-256 şifreli** saklanır), `BankIban`, `FcmToken` (push için cihaz token'ı), `SubMerchantKey` (İyzico için, kullanılmıyor)

**Load** (yük/ilan — `Models/Load.cs`) — PK `Guid`
- Rota: `FromCity`/`FromDistrict` → `ToCity`/`ToDistrict`
- **PostGIS koordinat** (PostGIS = PostgreSQL'in coğrafi veri eklentisi): `Origin`, `Destination` — `geometry(Point, 4326)` tipinde gerçek harita noktaları (`Load.cs:20-23`)
- Özellik: `Weight`, `Volume`, `Type` (LoadType), `RequiredVehicleType`, `Description`, `PickupDate`/`DeliveryDate`
- Fiyat: `Price`, `Currency` (varsayılan "TRY")
- **AI fiyat:** `AiSuggestedPrice`, `AiMinPrice`, `AiMaxPrice`, `AiPriceReasoning` (`Load.cs:43-52`) — ilan oluşturulurken Gemini'nin hesapladığı adil navlun "mühürlenir"
- Durum: `Status` (LoadStatus), `ProximityNotified`, iptal alanları (`CancelledAt`, `CancellationReason`, `CancelledBy`)
- İlişki: `UserId`/`Owner` (ilanı açan müşteri), `DriverId`/`Driver` (atanan şoför), `VehicleId`/`Vehicle`

**Bid** (teklif — `Models/Bid.cs`) — PK `int`
- `LoadId` (hangi ilana), `DriverId` (hangi şoför), `Amount` (teklif tutarı), `Status` (BidStatus), `Note`, `CloseReason`

**Vehicle** (araç — `Models/Vehicle.cs`) — PK `int`
- `DriverId`, `Plate` (benzersiz), `Type` (VehicleType), `Capacity`, `IsActive`, `LastMaintenanceDate`

**PaymentTransaction** (ödeme/escrow kaydı — `Models/PaymentTransaction.cs`) — PK `Guid`
- `LoadId`, `TransactionId` (harici/mock işlem no), `Amount` (bloke edilen toplam = **müşterinin ödediği**), `Status` (PaymentStatus), `CreatedAt`/`UpdatedAt`

**WalletAuditLog** (cüzdan defter kaydı — `Models/WalletAuditLog.cs`) — PK `long`
- Bu, **muhasebe defteridir (ledger)**: her para hareketi tek tek yazılır.
- `UserId`, `LoadId`, `Amount`, `Type` (WalletAuditLogType: Hold/Release/Commission/CustomerCommission/Tax/Refund), `BalanceBefore`, `BalanceAfter`, `Reason`

**ChatMessage** (sohbet mesajı — `Models/ChatMessage.cs`) — PK `Guid`
- `LoadId` (yük başına oda; FK yok), `SenderUserId`, `SenderName`, `SenderRole`, `Message`, **moderasyon:** `IsBlocked`, `BlockReason`, `BlockedAt`

**SupportTicket** (destek talebi — `Models/SupportTicket.cs`) — PK `Guid`
- `UserId`, `Subject`, `Status` (SupportTicketStatus: Open/Answered/Resolved/Closed), `CreatedAt`, `LastMessageAt`, `SlaDeadline` (= CreatedAt + 24 saat), `Messages` koleksiyonu

**SupportMessage** (destek mesajı — `Models/SupportMessage.cs`) — PK `Guid`
- `TicketId`, `SenderId`, `SenderRole` (SupportSenderRole: User=0/Admin=1/AI=2), `Content` — AI, admin ve kullanıcı mesajları aynı thread'de akar

**Rating** (puan — `Models/Rating.cs`) — PK `Guid`
- `LoadId`, `GivenByUserId` → `GivenToUserId`, `Score` (1-5), `Comment`, `RaterRole` (Customer/Driver). Benzersiz: (LoadId, GivenByUserId) → her kişi her yüke tek puan

**Notification** (bildirim — `Models/Notification.cs`) — PK `int`
- `UserId`, `Title`, `Message`, `Type` (NotificationType: Load=0/Bid=1/Payment=2/System=3/Document=4/Proximity=5), `IsRead`, `RelatedEntityId`

**DeliveryAddress** (adres defteri — `Models/DeliveryAddress.cs`) — PK `Guid`
- `UserId`, `Title`, `CompanyName`, `ContactPerson`, `ContactPhone`, `Address`, `City`, `District`, `Latitude`/`Longitude`, `IsDefault`

**Diğer:** `FuelPrice` (il bazlı yakıt fiyatı, AI fiyatlamada kullanılır), `AdminActionLog` (admin denetim izi: kim ne yaptı), `UetdsOutbox` (devlet U-ETDS bildirimi — **mock**, outbox deseniyle).

### 3.2 Enum'lar (sabit değer kümeleri)

> **Kritik kural:** Enum'lar DB'de **integer** (sayı) olarak saklanır. Bu yüzden mevcut üyeler **asla silinmez/yeniden sıralanmaz**; yeni üyeler **yalnızca sona** eklenir (`Enums.cs:4-6` uyarısı).

| Enum | Değerler (index) | Dosya |
|---|---|---|
| **UserRole** | Customer=0, Driver=1, Admin=2 | `User.cs:5-10` |
| **ApprovalStatus** | Pending=0, Approved=1, Rejected=2, Active=3, ManualApprovalRequired=4, PendingReview=5 | `User.cs:15-38` |
| **LoadStatus** | Active=0, Assigned=1, OnWay=2, Arrived=3, Delivered=4, Cancelled=5 | `Enums.cs:50-58` |
| **BidStatus** | Pending=0, Accepted=1, Rejected=2, Cancelled=3 | `Enums.cs:61-67` |
| **PaymentStatus** | Pending=0, Blocked=1, Released=2, Refunded=3, Failed=4 | `PaymentTransaction.cs:5-12` |
| **VehicleType** | TIR=0 … Silobas=11 (12 tip) | `Enums.cs:7-22` |
| **LoadType** | Paletli=0 … Kimyasal=15 (16 tip) | `Enums.cs:28-47` |
| **WalletAuditLogType** | Hold, Release, Commission, CustomerCommission, Tax, Refund | `WalletAuditLogType.cs` |
| **NotificationType** | Load=0, Bid=1, Payment=2, System=3, Document=4, Proximity=5 | `Notification.cs:25-33` |
| **SupportTicketStatus** | Open=0, Answered=1, Resolved=2, Closed=3 | `SupportTicket.cs:33-46` |
| **FuelType** | Motorin, Benzin, Lpg | `Enums.cs:70-75` |

### 3.3 İlişki şeması (metin tabanlı)

```
                          ┌─────────────────────────────┐
                          │            User             │  (Customer / Driver / Admin)
                          │  PK: int Id                 │
                          │  WalletBalance, PendingBal. │
                          │  ApprovalStatus, IsActive   │
                          └──────┬──────────┬───────────┘
            Owner (1—çok)        │          │   Driver (1—çok)
        ┌────────────────────────┘          └───────────────────────┐
        │                                                            │
        ▼                                                            ▼
┌──────────────────┐  1 — çok  ┌──────────────┐            ┌──────────────────┐
│      Load        │◄──────────│     Bid      │            │     Vehicle      │
│  PK: Guid Id     │           │  PK: int Id  │            │  PK: int Id      │
│  Status (enum)   │  DriverId→│  Amount      │ DriverId→  │  Plate (unique)  │
│  Origin/Dest.    │   User    │  Status      │   User     │  Type, Capacity  │
│  Price, AiPrice  │           └──────────────┘            └──────────────────┘
└───┬───┬───┬──────┘
    │   │   │ 1 — çok (FK navigation yok, ham LoadId)
    │   │   └──────────────► ChatMessage (LoadId, IsBlocked)
    │   │
    │   │ 1 — çok           ┌──────────────────────┐
    │   └──────────────────►│  PaymentTransaction  │  (Load → Restrict: yük silinse de yaşar)
    │   1 — çok             │  Amount=CustomerTotal │
    │                       │  Status (enum)        │
    │                       └──────────────────────┘
    │ 1 — çok
    └──────────────────────► Rating (LoadId, GivenBy→GivenTo, Score 1-5)
                                     unique (LoadId, GivenByUserId)

  User 1 — çok  ► WalletAuditLog (ledger: Hold/Release/Commission/Tax/Refund)
  User 1 — çok  ► Notification (Type, IsRead)
  User 1 — çok  ► DeliveryAddress (IsDefault)
  User 1 — çok  ► SupportTicket 1 — çok ► SupportMessage (User/Admin/AI)

  Bağımsız: FuelPrice, AdminActionLog, UetdsOutbox
```

**Silme davranışları** (`YukleDbContext.OnModelCreating`): Load→Owner **Cascade** (müşteri silinince yükleri de silinir), Load→Driver **Restrict**, PaymentTransaction→Load **Restrict** (ödeme kaydı yük silinse bile korunur — mali iz), Rating→Load Cascade. ChatMessage ve WalletAuditLog ham `LoadId` tutar (navigation property yok).

---

## 4) KİMLİK & YETKİ

### 4.1 Kayıt → Doğrulama → Giriş akışı

1. **Kayıt** (`POST /api/Auth/register`, `AuthController.cs:87`): telefon/email tekillik kontrolü → parola **BCrypt** ile hash'lenir → 6 haneli OTP üretilir (geliştirmede sabit `123456`) → `IsPhoneVerified=false` → SMS gönderilir (Netgsm; dev'de mock). SMS rate-limit: 3/dk, sonra 15 dk kara liste.
2. **OTP doğrulama** (`POST /Auth/verify-otp`, `AuthController.cs:166`): brute-force sayaç (3 hata/dk kilit) + kod/expiry eşleşme. **Müşteri** anında aktif (`IsActive=true`, `ApprovalStatus=Active` — `AuthService.cs:257-261`); **şoför** belge onayına kadar pasif kalır.
3. **Giriş** (`POST /Auth/login`, telefon VEYA email + parola, `AuthService.cs:367-389`): `IsPhoneVerified=false` ise 403 (`requiresVerification`). Başarılıysa **access token (7 gün) + refresh token** döner. Yanıt `LoginResponseDto` rolü + `IsActive` + `ApprovalStatus`'u da taşır (mobilin doğru ekrana gitmesi için).

> ⚠️ **Denetim bulgusu:** `LoginAsync` `IsActive` kontrol **etmez** → askıya alınmış (suspend) bir müşteri yine girebilir (`TUTARLILIK-DENETIMI.md` KRİTİK #1).

### 4.2 JWT üretimi, süresi, yenilemesi

- **Üretim:** `TokenService.cs:55` — HMAC-SHA512 imza, `Expires = AddDays(7)`. Payload'da rol, `IsActive`, `ApprovalStatus` claim'leri (kullanıcı bilgisi) taşınır.
- **Yenileme (refresh):** `POST /Auth/refresh-token` → eski refresh token doğrulanır, **rotation** ile yenisi üretilir (eski geçersizleşir → çalınan token en fazla bir kez kullanılır, `AuthService.cs:524-550`). DB'de `User.RefreshToken` + `RefreshTokenExpiryTime` (7 gün).
- **Süre dolunca:** Web'de axios response interceptor 401'i yakalar → refresh dener → başarısızsa logout + login'e yönlendirir (`apps/web/src/api/client.ts:74-129`).

> ⚠️ **Denetim bulgusu:** Mobilde 401 response interceptor **yok** (`api.client.ts:84` yalnız request interceptor) → 7 gün sonra mobil oturum sessizce kırılır (`TUTARLILIK-DENETIMI.md` KRİTİK #7).

### 4.3 Telefon doğrulama + şifreleme

- **Doğrulama:** 6 haneli OTP (SMS). Dev'de sabit `123456` (`NetgsmSmsService.cs:36`).
- **Şifreleme (KVKK koruması):** `Phone`, `FullName`, `TaxNumberOrTCKN` alanları **AES-256-CBC** ile şifreli saklanır (EF ValueConverter, `YukleDbContext.cs:60-97`). `Phone` **deterministik** (sabit IV) çünkü `Phone == loginInput` sorgusu ve benzersiz index'in çalışması gerekir.

### 4.4 Roller, izinler, yönlendirme

- **Yetki mekanizması:** Endpoint'lerde `[Authorize(Roles="...")]`. Şoför operasyonları için özel **`RequireActiveDriver` policy'si** — JWT claim'e güvenmez, **DB'den canlı `IsActive` okur** (`ActiveDriverAuthorizationHandler.cs:29-36`). Böylece admin onayı/askıya alma yeniden giriş gerektirmeden anında etkili olur.
- **Rol bazlı yönlendirme:** Giriş sonrası web `Login.tsx:56-58` ve mobil `LoginScreen.tsx:51-57` role göre `/customer`, `/driver`, `/admin` (veya admin-login) yönlendirir. Web admin rotaları `ProtectedRoute allowedRoles={['Admin']}` ile korunur.

| Rol | Erişebildiği uçlar (örnek) |
|---|---|
| Customer | İlan oluştur/iptal, teklif kabul, adres CRUD, kendi cüzdanı, puan ver |
| Driver | Teklif ver (yalnız `RequireActiveDriver`), pickup/deliver, konum güncelle, kendi kazancı |
| Admin | `[Authorize(Roles="Admin")]` tüm yönetim: belge onay, suspend/activate, ödeme serbest bırakma, loglar |

---

## 5) ROL YOLCULUKLARI (adım adım)

Format: **adım → ekran (web/mobil) → endpoint/hub → ne oluyor**.

### 5.1 MÜŞTERİ yolculuğu

1. **Kayıt + OTP** → `Register`/`register` → `POST /Auth/register` + `verify-otp` → hesap anında aktif.
2. **İlan oluştur** → `LoadCreate`/`create-load` (3 adımlı sihirbaz) → `POST /Loads` → `Load` kaydı (Status=**Active**, PostGIS koordinatlar). Sihirbaz sırasında `POST /Ai/price-suggestion` ile **canlı AI fiyat önizlemesi** gösterilir; oluşturmada AI fiyat mühürlenir.
3. **Teklifleri gör** → `Bids`/`load-detail` → `GET /Bids/load/{id}` → gelen teklifler listesi. Yeni teklif geldiğinde SignalR `ReceiveBid`/`ReceiveNotification` push'u.
4. **Teklif kabul** → `POST /Bids/{id}/accept` → atomik işlem: bid→Accepted, diğerleri Rejected, Load→**Assigned** + DriverId atanır, **escrow hold** (para kilitlenir).
5. **Takip** → `Track` (web Leaflet harita) → `GET /Location/driver/{loadId}` 20 sn polling → şoförün canlı konumu. (Mobilde müşteri canlı harita ekranı **yok** — denetim bulgusu.)
6. **Teslim onayı** → müşteri **QR kod** üretir → `GET /Loads/{id}/delivery-qr` (15 dk HMAC imzalı token) → şoföre gösterir/okutur.
7. **Ödeme** → teslim tamamlanınca escrow şoföre release edilir; müşteri tarafında ek aksiyon yok (otomatik).
8. **Puan** → `rate-driver` formu → `POST /Ratings/submit` (yalnız Delivered durumda).

### 5.2 ŞOFÖR yolculuğu

1. **Kayıt + OTP** → şoför rolü seçilir → hesap **pasif** (`IsActive=false`).
2. **Belge yükle** → `Documents`/`documents` → `POST /Auth/upload-document?docType=...` → Gemini OCR analizi. Üç zorunlu belge: **Ehliyet (DriverLicense) + SRC + Psikoteknik**.
3. **Onay bekle** → tüm zorunlu belgeler AI tarafından onaylanınca `IsActive=true` olur (`AuthService.cs:728-733`). Bu **aktivasyonun tek yasal yolu**.
   > ⚠️ **Denetim bulgusu:** Web'de tüm belgeler `DriverLicense` olarak gönderiliyor (`Documents.tsx:29,44`) → web şoför asla onaylanamaz (KRİTİK #2). Mobil doğru.
4. **İlan keşfet** → `Loads`/`loads` + "Senin İçin Önerilenler" → `GET /Matching/recommended` (Gemini skorlu, `RequireActiveDriver`).
5. **Teklif ver** → `load-detail` → `POST /Bids/submit` → owner'a SignalR push. (Onaysız şoför 403 alır.)
6. **Kabul edilince** → bildirim → ilan kendisine atanır.
7. **Taşı + konum paylaş** → `ActiveLoad`/`active-load` → `POST /Loads/{id}/pickup` (Assigned→OnWay) → `POST /Location/update` (web 20 sn, mobil 10 sn aralıkla GPS). 0.2 km yakınlıkta otomatik **Arrived**.
8. **Teslim** → müşterinin QR'ını tarar → `POST /Loads/{id}/deliver` (QR token + GPS ≤0.5 km doğrulama) → Load→**Delivered**, escrow **release**, U-ETDS outbox yazılır.
9. **Kazanç/cüzdan** → `Wallet`/`wallet` → `GET /Wallet/summary` → `WalletBalance` (kullanılabilir), `PendingBalance` (bekleyen), aylık kazanç, yük bazlı döküm. (Para çekme/cashout **yok**.)

### 5.3 ADMIN yolculuğu

1. **Belge onay** → `Reviews`/`reviews` → `GET /Admin/pending-reviews` (onay kuyruğu) → `POST /Admin/reviews/{userId}/decide` (onay/red). Onaylanınca şoför aktifleşir.
2. **Kullanıcı/ilan yönetimi** → `Users`/`Drivers`/`Customers`/`Loads` → suspend/activate/warn/note, ilan iptal.
3. **Ödeme/escrow gözetimi** → `Payments`/`payments` → bloke (Held) ödemeleri görür → `POST /Admin/payments/{id}/release` → para şoför cüzdanına geçer.
4. **Destek** → `Support` → açık ticket'ları yanıtlar.
5. **Loglar/sistem** → `Logs`/`System` → `AdminActionLog` denetim izi, sistem durumu (API/DB/U-ETDS).

---

## 6) İLAN–TEKLİF–EŞLEŞTİRME

### 6.1 İlan durum makinesi (LoadStatus)

```
   ┌─────────┐  teklif kabul   ┌──────────┐  şoför pickup  ┌────────┐
   │ Active  │ ──────────────► │ Assigned │ ─────────────► │ OnWay  │
   │(İlanda) │  (müşteri)      │ (Atandı) │  (şoför)       │(Yolda) │
   └────┬────┘                 └────┬─────┘                └───┬────┘
        │                           │                          │ GPS ≤0.2km (otomatik)
        │ iptal                     │ admin iptal+iade         ▼
        ▼                           ▼                     ┌──────────┐
   ┌───────────┐               ┌───────────┐  QR+GPS      │ Arrived  │
   │ Cancelled │◄──────────────│ Cancelled │  teslim      │(Ulaştı)  │
   │  (İptal)  │               │  (İptal)  │  ┌───────────►└────┬─────┘
   └───────────┘               └───────────┘  │                │
                                               │           ┌────▼──────┐
                                               └───────────│ Delivered │
                                                           │ (Teslim)  │ → escrow release
                                                           └───────────┘
```

**Geçişleri kim/ne tetikliyor:**

| Geçiş | Tetikleyici | Kod |
|---|---|---|
| Active → Assigned | Müşteri teklif kabul eder | `BidService.cs:172` |
| Assigned → OnWay | Şoför "yükü aldım" (pickup) | `LoadService.cs:248` |
| OnWay → Arrived | **Otomatik** — şoför GPS hedefe ≤0.2 km (Haversine) | `LocationController.cs:49-51` |
| OnWay/Arrived → Delivered | Şoför QR + GPS yakınlık ile teslim | `LoadService.cs:286-290` |
| → Cancelled | Müşteri (kabul öncesi) veya admin (kabul sonrası, iadeli) | `CancellationService.cs:98` |

### 6.2 Teklif durumları (BidStatus)

`Pending` (beklemede) → `Accepted` (kabul) / `Rejected` (red) / `Cancelled` (şoför geri çekti).

### 6.3 Kabulde ne oluyor (atomik zincir)

`POST /Bids/{id}/accept` tek **transaction** (ya hepsi olur ya hiçbiri) içinde (`BidService.cs:140-231`):
1. Kabul edilen teklif → `Accepted`
2. İlan → `Assigned` + `DriverId` atanır
3. **Diğer tüm Pending teklifler** → `Rejected` (tek SQL `ExecuteUpdateAsync`)
4. **Escrow hold** → `HoldPaymentAsync` ile para kilitlenir (`PaymentTransaction` + `WalletAuditLog`)
5. Başarısızsa → tümü geri alınır (rollback)
6. Transaction commit sonrası → 3 bildirim: kabul edilen şoför, müşteri, reddedilen şoförler

---

## 7) PARA/ESCROW (uçtan uca, formüllerle)

Bu sistemin en kritik kısmı. Gerçek banka/kart yok — **MockPaymentService** ile escrow (emanet) modeli simüle edilir; ama **defter kayıtları, komisyon hesapları ve cüzdan bakiyeleri gerçekten yazılır** (sahte olan yalnız fiziksel para hareketi).

### 7.1 Komisyon ve stopaj oranları

`CommissionSettlementOptions` config'ten okunur (`WalletSettlementCalculator.cs:13-20`):

| Sabit | Değer | Yer |
|---|---|---|
| DriverRate (şofor komisyonu) | %2 (0.02) | `appsettings.json:31` |
| CustomerRate (müşteri komisyonu) | %2 (0.02) | `appsettings.json:32` |
| **StopajRate (stopaj/vergi)** | **%0 (0.0)** | `appsettings.json:35` |

> **Stopaj** = devlet adına kaynakta kesilen vergi. Şu an oran **0** olduğu için fiilen kesinti yok (UI'da satır görünse de 0 — denetim bulgusu).

### 7.2 Formüller (`WalletSettlementCalculator.cs:22-46`)

```
X = teklif tutarı (bid)
driverCommission   = yuvarla(X × 0.02)          ← şofordan kesilen
customerCommission = yuvarla(X × 0.02)          ← müşteriden eklenen
stopaj             = yuvarla(X × 0.0) = 0
driverNet          = X − driverCommission − stopaj    ← şoförün net alacağı
customerTotal      = X + customerCommission            ← müşterinin ödediği
platformRevenue    = driverCommission + customerCommission   ← platform geliri
```

### 7.3 Sayısal örnek: X = 1000 TL (bireysel şoför)

```
driverCommission   = 1000 × 0.02 = 20,00 TL
customerCommission = 1000 × 0.02 = 20,00 TL
stopaj             = 1000 × 0.0  =  0,00 TL
─────────────────────────────────────────────
driverNet          = 1000 − 20 − 0 = 980,00 TL   ← şofor cüzdanına geçecek
customerTotal      = 1000 + 20     = 1020,00 TL  ← müşterinin ödediği
platformRevenue    = 20 + 20       = 40,00 TL    ← Navlonix kazancı

Doğrulama özdeşliği:
  müşterinin ödediği = şofor net + müşteri kom. + şofor kom. + stopaj
  1020,00            = 980,00    + 20,00        + 20,00       + 0,00    ✓
```

### 7.4 Uçtan uca akış

1. **Müşteri öder / escrow hold:** Teklif kabulünde `HoldPaymentAsync` (`MockPaymentService.cs:33`) → `PaymentTransaction` (Amount=**1020** = customerTotal, Status=**Blocked**) + `ApplyHoldAsync` (`WalletLedgerService.cs:13`): şoförün `PendingBalance += 980` ve 4 defter kaydı yazılır (Hold 980, Commission 20, CustomerCommission 20, Tax 0).
2. **Bloke (Held):** Para kilitli; ne şoför ne müşteri dokunabilir.
3. **Admin serbest bırakma:** `POST /Admin/payments/{id}/release` (`AdminController.cs:516`) → `ApplyReleaseAsync` (`WalletLedgerService.cs:49`): şoförün `PendingBalance −= 980`, `WalletBalance += 980`, PaymentStatus → **Released**. **Idempotent** (yalnız `Blocked` arar → çift kredi olmaz).
4. **Şofor cüzdanı:** `WalletBalance` artık 980 (kullanılabilir).

### 7.5 Hangi ekran ne gösterir

| Ekran | Gösterdiği | Kaynak |
|---|---|---|
| **Müşteri** (EscrowCard) | "Ödediğiniz 1020 TL emanette/serbest" | `GET /Payments/load` (status Held/Released) |
| **Şofor cüzdanı** | `WalletBalance` (kullanılabilir), `PendingBalance` (bekleyen 980), aylık kazanç | `GET /Wallet/summary` |
| **Admin Ödemeler** | Bloke/serbest ödemeler, toplam hacim | `GET /Admin/payments` + `/Payments/admin/summary` |

> ⚠️ **Denetim bulguları:** Web admin "Platform payı" oranı hardcoded; "Toplam işlem hacmi" Refunded dahil + customerTotal toplar; "Held" (Payments endpoint) vs "Blocked" (Admin endpoint) iki ayrı string; web admin Payments filtreleri tamamen ölü (`TUTARLILIK-DENETIMI.md §7`).

---

## 8) GERÇEK ZAMANLI (SignalR)

SignalR, sunucunun istemciyi **anında** uyarabildiği çift yönlü kanaldır (sürekli sormaya/polling'e gerek kalmaz). Üç hub var, hepsi `/hubs/*` altında ve `[Authorize]`. Token URL'de `?access_token=` ile geçer (`Program.cs:317-329`).

| Hub | URL | Ne yapar | Yazan → Okuyan | Durum |
|---|---|---|---|---|
| **NotificationHub** | `/hubs/notifications` | Olay bildirimleri (grup = userId) | Sunucu → ilgili kullanıcı (`ReceiveNotification`, `ReceiveBid`...) | **Mobil bağlı; web bağlı DEĞİL** (web `lib/notificationHub.ts` import edilmiyor → web 10 sn polling yapar) |
| **TrackingHub** | `/hubs/tracking` | Canlı konum yayını, Haversine varış | (tasarımda) şoför → müşteri | **TAMAMEN ÖLÜ** — hiçbir istemci bağlanmıyor; konum REST polling'le gidiyor |
| **ChatHub** | `/hubs/chat` | Yük başına sohbet odası + moderasyon | Müşteri ↔ şoför (`SendMessage` → `ReceiveMessage`) | **Çalışıyor** (web + mobil aynı hub/metot/event) |

**Bağlanma (token):** Web her reconnect'te store'dan **taze** token okur (`accessTokenFactory`); mobil mount anındaki token'ı yakalar (uzun oturumda bayat token riski).

**Sohbet detayı:** `loadId`'ye bağlı oda. Mesaj gönderildiğinde `ChatModerationService` engelli içerik kontrolü yapar; engellenirse `IsBlocked=true` DB'ye yazılır + gönderene hata, admin engellenenleri görür. Admin sohbete **katılmaz**, yalnız REST `/Admin/chats` ile izler (gözetim).

> ⚠️ **Denetim bağı:** TrackingHub ölü kod → "gerçek zamanlı takip" aslında 20 sn REST polling; mobil müşteride canlı harita ekranı yok; chat'te okunmamış sayacı yok (`TUTARLILIK-DENETIMI.md §5-6`).

---

## 9) DESTEK

İki katmanlı destek (`SupportController.cs`):

1. **AI chatbot:** Kullanıcı soru sorar → `SafeAiReplyAsync` → `GeminiServiceClient.GetSupportAssistantReplyAsync` (gerçek Gemini Flash). Gemini erişilemezse (anahtar/timeout/circuit-breaker) `null` döner ve **`SupportFaqResponder`** (önceden hazırlanmış Türkçe SSS) devreye girer → çekirdek akış asla çökmez (`SupportController.cs:400-414`).
2. **Ticket sistemi:** AI çözemezse insana aktarılır. `SupportTicket` (Open/Answered/Resolved/Closed) + `SupportMessage` (gönderen: User/Admin/AI, hepsi aynı thread'de).
   - **SLA** (hizmet süre hedefi): `SlaDeadline = CreatedAt + 24 saat`; geçilirse "gecikmiş".
   - **Operatöre aktarma** ("escalate"): `SupportController.cs:190-223` → ticket Open olur, admin'lere bildirim, sistem mesajı eklenir, sonrasında AI susar (`humanMode`). Web + mobil buton bağlı (**çalışıyor**).
   - **Admin yönetimi:** `Support` ekranından açık ticket'lar yanıtlanır.

> ⚠️ Web admin Reviews KPI'ları ("Bugün onaylanan", "ortalama inceleme süresi") hardcoded (`TUTARLILIK-DENETIMI.md §9`).

---

## 10) BELGE & ONAY

**Belge türleri (şoför, 3 zorunlu):** Ehliyet (DriverLicense), SRC (mesleki yeterlilik), Psikoteknik. Her biri için `User`'da onay bayrağı + expiry tarihi (`User.cs:129-136`).

**Akış:**
1. Şoför belge yükler → `POST /Auth/upload-document?docType=...` → Gemini Pro Vision OCR (`AuthService.AnalyzeDocumentAsync`).
2. AI kararı:
   - Geçerli → ilgili bayrak onaylanır.
   - Geçersiz/süresi dolmuş/kimlik uyuşmazlığı → `Rejected`, `IsActive=false` (`AuthService.cs:659-711`).
   - Teknik hata/timeout → `ManualApprovalRequired` (admin'e düşer).
   - Gri alan (confidence 50-85) → `PendingReview` (admin'e düşer).
3. **Tüm zorunlu belgeler onaylı** → `IsActive=true`, `ApprovalStatus=Active` (`AuthService.cs:728-733`).
4. **Admin inceleme:** `GET /Admin/pending-reviews` kuyruğu → `POST /Admin/reviews/{userId}/decide` (onay/red), AI çıkarım detayları (`AiInferenceDetails` JSON) delil olarak gösterilir.

**Onayın yetkiye etkisi:** Şoför `IsActive=true` olmadan teklif veremez/operasyon yapamaz — `RequireActiveDriver` policy DB'den canlı okur (`ActiveDriverAuthorizationHandler.cs:29-36`). **Gate gerçekten enforce ediliyor.**

> ⚠️ Web admin belge inceleme paneli backend'in yazmadığı alanları okuyup uydurma/hep-yeşil veri gösteriyor (`TUTARLILIK-DENETIMI.md §11 KRİTİK`). Belge depolama **gerçek** (diske yazıyor, `DriverReviewDocumentStore.cs:22-37`).

---

## 11) BİLDİRİM

**Olay → bildirim türleri** (`NotificationService.SendAsync` üçlü yapar: DB kaydı + SignalR push + FCM):

| Olay | Tip | Tetikleyici |
|---|---|---|
| Teklif kabul/red | Bid | `BidService.cs:205,211,219` |
| Teslim tamamlandı | Load | `LoadService.cs:313,318` |
| Yaklaşma/varış | Proximity | `LocationController.cs:43,52,56` |
| İptal/iade | Load/Bid/Payment | `CancellationService.cs:154-165` |
| Destek | System | `SupportController.cs:426,438` |

- **In-app:** DB'ye yazılır; mobil SignalR ile anlık alır, web 10 sn polling ile çeker. Okundu/sayaç: `GET /Notifications/unread-count`, `POST /Notifications/{id}/read`, `read-all`.
- **FCM (push):** **Mock/ölü.** `firebase-service-account.json` repoda yok → `FirebaseApp.Create` çağrılmıyor; mobil hiçbir yerde FCM token üretip kaydetmiyor → `User.FcmToken` daima null. Uygulama kapalıyken push **çalışmaz** (`TUTARLILIK-DENETIMI.md §12 KRİTİK`).
- ⚠️ "Yeni teklif" bildirimi DB'ye yazılmıyor (yalnız SignalR, id'siz) → offline müşteri göremez, mobilde düşürülür.

---

## 12) EKRAN ENVANTERİ & PARİTE

> ✅ var · ❌ yok · ⚠️ stub/sahte/ölü

### Müşteri

| Ekran | Web | Mobil | Not |
|---|---|---|---|
| Dashboard | ✅ | ✅ | Gerçek history'den, tutarlı |
| İlan oluştur (+AI fiyat) | ✅ | ✅ | İki tarafta canlı AI önizleme |
| İlanlarım / İlan detay | ✅ | ✅ | |
| Teklifler | ✅ | ✅ | |
| Canlı takip | ✅ (`Track`) | ❌ | **Mobilde müşteri canlı harita yok** |
| İlan düzenle | ❌ | ✅ | **Web'de edit akışı yok** |
| Adresler | ✅ (edit ❌) | ✅ (edit ✅) | Web'de düzenleme yok |
| Analitik | ⚠️ tamamen hardcoded | ✅ gerçek + DEMO etiketli | Web sahte, mobil dürüst |
| Sohbet / Destek / Profil / Puan | ✅ | ✅ | |

### Şoför

| Ekran | Web | Mobil | Not |
|---|---|---|---|
| Dashboard | ⚠️ alan uyuşmazlığı → 0 | ✅ gerçek | **Web KIRIK** (DTO alan adları) |
| Belgeler | ⚠️ hep DriverLicense | ✅ doğru | **Web'den onay alınamaz** |
| İlan keşfet / Önerilenler | ✅ | ✅ | Mobilde AI match skoru yok |
| Teklif ver/listele | ✅ (form guard'sız) | ✅ | Geri çekme UI'da ikisinde de zayıf |
| Aktif sefer / takip | ✅ (`ActiveLoad`) | ✅ (`active-load`) | Web `Track.tsx` placeholder |
| Cüzdan | ✅ | ✅ | Cashout yok (ikisinde de) |
| Sohbet / Geçmiş / Profil | ✅ | ✅ | |

### Admin

| Ekran | Web | Mobil | Not |
|---|---|---|---|
| Dashboard | ⚠️ yarısı hardcoded/0 | ✅ gerçek alanlar | Web hayalet alanlar |
| Belge inceleme (Reviews) | ⚠️ uydurma AI verisi | ✅ doğru | |
| Kullanıcılar | ✅ (ayrı Drivers/Customers) | ✅ (tek `users` + sekme) | Tasarım farkı, kabul edilebilir |
| İlanlar / Ödemeler | ✅ (Payments filtreleri ölü) | ✅ (filtre çalışır) | |
| Takip / Sohbet / Engellenenler | ✅ | ✅ | |
| Puanlar / Loglar / Sistem | ✅ | ✅ | Mobil daha dürüst metrik |
| Settings | ⚠️ tamamen ölü | ✅ kısmi gerçek | Web'de profil/şifre kaydedilemez |

---

## 13) BACKEND YAPISI

### 13.1 Katmanlar

```
Controllers/  (18 adet — HTTP uçları, ince katman)
     │ çağırır
Services/     (~40 adet — iş mantığı; çoğu I…Service arayüzü + implementasyon)
     │ kullanır
Data/ (YukleDbContext — EF Core)  ──► PostgreSQL + PostGIS
Hubs/ (3 SignalR hub)
BackgroundServices/ (arka plan işleri)
```

### 13.2 Controller'lar (18)

`Auth`, `Loads`, `Bids`, `Matching`, `Location`, `Payments`, `Wallet`, `Settlement`, `Admin`, `Users`, `Dashboard`, `Chat`, `Ratings`, `Notifications`, `DeliveryAddresses`, `Support`, `Ai`, `System`. (Detaylı endpoint listesi: `SISTEM-GENEL-BAKIS.md §2.4`.)

### 13.3 Önemli servisler

- **AuthService / TokenService / EncryptionService:** kimlik, JWT, AES-256.
- **LoadService / LoadEditService / CancellationService:** yük yaşam döngüsü, iptal/iade kuralları.
- **BidService:** atomik teklif kabul zinciri.
- **MockPaymentService / WalletLedgerService / WalletSettlementCalculator:** escrow + defter + komisyon.
- **GeminiServiceClient (+ FreightPricingEngine fallback):** AI fiyat/OCR/eşleştirme (Polly resilience: retry×3 → circuit breaker → 10s timeout).
- **NotificationService / ChatModerationService / SupportFaqResponder / RouteService (OSRM).**

### 13.4 Arka plan işleri (BackgroundServices/)

- **AdminSeederJob:** her açılışta admin + test kullanıcılarını oluşturur (`admin@navlonix.com`/`Admin123!`).
- **DemoProvaSeederJob:** demo yükleri/teklifleri/escrow + canlı harita için simüle şoför konumu üretir.
- **FuelPriceUpdateWorker:** il bazlı yakıt fiyatlarını çeker (AI fiyatlama girdisi).
- **UetdsBackgroundWorker:** U-ETDS outbox'ı 2 dk'da işler (mock).
- **DocumentCleanupJob:** gece 02:00 UTC, 30 günden eski `PendingReview`/`Rejected` kullanıcıları siler (KVKK).
- **GeminiQueueProcessor / GeminiTaskQueue:** async AI kuyruğu (~30 RPM throttle).
- **PaymentBackfillJob:** eski yüklere geriye dönük escrow üretir.

---

## 14) MOCK vs GERÇEK

| Entegrasyon | Durum | Demo'da ne sahte | Yanıltıcı mı |
|---|---|---|---|
| **Ödeme provider** (İyzico/kart) | **MOCK** — `MockPaymentService` tek implementasyon | Fiziksel para hareketi + kart tahsilatı yok | **Hayır** — `PaymentTransaction`, defter, cüzdan bakiyeleri gerçekten yazılır; sayılar doğru. UI "Demo: ödeme mock'tur" diyor (`EscrowCard.tsx:159`) |
| **U-ETDS** (devlet taşıma bildirimi) | **MOCK** — outbox yazılır, worker işler ama gerçek devlet API'si yok | Bildirim gönderimi | Hayır (iç metrik gerçek sayar) |
| **FCM** (push bildirim) | **MOCK/ÖLÜ** — credential + mobil token kaydı yok | Arka plan push'u | Kısmen — uygulama kapalıyken bildirim gelmez |
| **Redis** (cache + SignalR backplane) | **MOCK** — `AddDistributedMemoryCache` (in-memory) | Gerçek Redis yok | **Evet, tek yanıltıcı nokta:** dashboard "Redis Online" der ama Redis yok (`AdminController.cs:116-129`) |
| **Gemini AI** | **GERÇEK** + circuit-breaker fallback | — | Hayır — AI kapalıysa matematiksel fiyat fallback / manuel onay kuyruğu devreye girer |
| **SMS/OTP** (Netgsm) | **GERÇEK client**, dev'de mock (sabit `123456`) | Dev'de SMS gönderilmez | Hayır (kasıtlı bypass, demo hesapları `IsPhoneVerified=true` seed) |

---

## 15) BİLİNEN SINIRLAR

`docs/TUTARLILIK-DENETIMI.md` denetiminin özeti — neler kırık/eksik/sahte:

### Demo'yu bozabilecek KRİTİK'ler
1. **"Banla" müşteride etkisiz** — `LoginAsync` `IsActive` kontrol etmiyor (`AuthService.cs:367-389`).
2. **Web şoför belge yükleme hep DriverLicense** — SRC/Psikoteknik yüklenemez, web şoför asla onaylanamaz (`Documents.tsx:29,44`).
3. **Web şoför Dashboard alan uyuşmazlığı** — DTO alan adları tutmuyor, tüm değerler 0 (`DriverDashboardDto.cs` vs `types.ts`).
4. **Web admin Dashboard + müşteri Analitik** büyük ölçüde hardcoded/hayalet alanlar; mobil dürüst.
5. **Web admin belge inceleme** uydurma AI verisi (hep yeşil ✅).
6. **Mobilde token refresh yok** → 7 gün sonra oturum sessizce kırılır.
7. **Web "Kodu tekrar gönder" ölü** → OTP kaçıran web kullanıcısı kayıt olamaz.
8. **Dashboard sahte "Redis Online"** → var olmayan altyapı "çalışıyor" gösterilir.

### İşlevsel boşluklar
- TrackingHub tamamen ölü kod; mobil müşteri canlı harita yok; ETA yok.
- Web'de eksik akışlar: ilan düzenleme, adres düzenleme, teklif geri çekme, admin Settings (hepsi backend'de hazır).
- FCM push uçtan uca ölü; "yeni teklif" bildirimi DB'ye yazılmıyor.
- `RequiredVehicleType` DTO'dan düşmüş → şoför gerekli araç tipini görmez.
- Web admin Payments filtreleri + "Başarısız İşlem" KPI ölü/daima 0.

### Kozmetik/tutarlılık
- Enum etiket farkı (Active → web "Yayında" vs mobil "Aktif").
- ApprovalStatus index 5 FE map'lerinde eksik.
- Ödeme status iki string ("Held" vs "Blocked").
- Stopaj her yerde 0 ama UI vaad ediyor.
- Web komisyon oranı hardcoded; "toplam hacim" Refunded dahil.

**Genel desen:** Backend çekirdek iş mantığı sağlam (ödeme aritmetiği, teklif atomikliği, yetki, escrow idempotency). En zayıf nokta **web frontend ↔ backend sözleşme uyumu**; mobil tarafı çoğu akışta daha tutarlı ve dürüst.

---

## 16) SÖZLÜK

| Terim | Açıklama |
|---|---|
| **Escrow (emanet)** | Müşterinin ödediği paranın, iş tamamlanana kadar tarafsız bir yerde (burada platform) kilitli tutulması. Teslim onaylanınca şoföre serbest bırakılır. |
| **Stopaj** | Devlet adına, ödemenin kaynağında peşin kesilen vergi. Burada oran şu an %0 (fiilen kapalı). |
| **Komisyon** | Platformun hizmet bedeli. Burada müşteriden +%2, şofordan −%2 (toplam %4 platform geliri). |
| **Havuz** | Escrow'da bekleyen toplam para (admin Ödemeler'de "havuzda/bloke" olarak görünür). |
| **U-ETDS** | Ulaştırma Bakanlığı'nın elektronik taşıma bildirim sistemi. Burada mock. |
| **SignalR** | Sunucunun istemciyi anında uyarabildiği gerçek-zamanlı çift yönlü iletişim teknolojisi (WebSocket üzerinde). |
| **Idempotent** | Aynı işlemin birden çok kez çağrılmasının tek seferlik etki yapması (örn. "serbest bırak" iki kez çağrılsa da para bir kez geçer). |
| **JWT** | Sunucunun imzaladığı, kullanıcı kimliğini taşıyan dijital bilet; her isteğe iliştirilir. |
| **Refresh token** | Access token süresi dolunca yeniden giriş yapmadan yeni token almayı sağlayan, tek kullanımlık yenilenen bilet. |
| **OTP** | Tek kullanımlık doğrulama kodu (SMS ile gelen 6 hane). |
| **OCR** | Görüntüdeki metni okuma (belge fotoğrafından bilgi çıkarma). Burada Gemini Pro Vision yapar. |
| **PostGIS** | PostgreSQL'in coğrafi (harita koordinatı) veri eklentisi; mesafe/konum sorgularını mümkün kılar. |
| **Haversine** | İki coğrafi nokta arası kuş uçuşu mesafeyi hesaplayan formül (varış algılamada kullanılır). |
| **Polling** | İstemcinin sunucuya periyodik "yeni bir şey var mı?" diye sorması (SignalR'ın anlık push'unun aksine). |
| **Monorepo** | Birden çok ilişkili uygulamanın tek Git deposunda toplanması. |
| **Parite** | Web ile mobil arasında özellik denkliği (aynı şeyi iki platform da yapabiliyor mu). |
| **Seeder** | Uygulama açılışında veritabanına başlangıç/demo verisi yazan iş. |
| **Outbox deseni** | Dış sisteme gönderilecek mesajların önce DB'ye yazılıp arka plan işiyle güvenilir biçimde iletilmesi (U-ETDS'te kullanılır). |
| **Circuit breaker** | Bir dış servis (Gemini) sürekli hata verince, bir süre çağrıyı kesip fallback'e geçen koruma mekanizması. |

---

*Bu doküman kod okunarak üretilmiştir (`Models/`, `Controllers/`, `Services/`, `Hubs/`, `BackgroundServices/`, web `src/`, mobil `app/`+`src/`). Hiçbir kaynak dosya veya veritabanı değiştirilmemiştir. Bilinen sınırlar `docs/TUTARLILIK-DENETIMI.md` denetimine dayanır.*
