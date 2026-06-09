# SORUN TARAMA 3 — Uç Durum & Dayanıklılık Taraması

> READ-ONLY analiz. Hiçbir kaynak dosya veya DB değiştirilmedi. Her bulgu gerçek `dosya:satır` ile gerekçelendirildi.
> Kapsam: İLAN · TEKLİF · ÖDEME/ESCROW · SOHBET · BELGE akışları × 6 eksen (boş/null, ağ/hata, yarış/eşzamanlılık, geçersiz giriş, durum ihlali, yetim veri).
> Backend: `apps/api/Yukle.Api` · Web: `apps/web/src` · Mobil: `apps/mobile/yukle-mobile`

---

## YÖNETİCİ ÖZETİ

Genel olarak **çekirdek finansal akışlar (Accept / Hold / Release / Refund) sağlam** kurgulanmış: transaction + `CreateExecutionStrategy`, idempotency guard'ları (Blocked tek kayıt, `IX_WalletAuditLogs_CustomerRefund_Unique`), `PostgresRowLock` ve durum guard'ları mevcut. FE tarafında `getApiErrorMessage`/`AlertBanner`/`uiMessage` kullanımı büyük ölçüde tutarlı ve aksiyon butonlarının çoğu busy guard'lı.

Ancak birkaç **yapısal risk** öne çıkıyor:

1. **[KRİTİK] DocumentCleanupJob, `ExecuteDeleteAsync` ile EF cascade'i ATLAR** ve PendingReview şoförleri 30 günde siler. Gri-alan (düşük görsel kalite ama geçerli) belgeli meşru şoför PendingReview'a düşebildiği için **yanlışlıkla silinme** + filtrelenmiş unique index ve `PaymentTransaction→Load Restrict` yüzünden **FK ihlaliyle tüm batch'in patlaması** riski var.
2. **[KRİTİK] ChatMessage'ın hiçbir FK ilişkisi yok** (`LoadId`/`SenderUserId` ham alan). Yük veya kullanıcı silindiğinde sohbet mesajları **yetim** kalır; KVKK temizliğinde de silinmezler.
3. **[ORTA] Müşteri, Assigned ilanı iptal ettiğinde escrow iade EDİLMEZ** (`needsRefund = isAdmin && ...`). `AllowCustomerCancelAfterAccept=true` yapıldığında para emanette sıkışır, bid kapanır.
4. **[ORTA] Web `LoadDetail` `Promise.all([getLoad, getBidsForLoad])`** — biri 500 dönerse tüm detay sayfası çöker (boş/hata). Mobil müşteri detayında da aynı kalıp.
5. **[ORTA] Teslimat QR durum tutarsızlığı**: QR `Assigned`/`OnWay` için üretilir ama `DeliverAsync` `OnWay`/`Arrived` ister; ayrıca FE'de min teklif/ağırlık eşikleri BE ile uyumsuz.

En kritik maddeler raporun sonunda listelenmiştir.

---

## 1) İLAN AKIŞI

### [KRİTİK] · İlan · `BackgroundServices/DocumentCleanupJob.cs:130` + `Data/YukleDbContext.cs:127,287` · Yetim veri / silme patlaması
- **Senaryo:** Job, `db.Users.Where(...).ExecuteDeleteAsync(ct)` çağırır. `ExecuteDeleteAsync` **ham SQL DELETE** üretir ve EF Core in-memory cascade'ini **çalıştırmaz** — yalnızca veritabanı seviyesindeki FK davranışına güvenir. Kod yorumu (`DocumentCleanupJob.cs:127-129`) "EF Core Cascade Delete… otomatik silinir" diyor; bu yanlış.
- **Etki:** (a) Silinen kullanıcı bir yükün `DriverId`'si ise `Load→Driver` = **Restrict** (`YukleDbContext.cs:135`) → DELETE FK ihlaliyle patlar, `catch(Exception)` yutar, **batch tamamen başarısız** olur, hiç temizlik yapılmaz. (b) Silinen kullanıcının yükünde `PaymentTransaction` varsa `PaymentTransaction→Load` = **Restrict** (`YukleDbContext.cs:287-290`) → yine FK ihlali. (c) DB cascade kuruluysa `OwnedLoads` (Cascade, `:127`) ve `Bids` sessizce gider.
- **Öneri:** İlişkili veriyi açıkça (bid/load/payment kontrolü ile) ele al; `ExecuteDeleteAsync` yerine entity yükleyip `RemoveRange` veya guard'lı manuel cascade kullan; FK ihlali olasılığını silmeden önce filtrele.

