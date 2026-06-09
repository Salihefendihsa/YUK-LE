# SORUN TARAMA 4 — Performans & Veritabanı Analizi

> READ-ONLY analiz. DB'ye dokunulmadı; yalnızca entity/sorgu/komponent kodu okundu.
> Repo: `C:/Users/SALİH/OneDrive/Desktop/YÜK-LE`
> Kapsam: Backend (`apps/api/Yukle.Api`), Web (`apps/web/src`), Mobil (`apps/mobile/yukle-mobile`)
> Tarih: 2026-06-07

---

## Yönetici Özeti

Sistem genel olarak DTO projeksiyonu, `AsNoTracking`, `ExecuteUpdateAsync` ve bazı bileşik index'ler gibi doğru kalıpları **kısmen** uyguluyor. Ancak ölçek büyüdüğünde patlayacak birkaç **kritik** problem var:

1. **Mobil `chatThreads.service.ts` gerçek bir N+1**: her sohbet thread'i için ayrı ayrı `getChatMessages` (tüm transkript) + `getBidsForLoad` çağrısı yapılıyor. 50 ilan = 100+ HTTP isteği + her birinde tam mesaj listesi. (KRİTİK, doğrulandı.)
2. **`GetActiveLoads` sayfalama sahte**: backend TÜM aktif yükleri RAM'e çekiyor, controller bellekte `Skip/Take` yapıyor. Web `ChatsPage`/`Loads` de `pageSize: 80` ile geniş çekiyor. (KRİTİK.)
3. **Admin chat özeti (`GetChats`)** son 800 mesajı tam entity olarak RAM'e çekip bellekte grupluyor; `Take(800)` keyfi ve eksik mesaj riski taşıyor. (ORTA-KRİTİK.)
4. **Çok sayıda admin/rating/wallet endpoint'i sayfalamasız** (`GetDrivers`, `GetCustomers`, `GetLoads`, `GetPayments`, `Transactions`, `GetByUser`, `GetAllRatings`) — `Take` yok veya 200-500 sabit limit. Veri büyüdükçe yavaşlar.
5. **Eksik index'ler**: `Bid.LoadId+Status`, `Bid.DriverId`, `PaymentTransaction.LoadId`/`Status`, `Load.DriverId+Status`, `Load.UserId+Status`, `WalletAuditLog (LoadId,UserId,Type)`, `Rating.GivenToUserId`. Bunlar dashboard/komisyon/cüzdan dökümünün en sıcak sorguları.
6. **Frontend**: web bildirim polling **10 sn** (`TopBar`), her cycle 40 bildirim + sayım çekiyor; konum polling 20 sn (temiz). Ham entity dönüşleri (`GetChatByLoad`, admin `GetChats`) ağır payload. Landing 3D (three.js + GSAP + leaflet) lazy bölünmüş (iyi) ama vendor manuel chunk yok.

Aşağıda her bölüm `dosya:satır` gerekçesiyle detaylandırılmıştır.

---

## 1 — N+1 Sorgu / Eksik Include

