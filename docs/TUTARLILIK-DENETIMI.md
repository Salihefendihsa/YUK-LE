# Navlonix — Sistem Tutarlılık & İşlevsellik Denetimi

> **Kapsam:** Uçtan uca, salt-okuma (READ-ONLY) denetim. Hiçbir dosya değiştirilmedi, DB'ye dokunulmadı.
> **Yöntem:** Her akış frontend tetikleyici → API çağrısı → backend handler/servis → entity/DB → DTO → frontend render zinciri boyunca izlendi. Her bulgu gerçek `dosya:satır` referansına dayanır. 3 rol (müşteri/şoför/admin) × 2 platform (web `apps/web` / mobil `apps/mobile/yukle-mobile`) + .NET backend (`apps/api/Yukle.Api`).
> **Tarih:** 2026-06-07 · **Branch:** polish/ui-vivid
>
> **Katmanlar:**
> - **Backend:** `apps/api/Yukle.Api` — 18 controller, ~40 servis, 3 SignalR hub, EF Core + PostgreSQL
> - **Web:** `apps/web/src` — React/Vite, 18 api modülü, rol bazlı sayfalar
> - **Mobil:** `apps/mobile/yukle-mobile` — Expo RN, 22 servis, expo-router
> - **Shared:** `packages/shared/src` — ortak domain tipleri
>
> Aşağıdaki **KRİTİK** bulgular rapor yazarı tarafından kaynak koddan bağımsız olarak ikinci kez doğrulanmıştır (✓ işaretli).

---

## İÇİNDEKİLER