### [KRİTİK] · İlan · `Services/AuthService.cs:646-648,736,838` ↔ `DocumentCleanupJob.cs:85-102` · Meşru şoförün yanlışlıkla silinmesi
- **Senaryo:** Belge "geçerli ama düşük güven/gri alan" ise hesap `ApprovalStatus.PendingReview`'a alınır (`AuthService.cs:646`, `MarkPendingReviewAsync:838`). DocumentCleanupJob, `PendingReview` + `Rejected` durumdaki ve `CreatedAt < cutoff (30 gün)` olan TÜM kullanıcıları siler (`DocumentCleanupJob.cs:85-102`).
- **Etki:** Admin onay kuyruğunda 30 günden uzun bekleyen **geçerli belgeli şoför** (admin gecikmesi nedeniyle) sessizce silinir; verdiği teklifler, taşıdığı/sahip olduğu yükler de gider. Denetim/itiraz yolu kalmaz.
- **Öneri:** Silme kriterini `PendingReview`'ı hariç tutacak şekilde daralt (yalnız `Rejected`), veya "admin tarafından hiç dokunulmamış + belge yüklenmemiş" alt kümesine indir; PendingReview için ayrı, daha uzun saklama + uyarı bildirimi uygula.

### [ORTA] · İlan · `pages/customer/LoadDetail.tsx:41-50` · Ağ/hata: Promise.all tüm sayfayı düşürür
- **Senaryo:** `refreshDetail` = `Promise.all([getLoad(id), getBidsForLoad(id)])`. `getBidsForLoad` 500/timeout dönerse `Promise.all` reject olur, `catch` → `setError('İlan detayı yüklenemedi.')`, `load` hiç set edilmez.
- **Etki:** Teklif servisi geçici hata verince **yük detayı, timeline, escrow, QR — hepsi görünmez**. Mobil müşteri detayında aynı kalıp (`app/(customer)/load-detail.tsx:152`).
- **Öneri:** `Promise.allSettled` kullan; yük çekilebildiyse göster, bid hatasını ayrı bir banner ile bildir.

