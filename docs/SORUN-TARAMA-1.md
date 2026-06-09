# Navlonix — Sorun Tarama Raporu #1

> **Kapsam:** Salt-okuma (READ-ONLY) statik analiz. Hiçbir kaynak dosya veya DB değiştirilmedi. Tek çıktı: bu dosya.
> **Tarih:** 2026-06-07 · **Branch:** `polish/ui-vivid`
> **Katmanlar:** Backend `apps/api/Yukle.Api` · Web `apps/web/src` · Mobil `apps/mobile/yukle-mobile` (`app/` + `src/`)
> **Yöntem:** Her bulgu kaynak koddan `dosya:satır` ile bağımsız doğrulandı. Uydurma yok; doğrulanamayan iddialar rapora alınmadı.
> **Bulgu formatı:** `[ÖNEM] · dosya:satır · ne · etki · öneri`

---

## YÖNETİCİ ÖZETİ

- **Derleme:** Web (`tsc -b`), Mobil (`tsc --noEmit`) ve .NET kod derlemesi **temiz (0 hata, 0 CS uyarısı)**. .NET build'in "fail" dönmesi yalnızca çalışan API instance'ının çıktı exe'sini kilitlemesinden kaynaklı **ortamsal** bir durumdur, kod hatası değildir.
- **Lint:** Web ESLint **61 problem (53 error + 8 warning)** — hakim kurallar `react-hooks/set-state-in-effect` ve `react-hooks/immutability` (React 19). En yoğun dosya `ChatsPage.tsx`. **Mobilde `lint` script'i hiç yok.**
- **En zayıf katman: web frontend ↔ backend sözleşmesi.** Web admin/şoför dashboard'ları, müşteri analitiği ve admin belge-inceleme paneli backend'in **döndürmediği alanları** okuyor → sessizce `0` / sahte sabit gösteriyor. Mobil aynı noktalarda belirgin biçimde daha doğru.
- **En kritik fonksiyonel açıklar:** (1) login'de `IsActive` guard'ı yok → "banla" etkisiz; (2) web şoför belge yükleme hep `DriverLicense` → web şoför asla `Active` olamaz; (3) `TrackingHub` tamamen ölü kod; (4) FCM push uçtan uca ölü; (5) web'de ilan/adres düzenleme + teklif geri çekme akışları yok (backend hazır).
- **TODO/FIXME/HACK/XXX:** Kaynak kodda **literal marker yok** (yalnız telefon placeholder'ı `5XXXXXXXXX` false-pozitifleri). Buna karşılık çok sayıda **hardcoded demo/sahte sabit** ve **"yakında" placeholder'ı** mevcut (Bölüm 6).

---

## BÖLÜM 1 — DERLEME

| Hedef | Komut | Sonuç |
|---|---|---|
| Web | `npx tsc -b` | **EXIT 0 — hata yok (temiz)** |
| Mobil | `npx tsc --noEmit` | **EXIT 0 — hata yok (temiz)** |
| .NET | `dotnet build` | **Kod derlemesi temiz: 0 derleme hatası, 0 CS uyarısı.** Build yalnızca ortamsal nedenle "fail" döndü — çalışan API process'i (`Yukle.Api`) çıktı exe'sini kilitlediği için MSB3026/MSB3027/MSB3021 (apphost.exe → `Yukle.Api.exe` kopyalanamadı). **Bu bir KOD hatası DEĞİL.** Öneri: build öncesi çalışan API durdurulmalı. |
| Web | `eslint src` | **EXIT 1 — 61 problem (53 error + 8 warning).** Hakim kurallar: `react-hooks/set-state-in-effect` (effect içinde senkron setState → cascade render) ve `react-hooks/immutability` (React 19). En yoğun dosya `apps/web/src/pages/shared/ChatsPage.tsx` (örn. 142, 148, 180. satırlar). |
| Mobil | `lint` | **Script YOK.** `apps/mobile/yukle-mobile/package.json:5-10` — yalnız `start/android/ios/web`; lint hiç tanımlı değil → mobil hiç lint'lenmiyor. |

**[ORTA] · `apps/mobile/yukle-mobile/package.json:5-10` · Mobilde lint script'i yok · Mobil kaynak hiç statik analiz edilmiyor; web'deki `set-state-in-effect`/immutability sınıfı sorunlar mobilde tespit edilemiyor. · ESLint + RN config ekle, CI'a bağla.**

---

## BÖLÜM 2 — RUNTIME RİSKİ

**[KRİTİK] · `apps/web/src/pages/driver/LoadDetail.tsx:26` · `Promise.all([getLoad(id), getLoadMatch(id)])` — AI eşleştirme çağrısı kritik yola bağlı · `getLoadMatch` (Gemini, `api/matching.ts:9`) 500/timeout dönerse `Promise.all` reject olur, tüm catch (`:31`) tetiklenir → şoför yük detayını HİÇ göremez (yalnız hata mesajı). · Match çağrısını ayrı try-catch / ayrı `Promise.allSettled`'a al; detay yükü match'ten bağımsız render edilsin.**

**[ORTA] · `apps/web/src/pages/admin/Dashboard.tsx:12-20` · `set-state-in-effect` + anlamsız re-render döngüsü · Effect içinde `setStats`/`setError`/`setNow` senkron çağrılıyor; ayrıca `setNow(Date.now())` her 30 sn `bars` useMemo'sunu (`:22`) yeniden hesaplatır ama dizi sabit `[35,45,...]` → boşa render. · ESLint kuralına uy; sabit grafiği kaldır.**

**[ORTA] · `apps/web/src/pages/shared/ChatsPage.tsx:148,180` (+ `:141-143`) · effect içinde senkron `setLoadingMsg(true)` / `setConn(connection)` · React 19 `set-state-in-effect` ihlali — cascade render, ESLint error. · Veri yüklemeyi event/handler'a taşı veya state'i effect dışında türet.**

**[ORTA] · `apps/web/src/pages/admin/Payments.tsx:36` · `paymentList.reduce((a,b) => a + Number(b.amount ?? 0), 0)` tüm statüleri (Blocked + Released + **Refunded**) toplar · "Toplam İşlem Hacmi" KPI'ı iade edilen işlemleri de sayar + brüt navlun yerine müşteri-toplamını (bid×1.02) toplar → gerçek ciro şişer. · Refunded'ı hariç tut veya backend `AdminSummary` kullan.**

**[DÜŞÜK] · `apps/web/src/pages/shared/ChatsPage.tsx:163-165` · `.catch(() => { if (!cancelled) setMessages([]) })` — hata yutuluyor · Mesaj çekme başarısızsa kullanıcıya hata gösterilmeden boş liste; sessiz başarısızlık. · En azından bir hata banner'ı göster.**

**Pozitif (doğrulandı):** `null` erişimi için web genelinde defensive `?? 0` / `Number(... ?? 0)` deseni yaygın; çoğu fetch `.catch(...).finally(...)` ile sarılı. Boş `catch {}` (tamamen sessiz) deseni grep ile **bulunamadı**; tek anlamlı yutma `AdminController.cs:126-129` (Redis healthcheck — kasıtlı, aşağıda).

**`theme radius` / palette tanımsız-değişken riski:** Aranan "X is not defined" / tanımsız `radius` veya palette import sınıfı bir sorun **tespit edilmedi** (mobil `palette` importları tutarlı; `tsc` temiz olduğundan tanımsız sembol derlemede yakalanırdı).

---

## BÖLÜM 3 — ÖLÜ ÖZELLİK (hiçbir şey yapmayan buton/ekran)

**[KRİTİK] · `apps/web/src/pages/auth/VerifyPhone.tsx:111-117` · "Kodu Tekrar Gönder" butonu ÖLÜ · `onClick={() => setSecondsLeft(60)}` yalnız sayacı sıfırlar; `/Auth/resend-otp`'yi HİÇ çağırmaz. `apps/web/src/api/auth.ts`'te resend fonksiyonu yok (yalnız `login/register/verifyOtp/refreshToken`). Backend (`AuthController.cs:148-149 ResendOtp`) ve mobil (`src/services/auth.service.ts:161`) çalışıyor. · **Etki:** ilk OTP'yi kaçıran web kullanıcısı asla yeni kod alamaz → kayıt tıkanır. · `api/auth.ts`'e `resendOtp(phone)` ekle, butona bağla.**

**[KRİTİK] · `apps/web/src/pages/driver/Documents.tsx:29,44` · Web şoför belge yükleme: TÜM belgeler `DriverLicense` olarak gider · `handleAnalyzeAndUpload(type)` `type` parametresini alır ama `uploadDocumentForAi(selectedFile)` / `uploadDriverDocument(selectedFile)`'ı docType'sız çağırır; `api/ai.ts:3,13` varsayılanı `'DriverLicense'`. SRC/Psikoteknik kartından yüklenen belge bile ehliyet olarak gönderilir. Mobil doğru (`src/services/documents.service.ts`). · **Etki:** web'den SRC/Psikoteknik yüklenemez → `AreAllMandatoryDocumentsApproved` asla sağlanmaz → **web şoför ASLA `Active` olamaz.** · Kart→docType eşle (`license→DriverLicense, src→SrcCertificate, psychotechnic→Psychotechnical`), iki çağrıya da ilet.**

**[ORTA] · `apps/web/src/pages/admin/Settings.tsx:1-33` · Admin Settings ekranı tamamen ÖLÜ · Hiç API yok; inputlar hardcoded `defaultValue="Admin Kullanıcı"/"admin@navlonix.com"` (`:11-12`), şifre alanları no-op, Kaydet butonu yok, "2FA: yakında" (`:29`). Mobil settings GERÇEK (`getUserProfile/updateUserProfile/changePassword`). · Mobildeki servislere bağla veya kapsam-dışı dokümante et.**

**[ORTA] · `apps/web/src/pages/driver/Track.tsx:1-5` · Web şoför "Takip" ekranı placeholder · `<PlaceholderPage title="Şoför Takip" description="Rota ve canlı konum ekrani burada olacak." />` — hiçbir işlev yok. Gerçek konum paylaşımı `driver/ActiveLoad.tsx`'te. (Not: `customer/Track.tsx` GERÇEK çalışan bir harita ekranı — placeholder değil.) · Placeholder'ı kaldır/yönlendir veya ActiveLoad haritasını taşı.**

**[ORTA] · `apps/web/src/pages/admin/ReviewsDetailModal.tsx:229` · "Notu Kaydet" butonu ÖLÜ · Yalnız `toast.info('Not taslak olarak saklandı...')` atar; hiçbir API çağrısı / kayıt yok. · Butonu kaldır veya gerçek not-kaydetme endpoint'ine bağla.**

**[DÜŞÜK] · `apps/web/src/pages/admin/Payments.tsx:78-91` · Admin Payments filtreleri tamamen DEKORATİF · Durum `<select>`, iki tarih input'u, "Müşteri/Şoför adı", "Tutar aralığı" inputlarının hiçbirinde `value`/`onChange`/state yok → hiçbir filtreleme yapmazlar. Mobil filtre çalışıyor. · State + filtre mantığı ekle veya kaldır.**

**[DÜŞÜK] · `apps/web/src/pages/admin/Payments.tsx:43,74-76` · "Başarısız İşlem" KPI'ı daima 0 · `failedCount` = status'ü `.includes('fail')` olanlar; backend hiç "Failed" statüsü döndürmez (yalnız Blocked/Released/Refunded) → metrik hep 0/yanıltıcı. · Metriği kaldır veya gerçek failed kaynağına bağla.**

**[DÜŞÜK] · `apps/web/src/lib/notificationHub.ts:11` · `createNotificationConnection` hiçbir yerden import edilmiyor (ölü kod) · Web bildirim gerçek-zaman SignalR yerine `TopBar` 10 sn polling kullanıyor; bu hub bağlanmıyor (grep: yalnız tanım, hiç çağrı). · TopBar'a bağla veya dosyayı sil.**

**[DÜŞÜK] · `apps/api/Yukle.Api/Controllers/AuthController.cs:125-126` (`POST /Auth/google`) · Tam implement ama hiçbir FE çağırmıyor · `AuthService.LoginWithGoogleAsync:391` çalışır; web/mobil login ekranlarında Google butonu yok (grep: yalnız backend + font importları). · FE entegre et veya kapsam-dışı dokümante et.**

---

## BÖLÜM 4 — KOPUK BAĞLANTI (FE ↔ BE)

### 4a) Web (FE eksik — backend hazır)

**[KRİTİK] · `apps/web/src/api/loads.ts` (export listesi 4-71) · `updateLoad` HİÇ YOK · Backend `LoadsController` PUT hazır, mobil `src/services/loads.service.ts:263 updateLoad` + `create-load.tsx:383` çalışıyor. Web `pages/customer/LoadDetail.tsx`'te edit butonu da yok. · **Etki:** web müşterisi açık-teklifli ilanını güncelleyemez. · Web'e edit akışı ekle.**

**[KRİTİK] · `apps/web/src/api/bids.ts` (export listesi 4-20) · `cancelBid` HİÇ YOK · Backend `BidsController` iptal hazır, mobil `src/services/bids.service.ts:64 cancelBid` + `app/(driver)/load-detail.tsx:124` çalışıyor. Web `pages/driver/Bids.tsx`'te buton yok. · **Etki:** web şoförü teklifini geri çekemez. · Web api client'a `cancelBid` + listeye buton ekle.**

**[ORTA] · `apps/web/src/api/addresses.ts` PUT destekler ama UI'da yok · `pages/customer/Addresses.tsx` yalnız Ekle/Varsayılan/Sil sunar; düzenleme yok. Mobil tam edit sunar. · Web'e edit formu ekle.**

### 4b) Mobil (FE eksik — web'de var)

**[ORTA] · `apps/mobile/yukle-mobile/src/services/matching.service.ts` (exports 5,35) · `getLoadMatch` (tekil yük AI uyum skoru) karşılığı YOK · Yalnız `getRecommendedLoads()` var. Web `pages/driver/LoadDetail.tsx:26 getLoadMatch` ile yük detayında AI uyum skoru gösterir; mobil detayda bu yok. · Mobil paritesi için tekil match servisi ekle.**

### 4c) Backend (endpoint var — FE çağrısı yok)

- `POST /Auth/google` (`AuthController.cs:125`) — FE'siz (Bölüm 3'te listelendi).
- `Hubs/TrackingHub.cs` (`Program.cs` map) — istemci tarafı sıfır referans (Bölüm 3/5'te; tamamen ölü).

---

## BÖLÜM 5 — EKSİK DURUM (loading / empty / error) + Sözleşme Uyuşmazlıkları

**[KRİTİK] · `apps/web/src/pages/driver/Dashboard.tsx:55-67` vs `apps/api/Yukle.Api/DTOs/DriverDashboardDto.cs:7-13` · Sözleşme uyuşmazlığı — HİÇBİR alan eşleşmiyor · Web `totalEarned/activeOffersCount/completedLoadsCount/rating` okur (`api/types.ts:66-69`); backend `CompletedJobCount/ActiveBidCount/TotalEarnings` döner ve **`rating` HİÇ döndürmez**. · **Etki:** web şoför panelinde Aktif Teklif / Tamamlanan / Kazanç / ⭐ **daima 0 / ₺0**. Mobil doğru alanları kullanır. · Web tipini `completedJobCount/activeBidCount/totalEarnings`'e hizala; rating'i ayrı `getUserRatings`'ten çek.**

**[KRİTİK] · `apps/web/src/pages/admin/Dashboard.tsx:31-34,90,95-98` vs `apps/api/Yukle.Api/Controllers/AdminController.cs:131-144` · Hayalet alanlar + hardcoded grafik · Backend `/Admin/dashboard` YALNIZ `totalUsers/activeLoadCount/pendingReviewCount/totalTransactionVolume/systemStatus/recentActions` döner. Web ek olarak `deliveredTodayCount/onWayCount/monthlyCommission/avgDeliveryHours` (`:31-34`) ve `customerCount/driverCount` (`:95`) okur → **hepsi `0`**. 7-günlük grafik sabit `[35,45,50,42,58,61,49]` (`:22`); güzergahlar sabit "İzmir → İstanbul: 42 / Ankara → Bursa: 31 / Mersin → Konya: 27" (`:96-98`); sağlık pill'leri statik dummy (`:44-57`). · **Etki:** web admin panelinin ikinci KPI satırı + grafik + güzergahlar tamamen sahte/0. · Hayalet alanları kaldır veya backend'e ekle.**

**[KRİTİK] · `apps/web/src/pages/admin/ReviewsDetailModal.tsx:37-43` · AI inceleme paneli backend'in YAZMADIĞI alanları okuyor → hep uydurma + daima yeşil · `confidence = Number(ai.ConfidenceScore ?? 72)`, `validUntil = ai.ValidUntil ?? '12.05.2027'`, `licenseClass = ai.LicenseClass ?? 'CE'`, `nameMatch/tcMatch` (false değilse hep "Eşleşiyor"), `suspicious = ai.SuspiciousNotes ?? 'Tarih bölümü bulanık'`. Backend `AiInferenceDetails`'e bu alanları yazmaz. · **Etki:** admin sahte sabitlere (%72 güven, 12.05.2027) bakarak karar verir; gerçek confidence/red gerekçesi görünmez. · Web modalı backend JSON şemasına hizala (mobildeki `parseAiInferenceDetails` mantığı).**

**[KRİTİK] · `apps/web/src/pages/customer/Analytics.tsx:19-20,108,115` · Müşteri analitiği büyük ölçüde demo/hardcoded · `months = ['Oca'..'Haz']` + `spend = [8200,9100,7800,12450,9900,11200]` sabit (`:19-20`); karbon "2.4 t CO₂e bu ay" (`:108`); tasarruf "₺1.240" (`:115`). Mobil (`analytics.tsx`) harcama/güzergahı GERÇEK history'den hesaplar + karbon/tasarrufu açık DEMO etiketiyle işaretler. · **Etki:** web analitik neredeyse tamamen sahte; ciddi parite + güven sorunu. · Mobildeki gibi `getCustomerLoadHistory` + gerçek hesaplamaya taşı.**

**Pozitif (doğrulandı — durum yönetimi sağlam ekranlar):** `Payments.tsx` (loading skeleton + PageError + boş-durum kartı), `customer/Track.tsx` (PageSkeleton/PageError/PageEmpty + LiveMap), `admin/Dashboard.tsx` (skeleton + PageError) gerçek loading/empty/error durumlarına sahip. Genel desen: API hatasında kullanıcı **boş ekran/çökme değil**, `PageError` banner'ı görür (çoğu sayfa `.catch(e => setError(e.uiMessage ?? '...'))`).

---

## BÖLÜM 6 — TODO/FIXME/HACK + Hardcoded Demo/Sahte Veri

### 6a) Literal markerlar

`grep "\bTODO\b|\bFIXME\b|\bHACK\b"` (api+web+mobil, lock dosyaları hariç) → **0 gerçek marker.** "XXX" eşleşmeleri yalnız telefon placeholder'ı `5XXXXXXXXX` (false-pozitif, ör. `AuthController.cs:237-248`, `LoginScreen.tsx:96`).

### 6b) Hardcoded demo / sahte veri sabitleri

| Önem | dosya:satır | Sahte sabit |
|---|---|---|
| KRİTİK | `web/src/pages/admin/Dashboard.tsx:22` | 7-günlük grafik `[35,45,50,42,58,61,49]` |
| KRİTİK | `web/src/pages/admin/Dashboard.tsx:96-98` | Güzergahlar "İzmir→İstanbul: 42 / Ankara→Bursa: 31 / Mersin→Konya: 27" |
| KRİTİK | `web/src/pages/customer/Analytics.tsx:20` | Harcama dizisi `[8200,9100,7800,12450,9900,11200]` |
| KRİTİK | `web/src/pages/customer/Analytics.tsx:108,115` | Karbon "2.4 t CO₂e", tasarruf "₺1.240" |
| KRİTİK | `web/src/pages/admin/ReviewsDetailModal.tsx:37,39,40,43` | AI fallback'leri `72`, `'12.05.2027'`, `'CE'`, `'Tarih bölümü bulanık'` |
| ORTA | `web/src/pages/admin/Settings.tsx:11-12` | `defaultValue="Admin Kullanıcı"`, `"admin@navlonix.com"` |
| ORTA | `web/src/pages/admin/System.tsx:51-52` | "Önbellek: Devre dışı / Canlı ortamda etkin olacak" |
| ORTA | `web/src/pages/admin/System.tsx:58` | "Yakıt fiyatı görevi: Son çalışma 10 dk önce" (hardcoded) |
| ORTA | `web/src/pages/admin/System.tsx:60` | "Belge temizleme: Son çalışma 1 saat önce" (hardcoded) |
| ORTA | `api/Yukle.Api/Controllers/AdminController.cs:645-646` | `MonthlyCommission = null, "not_calculated"` (backend placeholder) |

### 6c) "Yakında" / placeholder etiketleri (kabul edilebilir ama ölü)

- `web/src/pages/admin/Settings.tsx:29` — "2FA: yakında aktif olacak (placeholder)".
- `web/src/pages/driver/Track.tsx:4` — `PlaceholderPage` (Bölüm 3).
- `mobile/.../app/(customer)/settings.tsx:42,48` — bildirim toggle hint'leri "(yakında)".
- `mobile/.../app/(customer)/(tabs)/dashboard.tsx:233,237` — "Yakında" rozeti + "AI rota/fiyat önerileri yakında".
- `mobile/.../app/(admin)/(tabs)/system.tsx:41` ve `settings.tsx:191` — "(yakında)" satırları.

### 6d) Diğer ortamsal sabit/dev artıkları

- `web/src/api/auth.ts:11` — `console.log('[register payload]', data)` (register payload'ı konsola döker; PII sızıntısı riski, prod'da kaldırılmalı).
- `api/Yukle.Api/Controllers/AdminController.cs:117-129` — Redis healthcheck in-memory cache üzerinden (Program.cs `AddDistributedMemoryCache`) → roundtrip hep başarılı → dashboard daima `redis="Online"` (Redis fiilen YOK; tek yanıltıcı sağlık göstergesi).

---

## EN KRİTİK 10 MADDE

| # | Önem | Bulgu | Konum |
|---|---|---|---|
| 1 | KRİTİK | Login'de `IsActive` guard'ı yok → "banla/suspend" müşteride fiilen ETKİSİZ | `api/.../Services/AuthService.cs:367-389` |
| 2 | KRİTİK | Web şoför belge yükleme hep `DriverLicense` → web şoför ASLA `Active` olamaz | `web/.../pages/driver/Documents.tsx:29,44` + `api/ai.ts:3,13` |
| 3 | KRİTİK | Web "Kodu Tekrar Gönder" ölü → OTP kaçıran web kullanıcısı kayıt olamaz | `web/.../pages/auth/VerifyPhone.tsx:111-117` + `api/auth.ts` |
| 4 | KRİTİK | Web şoför Dashboard sözleşme uyuşmazlığı → tüm değerler 0/₺0 | `web/.../pages/driver/Dashboard.tsx:55-67` vs `DTOs/DriverDashboardDto.cs:7-13` |
| 5 | KRİTİK | Web admin Dashboard ikinci KPI satırı + grafik + güzergahlar sahte/0 | `web/.../pages/admin/Dashboard.tsx:22,31-34,90,95-98` |
| 6 | KRİTİK | Web admin AI inceleme paneli uydurma veri (hep yeşil, %72, 12.05.2027) | `web/.../pages/admin/ReviewsDetailModal.tsx:37-43` |
| 7 | KRİTİK | Web müşteri Analitik büyük ölçüde demo/hardcoded | `web/.../pages/customer/Analytics.tsx:20,108,115` |
| 8 | KRİTİK | Şoför yük detayı AI match çağrısına bağlı → Gemini 500'de detay çöker | `web/.../pages/driver/LoadDetail.tsx:26,31` |
| 9 | KRİTİK | Web'de `updateLoad` + `cancelBid` yok (backend + mobil hazır) | `web/.../api/loads.ts`, `web/.../api/bids.ts` |
| 10 | ORTA | Web ESLint 61 problem + mobilde lint script'i hiç yok | `eslint src` çıktısı + `mobile/.../package.json:5-10` |

---

*Bu rapor salt-okuma analizdir; hiçbir kaynak dosya veya DB değiştirilmemiştir. Her bulgu kaynak koddan `dosya:satır` ile bağımsız doğrulanmış; doğrulanamayan iddialar dahil edilmemiştir.*