1. [Kimlik & Onboarding](#1-kimlik--onboarding)
2. [İlan Yaşam Döngüsü + 3) Teklif + 4) Eşleştirme](#2-i̇lan-yaşam-döngüsü--3-teklif--4-eşleştirme)
5. [Canlı Takip + 6) Sohbet (SignalR)](#5-canlı-takip--6-sohbet-signalr)
7. [Ödeme/Escrow + 8) Cüzdan](#7-ödemeescrow--8-cüzdan)
9. [Destek + 10) Puanlar + 11) Belgeler](#9-destek--10-puanlar--11-belgeler)
12. [Bildirimler + 13) Adresler + 14) Analitik](#12-bildirimler--13-adresler--14-analitik)
15. [Admin Yönetim + Çapraz Tutarlılık](#15-admin-yönetim--çapraz-tutarlılık)
- [SONUÇ: (a) Demo'yu bozabilecek KRİTİK'ler · (b) İşlevsel boşluklar · (c) Kozmetik/tutarlılık](#sonuç)

**Bulgu formatı:** `[Önem] · Alan/akış · Katman+dosya:satır · Ne tutarsız/çalışmıyor · Etki · Önerilen düzeltme`

---

## 1) KİMLİK & ONBOARDING

**Doğrulanmış çalışan akış:** Tek login endpoint `POST /api/Auth/login` (telefon VEYA e-posta + şifre) — `AuthController.cs:102`, `AuthService.LoginAsync:367-389`. Web, mobil, admin-web, admin-mobil hepsi aynı endpoint'i kullanır. JWT HS512, **7 GÜN** ömür (`TokenService.cs:55`). Refresh token = 64-byte CSPRNG, 7 gün, DB rotation (`AuthService.cs:524-550`). AES-256-CBC ile `Phone`/`FullName`/`TaxNumberOrTCKN` şifreli saklanır; deterministik (sabit IV) olduğu için `Phone == loginInput` sorgusu çalışır (`EncryptionService.cs:36-44`, `YukleDbContext.cs:60-97`).

### KRİTİK

**[KRİTİK] ✓ · JWT refresh / token expiry · Mobil `src/services/api.client.ts:84` (yalnız `interceptors.request` var) · Mobilde 401 response interceptor ve refresh mekanizması TAMAMEN YOK.** Backend refresh token üretip mobile gönderiyor, `updateTokens` store action'ı tanımlı (`auth.store.ts:57`) ama **hiçbir yerden çağrılmıyor**. Web'de doğru kurulu (`apps/web/src/api/client.ts:74-129`: 401→refresh→retry→logout). · **Etki:** 7 günlük access token dolunca mobil oturum sessizce kırılır; otomatik refresh/forced-logout yok → kullanıcı yarı-çalışan ekranda kalır. · **Düzeltme:** mobile `api.client.ts`'e web'deki gibi response interceptor ekle, `/Auth/refresh-token` çağır, başarısızsa `logout()`.

**[KRİTİK] ✓ · Web "Kodu Tekrar Gönder" · `apps/web/src/pages/auth/VerifyPhone.tsx:113` · Resend butonu ÖLÜ.** `onClick={() => setSecondsLeft(60)}` — sadece sayacı sıfırlıyor, `/Auth/resend-otp`'yi HİÇ çağırmıyor; `api/auth.ts`'de resend fonksiyonu bile yok. Mobil doğru yapıyor (`verify-phone.tsx:69`). · **Etki:** Web'de ilk OTP'yi kaçıran kullanıcı asla yeni kod alamaz, kayıt tıkanır. · **Düzeltme:** `api/auth.ts`'e `resendOtp(phone)` ekle, butona bağla.

### ORTA

**[ORTA] · Login rol yönlendirme · web `Login.tsx:56-58`, mobil `LoginScreen.tsx:51-57` · Onaysız şoför (`IsActive=false`) doğrudan `/driver/dashboard`'a yönlendiriliyor.** `LoginResponseDto.ApprovalStatus` (`:58-63`) bu amaçla dönüyor ama FE kullanmıyor. · **Etki:** Onaysız şoför dashboard'da 403'lerle karşılaşır; "evrak bekleniyor" ekranına yönlendirilmeli. · **Düzeltme:** login sonrası `approvalStatus !== 'Active'` ise şoförü bekleme/evrak ekranına at.

**[ORTA] · SMS/OTP · `NetgsmSmsService.cs:34-39, 74-80` + `appsettings.Development.json:29-35` · OTP demo'da MOCK ve sabit "123456".** Development'ta veya Netgsm config boşken simüle eder; OTP `123456` sadece log'a yazılır. Mobil verify ekranı bu hint'i gösteriyor (`verify-phone.tsx:84`), web göstermiyor (parite farkı). · **Etki:** Demoyu bloklamaz (kasıtlı bypass). Production'da Netgsm dolmazsa "gönderildi" yanılgısı. · **Düzeltme:** Production checklist'e "Netgsm secrets zorunlu"; web'e de dev-hint ekle.

**[ORTA] · Logout · web `auth.store.ts:47` / mobil `auth.store.ts:49` · Logout backend'i çağırmıyor; DB'deki refresh token iptal edilmiyor.** · **Etki:** Düşük güvenlik riski (token rotation mevcut). · **Düzeltme:** Opsiyonel `revoke` endpoint'i.

### DÜŞÜK

- **[DÜŞÜK] · AES anahtarı · `appsettings.Development.json:17-20` · Key/IV tamamen sıfır-byte placeholder** (format geçerli, kriptografik değersiz). Dev için kabul edilebilir; prod'da KeyVault/user-secrets zorunlu (`appsettings.json:18-20` `REPLACE_WITH_USER_SECRET`).
- **[DÜŞÜK] · Register parity · web `Register.tsx:241,301` · 3-adımlı sihirbaz adım-bazlı valide etmiyor; tüm kontrol son submit'te.** Mobil her adımda valide ediyor.
- **[DÜŞÜK] · Dead endpoint · `POST /Auth/google` (`AuthController.cs:125`)** backend'de tam implement ama hiçbir FE çağırmıyor (login ekranlarında Google butonu yok).
- **[DÜŞÜK] · Storage key tutarsızlığı ·** web persist key `'yükle-auth'` (dotted-ü, `auth.store.ts:58` + `client.ts:52,98` hardcode) vs mobil `'yukle-auth'`. Platformlar ayrı olduğundan çakışma yok; Türkçe-karakterli key kırılgan.

---

## 2) İLAN YAŞAM DÖNGÜSÜ + 3) TEKLİF + 4) EŞLEŞTİRME

**Doğrulanmış çekirdek:** Oluştur→teklif→kabul→atama→pickup→arrived→teslim→escrow zinciri **atomik ve tutarlı**. Teklif kabul tek transaction içinde: bid→Accepted, load→Assigned+DriverId, diğer Pending teklifler `ExecuteUpdateAsync` ile Rejected, escrow `HoldPaymentAsync`; başarısızsa rollback (`BidService.cs:140-231`). 3 bildirim transaction commit sonrası atılır.

### KRİTİK

**[KRİTİK] ✓ · İlan kontratı: `RequiredVehicleType` DTO'da YOK · BE `DTOs/LoadListDto.cs` (alan yok) + `LoadService.cs:85-112` / FE web `api/types.ts:129`, mobil `format.ts` normalizeLoad** · İlan oluşturulurken `RequiredVehicleType` entity'ye yazılıyor (`LoadService.cs:47`) ama `LoadListDto`'da alan **hiç yok**; 4 projeksiyonun hiçbiri doldurmuyor. FE bu alanı bekliyor → her zaman `undefined`. · **Etki:** Şoför liste/detayda "gerekli araç tipi"ni asla göremez. · **Düzeltme:** `LoadListDto`'ya alanı ekle, 4 projeksiyonda doldur.

**[KRİTİK] · Web'de İLAN DÜZENLEME TAMAMEN YOK (web↔mobil parite) · web `api/loads.ts` (`updateLoad` yok) + `pages/customer/LoadDetail.tsx` (edit butonu yok) / BE `LoadsController.cs:286` (`PUT` mevcut) / mobil var (`edit-load.tsx`, `loads.service.ts:263`)** · Backend + mobil tam çalışıyor; web'de düzenle akışı yok. · **Etki:** Web müşterisi açık teklifli ilanını güncelleyemez. · **Düzeltme:** Web'e edit akışı ekle veya kapsam-dışı olduğunu dokümante et.

**[KRİTİK] · Teklif geri çekme UI'da yok · web `api/bids.ts` (`cancelBid` HİÇ yok) + `pages/driver/Bids.tsx` (buton yok); mobil `bids.service.ts:64` var ama `(driver)/(tabs)/bids.tsx` ekranında buton yok (yalnız detay `load-detail.tsx:303`'te) · BE endpoint hazır (`BidsController.cs:108`)** · **Etki:** Şoför teklif listesinden teklifini iptal edemez. · **Düzeltme:** Her iki platformda bids listesine geri-çekme butonu ekle; web api client'a `cancelBid` ekle.

### ORTA

**[ORTA] · Enum serileştirme tutarsızlığı (aynı DTO içinde) · BE `Program.cs:103` (global `JsonStringEnumConverter` YOK) + `LoadListDto`: `Status` = `.ToString()` (string "Active") ama `Type`/LoadType = integer** · FE defensive yazılmış (index tabloları), şu an çalışıyor ama kırılgan ve tutarsız. · **Düzeltme:** Enum serileştirme politikasını tek tipe sabitle (tercihen tümü string + converter).

**[ORTA] · QR/Assigned-Deliver durum tutarsızlığı · `LoadsController.cs:343` (QR'ı `OnWay||Assigned`'da üretir) vs `LoadService.cs:286` (`DeliverAsync` yalnız `OnWay||Arrived` kabul)** · **Etki:** Müşteri Assigned'da QR üretip verirse, şoför pickup yapmadan teslim deneyince hata alır → dead-end UX. · **Düzeltme:** QR üretimini de `OnWay/Arrived` ile sınırla (tek kural).

**[ORTA] · Web driver teklif formu guard'sız · web `pages/driver/LoadDetail.tsx:110-126` · "Teklif ver" kartı `load.status`'tan bağımsız her zaman render; Assigned/OnWay/Delivered'da bile aktif (BE reddeder, UI yanıltıcı dead button). Onay-gate uyarısı + "zaten teklif verdiniz" kontrolü de yok.** Mobil hepsini yapıyor (`load-detail.tsx:100-116,268,300`). · **Düzeltme:** Web'e `status==='Active'` guard'ı + onay-gate + mevcut-teklif tespiti ekle.

**[ORTA] · Mobil detayda AI uyum skoru yok · web `LoadDetail.tsx:26` (`getLoadMatch`) çağırır, mobil `matching.service.ts`'te karşılığı yok.** Ayrıca web'de `getLoadMatch` `Promise.all` içinde; Gemini 500 dönerse tüm detay sayfası çöker (`LoadDetail.tsx:31`, `MatchingController.cs:204`). · **Düzeltme:** Web'de match çağrısını try-catch ile ayır; mobil paritesi için servis ekle.

### DÜŞÜK

- **[DÜŞÜK] · Teklif verme gate'i SAĞLAM ·** Onaysız şoför teklif veremez: `BidsController.cs:41` `Policy="RequireActiveDriver"` + `ActiveDriverAuthorizationHandler.cs:29-36` (DB'den `IsActive` okur, stale token sorunu yok). Mobil ek UI gate'i de var. **Çalışıyor.**
- **[DÜŞÜK] · İptal/refund kuralları TUTARLI ·** Müşteri iptali varsayılan config'de yalnız `Active`+kabul-yok (`LoadCancellationRules.cs:15-23`); refund yalnız admin+`Assigned`+atanmış sürücü, `RefundPercent` %100 (`CancellationService.cs:84`). İptalde teklifler kapanır + bildirim atılır.
- **[DÜŞÜK] · Ağırlık üst sınırı FE↔BE uyumsuz ·** FE max 40.000 kg (`LoadCreate.tsx:174`, `create-load.tsx:242`) / BE max 100.000 kg (`CreateLoadDto.cs:58`). 40k–100k yükler gönderilemez.
- **[DÜŞÜK] · Açıklama: BE opsiyonel (`CreateLoadDto.cs:54`), FE zorunlu** (validation parite yok).
- **[DÜŞÜK] · Enum tabloları TUTARLI:** LoadStatus index/isim/sıra üç katmanda birebir. Tek kozmetik fark: `Active` → mobil "Aktif" (`statusPills.ts:27`) vs web "Yayında" (`displayLabels.ts:32`).
- **[DÜŞÜK] · Geçiş tetikleyicileri TUTARLI:** Active→Assigned (`BidService.cs:172`), Assigned→OnWay (`LoadService.cs:248`), OnWay→Arrived otomatik Haversine ≤200m (`LocationController.cs:49`), →Delivered (`LoadService.cs:286`), →Cancelled (`CancellationService.cs:98`).

---

## 5) CANLI TAKİP + 6) SOHBET (SignalR)

**Doğrulanmış durum:** Canlı takip **tamamen REST polling** ile çalışıyor (~20 sn). Sohbet **gerçek-zamanlı SignalR** ile çalışıyor, `loadId`'ye bağlı, web & mobil aynı hub/metot/event adları. Moderasyon gerçekten engelliyor + DB'ye yazıyor.

### KRİTİK

**[KRİTİK] ✓ · `TrackingHub` (SignalR) tamamen ÖLÜ KOD · BE `Hubs/TrackingHub.cs` (273 satır) + `Program.cs:499`** · `JoinLoadGroup`/`UpdateLocation`/`GetLastLocation`/`ReceiveLocation`/`hubs/tracking` referansı web+mobil kod tabanında **sıfır** (grep ile doğrulandı — yalnız backend'de geçiyor). Tüm konum akışı `LocationController` REST'ten gidiyor. Redis son-konum tamponu, grup izolasyonu, Haversine varış mantığı hiç çalışmıyor. · **Etki:** "Gerçek zamanlı takip" izlenimi yanlış; müşteri haritası 20 sn gecikmeli (polling). Ölü kod + çift varış-algılama riski. · **Düzeltme:** Ya istemcileri TrackingHub'a bağla, ya da hub'ı kaldırıp REST mimarisini resmileştir.

### ORTA

**[ORTA] · Web şoför "Takip" ekranı placeholder · web `pages/driver/Track.tsx:1-5` (`PlaceholderPage` "...burada olacak").** Gerçek konum paylaşımı `driver/ActiveLoad.tsx:64-96`'da (geolocation + 10 sn interval). · **Etki:** Web şoförü "Takip" sayfasında hiçbir şey görmez. · **Düzeltme:** Placeholder'ı kaldır/yönlendir veya ActiveLoad haritasını taşı.

**[ORTA] · Mobil müşteri/şoför canlı takip ekranı YOK · mobil — `tracking.tsx` yalnız admin tabında; `getDriverLocation` (`location.service.ts:48`) tanımlı ama hiçbir müşteri ekranı çağırmıyor.** Web müşteri şoför konumunu görebiliyor (`customer/Track.tsx` + `useCustomerDriverLocation`). · **Etki:** Net web↔mobil özellik açığı; mobil müşteri şoför konumunu göremez. · **Düzeltme:** Mobil müşteri için `getDriverLocation` polling + harita ekranı ekle.

**[ORTA] · Varış algılama ikilemesi · `TrackingHub.cs:186-229` ve `LocationController.cs:40-61` · İki ayrı paralel varış/yakınlık mantığı; eşik sabiti (`0.2 km`) iki dosyada kopya. Yalnız REST yolu canlı.** `LocationController`'da `ProximityNotified` (1 km) var, hub'da yok → asimetrik. · **Düzeltme:** Varış mantığını tek serviste topla; ölü hub yolunu sil.

**[ORTA] · Konum yük-bağımsız saklanıyor · `LocationController.cs:27-29` · Konum `Users.LastKnownLatitude/Longitude` tek satırda; yük başına geçmiş yok.** · **Etki:** Bir şoför aynı anda birden çok aktif yüke sahipse tüm müşterilere aynı (son) konum gider; rota izi çizilemez. · **Düzeltme:** Konumu yük bazlı sakla.

### DÜŞÜK

- **[DÜŞÜK] · ETA yok · web `useCustomerDriverLocation.ts:69-97` · Yalnız Haversine düz-çizgi mesafe; süre/ETA hesaplanmıyor** (OSRM `RouteService` var ama takipte kullanılmıyor).
- **[DÜŞÜK] · Chat moderasyon zayıf filtre · `ChatModerationService.cs:23-36` · `Contains` substring eşleşmesi; `"it"`, `"lan"` gibi kısa terimler masum kelimeleri yanlış-pozitif engelleyebilir.** Engelleme mekanizması doğru çalışıyor (DB `IsBlocked` + admin görür). · **Düzeltme:** Kelime sınırı (regex `\b`).
- **[DÜŞÜK] · Chat unread sayacı yok · mobil `chatThreads.service.ts` + web yok · Sohbet listesinde yalnız `hasMessages` boolean; okunmamış sayısı hiçbir katmanda yok.**
- **[DÜŞÜK] · Chat liste N+1 · mobil `chatThreads.service.ts:23-49` · `enrichThreads` her thread için tüm mesajları çekiyor.**
- **[DÜŞÜK] · Mobil hub token tazeliği · mobil `chatHub.ts:8` mount anındaki token'ı closure'da yakalar; web her reconnect'te store'dan taze okur (`getAccessTokenForHub`).** Uzun oturumda mobil reconnect bayat token'la 401 alabilir. · **Düzeltme:** Mobilde de `accessTokenFactory` store'dan taze okusun.
- **[DÜŞÜK] · Hub auth TUTARLI ·** JWT query-string `?access_token=`, yalnız `/hubs` path'inde (`Program.cs:317-329`). Admin chat hub'a katılmaz, yalnız REST `/Admin/chats` ile izler (doğru tasarım).

---

## 7) ÖDEME/ESCROW + 8) CÜZDAN

**Doğrulanmış çekirdek aritmetik DOĞRU.** Backend tek kaynak (config-driven oranlar). `WalletSettlementCalculator.Calculate` (`WalletSettlementCalculator.cs:22-46`).

### Sabitler (oran/stopaj)

| Sabit | Değer | Yer |
|---|---|---|
| DriverRate | 0.02 | `CommissionSettlementOptions.cs:9` + `appsettings.json:31` |
| CustomerRate | 0.02 | `CommissionSettlementOptions.cs:10` + `appsettings.json:32` |
| **StopajRate** | **0.0** | `CommissionSettlementOptions.cs:11` + `appsettings.json:35` |
| Web rate (hardcoded) | 0.02 / 0.02 | `apps/web/src/utils/displayLabels.ts:3-4` |

### Sayısal doğrulama (X = 1000 TL, bireysel şoför)

```
driverCommission   = round(1000 × 0.02) = 20.00
customerCommission = round(1000 × 0.02) = 20.00
stopaj             = round(1000 × 0.0)  =  0.00
driverNet          = 1000 − 20 − 0      = 980.00
customerTotal      = 1000 + 20          = 1020.00
platformRevenue    = 20 + 20            = 40.00

Özdeşlik: Müşterinin ödediği = şoför net + müşteri kom. + şofor kom. + stopaj
          1020.00  =  980.00 + 20.00 + 20.00 + 0.00 = 1020.00   ✓ TUTAR
```
Para da çakışır: customerTotal(1020) − driverNet(980) = 40 = platformRevenue. **Çekirdek özdeşlik doğru.** "Serbest Bırak" cüzdana yansır + PaymentStatus=Released yapar, **idempotent** (yalnız `Blocked` arar, `MockPaymentService.ReleasePaymentAsync:94`).

### ORTA

**[ORTA] · Stopaj fiilen DEVRE DIŞI · `CommissionSettlementOptions.cs:11` + tüm appsettings (StopajRate=0.0)** · Tüm "Stopaj" UI satırları (`EscrowCard` `withholding>0` koşullu) her zaman 0; kullanıcıya "stopaj kesintisi" anlatılıyor ama hiç kesilmiyor. · **Etki:** Demo "stopaj" vaadini boş gösterir. · **Düzeltme:** Gerçek oran set et + özdeşliği yeniden doğrula, ya da satırı gizle.

**[ORTA] · Komisyon oranı web'de HARDCODED · `displayLabels.ts:3-4`** · Backend oranları config'ten okur; admin oranı değiştirirse web "Platform payı (%2+%2)" KPI'ı ve `estimatePlatformCommissionFromCustomerTotal` yanlış kalır. Backend `PaymentsController.AdminSummary:117-163` zaten gerçek `TotalPlatformRevenue` hesaplıyor. · **Düzeltme:** Web KPI'ı backend summary endpoint'inden alsın.

**[ORTA] · "Toplam işlem hacmi" Refunded dahil + CustomerTotal topluyor · mobil `payments.tsx:64` + web `Payments.tsx:36` (`payments.reduce((s,p)=>s+p.amount)`)** · Tüm statüleri (Blocked+Released+**Refunded**) toplar; ayrıca brüt navlun değil müşteri-toplamı (bid×1.02). · **Etki:** Admin'de görünen toplam hacim gerçek ciroyu yansıtmaz, şişer. · **Düzeltme:** Refunded'ı hariç tut / backend `AdminSummary` kullan.

**[ORTA] · İki farklı status string'i aynı durumu temsil ediyor · `PaymentsController.cs:36` Blocked→"Held" vs `AdminController.cs:508` ham "Blocked"** · Shared type (`payment.ts:5`) yalnız `'Held'|'Released'|'Refunded'` — "Blocked"/"Failed"/"Pending" yok, oysa admin "Failed" filtre seçeneği sunuyor. · **Düzeltme:** Tek DTO status sözleşmesi.

### DÜŞÜK

- **[DÜŞÜK] · Web admin Payments filtreleri tamamen ÖLÜ · `Payments.tsx:78-91`** — durum `<select>`, tarih, isim, tutar aralığı inputlarının `onChange`/state'i yok, dekoratif. (Mobil filtre çalışıyor — `payments.tsx:46-57`.)
- **[DÜŞÜK] · Web "Başarısız İşlem" KPI'ı daima 0 · `Payments.tsx:43,75` · `PaymentStatus.Failed` yazan kod yok** → metrik hep boş/yanıltıcı.
- **[DÜŞÜK] · Release row-lock'suz · `MockPaymentService.ReleasePaymentAsync:92-114`** (Hold/Refund row-lock kullanır). Eşzamanlı çift release teorik yarış; demo'da düşük risk.
- **[DÜŞÜK] · Müşteri cüzdanında Refunded görünmüyor · `WalletController.cs:90-104`** (eksik state, çift sayım yok).
- **[DÜŞÜK] · MOCK dürüst:** `MockPaymentService` tek `IPaymentService` (gerçek İyzico yok). Sahte olan yalnız kart tahsilatı; `PaymentTransaction`/`WalletAuditLogs`/`WalletBalance` gerçekten yazılır → **sayıları yanıltmıyor**. UI "Demo: ödeme altyapısı mock'tur" diyor (`EscrowCard.tsx:159`).

---

## 9) DESTEK + 10) PUANLAR + 11) BELGELER

**Doğrulanmış:** AI chatbot gerçekten cevaplıyor (gerçek Gemini Flash; erişilemezse `SupportFaqResponder` curated TR SSS fallback — `SupportController.cs:400-414`, **çekirdek çökmez**). Belge onayı gerçekten yetki kapısı (`RequireActiveDriver` DB'den `IsActive` okur). Belge depolama gerçek (diske yazıyor, `DriverReviewDocumentStore.cs:22-37`).

### KRİTİK

**[KRİTİK] ✓ · Web sürücü belge yükleme: TÜM belgeler `DriverLicense` olarak gönderiliyor · web `pages/driver/Documents.tsx:29,44` + `api/ai.ts:3,13` (varsayılan `docType='DriverLicense'`)** · `handleAnalyzeAndUpload(type)` parametresini yok sayıp `uploadDocumentForAi(selectedFile)` / `uploadDriverDocument(selectedFile)`'i docType'sız çağırıyor → SRC ve Psikoteknik kartından yüklenen belge bile ehliyet olarak gider. Mobil doğru (`documents.service.ts:48,61`). · **Etki:** Web'den şoför SRC/Psikoteknik yükleyemez; `AreAllMandatoryDocumentsApproved` asla sağlanmaz → **web kullanıcısı hiçbir zaman `Active` olamaz.** · **Düzeltme:** Kart→docType eşlemesi (`license→DriverLicense, src→SrcCertificate, psychotechnic→Psychotechnical`) yap, iki çağrıya da ilet.

**[KRİTİK] · Web admin belge inceleme: AI paneli sahte/hardcoded veri gösteriyor · web `pages/admin/ReviewsDetailModal.tsx:37-43,182-200`** · Modal backend'in YAZMADIĞI alanları okuyor (`ai.ValidUntil`, `ai.LicenseClass`, `ai.NameMatch`, `ai.TcMatch`, `ai.SuspiciousNotes`). Backend `AiInferenceDetails`'e `DocumentType/IsValid/ConfidenceScore/ValidationMessage/ExpiryDate/DocumentClasses` yazıyor (`AuthService.cs:741-753`). Sonuç: panel hep uydurma sabitler (`validUntil='12.05.2027'`, `confidence=72`) ve daima yeşil ✅ gösterir. Mobil doğru alanları okuyor (`src/components/admin/ReviewsDetailModal.tsx:54-59`). · **Etki:** Admin sahte verilere bakarak karar verir; gerçek confidence/red gerekçesi görünmez. · **Düzeltme:** Web modalı backend JSON şemasına hizala (mobildeki `parseAiInferenceDetails` mantığı).

### ORTA

**[ORTA] · Web admin "Notu Kaydet" + "Manuel İncele" ölü butonlar · `ReviewsDetailModal.tsx:225-232,276-285` + `Reviews.tsx:142-145`** · İkisi de yalnız `toast` atıyor, API yok / kayıt durumu değişmiyor. · **Etki:** Admin "manuel incele" sandığı kayıt kuyrukta aynen kalır. · **Düzeltme:** Butonu kaldır veya gerçek erteleme endpoint'ine bağla.

**[ORTA] · `PendingReview` enum çift-anlam · `AuthService.cs:736` + `User.cs:32-37`** · Tek belge onaylanıp diğerleri eksikken status `PendingReview` (admin kuyruğuna düşer), oysa enum "AI kararsız" anlamı taşıyor. · **Etki:** "Belge eksik" şoför, admin'in "şüpheli AI" kuyruğunda görünür → gereksiz kalabalık + KVKK temizliğinde (`DocumentCleanupJob.cs:91`) 30 gün sonra silinme riski. · **Düzeltme:** Eksik-belge için `Pending` kullan; `PendingReview`'ı gerçek gri-alana ayır.

**[ORTA] · Web admin Reviews KPI'ları sabit · `Reviews.tsx:97-106` · "Bugün Onaylanan: 0", "Ortalama İnceleme: 12 dk" hardcoded** (`AdminActionLog` mevcut ama sorgulanmıyor). · **Düzeltme:** Loglardan gerçek sayıyı çek.

### DÜŞÜK

- **[DÜŞÜK] · Ortalama puan iki kaynak · `RatingsController.cs:48-50` (stored incremental) vs `:66` (anlık `AVG`)** · Submit/Delete stored alanı doğru günceller → normalde eşitler ama tek doğruluk-kaynağı değil, float birikim riski. · **Düzeltme:** Tek kaynak seç.
- **[DÜŞÜK] · "Operatöre aktar" ÇALIŞIYOR · `SupportController.cs:190-223`** (durum Open + admin bildirim + sistem mesajı + `humanMode` sonrası AI susar). Web+mobil buton bağlı. **Ölü değil.**
- **[DÜŞÜK] · OCR çift çağrı · web `Documents.tsx:29`+`:44` ve mobil önce `/Ai/ocr` (önizleme) sonra `/Auth/upload-document` (gerçek onay) çağırıyor** → iki Gemini çağrısı (maliyet). `/Auth/upload-document` zaten OCR sonucu döndürüyor. · **Düzeltme:** Tek çağrıya indir.
- **[DÜŞÜK] · web↔mobil: mobil belge ekranı yüklemeden sonra gerçek profili resync ediyor (`documents.tsx:102-148`); web yalnız lokal state tutuyor, yenilenince sıfırlanıyor.** Mobil daha doğru.
- **[DÜŞÜK] · Web `admin/Documents.tsx:1-14` sadece Reviews'e yönlendiren stub** (menüde çift giriş).

---

## 12) BİLDİRİMLER + 13) ADRESLER + 14) ANALİTİK

### 12) Bildirimler

**Doğrulanmış olay→bildirim zinciri (gerçek):** teklif kabul (`BidService.cs:205,211,219`), teslim (`LoadService.cs:313,318`), yaklaşma/varış (`LocationController.cs:43,52,56`), iptal/iade (`CancellationService.cs:154-165`). `NotificationService.SendAsync` üçlü: DB + SignalR push + (token varsa) FCM. Unread-count/mark-read sözleşmesi her iki istemcide doğru (`count ?? Count`).

**[KRİTİK] · FCM push uçtan uca ÖLÜ · `Program.cs:38-52` + mobil (FCM token üretimi hiç yok) · `firebase-service-account.json` repoda yok → `FirebaseApp.Create` hiç çağrılmıyor; mobil hiçbir yerde FCM token alıp `PUT /users/fcm-token`'a göndermiyor (grep 0 sonuç) → `User.FcmToken` daima null.** · **Etki:** Uygulama kapalı/arka plandayken push ÇALIŞMAZ; yalnız uygulama açıkken SignalR + polling var. · **Düzeltme:** Mobilde `expo-notifications`/FCM token al + kaydet; backend'e credential ekle.

**[KRİTİK] · FCM hata yutma dar · `NotificationService.cs:137-139` · `catch` yalnız `FirebaseMessagingException` yakalar; Firebase init edilmemişken token varsa `FirebaseMessaging.DefaultInstance` `InvalidOperationException` fırlatır, yakalanmaz → `SendAsync` patlar (controller 500).** Core veri tutarlı kalır (DB+SignalR önce, transaction commit sonrası çağrılır). · **Düzeltme:** Geniş `try/catch` veya `FirebaseApp.DefaultInstance==null` guard'ı.

**[ORTA] · "Yeni Teklif" bildirimi DB'ye yazılmıyor · `BidsController.cs:173-181` (`SendBidPushAsync` yalnız SignalR `ReceiveNotification`, `NotificationService.SendAsync` çağrılmaz, payload'da `Id` yok)** · **Etki:** (1) Müşteri offline'sa yeni-teklifi kalıcı listede/sayaçta asla göremez; (2) Mobil `notifications.store.ts:60` `if(!row.id) return` ile bu push'u tamamen düşürür → mobilde online olsa bile görünmez. · **Düzeltme:** Yeni teklifte de `SendAsync(..., NotificationType.Bid, ...)` kullan.

**[ORTA] · web↔mobil gerçek-zaman paritesi · web `TopBar.tsx:51-53` (10 sn polling) vs mobil SignalR · web `apps/web/src/lib/notificationHub.ts` tanımlı ama hiç import edilmiyor (ölü kod).** · **Etki:** Web bildirim 10 sn gecikmeli. · **Düzeltme:** Web'de `createNotificationConnection`'ı TopBar'a bağla.

- **[DÜŞÜK] · Web mark-read optimistik değil · `TopBar.tsx:182-184,227`** (10 sn polling'e kadar UI eski; mobil optimistik — `app/notifications.tsx:86-90`).
- **[DÜŞÜK] · Bildirim `Type` enum'u tüketilmiyor · web `TopBar.tsx:14-20` başlık string-match ile kategori tahmin eder; mobil tipi hiç göstermez.** · **Düzeltme:** `Type` alanını kullan.

### 13) Adresler

Backend CRUD tam ve gerçek (`DeliveryAddressesController.cs:16-97`, `[Authorize(Roles="Customer")]`).

**[ORTA] · Web'de adres DÜZENLEME yok · web `pages/customer/Addresses.tsx:65-76` (yalnız Ekle/Varsayılan/Sil) · backend + api client (`api/addresses.ts:27` `updateAddress`) PUT destekler ama UI'da yok.** Mobil tam edit sunar (`addresses.tsx:253`). · **Etki:** Web kullanıcı adresi düzeltemez (sil+yeniden ekle). · **Düzeltme:** Web'e edit formu ekle.

**[ORTA] · Load-create adres kullanım paritesi · web `LoadCreate.tsx:372-388` yalnız `toCity/toDistrict` doldurur (varış); mobil `create-load.tsx:493-705` adresi çıkış VEYA varış uygular + koordinatı set eder (`coordsFromAddress`).** · **Düzeltme:** Web'de from/to + koordinat aktarımını hizala.

- **[DÜŞÜK] · Web adreslerinde lat/lng toplanmıyor · `Addresses.tsx:7`** → load-create'te de boş kalır.

### 14) Analitik / Dashboard

**[KRİTİK] ✓ · Web Şoför Dashboard sözleşme uyuşmazlığı · web `pages/driver/Dashboard.tsx:55-67` + `api/types.ts:67-69` (`activeOffersCount/completedLoadsCount/totalEarned`) vs backend `DTOs/DriverDashboardDto.cs` (`CompletedJobCount/ActiveBidCount/TotalEarnings`)** · HİÇBİR alan adı eşleşmiyor + backend `rating` döndürmez. · **Etki:** Web şoför panelinde Aktif Teklif / Tamamlanan / Kazanç / ⭐ **daima 0 / ₺0**. Mobil doğru alanları kullanır → mobil DOĞRU, web KIRIK. · **Düzeltme:** Web tipini `completedJobCount/activeBidCount/totalEarnings`'e hizala; rating'i ayrı `getUserRatings`'ten çek.

**[KRİTİK] · Web Admin Dashboard hayalet alanlar + hardcoded · `pages/admin/Dashboard.tsx:22,30-35,45-53,90,96-98`** · Backend `/Admin/dashboard` yalnız `totalUsers/activeLoadCount/pendingReviewCount/totalTransactionVolume/systemStatus/recentActions` döner; web ek olarak `deliveredTodayCount/onWayCount/monthlyCommission/avgDeliveryHours/customerCount/driverCount/idleLoadsCount/complaintCount/failedPaymentCount` okur (hepsi YOK → 0). 7-günlük grafik sabit `[35,45,50,42,58,61,49]`, güzergahlar sabit, sağlık pill'leri statik dummy. Mobil yalnız gerçek alanları gösterir. · **Etki:** Web admin panelinin yarısı sahte/0. · **Düzeltme:** Hayalet alanları/hardcoded grafiği kaldır veya backend'e ekle.

**[KRİTİK] · Web Müşteri Analitik tamamen demo/hardcoded · `pages/customer/Analytics.tsx:19-20,78-81,108-118`** · Harcama grafiği sabit, güzergahlar sabit, karbon "2.4 t CO₂e" + "tasarruf ₺1.240" sabit. Yalnız memnuniyet puanı gerçek. Mobil (`analytics.tsx:84-118`) harcama+güzergahı GERÇEK history'den hesaplar, karbon/tasarrufu açık `DEMO` pill'iyle işaretler. · **Etki:** Web analitik neredeyse tamamen sahte; ciddi parite + güven sorunu. · **Düzeltme:** Web'i mobildeki gibi `getCustomerLoadHistory` + `computeMonthlySpend/computeTopRoutes`'a taşı.

- **[ORTA] · Backend admin aylık komisyon placeholder · `AdminController.cs:645-646` (`MonthlyCommission=null, "not_calculated"`).**
- **[DÜŞÜK] · Müşteri Dashboard TUTARLI ·** web `Dashboard.tsx:21-77` ve mobil `dashboard.tsx:286-344` aynı algoritmayla "Bu hafta/Aylık/Favori şoförler"i gerçek history'den hesaplar. **Gerçek ve tutarlı.**
- **[DÜŞÜK] · "AI önerileri / Performans skoru — Yakında" · web `Dashboard.tsx:294-311` + mobil `dashboard.tsx:227-240`** (açık "Yakında" etiketli, tutarlı, kabul edilebilir).

---

## 15) ADMIN YÖNETİM + ÇAPRAZ TUTARLILIK

**Doğrulanmış:** Admin endpoint'lerinin neredeyse tamamı GERÇEK DB verisi döner; aksiyonlar (suspend/activate/note/warn/cancel/release/review-decide/rating-delete) uçtan uca yazılır + `AdminActionLog`'a loglanır. İstisnalar aşağıda. Web router admin rotalarını `ProtectedRoute allowedRoles={['Admin']}` ile koruyor.

### KRİTİK

**[KRİTİK] ✓ · "Banla/suspend" müşteride fiilen ETKİSİZ · BE `AuthService.LoginAsync:367-389` (IsActive kontrolü YOK) + `Program.cs:337`** · `LoginAsync` hiçbir yerde `user.IsActive` kontrol etmiyor (doğrulandı — IsActive yalnız Register/belge-onay/refresh-log bağlamlarında geçiyor, login'de yok). Yalnız şoförler `RequireActiveDriver` ile DB-recheck yapar; müşteri/admin uçları düz `[Authorize(Roles="...")]`. · **Etki:** Admin bir müşteriyi askıya alsa (`SuspendUser`→`IsActive=false`, `AdminController.cs:688`) müşteri yine login olur, geçerli JWT alır, tüm müşteri uçlarını kullanır. "Kullanıcıyı banla → giremesin" demo'su çöker. · **Düzeltme:** `LoginAsync`/`IssueTokensAsync` içinde `if(!user.IsActive) throw`; veya tüm rollere DB-IsActive recheck yapan global policy.

**[KRİTİK] ✓ · FE ApprovalStatus index map'inde `5: PendingReview` EKSİK · BE `Models/User.cs:15-38` (PendingReview=5) vs web `displayLabels.ts:9-15` + mobil `statusPills.ts:7-14` (yalnız 0–4, index 5 yok)** · String-label map'lerinde `PendingReview` var ama numeric index map'lerinde yok (doğrulandı). · **Etki:** Sayısal `5` gelirse ham "5" riski / yanlış etiket; gri-alan profilleri sayısal serileştirmede patlayabilir. Backend çoğu yerde string döndüğü için pratik etki sınırlı. · **Düzeltme:** Her iki map'e `5: 'PendingReview'` ekle.

### ORTA

**[ORTA] · Dashboard "Redis Online" yanılgısı · `AdminController.cs:116-129` + `Program.cs:101` (`AddDistributedMemoryCache`)** · Redis healthcheck in-memory cache üzerinden yapılıyor → roundtrip hep başarılı → dashboard daima `redis="Online"`. Redis aslında YOK. · **Etki:** Var olmayan Redis "çalışıyor" gösterilir. · **Düzeltme:** "Devre dışı / Geliştirme" işaretle.

**[ORTA] · Web System ekranı sahte metrikler · web `pages/admin/System.tsx:51-52,58,60` · "Önbellek: Devre dışı", "Yakıt görevi son çalışma 10 dk önce", "Belge temizleme 1 saat önce" hardcoded** (yalnız `uetdsPending` gerçek). Mobil bu sahte satırları içermez (daha dürüst). · **Düzeltme:** Kaldır veya gerçek job-zamanı endpoint'i.

**[ORTA] · Web admin Settings ekranı tamamen ÖLÜ · web `pages/admin/Settings.tsx:1-33` · Hiç API yok; inputlar hardcoded `defaultValue`, Kaydet handler YOK, şifre alanları no-op, "2FA: yakında".** Mobil settings GERÇEK çalışıyor (`getUserProfile/updateUserProfile/changePassword`). · **Düzeltme:** Mobildeki servislere bağla.

**[ORTA] · `SystemController` auth YOK · BE `SystemController.cs:5-17` · `/api/System/status` anonim erişilebilir; `Environment="Development"` + framework sürümü bilgi sızdırır** (veri hassas değil ama). · **Düzeltme:** `[Authorize]` veya prod'da generic mesaj.

**[ORTA] · Admin ekran paritesi (kabul edilebilir tasarım farkı) ·** Web'de ayrı `DriverDetail`/`CustomerDetail`/`LoadDetail` sayfaları; mobilde modal (`AdminUserDetailModal`/`AdminLoadDetailModal`). Web'de ayrı `Drivers`/`Customers`; mobilde tek `users` tab + sekme. **Tüm kritik aksiyonlar her ikisinde de mevcut.** Yalnız web `Settings`/`System` placeholder'ları düzeltilmeli.

### DÜŞÜK

- **[DÜŞÜK] · Enum tabloları (LoadStatus/LoadType/VehicleType/BidStatus/PaymentStatus) TUTARLI ·** Üç katmanda index/isim/label uyumlu. Tek istisna ApprovalStatus index 5 (yukarıda KRİTİK).
- **[DÜŞÜK] · VehicleType sayısal index map'i mobilde yok (`format.ts`)** — sayısal gelirse ham sayı görünür; web doğru çözer.
- **[DÜŞÜK] · Reviews `documentType` eksik · web `api/admin.ts:18-24` `decideReview` `documentType` göndermez; mobil gönderir.** Backend AI JSON'dan çözer (`TryResolveReviewDocumentType:985`) ama yoksa `ApplicationException`. · **Düzeltme:** Web'e de parametre ekle.
- **[DÜŞÜK] · Yetkilendirme genelde DOĞRU ·** AdminController tümü `[Authorize(Roles="Admin")]`; `wallet-release` Admin-only; WalletController kendi kaydını döner (userId filtreli); `UsersController.CanAccessUser` admin-or-self. **Sızıntı yok.**
- **[DÜŞÜK] · MOCK envanteri:** Ödeme (`MockPaymentService`, kasıtlı, DB tutarlı), Redis (in-memory, tek yanıltıcı nokta = "Redis Online"), FCM (opsiyonel, credential yoksa sessiz düşer), Gemini (gerçek + circuit-breaker fallback), SMS (gerçek Netgsm client, config yoksa OTP gitmez, demo hesapları `IsPhoneVerified=true` seed), U-ETDS (gerçek `UetdsOutbox` + worker).

---

## SONUÇ

### (a) Demo'yu BOZABİLECEK KRİTİK'ler

| # | Bulgu | Konum | Demo etkisi |
|---|---|---|---|
| 1 | **"Banla" müşteride etkisiz** — login `IsActive` kontrol etmiyor | `AuthService.cs:367-389` | "Kullanıcıyı banla → giremesin" senaryosu çöker |
| 2 | **Web şoför belge yükleme hep `DriverLicense`** — SRC/Psikoteknik yüklenemez | `pages/driver/Documents.tsx:29,44` + `api/ai.ts:13` | Web şoför ASLA onaylanamaz/`Active` olamaz |
| 3 | **Web şoför Dashboard alan uyuşmazlığı** — tüm değerler 0/₺0 | `pages/driver/Dashboard.tsx:55-67` vs `DriverDashboardDto.cs` | Şoför panel boş görünür |
| 4 | **Web admin Dashboard yarısı sahte/0 + hardcoded grafik** | `pages/admin/Dashboard.tsx:22,30-35,96` | Jüri sahte metrik/grafik görür |
| 5 | **Web müşteri Analitik tamamen demo/hardcoded** | `pages/customer/Analytics.tsx:19,78,108` | "Gerçek analitik" izlenimi yanlış |
| 6 | **Web admin belge inceleme paneli uydurma AI verisi (hep yeşil ✅)** | `pages/admin/ReviewsDetailModal.tsx:37-43` | Admin sahte veriye göre karar verir |
| 7 | **Mobilde token refresh yok** — 7 gün sonra oturum sessiz kırılır | `src/services/api.client.ts:84` | Uzun demo/sonraki gün mobil bozulur |
| 8 | **Web "Kodu tekrar gönder" ölü** — kayıt akışı tıkanabilir | `pages/auth/VerifyPhone.tsx:113` | OTP kaçıran web kullanıcısı kayıt olamaz |
| 9 | **Dashboard sahte "Redis Online"** | `AdminController.cs:116-129` | Var olmayan altyapı "çalışıyor" gösterilir |

### (b) İşlevsel boşluklar (özellik eksik / ölü)

- **Canlı takip:** `TrackingHub` tümüyle ölü kod; mobil müşteri/şoför canlı harita ekranı YOK; web şoför `Track.tsx` placeholder; ETA hiç yok.
- **Web'de eksik akışlar:** İlan düzenleme, adres düzenleme, teklif geri çekme, admin Settings (tümü ölü/yok) — hepsi backend'de hazır.
- **FCM push uçtan uca ölü** (credential + mobil token kaydı yok) → arka planda bildirim yok.
- **"Yeni teklif" bildirimi DB'ye yazılmıyor** → offline müşteri göremez, mobilde `id=0` ile düşürülür.
- **`RequiredVehicleType` DTO'dan düşmüş** → şoför gerekli araç tipini hiç görmez.
- **Web admin Payments filtreleri + "Başarısız İşlem" KPI** ölü/daima 0.
- **Ölü/dekoratif butonlar:** Web admin "Notu Kaydet" / "Manuel İncele" (toast-only), `/Auth/google` (FE'siz), web `lib/notificationHub.ts` (import edilmiyor).

### (c) Kozmetik / tutarlılık

- Enum etiket farkı: `Active` → web "Yayında" vs mobil "Aktif".
- ApprovalStatus index `5` FE map'lerinde eksik (pratik etki sınırlı).
- Ödeme status iki string: "Held" (Payments endpoint) vs "Blocked" (Admin endpoint); shared type eksik değerler.
- Stopaj her yerde 0 ama UI "stopaj kesintisi" vaad ediyor.
- Web komisyon oranı hardcoded (config mirror'lamıyor).
- "Toplam işlem hacmi" Refunded dahil + CustomerTotal toplar.
- Chat: unread sayacı yok, moderasyon `Contains` filtresi yanlış-pozitif riski, liste N+1.
- Web bildirim mark-read optimistik değil (10 sn gecikme), web 10 sn polling vs mobil SignalR.
- Ağırlık/açıklama validation FE↔BE uyumsuz; web register adım-validasyonu yok.

### Çapraz değerlendirme

- **En sağlam katman: backend çekirdek iş mantığı.** Ödeme aritmetiği (1000→1020/980/40 özdeşliği tutuyor), teklif-kabul atomikliği, yetkilendirme, escrow idempotency, enum tutarlılığı (ApprovalStatus hariç) hep doğru.
- **En zayıf katman: web frontend ↔ backend sözleşme uyumu.** Şoför/admin dashboard, analitik, belge inceleme paneli backend'in döndürmediği alanları okuyor → sessiz 0/sahte veri. Mobil tarafı bu noktalarda belirgin biçimde daha doğru ve dürüst (DEMO etiketleri, gerçek resync).
- **Genel desen:** Mobil (yeni, premium dil geçişi yapılmış) çoğu akışta web'den daha tutarlı ve gerçek-veri-bağlı; web'de eski placeholder/hardcoded artıkları ve eksik edit akışları birikmiş. Demo öncesi öncelik: **web dashboard/analitik sözleşme düzeltmeleri + "banla" login guard'ı + web belge docType eşlemesi.**

---

*Bu rapor salt-okuma analizdir; hiçbir kaynak dosya değiştirilmemiştir. KRİTİK bulgular (✓) kaynak koddan bağımsız ikinci kez doğrulanmıştır. Diğer bulgular alt-denetim ajanları tarafından `dosya:satır` ile gerekçelendirilmiştir.*