### [ORTA] · İlan · `Controllers/LoadsController.cs:343` ↔ `Services/LoadService.cs:286` · Durum ihlali: QR ile teslim guard tutarsızlığı
- **Senaryo:** `GetDeliveryQr`, durum `OnWay` **veya** `Assigned` iken QR üretir (`:343`). `DeliverAsync` ise yalnız `OnWay`/`Arrived` kabul eder (`LoadService.cs:286`). Şoför pickup yapmadan (Assigned) QR alabilir ama deliver çağrısı reddedilir → kafa karışıklığı.
- **Etki:** Düşük; BE deliver guard'ı son sözü söylüyor ama FE'de "QR aldım, teslim edemedim" UX tutarsızlığı.
- **Öneri:** QR üretimini de `OnWay`/`Arrived` ile sınırla (veya deliver guard'ına `Assigned` ekleme kararını tek noktada netleştir).

### [DÜŞÜK] · İlan · `Controllers/LoadsController.cs:457,463` · Boş/null: history projeksiyonu
- `DriverName = db.Users.Where(...).FirstOrDefault()` — sürücü silinmiş/atanmamışsa `null`; FE'de "—" gösterimi yoksa boş alan. `TotalSpend`/`TotalEarn` null-coalesce ile 0'a düşürülmüş (iyi).

### [DÜŞÜK] · İlan · `DTOs/CreateLoadDto.cs:58` vs Mobil teklif eşiği · Geçersiz giriş uyumsuzluğu
- Ağırlık BE'de `0.1–100_000 kg` (`:58`). Mobil/Web FE'de ağırlık üst sınırı genelde daha düşük gösteriliyor; tek doğrulama kaynağı BE olduğundan kritik değil ama FE/BE eşik dokümante edilmeli.

---

## 2) TEKLİF AKIŞI

### [İYİ] · Teklif · `Services/BidService.cs:140-231` · Yarış/eşzamanlılık — sağlam
- `AcceptBidAsync` `CreateExecutionStrategy` + `BeginTransactionAsync` içinde: Guard1 Pending, Guard2 sahiplik, **Guard3 Load hâlâ Active** (`:164`). İki kez kabul edilmeye çalışılırsa ikinci çağrı `bid.Status != Pending` veya `Load.Status != Active`'te düşer. Toplu reddetme tek SQL UPDATE. Hold başarısızsa exception → rollback. **Doğru kurgu.**

### [ORTA] · Teklif · `pages/customer/LoadDetail.tsx:78-88,220-223` · Yarış: web'de Accept butonu çift tıklamaya açık
- **Senaryo:** `onAccept` çağrılırken buton **disable edilmiyor** (`:221` butonda `disabled` yok, busy state tutulmuyor). Hızlı çift tıklama iki paralel `acceptBid` isteği gönderir.
- **Etki:** Düşük (BE transaction ikinci isteği reddeder, kullanıcı sadece hata mesajı görür) ama UX kötü; mobilde bu sorun YOK (`app/(customer)/load-detail.tsx:141,218` `acceptingId` busy guard'lı — doğru).
- **Öneri:** Web'de de `acceptingId`/busy state ekleyip butonu disable et.

### [ORTA] · Teklif · `app/(driver)/load-detail.tsx:140` vs `DTOs/CreateBidDto.cs:16` · Geçersiz giriş: min teklif eşiği uyumsuz
- **Senaryo:** Mobil FE min teklifi **100 TL** (`load-detail.tsx:140`), BE min **0.01 TL** (`CreateBidDto.cs:16` `Range(0.01, …)`). Web'den veya doğrudan API'den 1 TL teklif geçer.
- **Etki:** Tutarsız iş kuralı; istenmeyen düşük teklifler BE'den kabul edilir.
- **Öneri:** BE `Range` alt sınırını iş kuralına (örn. 100) çek veya FE/BE'yi tek değerde hizala.

### [DÜŞÜK] · Teklif · `Services/BidService.cs:27-61` · Yarış: SubmitBid transaction'sız
- `SubmitBidAsync` "daha önce teklif var mı" kontrolü (`:41`) ile insert arasında transaction/unique kısıt yok. Aynı şoför aynı anda iki kez submit ederse iki Pending bid oluşabilir (yarış penceresi dar). DB'de `(LoadId, DriverId)` unique index yok.
- **Öneri:** `Bids` üzerinde `(LoadId, DriverId)` unique index ekle (idempotency garantisi).

### [DÜŞÜK] · Teklif · `Services/BidService.cs:90` · Boş/null: DriverPhone her zaman boş string
- Müşteri görünümünde `DriverPhone = string.Empty` (bilinçli gizleme), admin görünümünde dolu — beklenen davranış, kayıt amaçlı.

---

## 3) ÖDEME / ESCROW AKIŞI

### [İYİ] · Ödeme · `Services/MockPaymentService.cs:55-61,92-114` · İdempotency — büyük ölçüde sağlam
- Hold: `alreadyHeld` (Blocked var mı) kontrolü → çift hold engellenir (`:55`). Release: yalnız `Status==Blocked` arar, ikinci release `null` döner (`:94-100`). Refund: `PostgresRowLock.LockPaymentForLoadAsync` + `Refunded` erken dönüş + WalletAuditLog unique reason kontrolü (`:120-142`). Üç katmanlı idempotency. **İyi.**

### [ORTA] · Ödeme · `Services/CancellationService.cs:84,112-124` · Durum ihlali / para sıkışması: müşteri iptalinde iade yok
- **Senaryo:** `needsRefund = isAdmin && load.Status == Assigned && DriverId != null` (`:84`). `AllowCustomerCancelAfterAccept=true` iken (config'te mevcut, `appsettings.example.json:56`) müşteri Assigned ilanı iptal edebilir (`LoadCancellationRules.cs:20-21`) ama `isAdmin=false` olduğu için **RefundEscrowAsync hiç çağrılmaz**. Load `Cancelled`, accepted bid `Cancelled` olur; PaymentTransaction **Blocked** kalır, şoförün PendingBalance'ı **geri alınmaz**.
- **Etki:** Para emanette sıkışır, şoför bakiyesi şişik kalır, müşteri iadesini alamaz. Flag default `false` olduğu için bugün gizli; açılırsa finansal tutarsızlık.
- **Öneri:** `needsRefund` koşulundan `isAdmin` şartını kaldır; iptal eden kim olursa olsun Assigned + escrow varsa `RefundEscrowAsync` çağır.

### [ORTA] · Ödeme · `Services/MockPaymentService.cs:92-101` · Yarış: Release'de row-lock yok
- **Senaryo:** `ReleasePaymentAsync` Blocked kaydı bulur, `ApplyReleaseAsync` ile bakiyeyi taşır, sonra Status=Released. Refund'un aksine **`PostgresRowLock` kullanmıyor**. `DeliverAsync` transaction içinde çağrıldığı için pratikte korunuyor; ancak iki eşzamanlı deliver (aynı sürücü, çift cihaz) teorik olarak iki release deneyebilir.
- **Etki:** Düşük-orta; `Status==Blocked` filtresi + EF concurrency pratik koruma sağlar, ama bilinçli row-lock yok.
- **Öneri:** Release'i de `PostgresRowLock.LockPaymentForLoadAsync` ile sarmala (Refund ile simetrik).

### [İYİ] · Ödeme · `Services/WalletLedgerService.cs:68-72,118-121` · Negatif bakiye guard'ı
- Release ve Refund öncesi `PendingBalance < required` kontrolü ile yetersiz bakiyede exception (`:68`, `:118`). Çifte ters çevirmeyi (double-reversal) engeller. **İyi.**

### [DÜŞÜK] · Ödeme · `pages/.../EscrowCard.tsx:21-27` · Ağ/hata: payment yüklenemezse sessiz
- `getPaymentForLoad(...).finally(setLoaded(true))` — `catch` yok; hata olursa `payment=null` kalır, kart "emanet yok" veya boş gösterir. Müşteriye hata bildirilmez (read-only kart olduğu için tolere edilebilir).

---

## 4) SOHBET AKIŞI

### [KRİTİK] · Sohbet · `Models/ChatMessage.cs:1-16` + `Data/YukleDbContext.cs:239-247` · Yetim veri: FK ilişkisi tamamen yok
- **Senaryo:** `ChatMessage.LoadId` ve `SenderUserId` **ham alan** (`ChatMessage.cs:4,5`). `OnModelCreating`'te (`:239-247`) yalnız property uzunlukları + index var; **hiçbir `HasOne(...).HasForeignKey(...)` tanımı yok**.
- **Etki:** (a) Yük silindiğinde (örn. müşteri Cascade silinince `OwnedLoads`) ait sohbet mesajları **DB'de yetim** kalır. (b) DocumentCleanupJob kullanıcı silince mesajlar gitmez → KVKK'da "kişisel veriyi 30 günde sil" hedefiyle çelişir. (c) Geçersiz `LoadId`'li mesaj insert edilmesini engelleyen referans bütünlüğü yok.
- **Öneri:** `ChatMessage→Load` (Cascade) ve `→User(Sender)` (Restrict) FK ilişkilerini tanımla; KVKK temizliğine sohbet mesajlarını da dahil et.

### [İYİ] · Sohbet · `Hubs/ChatHub.cs:63-99,114-121` · Yetki & boş mesaj guard'ları
- `JoinChatGroup`/`SendMessage`: geçersiz GUID, yük yok, owner/driver değilse `HubException`; boş mesaj reddi (`:103`); moderation kontrolü (`:135`). Engellenen mesaj DB'ye `IsBlocked=true` kaydedilip exception fırlatılıyor. **İyi.**

### [ORTA] · Sohbet · `Controllers/ChatController.cs:30` ↔ `Hubs/ChatHub.cs:117-120` · Durum ihlali: teslim sonrası sohbet açık
- **Senaryo:** Erişim yalnız `load.UserId == userId || load.DriverId == userId` kontrolüne dayalı; **yük durumuna (Delivered/Cancelled) bakılmıyor**. FE `canCustomerOpenChat`/`canDriverOpenChat` ile butonu gizliyor olabilir ama Hub/Controller seviyesinde Delivered/Cancelled yükte hâlâ mesaj gönderilebilir.
- **Etki:** Düşük-orta; iş bittikten sonra taraflar mesajlaşmaya devam edebilir (istenebilir de). İş kuralına göre kısıtlanmalı.
- **Öneri:** Gerekirse Hub `SendMessage`'a aktif durum guard'ı ekle.

### [DÜŞÜK] · Sohbet · `Hubs/ChatHub.cs:73,114` · Ağ/hata: her mesajda `GetLoadByIdAsync`
- Her `SendMessage`'ta tam load DTO çekiliyor (projeksiyon + Owner). Yüksek trafik sohbette gereksiz DB yükü; fonksiyonel sorun değil.

---

## 5) BELGE AKIŞI

### [ORTA] · Belge · `Controllers/AiController.cs:43,202` · Geçersiz giriş: OCR dosya tipi/boyut zayıf doğrulama
- **Senaryo:** `AnalyzeDocument`/`EnqueueOcr` yalnız `file.Length == 0` kontrol ediyor; MIME `switch` default'u her şeyi `image/jpeg`'e zorluyor (`:33-38`). **Maksimum boyut, gerçek içerik/uzantı, PDF reddi yok.**
- **Etki:** Çok büyük dosya MemoryStream'e tam kopyalanır (`:40-42`) → bellek baskısı/DoS yüzeyi; bozuk içerik Gemini'ye gider.
- **Öneri:** `RequestSizeLimit`/içerik tipi allow-list + boyut sınırı uygula.

### [ORTA] · Belge · `Services/GeminiServiceClient.cs:67-77` · Ağ/hata: model config eksikse fail-fast
- Model adı geçersizse **uygulama başlamaz** (`InvalidOperationException`, `:71`). Bu bilinçli (fail-fast) ama runtime'da Gemini API çökerse Polly (Retry×3 + CB 5/30s + Timeout 10s, sınıf yorumu `:19`) devrede; OCR/fiyat akışları fallback'e düşer. Belge OCR fallback'i fiyat kadar zengin değil — Gemini down iken şoför onayı **takılır** (gri alan/PendingReview'a düşebilir → bkz. KRİTİK silme riski).
- **Öneri:** Gemini kesintisinde OCR'ı "geçici hata, tekrar dene" olarak işaretle; otomatik Rejected/PendingReview'a düşürme.

### [İYİ] · Belge · `Services/AuthService.cs:657-688` · Durum ihlali: reddedilen belgede asla aktifleşme
- Reddedilen/kimlik uyuşmazlığı durumunda `IsActive=false` zorlanıyor (`:660,687`). Güvenlik açısından doğru.

### [DÜŞÜK] · Belge · `Controllers/LoadsController.cs:46-60` · Durum ihlali: ilan açmak için aktiflik kontrolü
- Müşteri `IsActive` değilse 403 (`:58`). Şoför tarafı `RequireActiveDriver` policy ile korunuyor (teklif/eşleşme). Tutarlı.

---

## 6) ÇAPRAZ KESİT — EKSEN BAZLI NOTLAR

- **Boş/Null:** `AiSuggestedPrice` null güvenli yönetiliyor — mobil/web detayda `aiSuggestedPrice != null && > 0` guard'ı (`app/(driver)/load-detail.tsx:237`, `(customer)/load-detail.tsx:384`). `getLoadMatch` 500 dönerse `MatchingController.cs:204` 500 döner; FE çağıran tarafında ayrı banner ile ele alınmalı (Promise.all'a katılmıyorsa güvenli).
- **Ağ/Hata:** `apiClient` timeout=15s, 401→refresh→retry kuyruğu (`client.ts:74-128`), `!error.response`'ta "sunucuya bağlanılamadı" mesajı (`:29`). `uiMessage`/`uiDetails` tutarlı set ediliyor. **Genel hata altyapısı iyi.** Retry yalnız 401 için; 500/timeout'ta otomatik retry yok (kullanıcı manuel tetikler).
- **Yarış:** Accept/Pickup/Deliver/Cancel/Edit hepsi `CreateExecutionStrategy + Transaction` (+ Cancel/Refund/Edit'te `PostgresRowLock`). **Tek eksik row-lock: Release.**
- **Geçersiz Giriş:** `CreateLoadDto` çapraz doğrulama iyi (pickup<bugün, delivery<pickup engelli — `:101-108`). IBAN `^TR\d{24}$`, TCKN `\d{11}`, telefon `\d{10,15}` (`UserRegisterDto.cs:13,64,68`). FE/BE eşik uyumsuzlukları: teklif min (100 vs 0.01), ağırlık üst sınır.
- **Durum İhlali:** BE guard'ları güçlü (SubmitBid Active, Accept Active+Pending, Deliver OnWay/Arrived, Cancel kuralları `LoadCancellationRules`). QR↔Deliver durum penceresi tutarsız (bkz. madde 1).
- **Yetim Veri:** `OnModelCreating` cascade haritası genelde bilinçli (Load→Owner Cascade, →Driver Restrict, PaymentTransaction→Load Restrict — finansal kayıt korunur). **İki boşluk: ChatMessage FK'sız + DocumentCleanup ExecuteDelete cascade atlaması.**

---

## EN KRİTİK MADDELER (öncelik sırası)

1. **[KRİTİK]** `DocumentCleanupJob.cs:130` — `ExecuteDeleteAsync` EF cascade'i atlar; `Load→Driver` / `PaymentTransaction→Load` Restrict yüzünden FK ihlali batch'i komple düşürür VEYA DB cascade'i sessizce yük/teklif siler. Üstelik **PendingReview meşru şoförü silebilir** (`AuthService.cs:646,838`).
2. **[KRİTİK]** `ChatMessage` FK ilişkisi yok (`ChatMessage.cs` + `YukleDbContext.cs:239-247`) → yük/kullanıcı silinince yetim sohbet, KVKK temizliği dışında kalır, referans bütünlüğü yok.
3. **[ORTA]** Müşteri Assigned iptalinde escrow iade edilmez (`CancellationService.cs:84`) — `AllowCustomerCancelAfterAccept` açılırsa para emanette sıkışır.
4. **[ORTA]** Web/mobil `LoadDetail` `Promise.all` (`pages/customer/LoadDetail.tsx:41`, `app/(customer)/load-detail.tsx:152`) — bid servisi hatası tüm detayı düşürür; `allSettled` gerekli.
5. **[ORTA]** Release'de row-lock yok (`MockPaymentService.cs:92`); Refund'la simetri kurulmalı.
6. **[ORTA]** FE/BE doğrulama uyumsuzlukları: teklif min 100 vs 0.01 (`load-detail.tsx:140` vs `CreateBidDto.cs:16`); QR↔Deliver durum penceresi (`LoadsController.cs:343` vs `LoadService.cs:286`); web Accept çift-tıklama guard'ı eksik (`LoadDetail.tsx:221`).
7. **[ORTA]** OCR yükleme boyut/MIME doğrulaması zayıf (`AiController.cs:33-42`) + Gemini kesintisinde şoför onayının PendingReview'a takılıp (1) ile birleşip silinme zinciri.
