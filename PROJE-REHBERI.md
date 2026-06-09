# Navlonix (YÜK-LE) — Sıfırdan Proje Rehberi

> Bu belge, projeyi yazan kişi için hazırlanmış kapsamlı bir **öğrenme/hatırlama**
> rehberidir. Her bölümde üç soruyu ayrı ayrı yanıtlar: **(1) Bu ne işe yarıyor / neden var,
> (2) Nasıl çalışıyor, (3) Kodda nerede.** Terimler açıklanır, kısaltmalar uzun hâliyle yazılır.
>
> Üretim tarihi: 2026-06-09. Kaynak: kodun tamamı + canlı veritabanı (`yukledb`) salt-okunur sorgular.
> Veritabanına **hiçbir yazma** yapılmadı; yalnızca `SELECT` / şema okuma sorguları kullanıldı.

---

## İçindekiler

0. [Genel Bakış](#0-genel-bakış)
1. [Veritabanı (yukledb / PostgreSQL)](#1-veritabanı-yukledb--postgresql)
2. [Backend (.NET 9 API)](#2-backend-net-9-api)
3. [Web (React 19 / Vite)](#3-web-react-19--vite)
4. [Mobil (Expo React Native)](#4-mobil-expo-react-native)
5. [Rol Bazlı Akışlar (en kritik bölüm)](#5-rol-bazlı-akışlar)
6. [Özet Tablolar](#6-özet-tablolar)
7. [BELİRSİZ İşaretlenen Maddeler](#7-belirsiz-i̇şaretlenen-maddeler)

---

## 0. GENEL BAKIŞ

### Navlonix nedir?
Navlonix (klasör adı **YÜK-LE**, eski adıyla "Yükle"), bir **dijital nakliye/lojistik pazar yeri**dir.
Üç tip kullanıcıyı buluşturur:
- **Müşteri (Customer):** Taşınacak yükü olan kişi/şirket. Yük ilanı açar, teklif toplar, ödeme yapar.
- **Şoför (Driver):** Aracı olan taşıyıcı. Yüklere teklif verir, taşır, kazanç elde eder.
- **Yönetici (Admin):** Platform operatörü. Belge onaylar, kullanıcı yönetir, moderasyon yapar.

İş modeli iki yönlüdür:
1. **Müşteri yük açar → şoförler teklif verir → müşteri kabul eder** (klasik "ihale" akışı).
2. **Şoför "boş araç" ilanı açar → müşteriler kendi yükünü teklif eder → şoför kabul eder** (ters akış).

Para, doğrudan elden geçmez; **emanet (escrow)** mantığıyla platform üzerinde bloke edilir,
iş tamamlanınca serbest bırakılır. (Şu an gerçek banka/İyzico entegrasyonu yerine **mock/taklit**
bir ödeme servisi çalışıyor — ledger kayıtları gerçek, kart çekimi simülasyon.)

### Monorepo (tek depo) yapısı
"Monorepo", birden çok uygulamanın **tek bir Git deposunda** tutulması demektir. Kök dizin:
`C:\Users\SALİH\OneDrive\Desktop\YÜK-LE`

```
YÜK-LE/
├── apps/
│   ├── api/          → Backend. .NET 9 Web API (C#). Asıl iş mantığı + veritabanı burada.
│   │   ├── Yukle.Api/    (ana proje)
│   │   └── Yukle.Tests/  (xUnit test projesi)
│   ├── web/          → Web uygulaması. React 19 + Vite + TypeScript. Müşteri/şoför/admin paneli.
│   ├── mobile/       → Mobil uygulama. Expo (React Native). Klasör: yukle-mobile/
│   └── marketing/    → Tanıtım/pazarlama sitesi. Next.js 16 (ayrı uygulama).
├── packages/
│   └── shared/       → Web ve mobilin paylaştığı ortak TypeScript kodu (tipler, yardımcılar).
├── docs/             → Proje dokümanları (analiz/tarama notları).
├── infra/            → Altyapı dosyaları (Docker vb. — bu rehberde kullanılmadı).
└── package.json      → Kök ayar (monorepo yönetimi).
```

**Monorepo nasıl yönetiliyor?** npm/pnpm "workspaces" **bilinçli olarak KULLANILMAMIŞ**. Her uygulamanın
kendi `node_modules` klasörü var. Ortak kod (`packages/shared`) build edilmeden, doğrudan kaynak
TypeScript olarak tüketiliyor: Web tarafında Vite'in `resolve.alias` ayarı, mobil tarafında Metro
paketleyicisinin `extraNodeModules`/`watchFolders` ayarı, ve `tsconfig` yol eşlemeleri (paths) ile.
Sebep: kök dizinde `npx`/`tsc` çalıştırıldığında yanlış TypeScript sürümüne çözümlenmesini önlemek.
(Kaynak: kök `package.json`.)

### Her uygulamanın görevi ve ana teknolojisi

| Uygulama | Klasör | Teknoloji | Görevi |
|---|---|---|---|
| **API (Backend)** | `apps/api/Yukle.Api` | .NET 9.0 (C#), ASP.NET Core Web API | Tüm iş mantığı, kimlik doğrulama, veritabanı erişimi, ödeme, AI çağrıları, gerçek zamanlı bildirim |
| **Web** | `apps/web` | React 19 + Vite + TypeScript | Tarayıcı paneli (müşteri, şoför, admin tek uygulamada, rol bazlı) |
| **Mobil** | `apps/mobile/yukle-mobile` | Expo ~54 (React Native 0.81), Expo Router | iOS/Android uygulaması (müşteri, şoför, admin) |
| **Marketing** | `apps/marketing` | Next.js 16, GSAP, Tailwind CSS 4 | Halka açık tanıtım/landing sitesi (animasyonlu) |
| **Shared** | `packages/shared` | TypeScript | Web+mobil ortak tipler/yardımcı fonksiyonlar |

> **Terim:** *Backend* = sunucu tarafı (kullanıcının görmediği, veriyi işleyen kısım).
> *Frontend* = kullanıcının gördüğü arayüz (web/mobil). *API (Application Programming Interface)*
> = uygulamaların birbiriyle konuştuğu kurallar kümesi; burada backend'in sunduğu HTTP uç noktaları.

### Uygulamalar birbiriyle nasıl konuşuyor?

```
[Web tarayıcı]   [Mobil uygulama]        [Marketing sitesi]
      │                 │                    (bağımsız, API'ye
      │  HTTP/JSON      │  HTTP/JSON          bağlı değil — sadece
      │  (axios)        │  (axios)            tanıtım)
      ▼                 ▼
 ┌─────────────────────────────────┐
 │   Backend API (.NET 9)          │   http://localhost:5151
 │   - Controller'lar (HTTP uçları)│
 │   - Service'ler (iş mantığı)    │
 │   - EF Core (veritabanı erişimi)│
 │   - SignalR (gerçek zamanlı)    │◄── WebSocket: bildirim + sohbet (canlı)
 └───────────────┬─────────────────┘
                 │ SQL (Entity Framework Core + Npgsql)
                 ▼
 ┌─────────────────────────────────┐
 │   PostgreSQL + PostGIS           │   localhost:5432, veritabanı: yukledb
 │   (coğrafi koordinatlar için     │
 │    PostGIS uzantısı)             │
 └─────────────────────────────────┘
        ▲                ▲
  Gemini AI         OSRM (harita rota
  (HTTP)            mesafesi) / Opet (yakıt fiyatı)
```

- **İletişim biçimi:** Web ve mobil, backend'e **HTTP** üzerinden **JSON** verisi gönderip alır.
  Her iki frontend de `axios` kütüphanesini kullanır.
- **Gerçek zamanlı (real-time):** Bildirimler ve sohbet için **SignalR** kullanılır. SignalR,
  Microsoft'un WebSocket tabanlı "sunucudan istemciye anlık veri itme" kütüphanesidir. Böylece
  yeni bir teklif/mesaj geldiğinde sayfa yenilemeden anında görünür.
- **Dış servisler:** Backend; belge okuma/fiyat/eşleştirme için **Google Gemini** yapay zekâsına,
  rota mesafesi için **OSRM** (Open Source Routing Machine — açık kaynak harita rota motoru) servisine,
  yakıt fiyatları için **Opet** benzeri kaynaklara HTTP ile çıkar.
- **Web'in API adresi:** `apps/web/src/api/client.ts` içinde sabit: `http://localhost:5151/api`.
- **Mobilin API adresi:** `apps/mobile/yukle-mobile/.env` → `EXPO_PUBLIC_API_BASE_URL`
  (gerçek cihazda makinenin LAN IP'si gerekir; `localhost` cihazda çalışmaz).

---

## 1. VERİTABANI (yukledb / PostgreSQL)

### Genel
- **Veritabanı motoru:** PostgreSQL 17 (Windows'ta yerel servis: `postgresql-x64-17`, port `5432`).
- **Veritabanı adı:** `yukledb`. Bağlantı bilgisi: `apps/api/Yukle.Api/appsettings.Development.json`
  → `ConnectionStrings:DefaultConnection`
  (`Host=localhost;Port=5432;Database=yukledb;Username=postgres;Password=...`).
- **Coğrafi uzantı:** **PostGIS**. Bu uzantı, "şu nokta nerede, iki nokta arası ne kadar" gibi
  coğrafi (harita) sorgularını mümkün kılar. Yük ve şoför ilanlarının kalkış/varış noktaları
  `geometry(Point, 4326)` tipinde saklanır. (4326 = WGS-84, GPS'in kullandığı standart koordinat
  sistemi; koordinat sırası X=boylam/longitude, Y=enlem/latitude.)

> **Terim:** *EF Core (Entity Framework Core)* = .NET'in "ORM" aracı. ORM (Object-Relational
> Mapping), C# sınıflarını (entity) otomatik olarak veritabanı tablolarına eşler; SQL'i çoğunlukla
> sizin yerinize yazar. *Migration* = veritabanı şemasındaki (tablo/kolon) değişikliklerin
> sürümlenmiş kayıtları. *DbContext* = EF Core'un veritabanı oturumu; hangi sınıfın hangi tabloya
> karşılık geldiğini ve ilişkileri burada tanımlarsınız.

### İki kaynağın karşılaştırması (kod ↔ canlı veritabanı)
- **Koddan:** Entity sınıfları `apps/api/Yukle.Api/Models/*.cs`, eşleme/ilişki ayarları
  `apps/api/Yukle.Api/Data/YukleDbContext.cs`, şema geçmişi `apps/api/Yukle.Api/Migrations/`.
- **Canlı veritabanından (salt-okunur):** `information_schema` ve PostGIS sistem tabloları sorgulandı.
- **Sonuç:** Kod ile canlı şema **birebir tutarlı**. `YukleDbContext` içindeki 17 `DbSet<>`
  (her biri bir tablo) canlı veritabanındaki 17 uygulama tablosuyla eşleşiyor. Migration geçmişi
  tablosu (`__EFMigrationsHistory`) **24 migration** uygulanmış olduğunu gösteriyor.

### Veritabanındaki tablolar (canlı satır sayılarıyla)
Aşağıdaki satır sayıları, sorgu anındaki (demo verisi yüklü) gerçek değerlerdir.

| Tablo | Satır | Ne tutar |
|---|---:|---|
| **Users** | 14 | Tüm kullanıcılar (müşteri+şoför+admin, tek tabloda) |
| **Loads** | 18 | Yük ilanları |
| **Vehicles** | 0 | Şoför araçları (demo veride henüz boş) |
| **Bids** | 15 | Şoförlerin yüklere verdiği teklifler |
| **DriverListings** | 4 | Şoförlerin "boş araç" ilanları |
| **ListingOffers** | 1 | Müşterilerin boş araç ilanına verdiği yük teklifleri |
| **PaymentTransactions** | 16 | Emanet (escrow) ödeme kayıtları |
| **WalletAuditLogs** | 77 | Cüzdan hareketlerinin değişmez (immutable) defteri |
| **Notifications** | 44 | Kullanıcı bildirimleri |
| **ChatMessages** | 2 | Yük bazlı sohbet mesajları |
| **Ratings** | 6 | Karşılıklı puanlamalar |
| **DeliveryAddresses** | 2 | Müşteri teslimat adres defteri |
| **SupportTickets** | 11 | Destek talepleri (başlık) |
| **SupportMessages** | 26 | Destek talebi mesajları |
| **AdminActionLogs** | 17 | Admin işlem kayıtları (denetim izi) |
| **FuelPrices** | 162 | İl bazlı yakıt fiyatları (arka plan işiyle güncellenir) |
| **UetdsOutboxes** | 1 | Bakanlık (U-ETDS) bildirim kuyruğu (outbox deseni) |
| `__EFMigrationsHistory` | 24 | (Sistem) Uygulanmış migration listesi |
| `spatial_ref_sys` | 8500 | (Sistem) PostGIS koordinat sistemi referansları |

> Ayrıca `geometry_columns` ve `geography_columns` PostGIS **görünümleridir** (view, gerçek tablo
> değil). Toplamda **17 uygulama tablosu** vardır.

### Tabloların tek tek açıklaması

#### Users — en kritik tablo (3 rol tek tabloda)
**Ne işe yarar:** Müşteri, şoför ve admin **aynı tabloda** tutulur. Kodda `apps/api/Yukle.Api/Models/User.cs`.
**Rol ayrımı:** `Role` kolonu, `UserRole` enum'ı (sayısal: 0=Customer, 1=Driver, 2=Admin) ile yapılır.
Yani "müşteri tablosu / şoför tablosu" diye ayrı tablo yoktur; tek tablo + rol kolonu.

**Önemli kolonlar:**
- Kimlik/güvenlik: `Id` (otomatik artan tam sayı), `FullName`, `Phone`, `Email`, `PasswordHash`
  (bcrypt ile hash'lenmiş, `bytea`/ikili), `PasswordSalt`.
- **KVKK (Kişisel Verilerin Korunması Kanunu) şifrelemesi:** `FullName`, `Phone`, `TaxNumberOrTCKN`
  kolonları veritabanına **AES-256 ile şifreli** yazılır, okunurken çözülür. Bu, `YukleDbContext`
  içindeki `ValueConverter`'larla otomatik yapılır (bkz. `Data/YukleDbContext.cs`). Telefon
  benzersizliği, "deterministik şifreleme" sayesinde şifreli değerde de korunur.
- Doğrulama: `IsPhoneVerified`, `VerificationCode`, `VerificationCodeExpiry` (SMS OTP — tek
  kullanımlık doğrulama kodu).
- **Ban/askıya alma mantığı:** `IsActive` (bool). Bu alan **iki amaca** hizmet eder:
  1. Şoförler için: belgeler yapay zekâ ile onaylanana kadar `false`; onaylanınca `true`.
  2. Admin tarafından "askıya alma (suspend)": admin `IsActive=false` yapar (`ApprovalStatus`'a
     dokunmaz). Bu ikisini `ApprovalStatus` kolonu ayırır (aşağıda).
- **Onay durumu:** `ApprovalStatus` enum'ı (`ApprovalStatus`): `Pending`, `Approved`, `Rejected`,
  `Active`, `ManualApprovalRequired`, `PendingReview`. Bu, **şoför belge denetiminin** yaşam döngüsüdür.
  Müşteriler kayıt+OTP sonrası doğrudan `Active`/`IsActive=true` olur; şoförler belge onayı bekler.
- Mali: `IsCorporate` (kurumsal mı bireysel mi — komisyon/stopaj farkı), `WalletBalance`
  (kullanılabilir bakiye), `PendingBalance` (emanette bloke bakiye), `BankIban`, `SubMerchantKey`
  (İyzico alt-üye anahtarı — entegrasyon iskeleti).
- Şoför belgeleri: `IsDriverLicenseApproved`, `IsSrcApproved`, `IsPsychotechnicalApproved` (üç
  zorunlu belge), ve geçerlilik tarihleri `DriverLicenseExpiry`, `SrcExpiry`, `PsychotechnicalExpiry`,
  ayrıca `LicenseClasses` (ehliyet sınıfları, ör. "B,C,CE").
- Yapay zekâ denetim izi: `LastValidationMessage`, `AdminReviewNote`, `AiInferenceDetails` (Gemini'nin
  kararsız kaldığı durumların JSON detayı).
- Oturum: `RefreshToken`, `RefreshTokenExpiryTime` (uzun ömürlü "yenileme jetonu" — düz metin
  saklanır çünkü şifre değildir; her yenilemede döndürülür/rotation).
- Push bildirim: `FcmToken` (Firebase Cloud Messaging cihaz jetonu).
- Konum/puan: `LastKnownLatitude/Longitude/LastLocationUpdate` (şoför canlı konumu),
  `AverageRating`, `TotalRatingCount` (önbelleğe alınmış puan özetleri).

#### Loads — yük ilanları
**Kodda:** `Models/Load.cs`. Müşterinin açtığı taşıma talebi.
**Önemli kolonlar:** rota (`FromCity/FromDistrict/ToCity/ToDistrict`), coğrafi noktalar
(`Origin`, `Destination` = `geometry(Point,4326)`), `Description`, `Weight` (ağırlık), `Volume`
(hacim), `Type` (yük tipi enum), `RequiredVehicleType` (istenen araç tipi), `PickupDate`/`DeliveryDate`,
`Price` (fiyat), `Currency` (varsayılan "TRY"). **Yapay zekâ fiyat analizi:** `AiSuggestedPrice`,
`AiMinPrice`, `AiMaxPrice`, `AiPriceReasoning` (Gemini'nin önerdiği "adil navlun" aralığı).
**Durum:** `Status` (`LoadStatus`: Active→Assigned→OnWay→Arrived→Delivered, ayrıca Cancelled).
**İlişkiler:** `UserId` (sahip müşteri, silinince yük de silinir/Cascade), `DriverId` (atanan şoför,
opsiyonel, kısıtlı silme/Restrict), `VehicleId` (opsiyonel, silinince null olur/SetNull).
İptal alanları: `CancelledAt`, `CancellationReason`, `CancelledBy`.

#### Vehicles — şoför araçları
**Kodda:** `Models/Vehicle.cs`. `Plate` (plaka, benzersiz), `Type` (araç tipi), `Capacity`
(kapasite/ton), `IsActive`, `LastMaintenanceDate`. `DriverId` → Users (Cascade). (Demo veride 0 satır.)

#### Bids — şoför teklifleri (klasik akış)
**Kodda:** `Models/Bid.cs`. Şoförün bir yüke verdiği fiyat teklifi. `LoadId`→Loads (Cascade),
`DriverId`→Users (Restrict), `Amount` (tutar), `Status` (`BidStatus`: Pending/Accepted/Rejected/Cancelled),
`Note`, `CloseReason`. **İş kuralı:** Bir yüke aynı şoför yalnızca bir teklif verebilir.

#### DriverListings — boş araç ilanları (ters akış)
**Kodda:** `Models/DriverListing.cs`. Şoförün "şu güzergâhta boş aracım var" ilanı. Kalkış/varış
şehir+ilçe+koordinat (`Origin`/`Destination`), `AvailableFrom` (müsaitlik), `VehicleType`,
`CapacityNote`, `Notes`, `Status` (`DriverListingStatus`: Active/Matched/Cancelled/Expired).
`DriverId`→Users (Cascade).

#### ListingOffers — boş araca verilen yük teklifleri
**Kodda:** `Models/ListingOffer.cs`. Müşterinin, bir şoför boş-araç ilanına **kendi yükünü** teklif
etmesi. `DriverListingId`→DriverListings (Cascade), `LoadId`→Loads (Restrict), `CustomerId`→Users
(Restrict), `Amount` (opsiyonel; boşsa yükün fiyatı kullanılır), `Note`, `Status`
(`ListingOfferStatus`: Pending/Accepted/Rejected/Withdrawn). Şoför kabul edince **klasik akıştaki
aynı atama+escrow** devreye girer.

#### PaymentTransactions — emanet ödeme kayıtları
**Kodda:** `Models/PaymentTransaction.cs`. Her yük için emanet işlemi. `LoadId`→Loads (Restrict —
yük silinse bile ödeme kaydı kalır), `TransactionId` (mock İyzico referansı), `Amount`,
`Status` (`PaymentStatus`: Pending/Blocked/Released/Refunded/Failed), `CreatedAt`/`UpdatedAt`.

#### WalletAuditLogs — cüzdan defteri (immutable ledger)
**Kodda:** `Models/WalletAuditLog.cs`. Her para hareketi tek tek, **silinmeden** kaydedilir
(muhasebe defteri mantığı). `UserId`, `LoadId`, `Amount`, `Type` (`WalletAuditLogType`: Hold,
Release, Commission, CustomerCommission, Tax, Refund vb.), `BalanceBefore`/`BalanceAfter` (işlem
öncesi/sonrası bakiye), `Reason`. Müşteri iade tekilliği için özel benzersiz index var.

#### Notifications — bildirimler
**Kodda:** `Models/Notification.cs`. `UserId`→Users (Cascade), `Title`, `Message`, `IsRead`,
`Type` (`NotificationType`), `RelatedEntityId` (ilgili yük/teklif kimliği). `(UserId, IsRead)`
bileşik index ile okunmamışlar hızlı getirilir.

#### ChatMessages — yük bazlı sohbet
**Kodda:** `Models/ChatMessage.cs`. Müşteri-şoför mesajlaşması. `LoadId`, `SenderUserId`,
`SenderName`, `SenderRole`, `Message`, ve **moderasyon** alanları: `IsBlocked`, `BlockReason`,
`BlockedAt` (uygunsuz mesaj otomatik engellenebilir). **Not:** Bu tabloda veritabanı seviyesinde
yabancı anahtar (foreign key) **tanımlı değil** (LoadId/SenderUserId kısıtsız) — ilişki yalnızca
uygulama mantığında. (Bkz. BELİRSİZ-3.)

#### Ratings — karşılıklı puanlama
**Kodda:** `Models/Rating.cs`. `LoadId`→Loads (Cascade), `GivenByUserId`/`GivenToUserId`→Users
(Restrict), `Score` (puan), `Comment`, `RaterRole` (puanlayanın rolü). `(LoadId, GivenByUserId)`
benzersiz → aynı iş için bir kişi bir kez puan verir.

#### DeliveryAddresses — müşteri adres defteri
**Kodda:** `Models/DeliveryAddress.cs`. `UserId`→Users (Cascade), başlık/firma/kişi/telefon/adres/
şehir/ilçe, opsiyonel koordinat, `IsDefault` (varsayılan adres).

#### SupportTickets / SupportMessages — destek sistemi
**Kodda:** `Models/SupportTicket.cs`, `Models/SupportMessage.cs`. Talep başlığı + mesaj dizisi
(thread). `SupportMessages.TicketId`→SupportTickets (Cascade). `Status`, `SlaDeadline`
(hizmet seviyesi/SLA son tarihi), `LastMessageAt`. **Not:** `SupportTickets.UserId` veritabanı
seviyesinde yabancı anahtar değil (Bkz. BELİRSİZ-3).

#### AdminActionLogs — admin denetim izi
**Kodda:** `Models/AdminActionLog.cs`. Adminin yaptığı her işlem (askıya alma, not, uyarı, iptal)
kaydedilir. `AdminId`→Users (Restrict), `TargetUserId`→Users (Cascade), `Action`, `Note`,
`LoadId`/`PaymentId` (opsiyonel).

#### FuelPrices — yakıt fiyatları
**Kodda:** `Models/FuelPrice.cs`. İl + yakıt tipi bazlı fiyat. Arka plan işiyle (FuelPriceUpdateWorker)
periyodik güncellenir; fiyat analizi/maliyet hesaplarında kullanılır. (Yabancı anahtarı yok — bağımsız
referans tablosu.)

#### UetdsOutboxes — Bakanlık bildirim kuyruğu (outbox deseni)
**Kodda:** `Models/UetdsOutbox.cs`. **U-ETDS (Ulaştırma Elektronik Takip ve Denetim Sistemi)** =
Ulaştırma Bakanlığı'nın yük taşıma bildirim sistemi. Teslimatlar buraya bildirilmek üzere bir
**outbox** (giden kutusu) kuyruğunda biriktirilir; arka plan işi (UetdsBackgroundWorker) tek tek
gönderir, hata olursa yeniden dener. `LoadId`→Loads (Restrict), `Payload`, `Status`, `RetryCount`.

### İlişki şeması (ASCII)
`Users` tablosu merkezdedir; neredeyse her şey kullanıcıya bağlanır.

```
                                  ┌──────────────────┐
                       ┌─────────►│      Users        │◄────────┐
                       │          │ (Customer/Driver/ │         │
                       │          │  Admin — Role ile)│         │
                       │          └──────────────────┘         │
        UserId(sahip)  │            ▲   ▲   ▲   ▲   ▲           │ DriverId
        (Cascade)      │   DriverId │   │   │   │   │ AdminId/  │ (Cascade)
                       │   (Restrict)   │   │   │   │ TargetId  │
                ┌──────┴─────┐          │   │   │   │           ┌┴──────────────┐
                │   Loads     │─────────┘   │   │   │           │ DriverListings │
                │ (yük ilanı) │ DriverId    │   │   │           │ (boş araç)     │
                └──────┬──────┘ (Restrict)  │   │   │           └───────┬────────┘
       LoadId(Cascade)│  ▲ ▲ ▲              │   │   │                   │ DriverListingId
        ┌─────────────┤  │ │ │              │   │   │                   │ (Cascade)
        ▼             ▼  │ │ │              │   │   │                   ▼
  ┌──────────┐  ┌────────┴┐│ │        ┌─────┴┐ ┌┴────────┐      ┌──────────────┐
  │   Bids    │  │ Ratings ││ │        │Delivery│ │Notifications│ │ ListingOffers│
  │(teklif)   │  │(puan)   ││ │        │Addresses│└─────────────┘ │(yük teklifi) │
  └──────────┘  └─────────┘│ │        └────────┘                 └──────┬───────┘
                           │ │                       CustomerId/LoadId →─┘
        ┌──────────────────┘ │                       (Restrict)
        ▼                    ▼
 ┌──────────────────┐  ┌──────────────┐
 │PaymentTransactions│  │WalletAuditLogs│   (LoadId/UserId ile bağlı, defter)
 │ (emanet)          │  │ (cüzdan defteri)
 └──────────────────┘  └──────────────┘

 Bağımsız / zayıf bağlı: FuelPrices (FK yok), UetdsOutboxes (LoadId→Loads),
 SupportTickets+SupportMessages (Ticket→Message Cascade; Ticket.UserId DB-FK YOK),
 ChatMessages (DB-FK YOK — uygulama mantığında LoadId'ye bağlı),
 AdminActionLogs (AdminId Restrict, TargetUserId Cascade).
```

**Silme davranışı kuralları (kodda `YukleDbContext.cs`):**
- *Cascade* = ana kayıt silinince bağlı kayıtlar da silinir (ör. müşteri silinince yükleri).
- *Restrict* = bağlı kayıt varsa silmeye izin verilmez (ör. teklifi olan şoför kolayca silinemez).
- *SetNull* = ana kayıt silinince yabancı anahtar boşaltılır (ör. araç silinince Load.VehicleId=null).
- Çoklu cascade çakışmasını önlemek için ListingOffers'ın müşteri/yük bağları **Restrict**'tir.

---

## 2. BACKEND (.NET 9 API)

### Mimari katmanlar
- **Controller** (`apps/api/Yukle.Api/Controllers/*.cs`): HTTP uç noktalarını (endpoint) tanımlar.
  Gelen isteği alır, yetkiyi kontrol eder, ilgili Service'i çağırır, sonucu döner.
- **Service** (`Services/*.cs`): Asıl iş mantığı. Controller "ince", Service "kalın" tutulur.
- **Model/Entity** (`Models/*.cs`): Veritabanı tabloları.
- **DTO (Data Transfer Object)** (`DTOs/*.cs`): API'nin dışarı verdiği/aldığı veri biçimleri
  (entity'nin tamamını değil, gerekli alanları taşır).
- **BackgroundServices** (`BackgroundServices/*.cs`): Arka planda sürekli/periyodik çalışan işler.

### Controller ve endpoint envanteri (19 controller, 107 uç nokta)
Her controller'ın başında `[Authorize]` (giriş şart) veya `[Authorize(Roles="...")]` (belirli rol
şart) ya da `[AllowAnonymous]` (girişsiz) olabilir. Tam endpoint tablosu için **Bölüm 6**'ya bakın.
Aşağıda her controller'ın özeti:

- **AuthController** (`Controllers/AuthController.cs`, controller-seviyesi yetki yok, uç bazında):
  kayıt, giriş, Google ile giriş, OTP doğrulama/yeniden gönderme, şifre sıfırlama/değiştirme,
  jeton yenileme, şoför belge yükleme. (10 uç)
- **AdminController** (`[Authorize(Roles="Admin")]`): dashboard, kullanıcı/şoför/müşteri listeleme,
  askıya alma/aktifleştirme, not/uyarı, yük ve boş-araç ilanı moderasyonu, ödeme serbest bırakma,
  loglar, sistem durumu, sohbet/engellenen mesaj izleme, belge onay kararı. (28 uç)
- **LoadsController** (`[Authorize]`): yük oluşturma, listeleme, detay, güncelleme, iptal, teslim
  alma (pickup), teslim etme (deliver) — QR + GPS doğrulamalı, teslimat QR üretme, geçmiş. (10 uç)
- **BidsController** (`[Authorize]`): teklif ver, yüke gelen teklifler, şoförün teklifleri, iptal,
  kabul (yükü şoföre atar + emanet kurar). (5 uç)
- **DriverListingController** (`[Authorize]`): boş araç ilanı oluştur/listele/detay/iptal; müşteri
  teklifi ver/listele/geri çek; şoför teklifi kabul/reddet. (11 uç)
- **AiController** (`[Authorize]`): belge OCR (görüntüden metin okuma), fiyat önerisi, ve bunların
  kuyruğa alma (enqueue) sürümleri (uzun süren AI işleri için). (5 uç)
- **MatchingController** (`[Authorize(Policy="RequireActiveDriver")]`): şoföre AI destekli yük
  önerileri ve belirli bir yük için uyumluluk analizi. (2 uç)
- **PaymentsController** (`[Authorize]`): yüke ait emanet bilgisi, kullanıcının ödemeleri, admin
  gelir özeti. (3 uç)
- **WalletController** (`[Authorize]`): cüzdan özeti, işlem geçmişi (şoför kazançları). (3 uç)
- **SettlementController** (`[Authorize]`): bir tutar için komisyon dökümü önizlemesi. (1 uç)
- **RatingsController** (`[Authorize]`): puan ver, kullanıcının puanları, admin tüm puanlar/silme. (4 uç)
- **SupportController** (`[Authorize]`): destek talebi oluştur (AI yanıtlı), mesaj ekle, insana
  yükselt (escalate), durum güncelle (admin), taleplerim/tümü/açık-sayısı/detay. (8 uç)
- **ChatController** (`[Authorize]`): yüke ait sohbet mesajları. (1 uç)
- **NotificationsController** (`[Authorize]`): bildirimler, okunmamış sayısı, oku/tümünü-oku. (4 uç)
- **LocationController** (`[Authorize]`): şoför konum güncelleme, yüke atanan şoförün konumunu görme. (2 uç)
- **DeliveryAddressesController** (`[Authorize(Roles="Customer")]`): adres CRUD + varsayılan yapma. (5 uç)
- **DashboardController** (`[Authorize]`): role göre özet panel verisi. (1 uç)
- **UsersController** (`[Authorize]`): profil görüntüle/güncelle, FCM jetonu kaydet. (3 uç)
- **SystemController** (yetki yok / `[AllowAnonymous]`): API sürümü/sağlık durumu. (1 uç)

### Kimlik doğrulama akışı (authentication)
**Nedir/neden:** Kullanıcının kim olduğunu doğrulamak ve sonraki isteklerde "ben oyum" diyebilmesi
için **JWT (JSON Web Token — imzalı, içinde kimlik bilgileri taşıyan jeton)** kullanılır.
**Kodda:** `Services/AuthService.cs`, `Services/TokenService.cs`, `Controllers/AuthController.cs`.

**Kayıt (register):**
1. SMS hız sınırı (rate limit) uygulanır: dakikada en çok 3 SMS, aşılırsa 15 dakika kara liste
   (`AuthService.EnforceSmsRateLimitAsync`).
2. Şifre **bcrypt** ile hash'lenir (`BCrypt.Net.BCrypt.HashPassword`). (bcrypt = şifreleri geri
   döndürülemez biçimde saklayan yavaş/güvenli hash algoritması.)
3. 6 haneli OTP üretilir (5 dakika geçerli), SMS ile gönderilir.

**OTP doğrulama (`VerifyOtpAsync`):** 3 yanlış denemede 1 dakika kilit. Müşteri doğrulanınca
`IsActive=true`; şoför `IsActive=false` kalır (belge onayı şart).

**Giriş (login — `LoginAsync`):**
1. Kullanıcı **telefon VEYA e-posta** ile bulunur (çift mod). Mobil/web kullanıcılar telefonla,
   admin e-posta ile girer; aynı alan ("phone") her ikisini de kabul eder.
2. `BCrypt.Verify` ile şifre doğrulanır.
3. `IsPhoneVerified` kontrol edilir.
4. **Ban/askıya alma kontrolü burada yapılır:** `if (!user.IsActive && user.ApprovalStatus ==
   ApprovalStatus.Active)` → "Hesabınız askıya alınmış". Yani: belgesi onaylı olup (`ApprovalStatus=Active`)
   ama `IsActive=false` olan kullanıcı = **admin tarafından askıya alınmış** demektir, girişi engellenir.
   Onay bekleyen şoförler (Pending/PendingReview/Rejected) burada **engellenmez** — çünkü belge
   yükleyebilmek için giriş yapmaları gerekir. (`AuthService.cs` LoginAsync, ~388-396. satırlar.)
5. Başarılıysa `IssueTokensAsync` ile **access token + refresh token** ikilisi üretilir.

**Jetonlar (`TokenService.cs`):**
- **Access token (erişim jetonu):** JWT, HS512 ile imzalı. İçindeki claim'ler (iddialar):
  kullanıcı kimliği, telefon, **Role**, ad, **IsActive**, **ApprovalStatus**. Süresi koddan
  okunduğu kadarıyla **7 gün** (BELİRSİZ-1: alışılmadık uzun, doğrulanmalı). Veritabanına yazılmaz.
- **Refresh token (yenileme jetonu):** 64 baytlık rastgele dizge, veritabanında `Users.RefreshToken`'da
  saklanır, 7 gün geçerli. Her yenilemede **döndürülür (rotation)** — eski üzerine yazılır; böylece
  çalınmış bir yenileme jetonu en fazla bir kez kullanılabilir. `RefreshTokenAsync` ayrıca sabit
  zamanlı karşılaştırma (timing attack koruması) ve replay (tekrar) saldırısı koruması içerir.

**Neden access token'da IsActive/ApprovalStatus var?** `RequireActiveDriver` adlı yetki politikası
(policy), şoförün gerçekten onaylı/aktif olduğunu **jetona bakarak** kontrol eder. Bu yüzden bir
şoför belge onayı aldıktan sonra yeni bir jeton almadan (yeniden giriş veya refresh) korumalı uçlara
erişemez.

**Şoför belge doğrulama (Gemini AI — `AuthService.UploadDriverDocumentAsync`):**
3 zorunlu belge (Ehliyet, SRC, Psikoteknik) yüklenir; her biri Google Gemini'ye gönderilir; AI
OCR yapar, süresini/mührünü/okunabilirliğini değerlendirir. Sonuçlar:
- AI hata/timeout → `ManualApprovalRequired` (admin manuel baksın).
- Güven (confidence) 50–85 arası veya belirsizlik kelimeleri → `PendingReview` (gri alan, admin kuyruğu).
- OCR'daki ad/TCKN, kullanıcı kaydıyla uyuşmuyor → `Rejected` (Türkçe karakter duyarlı normalize ile
  karşılaştırılır: İ→I, Ç→C vb.).
- Belge süresi geçmiş → `Rejected`.
- 3 belge de onaylı → `ApprovalStatus=Active`, `IsActive=true`.

### Önemli Service sınıfları
- **AuthService** — kayıt/giriş/OTP/şifre/belge onayı (yukarıda).
- **TokenService** — JWT üretimi + refresh rotation.
- **BidService** (`Services/BidService.cs`) — teklif verme/kabul; **kabulde yükü şoföre atar +
  emanet kurar** (`AcceptBidAsync`).
- **DriverListingService** — boş araç ilanı CRUD + teklif/kabul/red + admin moderasyon metotları.
- **LoadService / LoadEditService** — yük oluşturma/güncelleme.
- **MockPaymentService / WalletLedgerService / WalletSettlementCalculator** — emanet + komisyon
  (aşağıda).
- **CancellationService** — yük iptali + iade kuralları (`LoadCancellationRules`).
- **NotificationService** — veritabanı bildirimi + SignalR canlı itme + FCM push üçlüsü.
- **GeminiServiceClient / AiPricingService / FreightPricingEngine** — yapay zekâ fiyat/eşleştirme/OCR.
- **EncryptionService** — KVKK AES-256 şifreleme (FullName/Phone/TCKN).
- **ChatModerationService** — sohbet mesajı moderasyonu (uygunsuz içerik engelleme).

### Escrow (emanet) / ödeme mantığı — adım adım
**Nedir/neden:** Müşteri parayı doğrudan şoföre vermez; iş bitene kadar platformda **bloke** edilir
(emanet). İş bitince serbest bırakılır, iptal olursa iade edilir. Şu an gerçek banka çekimi yok —
**mock** (taklit) servis çalışır ama defter (ledger) kayıtları gerçektir.
**Kodda:** `Services/MockPaymentService.cs`, `Services/WalletLedgerService.cs`,
`Services/WalletSettlementCalculator.cs`.

Üç ana işlem:
1. **HoldPaymentAsync (bloke):** Teklif kabul edilince çağrılır. Önce yük şoföre atanmış olmalıdır
   (escrow, atanmış `DriverId`'yi okur). Müşteri toplamı bir `PaymentTransaction(Status=Blocked)`
   olarak kaydedilir; şoförün `PendingBalance`'ı artırılır; her parça (hold, komisyonlar, stopaj)
   `WalletAuditLogs`'a yazılır.
2. **ReleasePaymentAsync (serbest bırakma):** Yük teslim edilince. `PendingBalance` → `WalletBalance`'a
   aktarılır; `PaymentTransaction.Status=Released`.
3. **RefundEscrowAsync (iade):** Müşteri iptal edince. Satır kilidi (row lock) alınır (yarış koşulu
   önlemi), iade tutarı = `(bloke tutar × iade yüzdesi) − iptal ücreti`; müşteri `WalletBalance`'ına
   yatar; `PaymentTransaction.Status=Refunded`.

**Komisyon/settlement hesabı (`WalletSettlementCalculator.Calculate`):** Oranlar appsettings'ten
(`CommissionSettlementOptions`) okunur. Varsayılanlar: **şoför komisyonu %2, müşteri komisyonu %2,
stopaj (bireysel) %0** (BELİRSİZ-2: gerçek appsettings değerleri farklı olabilir).

**Sayısal örnek — 10.000 TL teklif (bireysel şoför):**
```
Teklif (BidAmount)        = 10.000 TL
Şoför komisyonu (%2)      =    200 TL   (platforma)
Müşteri komisyonu (%2)    =    200 TL   (platforma)
Stopaj (bireysel %0)      =      0 TL
─────────────────────────────────────
Şoför net (DriverNet)     =  9.800 TL   → önce PendingBalance'a bloke, teslimde WalletBalance'a
Müşteri toplam (Customer) = 10.200 TL   → PaymentTransaction.Amount (Blocked) olarak çekilir
Platform geliri           =    400 TL   (200 + 200)
```
Kurumsal şoför (`IsCorporate=true`) ve stopaj kurumsala uygulanıyorsa (`StopajAppliesToCorporate=true`),
şoför netinden ayrıca stopaj düşülür.

### Yük–şoför eşleştirme (matching)
**Nedir/neden:** Şoföre "sana en uygun yükler" listesini akıllıca sunmak.
**Kodda:** `Controllers/MatchingController.cs` (+ Gemini istemcisi).
**Nasıl:**
1. Şoför profili (araç tipi/kapasitesi) + son ~10 başarılı teslimatı (geçmiş rota tercihleri) toplanır.
2. Aktif yük havuzundan adaylar alınır.
3. Her aday için **mesafe** hesaplanır: önce **OSRM** (gerçek yol mesafesi) denenir; başarısızsa
   **Haversine** formülü (iki coğrafi nokta arası kuş uçuşu mesafe, Dünya yarıçapı 6371 km) ile fallback.
4. Bu bağlam (şoför + adaylar + mesafe + fiyat) Google **Gemini**'ye verilir; Gemini her yük için
   **0–100 uyum puanı + gerekçe** döner.
5. Yeni şoför (geçmişi yok) ise Gemini matematiksel fallback ~70 baz puanla çalışır.
6. Sonuçlar puana göre sıralanıp döndürülür.
**Kriterler:** coğrafi yakınlık, araç tipi/kapasite uyumu, geçmiş rota benzerliği, fiyat uyumu, yük tipi.

### Ban/suspend akışı — özet
- Admin **askıya alır:** `PUT /api/admin/users/{userId}/suspend` → `IsActive=false` (ApprovalStatus
  korunur). Denetim için `AdminActionLogs`'a yazılır.
- Admin **aktifleştirir:** `PUT /api/admin/users/{userId}/activate` veya `toggle-active`.
- **Login'de kontrol:** `AuthService.LoginAsync` → `!IsActive && ApprovalStatus==Active` ise giriş
  reddedilir (yukarıda anlatıldı). Yani askıya alma anında girişte etkilidir.

### Arka plan işleri (BackgroundServices)
- **PaymentBackfillJob:** Emanet özelliği öncesi oluşmuş eski yükler için toplu emanet üretir
  (idempotent — zaten Blocked varsa atlar). Açılışta çalışır.
- **FuelPriceUpdateWorker:** İl bazlı yakıt fiyatlarını periyodik (RefreshHours) günceller →
  `FuelPrices`.
- **UetdsBackgroundWorker:** `UetdsOutboxes`'taki bekleyen Bakanlık bildirimlerini 2 dakikada bir
  gönderir, hatada 3'e kadar yeniden dener (outbox deseni).
- **GeminiQueueProcessor / GeminiTaskQueue:** Uzun süren AI işlerini (OCR, fiyat) kuyruktan işler,
  SignalR ile sonucu bildirir.
- **AdminSeederJob:** Açılışta admin + test kullanıcılarını (idempotent) oluşturur
  (`admin@navlonix.com`, `test@navlonix.com` müşteri, `sofor@navlonix.com` şoför).
- **DemoProvaSeederJob:** Jüri/demo için zengin örnek veri (teslim edilmiş yükler, escrow geçmişi,
  puanlar, **test şoföre ait 4 boş-araç ilanı**) — idempotent.
- **DocumentCleanupJob:** Eski belge dosyalarını temizler.

---

## 3. WEB (React 19 / Vite)

**Nedir/neden:** Tarayıcıda çalışan tek sayfa uygulaması (SPA — Single Page Application). Müşteri,
şoför ve admin **aynı uygulamada**, rol bazlı yönlendirme ile farklı sayfaları görür.
**Teknoloji:** React 19, Vite (hızlı geliştirme sunucusu + paketleyici), TypeScript. Geliştirme
sunucusu portu `5173`.

### Route (sayfa) yapısı — `apps/web/src/router/index.tsx`
**Public (girişsiz):** `/` (landing), `/login`, `/admin/login`, `/register`, `/forgot-password`,
`/verify-phone`, KVKK/gizlilik/kullanım sayfaları, pazarlama/özellik sayfaları, `/unauthorized`,
`/500`, `*` (404).

**Müşteri** (`/customer/*`, `allowedRoles=['Customer']`): dashboard, loads (İlanlarım),
loads/create, loads/:id, bids (Teklifler), driver-listings (Boş Araçlar), listing-offers
(Boş Araç Tekliflerim), track (Canlı Takip), history, addresses, profile, chats, support,
settings, analytics.

**Şoför** (`/driver/*`, `allowedRoles=['Driver']`): dashboard, loads (Yük Panosu), loads/:id,
documents (Belgelerim), bids (Tekliflerim), history, wallet (Cüzdan), active-load (Aktif Sefer),
listings + listings/create (Boş Araç İlanlarım), track, profile, chats, support, settings.

**Admin** (`/admin/*`, `allowedRoles=['Admin']`): dashboard, reviews (Belge Kuyruğu), drivers
(+:id), customers (+:id), loads (+:id, İlan Yönetimi), driver-listings (Boş Araç İlanları
moderasyonu), documents, chats, support, payments, users (Tüm Kullanıcılar), system, logs,
settings, tracking, ratings.

> **Rol koruması nasıl?** `ProtectedRoute` bileşeni, `allowedRoles` ile gelen rolü oturumdaki
> kullanıcı roluyle karşılaştırır; uymuyorsa `/unauthorized`'a atar.

### API çağrı katmanı — `apps/web/src/api/`
- **`client.ts`:** axios örneği. Base URL `http://localhost:5151/api`, zaman aşımı 15 saniye.
  - **Request interceptor (istek araya girici):** Her isteğe `localStorage`'daki jetonu
    `Authorization: Bearer <token>` başlığı olarak ekler.
  - **Response interceptor (yanıt araya girici):** **401 (yetkisiz)** gelince otomatik **token
    yenileme** dener (bekleyen istekleri kuyruğa alır); başarısızsa `localStorage` temizlenip
    login'e yönlendirilir. Hataları Türkçeleştirip kullanıcı dostu `uiMessage`/`uiDetails` alanlarına
    çevirir.
- **Alan bazlı istemciler:** `auth.ts`, `loads.ts`, `bids.ts`, `driverListings.ts`, `admin.ts`,
  `chat.ts`, `matching.ts`, `payments.ts`, `support.ts`, `wallet.ts`, `users.ts`, `addresses.ts`,
  `ratings.ts`, `dashboard.ts`, `notifications.ts`, `location.ts`, `ai.ts`, `types.ts`. Her biri
  backend'in bir alanını sarmalar (örn. `loads.ts` → `/Loads/*`).

### State (durum) yönetimi — `apps/web/src/store/auth.store.ts`
- **Kütüphane:** **Zustand** (basit global durum yönetimi) + `persist` ara katmanı.
- **Saklanan:** `user` (userId, fullName, role, isPhoneVerified, isActive, approvalStatus), `token`,
  `refreshToken`, `isAuthenticated`. **localStorage anahtarı:** `yükle-auth`.
- **Akış:** Login → `setAuth()` (jetonlar + kullanıcı yazılır). Her istekte interceptor jetonu ekler.
  401 → `updateTokens()`. Çıkış → `logout()` (durum sıfırlanır, localStorage temizlenir).

### Rol bazlı menü — `apps/web/src/components/layout/Sidebar.tsx`
Kullanıcının rolüne göre üç farklı menü dizisi (`CUSTOMER_NAV`, `DRIVER_NAV`, `ADMIN_NAV`).
Admin menüsünde "Destek Talepleri" yanında açık talep sayısı **rozeti** 20 saniyede bir güncellenir.
Daraltılabilir (collapsed) ve mobil-uyumlu.

---

## 4. MOBİL (Expo React Native)

**Nedir/neden:** iOS/Android (ve web) için tek kod tabanı. **Expo** = React Native'i kolaylaştıran
araç seti. **Expo Router** = dosya tabanlı yönlendirme (klasör/dosya yapısı = sayfa yapısı).
**Konum:** `apps/mobile/yukle-mobile`. Geliştirme sunucusu (Metro) portu `8081`.

### Ekran/navigasyon yapısı — `app/` klasörü
Dosya tabanlı routing; `(grupAdı)` parantezli klasörler "grup"tur (yol adına eklenmez).
```
app/
├── index.tsx        → Açılış: oturum kontrolü + role göre yönlendirme
├── welcome.tsx, onboarding.tsx
├── (auth)/          → login, admin-login, register, verify-phone, forgot-password
├── (customer)/(tabs)/ → dashboard, loads, bids, create-load, messages, addresses,
│                        history, analytics, support, profile (+ load-detail, edit-load, settings)
├── (driver)/(tabs)/   → dashboard, loads, active-load, bids, messages, wallet, documents,
│                        history, support, profile (+ load-detail, history-detail)
└── (admin)/(tabs)/    → dashboard, reviews, users, payments, system, loads, logs,
                         blocked-messages, chats, support, ratings, tracking, settings
```
- **Navigasyon biçimi:** Kök `Stack` navigator + her rol için **Drawer** (yandan açılan menü).
  Menü tanımları `src/navigation/drawerMenus.ts`; sarmalayıcı `src/components/navigation/RoleDrawerLayout.tsx`.
- **Rol yönlendirme:** `app/index.tsx` oturumdaki role göre ilgili `(customer|driver|admin)/(tabs)/dashboard`'a
  atar; her rol `_layout.tsx`'i yetkiyi tekrar kontrol eder (yanlış rol → köke geri).

### Login ve oturum akışı
- **Store:** `src/store/auth.store.ts` — Zustand + `persist`. **Saklama:** native'de **AsyncStorage**,
  web'de localStorage (`src/utils/storage.ts` → `getPersistStorage()`), anahtar `yukle-auth`.
- **API adresi:** `src/constants/api.ts` öncelik sırası: `.env` (`EXPO_PUBLIC_API_BASE_URL`) →
  `app.config.js` extra → platform fallback (web: localhost; Android emülatör: `10.0.2.2`; iOS
  simülatör: localhost). **Gerçek cihazda LAN IP zorunlu.**
- **API istemcisi:** `src/services/api.client.ts` (axios, zaman aşımı 25 sn — zayıf ağ/soğuk başlatma
  için). İstek interceptor jetonu ekler (anonim yollar hariç); 401 → otomatik çıkış.
- **Giriş ekranları:** müşteri/şoför `app/(auth)/login.tsx` (telefon+şifre), admin
  `app/(auth)/admin-login.tsx` (e-posta+şifre; giriş sonrası rol Admin değilse reddeder).

### Müşteri / şoför / admin mobil deneyim farkları
- **Müşteri'ye özel:** create-load (ilan oluştur), analytics, addresses (adres defteri).
- **Şoför'e özel:** active-load (canlı sefer + konum paylaşımı), wallet (kazanç), documents
  (belge yükleme/onay).
- **Admin'e özel:** reviews (belge kuyruğu), system, blocked-messages, tracking, ratings.
- **Görsel rol markalaması:** `src/theme/roleAccent.ts` ile her rol farklı vurgu rengi
  (müşteri/şoför/admin) + arka plan ışık efekti.

> **Web admin vs mobil admin:** Her iki uygulamada da admin paneli vardır ve büyük ölçüde aynı
> backend uçlarını kullanır. Mobil admin sekmeleri (komuta merkezi, belge kuyruğu, kullanıcılar,
> ödemeler, sistem, ilanlar, loglar, engellenen mesajlar, sohbetler, destek, puanlar, takip, ayarlar)
> web admin sayfalarıyla paraleldir. (Birebir özellik eşitliği BELİRSİZ — ekran sayıları yakın ama
> her detayın iki platformda aynı olduğu doğrulanmadı; Bkz. BELİRSİZ-4.)

---

## 5. ROL BAZLI AKIŞLAR

### MÜŞTERİ — uçtan uca
1. **Kayıt/Giriş:** Telefon + şifre ile kayıt → SMS OTP doğrulama → `IsActive=true`.
   Uçlar: `POST /api/auth/register`, `/verify-otp`, `/login`. Tablo: `Users`.
2. **Yük oluşturma:** "İlan Oluştur" → kalkış/varış (haritadan pin), ağırlık/hacim/araç tipi/tarih/fiyat.
   Sistem **AI fiyat önerisi** (adil navlun) sunar. Uç: `POST /api/loads` (+ `POST /api/ai/price-suggestion`).
   Tablo: `Loads` (Status=Active).
3. **Teklif toplama / eşleşme (iki yol):**
   - **Klasik:** Şoförler teklif verir; müşteri "Teklifler" sayfasında görür, **kabul eder** →
     yük şoföre atanır + **emanet bloke** edilir. Uçlar: `GET /api/bids/load/{loadId}`,
     `POST /api/bids/{id}/accept`. Tablolar: `Bids`, `Loads`, `PaymentTransactions`, `WalletAuditLogs`.
   - **Ters:** Müşteri "Boş Araçlar"da bir şoför ilanına **kendi yükünü teklif eder**; şoför kabul
     ederse aynı atama+escrow çalışır. Uçlar: `POST /api/driverlisting/{id}/offers`,
     (şoför) `POST /api/driverlisting/offers/{offerId}/accept`. Tablolar: `ListingOffers`, `Loads`.
4. **Takip:** Atanan şoförün canlı konumunu haritada izler. Uç: `GET /api/location/driver/{loadId}`.
   Tablo: `Users` (LastKnownLatitude/Longitude). Gerçek zamanlı: SignalR.
5. **Teslim & ödeme:** Şoför teslim edince emanet serbest bırakılır; müşteri puan verir.
   Uçlar: `GET /api/payments/load/{loadId}`, `POST /api/ratings/submit`. Tablolar:
   `PaymentTransactions`, `Ratings`.

### ŞOFÖR — uçtan uca
1. **Giriş + belge onayı:** Telefon+şifre ile giriş yapar (belgesiz de girer). **Belgelerim**'den
   Ehliyet/SRC/Psikoteknik yükler → Gemini AI denetler → onaylanınca `ApprovalStatus=Active`,
   `IsActive=true`. Uç: `POST /api/auth/upload-document`. Tablo: `Users`.
2. **Yük arama / öneri:** "Yük Panosu"nda aktif yükleri görür; AI önerileri "sana uygun" sıralı gelir.
   Uçlar: `GET /api/loads/active`, `GET /api/matching/recommended`. Tablolar: `Loads`, (AI) `FuelPrices`.
3. **Teklif verme:** Bir yüke fiyat teklifi verir (yalnızca onaylı/aktif şoför). Uç:
   `POST /api/bids/submit` (policy: RequireActiveDriver). Tablo: `Bids`.
4. **Kabul edilince:** Yük kendisine atanır; emanet kurulur; "Aktif Sefer" ekranı açılır.
5. **Teslim alma → yolda → teslim etme:** `pickup` (OnWay), canlı konum güncelleme, **teslim**
   QR kodu + GPS doğrulamasıyla. Uçlar: `POST /api/loads/{id}/pickup`, `POST /api/location/update`,
   `POST /api/loads/{id}/deliver`. Tablolar: `Loads`, `Users` (konum).
6. **Kazanç:** Teslim sonrası emanet serbest bırakılır → `WalletBalance`. "Cüzdanım"da görür.
   Uçlar: `GET /api/wallet`, `GET /api/wallet/transactions`. Tablolar: `WalletAuditLogs`,
   `PaymentTransactions`.
7. **Boş araç ilanı:** Kendi güzergâhı için ilan açar; müşteri tekliflerini kabul/reddeder. Uçlar:
   `POST /api/driverlisting`, `GET /api/driverlisting/{id}/offers`,
   `POST /api/driverlisting/offers/{offerId}/accept`. Tablolar: `DriverListings`, `ListingOffers`.

### ADMIN — uçtan uca
1. **Panel girişi:** E-posta + şifre (`admin@navlonix.com`). Web: `/admin/login`; mobil: admin-login.
   Uç: `POST /api/auth/login`. (Admin için ban kontrolü de aynı login mantığında.)
2. **Belge onayı:** "Belge Kuyruğu"nda bekleyen şoför belgelerini inceler, onay/ret kararı verir.
   Uçlar: `GET /api/admin/pending-reviews`, `GET /api/admin/review-documents/{userId}`,
   `POST /api/admin/reviews/{userId}/decide`. Tablo: `Users`.
3. **Kullanıcı yönetimi:** "Tüm Kullanıcılar" (rol segment filtreli), askıya alma/aktifleştirme,
   not ekleme, uyarı. Uçlar: `GET /api/admin/users`, `PUT /api/admin/users/{id}/suspend|activate`,
   `POST /api/admin/users/{id}/note|warn`. Tablolar: `Users`, `AdminActionLogs`.
4. **İçerik moderasyonu:** Yük iptali (`POST /api/admin/loads/{id}/cancel`), boş-araç ilanı kaldırma
   (`POST /api/admin/driver-listings/{id}/cancel` — yalnız Active, bekleyen teklifleri reddeder),
   engellenen sohbet mesajları. Tablolar: `Loads`, `DriverListings`, `ListingOffers`, `ChatMessages`.
5. **Ödeme/izleme:** Ödemeleri görür/serbest bırakır, canlı seferleri haritada izler, logları okur.
   Uçlar: `GET /api/admin/payments`, `POST /api/admin/payments/{id}/release`,
   `GET /api/admin/active-drivers`, `GET /api/admin/logs`. Tablolar: `PaymentTransactions`,
   `WalletAuditLogs`, `Users`, `AdminActionLogs`.

---

## 6. ÖZET TABLOLAR

### 6.1 Tüm endpoint'ler (107 uç / 19 controller)

> Kısaltma yok: GET=oku, POST=oluştur/işlet, PUT=tam güncelle, PATCH=kısmi güncelle, DELETE=sil.
> "Anon" = girişsiz (AllowAnonymous). "Auth" = giriş yeterli. Aksi belirtilmedikçe controller-seviyesi
> yetki geçerlidir.

**AuthController** — `/api/auth` (uç bazında yetki)
| Metod | Route | Rol | Açıklama |
|---|---|---|---|
| POST | /api/auth/register | Anon | Kayıt (telefon+şifre), OTP gönderir |
| POST | /api/auth/login | Anon | Giriş; JWT + refresh üretir |
| POST | /api/auth/google | Anon | Google ile giriş |
| POST | /api/auth/verify-otp | Anon | SMS OTP doğrulama |
| POST | /api/auth/resend-otp | Anon | OTP yeniden gönder |
| POST | /api/auth/forgot-password | Anon | Şifre sıfırlama OTP'si |
| POST | /api/auth/reset-password | Anon | Yeni şifre belirle |
| POST | /api/auth/change-password | Auth | Şifre değiştir |
| POST | /api/auth/refresh-token | Anon | Jeton yenile (rotation) |
| POST | /api/auth/upload-document | Driver | Şoför belge yükle (AI denetimi) |

**AdminController** — `/api/admin` (Roles=Admin)
| Metod | Route | Açıklama |
|---|---|---|
| GET | /api/admin/dashboard | Panel istatistik özeti |
| GET | /api/admin/pending-reviews | Belge onay kuyruğu |
| GET | /api/admin/review-documents/{userId} | Şoför belgesini getir |
| GET | /api/admin/drivers | Şoför listesi |
| GET | /api/admin/customers | Müşteri listesi |
| POST | /api/admin/users/{userId}/toggle-active | Aktif/pasif değiştir |
| GET | /api/admin/loads | Yük listesi (filtreli) |
| POST | /api/admin/loads/{loadId}/cancel | Yük iptal |
| GET | /api/admin/driver-listings | Boş araç ilanları (filtreli) |
| GET | /api/admin/driver-listings/{id}/offers | İlana gelen teklifler |
| POST | /api/admin/driver-listings/{id}/cancel | İlanı kaldır (Active) |
| GET | /api/admin/payments | Ödeme listesi |
| POST | /api/admin/payments/{paymentId}/release | Emaneti serbest bırak |
| GET | /api/admin/logs | İşlem kayıtları |
| GET | /api/admin/system | Sistem sağlık durumu |
| GET | /api/admin/blocked-messages | Engellenen mesajlar |
| GET | /api/admin/stats | Günlük istatistik |
| GET | /api/admin/users | Tüm kullanıcılar |
| PUT | /api/admin/users/{userId}/suspend | Askıya al |
| PUT | /api/admin/users/{userId}/activate | Aktifleştir |
| GET | /api/admin/chats | Sohbet özetleri |
| GET | /api/admin/chats/{loadId} | Bir yükün sohbeti |
| GET | /api/admin/active-drivers | Aktif şoförler (konumlu) |
| POST | /api/admin/users/{id}/note | Kullanıcıya not |
| POST | /api/admin/users/{id}/warn | Kullanıcıya uyarı |
| GET | /api/admin/drivers/{id}/stats | Şoför istatistiği |
| GET | /api/admin/customers/{id}/stats | Müşteri istatistiği |
| POST | /api/admin/reviews/{userId}/decide | Belge onay/ret kararı |

**LoadsController** — `/api/loads` (Auth)
| Metod | Route | Rol | Açıklama |
|---|---|---|---|
| POST | /api/loads | Customer | Yük oluştur (+AI fiyat) |
| GET | /api/loads/active | Customer,Driver,Admin | Aktif yükler |
| GET | /api/loads/{id} | Customer,Driver,Admin | Yük detayı |
| POST | /api/loads/{id}/cancel | Customer,Admin | Yük iptal |
| PUT | /api/loads/{id} | Customer | Yük güncelle |
| POST | /api/loads/{id}/pickup | RequireActiveDriver | Yükü teslim al (OnWay) |
| GET | /api/loads/{id}/delivery-qr | Customer,Admin | Teslim QR (15 dk) |
| POST | /api/loads/{id}/deliver | RequireActiveDriver | Teslim et (QR+GPS) |
| GET | /api/loads/history | Customer | Müşteri teslim geçmişi |
| GET | /api/loads/driver-history | Driver | Şoför teslim geçmişi |

**BidsController** — `/api/bids` (Auth)
| Metod | Route | Rol | Açıklama |
|---|---|---|---|
| POST | /api/bids/submit | RequireActiveDriver | Teklif ver |
| GET | /api/bids/load/{loadId} | Customer,Admin | Yüke gelen teklifler |
| GET | /api/bids/driver | Driver | Şoförün teklifleri |
| POST | /api/bids/{id}/cancel | Driver | Teklif geri çek |
| POST | /api/bids/{id}/accept | Customer | Teklif kabul (atama+escrow) |

**DriverListingController** — `/api/driverlisting` (Auth)
| Metod | Route | Rol | Açıklama |
|---|---|---|---|
| POST | /api/driverlisting | RequireActiveDriver | Boş araç ilanı aç |
| GET | /api/driverlisting | Customer,Driver,Admin | Yayında ilanlar |
| GET | /api/driverlisting/mine | Driver | Şoförün ilanları |
| GET | /api/driverlisting/{id} | Customer,Driver,Admin | İlan detayı |
| POST | /api/driverlisting/{id}/cancel | Driver | İlanı iptal et |
| POST | /api/driverlisting/{id}/offers | Customer | Yük teklif et |
| GET | /api/driverlisting/{id}/offers | Driver | İlana gelen teklifler |
| GET | /api/driverlisting/offers/mine | Customer | Müşterinin teklifleri |
| POST | /api/driverlisting/offers/{offerId}/accept | Driver | Teklifi kabul et |
| POST | /api/driverlisting/offers/{offerId}/reject | Driver | Teklifi reddet |
| POST | /api/driverlisting/offers/{offerId}/withdraw | Customer | Teklifi geri çek |

**AiController** `/api/ai` (Auth) — ocr (Driver), price-suggestion (Customer),
price-suggestion/enqueue (Customer), ocr/enqueue (Driver), load/{id}/price-suggestion (Customer). [5]

**MatchingController** `/api/matching` (RequireActiveDriver) — recommended, load/{id}. [2]

**PaymentsController** `/api/payments` (Auth) — load/{loadId}, mine, admin/summary (Admin). [3]

**WalletController** `/api/wallet` (Auth) — me, "" (özet), transactions. [3]

**SettlementController** `/api/settlement` (Auth) — preview (komisyon dökümü). [1]

**RatingsController** `/api/ratings` (Auth) — submit, user/{userId}, all (Admin), {id} DELETE (Admin). [4]

**SupportController** `/api/support` (Auth) — tickets (POST), tickets/{id}/messages,
tickets/{id}/escalate, tickets/{id}/status (PATCH, Admin), tickets/mine, tickets (GET, Admin),
tickets/open-count (Admin), tickets/{id}. [8]

**ChatController** `/api/chat` (Auth) — {loadId}/messages. [1]

**NotificationsController** `/api/notifications` (Auth) — "" (liste), unread-count,
{id}/read (PUT), read-all (PUT). [4]

**LocationController** `/api/location` (Auth) — update (RequireActiveDriver, POST),
driver/{loadId} (Customer,Admin). [2]

**DeliveryAddressesController** `/api/deliveryaddresses` (Roles=Customer) — GET, POST, PUT/{id},
DELETE/{id}, PUT/{id}/set-default. [5]

**DashboardController** `/api/dashboard` (Auth) — "" (role göre özet). [1]

**UsersController** `/api/users` (Auth) — {id} (GET), {id} (PUT), fcm-token (PUT). [3]

**SystemController** `/api/system` (Anon) — status. [1]

### 6.2 Tüm DB tabloları (tek satırlık özet)
| Tablo | Özet |
|---|---|
| Users | Müşteri/şoför/admin (Role ile ayrılır); IsActive+ApprovalStatus ile ban/onay; cüzdan; şoför belgeleri; PII şifreli |
| Loads | Yük ilanları; rota+coğrafi nokta; AI fiyat; durum yaşam döngüsü; sahip+atanan şoför |
| Vehicles | Şoför araçları (plaka, tip, kapasite) |
| Bids | Şoförün yüke verdiği teklif; kabulde atama+escrow |
| DriverListings | Şoförün boş araç ilanı (güzergâh+müsaitlik) |
| ListingOffers | Müşterinin boş araca verdiği yük teklifi |
| PaymentTransactions | Emanet (escrow) ödeme; Blocked/Released/Refunded |
| WalletAuditLogs | Cüzdan hareketlerinin değişmez defteri |
| Notifications | Kullanıcı bildirimleri (okundu/okunmadı) |
| ChatMessages | Yük bazlı sohbet + moderasyon (DB-FK yok) |
| Ratings | Karşılıklı puan (iş başına bir kez) |
| DeliveryAddresses | Müşteri adres defteri |
| SupportTickets | Destek talebi başlığı + SLA |
| SupportMessages | Destek talebi mesaj dizisi |
| AdminActionLogs | Admin işlem denetim izi |
| FuelPrices | İl/yakıt fiyatı (arka plan güncellemeli) |
| UetdsOutboxes | Bakanlık (U-ETDS) bildirim kuyruğu (outbox) |

### 6.3 Teknoloji/versiyon listesi
**Backend (`apps/api/Yukle.Api/Yukle.Api.csproj`):** .NET 9.0;
EntityFrameworkCore.Design/Tools 9.0.2; Npgsql.EntityFrameworkCore.PostgreSQL 9.0.3 (+NetTopologySuite
9.0.3, coğrafi); Microsoft.AspNetCore.Authentication.JwtBearer 9.0.2; BCrypt.Net-Next 4.1.0;
FirebaseAdmin 3.5.0 (push); SignalR.StackExchangeRedis 9.x; Caching.StackExchangeRedis 10.0.5;
Http.Resilience 10.4.0; Serilog.AspNetCore 10.0.0 (+Seq sink). **Gemini/Google AI için NuGet paketi
YOK** — özel HTTP istemcisi (`GeminiServiceClient`) ile entegre.
**Web (`apps/web/package.json`):** react/react-dom 19.2.5; vite 8.0.9; typescript ~6.0.2;
react-router-dom 7.14.2; axios 1.16.0; zustand 5.0.12; @microsoft/signalr 10.0.0; leaflet 1.9.4;
three/@react-three 0.184/9.x (3B görseller); framer-motion 12.x; qrcode 1.5.4.
**Mobil (`apps/mobile/yukle-mobile/package.json`):** expo ~54.0.33; react 19.1.0; react-native 0.81.5;
expo-router ~6.0.23; @react-navigation/drawer 7.x; @react-native-async-storage/async-storage 2.2.0;
zustand 5.0.13; axios 1.16.1; expo-location 19.x; react-native-maps 1.20.1; expo-camera 17.x
(QR); @microsoft/signalr 10.0.0.
**Marketing (`apps/marketing/package.json`):** Next.js 16.2.6; react 19.2.4; GSAP 3.15 + Lenis
(smooth scroll); Tailwind CSS 4; TypeScript 5.
**Veritabanı:** PostgreSQL 17 + PostGIS. **Monorepo:** alias tabanlı (workspaces yok).

### 6.4 "Bu projeyi 2 dakikada nasıl anlatırım" (asansör konuşması)
> "Navlonix, müşterilerle yük taşıyan şoförleri buluşturan bir dijital nakliye pazar yeri. Tek bir
> monorepoda dört uygulama var: .NET 9 backend API, React/Vite web paneli, Expo React Native mobil
> uygulama ve Next.js tanıtım sitesi. Backend, PostgreSQL+PostGIS üzerinde EF Core ile çalışıyor;
> tüm kullanıcılar (müşteri/şoför/admin) tek `Users` tablosunda, `Role` kolonuyla ayrılıyor. İki
> taraflı bir akış var: müşteri yük açar–şoför teklif verir, ya da şoför boş araç ilanı açar–müşteri
> yük teklif eder. Şoför kabul/atama anında para **emanete (escrow)** bloke ediliyor, teslimatta
> serbest bırakılıyor; komisyon ve cüzdan hareketleri değişmez bir defterde tutuluyor. Şoför
> belgeleri Google Gemini yapay zekâsıyla otomatik denetleniyor; fiyat önerisi ve yük-şoför
> eşleştirmesi de AI destekli. Giriş JWT + yenileme jetonu ile; telefonla (müşteri/şoför) veya
> e-postayla (admin) yapılıyor. Bildirim ve sohbet SignalR ile gerçek zamanlı. Admin paneli belge
> onayı, kullanıcı askıya alma ve içerik moderasyonu yapıyor."

---

## 7. BELİRSİZ İşaretlenen Maddeler

- **BELİRSİZ-1 (Access token süresi):** Kod analizinde access token ömrü **7 gün** olarak okundu
  (`Services/TokenService.cs`). Bu, erişim jetonu için alışılmadık derecede uzun (genelde dakika/saat).
  `appsettings`'teki JWT ayarlarıyla (ExpiryMinutes/Days) **doğrulanmalı**; refresh token'ın 7 gün
  olması beklenir, access'in bu kadar uzun olması tasarım tercihi mi yoksa not edilmiş bir geçici
  durum mu netleştirilmeli.
- **BELİRSİZ-2 (Komisyon oranları):** Settlement örneği şoför %2 / müşteri %2 / stopaj %0 (bireysel)
  varsayımıyla verildi (`CommissionSettlementOptions` varsayılanları). Gerçek `appsettings*.json`
  değerleri farklıysa örnekteki tutarlar değişir; canlı oranlar config'ten doğrulanmalı.
- **BELİRSİZ-3 (Eksik veritabanı yabancı anahtarları):** `ChatMessages`, `FuelPrices` ve
  `SupportTickets.UserId` için **veritabanı seviyesinde foreign key kısıtı yok** (canlı şema
  taramasıyla doğrulandı). İlişki yalnızca uygulama kodunda var. Bu bilinçli bir tasarım tercihi mi
  yoksa eksik bir kısıt mı belirsiz — veri bütünlüğü açısından gözden geçirilebilir.
- **BELİRSİZ-4 (Web admin ↔ mobil admin eşitliği):** Her iki platformda da admin paneli mevcut ve
  benzer sekmelere sahip; ancak her özelliğin iki platformda birebir aynı olduğu (örn. boş-araç
  moderasyonu, segment filtreler) ekran ekran doğrulanmadı.
- **BELİRSİZ-5 (Gemini API yapılandırması):** Gemini entegrasyonu NuGet paketiyle değil, özel
  `GeminiServiceClient` HTTP istemcisiyle yapılıyor. API anahtarının/uç noktasının nereden okunduğu
  (appsettings / ortam değişkeni) bu rapor kapsamında ayrıntılı doğrulanmadı.
- **BELİRSİZ-6 (Endpoint sayımı):** Alt-analiz sırasında üretilen bir ara toplam "141" idi; ancak
  controller bazında tek tek sayıldığında **107** uç bulunur (bu rapor 107'yi esas alır). Birkaç
  controller'da yardımcı/iç metotların endpoint sanılmamış olması için sayım tek tek doğrulandı.
```