### [KRİTİK] · `apps/mobile/yukle-mobile/src/services/chatThreads.service.ts:23-49, 56-70`
**Sorun:** `enrichThreads` her thread için `getChatMessages(thread.loadId)` çağırıyor (satır 27) — her ilan için ayrı HTTP isteği ve her istek o ilanın **tüm** sohbet transkriptini çekiyor (`chat.service.ts:19-24`, `Chat/{loadId}/messages` sınırsız döner). Ayrıca `getCustomerChatThreads` her uygun ilan için ayrı `getBidsForLoad(load.id)` çağırıyor (satır 60). `Promise.all` paralel yapsa da N adet round-trip + N adet tam mesaj listesi indirilir.
**Etki:** 50 aktif sohbeti olan bir kullanıcıda tek "Mesajlar" ekranı açılışı = ~50 mesaj endpoint + ~50 teklif endpoint = 100+ istek, her biri tam transcript. Mobil veri/pil/sunucu yükü doğrusal artar; liste görünür gecikme.
**Öneri:** Backend'e tek bir "thread özeti" endpoint'i ekle (her load için yalnızca `lastMessage`, `lastMessageAt`, `messageCount` — `AdminController.GetChats`'teki gibi tek sorguda gruplama). İstemci tek çağrıyla listeyi alsın; tam transcript yalnızca thread açıldığında çekilsin.

### [ORTA] · `apps/api/Yukle.Api/Controllers/AdminController.cs:713-768` (`GetChats`)
**Sorun:** `ChatMessages` tablosundan son 800 mesaj **tam entity** olarak çekiliyor (satır 716-720, `Select` yok), sonra bellekte `GroupBy(LoadId)` ile özetleniyor (satır 722-737).
**Etki:** `Take(800)` keyfi: 800 mesaj birkaç yoğun ilana aitse, daha eski ama hâlâ aktif ilanlar özet listesinden düşer (yanlış sonuç). Her mesajın `Message` (max 2000 char) + tüm kolonları RAM'e gelir → gereksiz bellek/ağ. DB tarafında gruplama yapılmadığı için ölçekte verimsiz.
**Öneri:** Gruplama ve "son mesaj" seçimini SQL'e taşı (`GroupBy(LoadId).Select(g => new { g.Key, LastAt = g.Max(...), MessageCount = g.Count() })`), `Take(200)` özet seviyesinde uygulansın; `LastMessage`'ı ayrı korele alt-sorgu ile getir.

### [DÜŞÜK] · `apps/api/Yukle.Api/Services/WalletLedgerService.cs:13-47` (`ApplyHoldAsync`)
**Sorun:** Tek hold işleminde 4 ayrı `AddLogAsync` çağrısı her biri `context.WalletAuditLogs.AddAsync` ile audit satırı ekliyor (Hold, Commission, CustomerCommission, Tax). Aynı şekilde `ApplyRefundAsync:127-158` 3-5 satır ekliyor.
**Etki:** Bu kabul edilebilir bir tasarım (tek `SaveChanges` çağıranda toplanır) **ancak** çağıran katmanda `SaveChanges` çağrısının tek transaction içinde olduğu doğrulanmalı; aksi halde döngü-içi I/O olur. Burada `AddAsync` DB'ye gitmez (sadece change tracker), bu yüzden N+1 değil — yine de not düşülmüştür.
**Öneri:** Mevcut hâli kabul edilebilir; `AddAsync` yerine senkron `Add` kullanmak gereksiz Task alokasyonunu önler (audit satırları value-generated key kullanmıyorsa).

### [DÜŞÜK] · `apps/api/Yukle.Api/Services/BidService.cs:118-136` (`GetBidsByDriverIdAsync`)
**Sorun:** `b.Load.FromCity` / `b.Load.ToCity` projeksiyonda kullanılıyor, `Include` yok ama EF Core projeksiyon JOIN'e çevirir (sorun yok). Aynı kalıp `LoadService` DTO projeksiyonlarında `l.Owner.FullName`, `l.Bids.Count` için de doğru (lazy değil, projeksiyon). N+1 **yok** — doğrulandı, pozitif bulgu.

---

## 2 — Sayfalama Yok / Sahte Sayfalama

### [KRİTİK] · `apps/api/Yukle.Api/Controllers/LoadsController.cs:172-228` (`GetActiveLoads`)
**Sorun:** Endpoint `page`/`pageSize` parametrelerini kabul ediyor (satır 185-186) ama **veriyi önce tamamen çekiyor**: `loadService.GetActiveLoadsAsync()` (`LoadService.cs:81-115`) `Where(Active).ToListAsync()` ile TÜM aktif yükleri RAM'e alır. Filtreleme/sıralama/`Skip/Take` hepsi bellekte `IEnumerable` üzerinde yapılır (satır 208-226). `query.Count()` ve `query.Skip().Take()` LINQ-to-Objects.
**Etki:** Aktif ilan sayısı büyüdükçe (binlerce) her istek tüm tabloyu çeker; sayfalama yalnızca yanıt boyutunu küçültür, DB/ağ yükünü küçültmez. Filtreler de index kullanamaz.
**Öneri:** Filtreleme + sıralama + `Skip/Take`'i `IQueryable` üzerinde DB'ye taşı. `GetActiveLoadsAsync`'e filtre/sayfa parametreleri ekle, `ToListAsync`'i en sona al.

### [ORTA] · `apps/api/Yukle.Api/Controllers/AdminController.cs:245-305 (GetDrivers), 307-355 (GetCustomers), 377-450 (GetLoads)`
**Sorun:** Hiçbirinde `Skip/Take` yok; `OrderByDescending(CreatedAt).Select(...).ToListAsync()` ile tüm satırları döner. `GetCustomers` ayrıca her müşteri için iki korele alt-sorgu (`totalLoadCount`, `totalSpent`) içeriyor (satır 340-341) — N müşteri = 2N alt-sorgu (SQL'de tek sorguya çevrilir ama index'siz `Loads.UserId` üzerinde ağır).
**Etki:** Platform büyüdükçe admin "Şoförler"/"Müşteriler"/"İlanlar" sayfaları tüm tabloyu çeker. `GetCustomers` agregasyonu `Load.UserId` index'i olmadan tablo taraması yapar.
**Öneri:** `GetUsers` (satır 653-686) zaten doğru `page/pageSize` + `Count` + `Skip/Take` kalıbını kullanıyor — aynı kalıbı bu üç endpoint'e uygula.

### [ORTA] · `apps/api/Yukle.Api/Controllers/WalletController.cs:63-110` (`Transactions`)
**Sorun:** Şoför ve müşteri işlem geçmişi `OrderByDescending(CreatedAt).ToListAsync()` ile **tamamen** döner; sayfalama yok, sadece opsiyonel `from/to` tarih filtresi var.
**Etki:** Aktif bir şoförün yüzlerce `WalletAuditLog` satırı tek istekte döner. `WalletAuditLogs` zaten 4-5 satır/işlem üretiyor (Bölüm 1), bu yüzden hacim hızlı büyür.
**Öneri:** `page/pageSize` ekle; `WalletAuditLogs(UserId,CreatedAt)` index'i mevcut (DbContext:304) — sayfalama doğrudan onu kullanır.

### [ORTA] · `apps/api/Yukle.Api/Controllers/RatingsController.cs:57-68 (GetByUser), 70-109 (GetAllRatings)`
**Sorun:** `GetByUser` bir kullanıcının TÜM puanlarını çeker (satır 60-64), sonra ortalamayı **bellekte** `ratings.Average` ile hesaplar (satır 66) — DB `AVG` yerine. `GetAllRatings` `Take(500)` sabit (satır 106) ama sayfalama yok ve iki `JOIN Users` (satır 94-95) `Rating.GivenToUserId` index'i olmadan çalışır.
**Etki:** Çok puan alan bir şoförde `GetByUser` tüm satırları indirir; ortalama DB'de tek skalerle dönebilecekken tüm liste taşınır. `GetAllRatings` 500 satırı her admin açılışında çeker.
**Öneri:** Ortalama+sayıyı ayrı `GroupBy`/`Average` skalerle al; liste için `page/pageSize` ekle. `Rating.GivenToUserId` index'i ekle (Bölüm 4).

### [DÜŞÜK] · `apps/api/Yukle.Api/Controllers/ChatController.cs:16-51` (`GetMessagesForLoad`)
**Sorun:** Bir ilanın tüm mesajları sınırsız döner (`Where(LoadId).OrderBy(CreatedAt).ToListAsync()`, satır 33-48). `Take` yok.
**Etki:** Tek ilanda sohbet çok uzunsa tüm transcript döner. Tek ilan bazında olduğu için pratik risk düşük, ama Bölüm 1'deki mobil N+1 ile çarpılınca ağırlaşır.
**Öneri:** İsteğe bağlı `before`/`limit` (cursor) parametresi ekle; `ChatMessages(LoadId,CreatedAt)` index'i mevcut (DbContext:246), cursor sayfalama buna oturur.

### [DÜŞÜK] · `apps/api/Yukle.Api/Controllers/AdminController.cs:871-895` (`DriverStats`, `CustomerStats`)
**Sorun:** `Loads.Where(...).ToListAsync()` ile tüm teslim edilen yükleri RAM'e çekip bellekte `Count/Sum/GroupBy` yapıyor (satır 874-880, 887-893).
**Etki:** Çok sefer yapmış bir şoför/müşteri profilinde tüm satırlar taşınır; agregasyon DB'de yapılabilir.
**Öneri:** `GroupBy`+`Sum`+`Count` projeksiyonunu DB'ye taşı, sadece skaler sonuçları dön.

**Pozitif:** `LoadsController.GetCustomerHistory` (satır 434-466) ve `GetDriverHistory` (satır 470-502) `Skip/Take`, `CountAsync`, `Clamp(pageSize,1,100)` ile **doğru** sayfalanmış. `NotificationsController.Get` (satır 14-23) ve `AdminController.GetUsers` de doğru.

---

## 3 — Gereksiz Büyük Payload

### [ORTA] · `apps/api/Yukle.Api/Controllers/AdminController.cs:151-230` (`GetPendingReviews`)
**Sorun:** Her bekleyen şoför için `AiInferenceDetails` (DbContext:115'te `text` tipi, "potansiyel olarak uzun JSON") tam olarak iki kez döner: önce çekilir (satır 175), sonra confidence parse için kullanılır ve **yine** response'a konur (satır 224). Ham JSON liste yanıtında taşınıyor.
**Etki:** Liste uzadıkça (yorumda "50-100 kişi" deniyor) her satırda büyük JSON taşınır. Liste görünümü için confidence skoru yeterli; tam JSON detayda çekilebilir.
**Öneri:** Liste yanıtından `AiInferenceDetails`'i çıkar (yalnızca türetilmiş `confidence` döndür); tam JSON'u `review-documents` / detay endpoint'inde sun.

### [ORTA] · `apps/api/Yukle.Api/Controllers/AdminController.cs:770-778` (`GetChatByLoad`)
**Sorun:** `ChatMessages` **ham entity** olarak (`Select` yok) tüm kolonlarıyla dönüyor (satır 773-776). `BlockReason`, `SenderRole`, `IsBlocked` vb. dahil tüm sütunlar.
**Etki:** Web admin Chats sayfası (`Chats.tsx:62`) bu transkripti tam çeker; uzun sohbetlerde ağır JSON.
**Öneri:** DTO projeksiyonu (`ChatController`'daki `ChatMessageItemDto` gibi) kullan; gerekmeyen alanları kes.

### [DÜŞÜK] · `apps/api/Yukle.Api/Services/LoadService.cs:85-112`
**Sorun:** `LoadListDto` her liste satırında `AiPriceReasoning` (serbest metin, AI gerekçesi) taşıyor (satır 111, 148, 186, 222). Liste kartında genelde gerekmez.
**Etki:** Aktif yük listesi (kullanıcının ana ekranı) her satırda potansiyel uzun gerekçe metni taşır.
**Öneri:** Liste DTO'sundan `AiPriceReasoning`'i çıkar; yalnızca detay (`GetLoadByIdAsync`) döndürsün.

### [DÜŞÜK] · `apps/api/Yukle.Api/Controllers/AdminController.cs:780-822` (`GetActiveDrivers`)
**Sorun:** `drivers` sözlüğü `ToDictionaryAsync(u => u.Id, u => u)` ile **tam User entity** çekiyor (satır 790-792) — şifreli `FullName`/`Phone`/`TaxNumberOrTCKN` dahil tüm kolonlar, oysa sadece ad + son konum gerekiyor.
**Etki:** Her aktif şoför için tüm User satırı + KVKK decrypt maliyeti (DbContext ValueConverter her okumada `Decrypt` çalıştırır).
**Öneri:** Anonim projeksiyonla yalnızca `Id, FullName, LastKnownLatitude, LastKnownLongitude, LastLocationUpdate` çek.

---

## 4 — Eksik Index Önerileri (yalnızca KOD'dan çıkarım)

Mevcut index'ler (`YukleDbContext.OnModelCreating`): `User(Phone unique, Email unique, Role+ApprovalStatus)`, `Vehicle(Plate unique)`, `Notification(UserId+IsRead)`, `Rating(LoadId+GivenByUserId unique)`, `ChatMessage(LoadId+CreatedAt)`, `AdminActionLog(TimestampUtc)`, `FuelPrice(City+FuelType+Date), (PlateCode+FuelType)`, `WalletAuditLog(UserId+CreatedAt), (LoadId), (LoadId+UserId+Reason filtered unique)`, `SupportTicket(Status+SlaDeadline), (UserId+LastMessageAt)`, `SupportMessage(TicketId+CreatedAt)`.

### [KRİTİK] · `Bid` — index YOK · `YukleDbContext.cs:186-199`
**Sorun:** `Bid` entity'sinde `HasIndex` hiç yok. Sıcak sorgular:
- `BidService.cs:41` `Bids.Any(LoadId==x && DriverId==y)` (her teklifte)
- `BidService.cs:78,100` `Bids.Where(LoadId==x)`
- `BidService.cs:120` `Bids.Where(DriverId==x)`
- `BidService.cs:177-189` `Where(LoadId && Status==Pending)` (kabul + toplu red)
- `DashboardService.cs:52` `Bids.Where(DriverId==x).GroupBy` (şoför dashboard)
**Öneri:** `HasIndex(b => new { b.LoadId, b.Status })` ve `HasIndex(b => new { b.DriverId, b.Status })`. FK'ler index oluşturmaz; bu olmadan teklif kontrolleri ve şoför dashboard tablo taraması yapar.

### [KRİTİK] · `Load(UserId, Status)` ve `Load(DriverId, Status)` · `YukleDbContext.cs:122-171`
**Sorun:** `Load` üzerinde hiç index yok (sadece FK'ler). Sıcak sorgular:
- `LoadService.cs:83` `Where(Status==Active)` (aktif liste — en sık)
- `LoadService.cs:119` `Where(UserId==x)` (müşteri ilanları)
- `LoadService.cs:157` `Where(DriverId==x && Status in [...])`
- `DashboardService.cs:27` `Loads.Where(UserId==x).GroupBy`
- `LoadsController.cs:444,480` history: `Where(UserId/DriverId && Status==Delivered)`
- `AdminController.cs:340-341` müşteri başına `Count/Sum(UserId==x)`
**Öneri:** `HasIndex(l => new { l.Status })` (veya `Status` lead'li bileşik), `HasIndex(l => new { l.UserId, l.Status })`, `HasIndex(l => new { l.DriverId, l.Status })`.

### [ORTA] · `PaymentTransaction(LoadId)` ve `(Status)` · `YukleDbContext.cs:284-294`
**Sorun:** `PaymentTransaction` index'siz. Sıcak sorgular:
- `WalletController.cs:16-17` `PaymentTransactions.Where(Loads.Any(l.Id==p.LoadId ...))` (her cüzdan özeti)
- `AdminController.cs:489-498` `GetPayments` filtreleri (`Status`, `LoadId` join)
- `AdminController.cs:98,637` `SumAsync(p.Amount)` (tüm tablo taraması — kaçınılmaz ama `Status` index'i Blocked/Released filtrelerine yardımcı)
**Öneri:** `HasIndex(p => p.LoadId)`, `HasIndex(p => new { p.Status, p.CreatedAt })`.

### [ORTA] · `WalletAuditLog(LoadId, UserId, Type)` · `YukleDbContext.cs:297-310`
**Sorun:** Mevcut `(UserId,CreatedAt)` ve `(LoadId)` var ama `WalletLedgerService.cs:51-57, 104-110` `Where(LoadId==x && UserId==y && Type==Hold).OrderByDescending(CreatedAt)` sorgusu üç alanı birlikte filtreliyor; `WalletController.cs:37-41` `Where(UserId && Type==Release && CreatedAt>=monthStart)`.
**Öneri:** `HasIndex(w => new { w.LoadId, w.UserId, w.Type })` ve `HasIndex(w => new { w.UserId, w.Type, w.CreatedAt })`.

### [ORTA] · `Rating(GivenToUserId)` · `YukleDbContext.cs:216-224`
**Sorun:** Mevcut index `(LoadId, GivenByUserId unique)`. Ama `RatingsController.cs:61` `Where(GivenToUserId==x)`, `:95` `join on GivenToUserId`, `:123` `Where(GivenToUserId==targetId)` (silme sonrası yeniden hesap) bu alanı arıyor — index yok.
**Öneri:** `HasIndex(r => r.GivenToUserId)`.

### [DÜŞÜK] · `User(CreatedAt)` · `YukleDbContext.cs:76-119`
**Sorun:** `AdminController` `GetUsers/GetDrivers/GetCustomers` hepsi `OrderByDescending(CreatedAt)`; `GetStats:641` `Where(CreatedAt>=today)`. Liste sıralaması için `CreatedAt` index'i yararlı.
**Öneri:** Düşük öncelik; sayfalama eklendiğinde (Bölüm 2) `HasIndex(u => u.CreatedAt)` sıralı I/O sağlar.

---

## 5 — Ağır Frontend Render

### [ORTA] · `apps/web/src/components/layout/TopBar.tsx:38-55`
**Sorun:** Bildirim polling **10 saniyede bir** çalışıyor ve her cycle'da **iki** istek yapıyor: `getUnreadCount()` + `getNotifications(1, 40)` (40 bildirim tam liste). Drawer kapalıyken bile 40 bildirim sürekli çekiliyor.
**Etki:** Açık her panel sekmesi, her kullanıcı için 6 istek/dk × 2 = sürekli arka plan yükü; gereksiz veri (kapalı drawer). SignalR `notificationHub` zaten varken polling de paralel çalışıyor.
**Öneri:** Liste çekimini yalnızca drawer açıkken yap; arka planda yalnızca `unread-count` (hafif) çek veya tamamen SignalR push'a geç. Interval'i 30 sn'ye çıkar.

### [ORTA] · `apps/web/src/pages/shared/ChatsPage.tsx:74-77, 114`
**Sorun:** Thread listesi `getLoads({ page: 1, pageSize: 80 })` ile 80 yük + `getCustomerLoadHistory(1, 80)` çekiyor. `getLoads` arkada `GetActiveLoads`'a gider (Bölüm 2 — backend tüm tabloyu RAM'e alır). Ayrıca ESLint'in işaret ettiği `set-state-in-effect` (satır 129-133 `setThreads`+`setSelectedId`, 152/189 `setMessages`) ardışık effect'lerde cascade render üretiyor.
**Etki:** Sayfa açılışında 2 geniş istek + selectedId değişiminde mesaj effect'i + SignalR effect'i zincirleme tetiklenir. Thread `map` her render'da `[...map.values()]` yeniden oluşur.
**Öneri:** Backend'e gerçek thread özeti endpoint'i (Bölüm 1 önerisiyle aynı). `setSelectedId`'yi mesaj yükleme effect'inden ayrıştır; `filteredThreads`/`activeThread` zaten `useMemo` (iyi).

### [DÜŞÜK] · `apps/web/src/pages/admin/Chats.tsx:48-55`
**Sorun:** 30 sn polling iki istek (`loadChats` + `loadBlocked`) yapıyor; `loadChats` backend'de son 800 mesajı RAM'e çeken `GetChats`'ı tetikliyor (Bölüm 1). Thread listesi `chats.map` virtualize edilmemiş `<button>` listesi.
**Etki:** Admin Chats sekmesi açık kaldıkça her 30 sn'de ağır backend sorgusu; çok ilanlı ortamda DOM'da yüzlerce buton.
**Öneri:** Backend gruplamayı SQL'e taşı (Bölüm 1); liste uzunsa sanal liste (react-window vb.) veya sunucu sayfalama.

### [DÜŞÜK] · `apps/web/src/components/map/LiveMap.tsx:35-66, 68-101` + `Tracking.tsx:37-44`
**Sorun:** İki ayrı effect: mount-only init (doğru, `mapRef` guard + cleanup `map.remove()` var — iyi). İkinci effect `markers`/`center` her değiştiğinde `await import('leaflet')` yapıp tüm layer'ları `clearLayers` + yeniden çiziyor. `Tracking` 20 sn polling ile `rows` set ettikçe `mapMarkers` (`useMemo`, iyi) değişir → tüm marker'lar yeniden çizilir.
**Etki:** Her 20 sn'de tüm circleMarker'lar silinip yeniden kuruluyor; az marker'da sorun değil, çok şoförde titreme/maliyet.
**Öneri:** Marker'ları id bazlı diff ile güncelle (sadece değişen konumu taşı). Leaflet harita instance'ı doğru korunuyor (pozitif); `import('leaflet')` sonucu modül-seviye cache'lenir (tekrar indirme yok).

### Pozitif bulgular (Bölüm 5)
- `useCustomerDriverLocation.ts:28-64` polling cleanup'ı doğru (`cancelled` + `clearInterval`), `shouldPoll` ile gereksiz polling önlenmiş.
- Mobil `MessagesInboxScreen.tsx:85-140` `FlatList` + `keyExtractor` (satır 87) doğru kullanılmış (web'in aksine sanal liste).
- `ChatsPage.tsx:220-230` `useMemo`; `Landing.tsx` `useMemo/useCallback` yaygın.

---

## 6 — Büyük Bundle

### [ORTA] · `apps/web/package.json:17-43` + `apps/web/vite.config.ts:9-18`
**Sorun:** Ağır bağımlılıklar: `three` (+`@react-three/fiber`, `drei`, `postprocessing`, `three-stdlib`, `@types/three`), `gsap`+`@gsap/react`, `leaflet`, `@microsoft/signalr`, `framer-motion`, `cobe`, `d3-geo`+`topojson-client`+`world-atlas`, `howler`, `lenis`, `leva`. `vite.config.ts`'de **manuel chunk / `build.rollupOptions.output.manualChunks` yok** — vendor'lar tek/varsayılan bölümlemeye düşer.
**Etki:** three.js + drei + postprocessing tek başına çok büyük; manuel chunk olmadan vendor parçalanması Vite'ın varsayılanına kalır.
**Öneri:** `manualChunks` ile `three`/`@react-three/*`, `gsap`, `leaflet`, `framer-motion`, `d3`/`topojson` ayrı vendor chunk'larına böl.

### Pozitif bulgular (Bölüm 6)
- `router/index.tsx:6-77` tüm sayfa rotaları `lazy()` ile kod-bölünmüş (Landing, auth, customer/driver/admin hepsi). Çok iyi.
- `Landing.tsx:12-32` 3D ağırlıklı section'lar (`AI`, `Security`, `Journey`, `MobileDemo`) `lazy()` + `LazySection` (IntersectionObserver, `rootMargin`) ile görünüm-içi yüklenir; `light3d` (reduced-motion / mobil) ile 3D kısılır (`useLandingPrefs:34-52`). Mükemmel kalıp.
- `LiveMap.tsx:39-40` `leaflet` ve CSS'i dinamik `import()` ile yüklüyor — harita kullanılmayan sayfalarda bundle'a girmez.

---

## Öncelikli Optimizasyonlar (etki/efor sırasıyla)

| # | Öncelik | Dosya | Aksiyon |
|---|---------|-------|---------|
| 1 | KRİTİK | `mobile/chatThreads.service.ts` + yeni backend endpoint | Thread özeti için tek toplu endpoint; N+1 (N mesaj + N teklif çağrısı) kaldır |
| 2 | KRİTİK | `LoadService.GetActiveLoadsAsync` + `LoadsController.GetActiveLoads` | Filtre/sırala/`Skip/Take`'i `IQueryable`'da DB'ye taşı (sahte sayfalamayı gerçek yap) |
| 3 | KRİTİK | `YukleDbContext.OnModelCreating` | `Bid(LoadId,Status)`, `Bid(DriverId,Status)`, `Load(Status)`, `Load(UserId,Status)`, `Load(DriverId,Status)` index'leri ekle |
| 4 | ORTA | `AdminController.GetChats` | Gruplama/son-mesaj seçimini SQL'e taşı; `Take(800)` ham entity kaldır |
| 5 | ORTA | `AdminController` GetDrivers/GetCustomers/GetLoads, `WalletController.Transactions`, `RatingsController` | `page/pageSize` ekle (GetUsers kalıbı); ortalamayı DB `AVG`'ye taşı |
| 6 | ORTA | `PaymentTransaction`, `WalletAuditLog`, `Rating` index'leri | `PaymentTransaction(LoadId),(Status,CreatedAt)`; `WalletAuditLog(LoadId,UserId,Type)`; `Rating(GivenToUserId)` |
| 7 | ORTA | `TopBar.tsx` | Bildirim listesini yalnızca drawer açıkken çek; interval 10→30 sn; SignalR'a yaslan |
| 8 | ORTA | `vite.config.ts` | `manualChunks` ile three/gsap/leaflet/framer-motion/d3 vendor bölmesi |
| 9 | ORTA | `GetPendingReviews`, `GetChatByLoad`, `GetActiveDrivers` | Liste payload'larından `AiInferenceDetails` / ham entity / tam User'ı kes (DTO projeksiyon) |
| 10 | DÜŞÜK | `LoadListDto` | Liste DTO'sundan `AiPriceReasoning` çıkar (yalnızca detayda) |

---

*Bu rapor yalnızca kaynak kodu okunarak üretilmiştir; hiçbir kaynak dosya değiştirilmemiş, DB'ye bağlanılmamıştır.*
