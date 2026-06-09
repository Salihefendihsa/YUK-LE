# SORUN TARAMA 2 — Güvenlik & Sızıntı Analizi (READ-ONLY)

> Kapsam: Backend (`apps/api/Yukle.Api`), Web (`apps/web/src`), Mobil (`apps/mobile/yukle-mobile`).
> Yöntem: Kod + git geçmişi statik incelemesi. Hiçbir kaynak/DB değiştirilmedi.
> Tarih: 2026-06-07 · Branch: `polish/ui-vivid`
> Bulgu formatı: **[SEVİYE] · dosya:satır · risk · etki · öneri**

---

## YÖNETİCİ ÖZETİ

**EN KRİTİK — CANLI API ANAHTARI SIZINTISI (TEYİT EDİLDİ):**
Canlı Google Gemini API anahtarı `AIzaSyCLpppN3Yf2_iuo3lhriUmirPsg5eyIOi0` git-tracked dosya
`.claude/settings.local.json:103` içinde bir Bash izin kuralında AÇIKÇA yazılı. Dosya
gitignore'da DEĞİL — takip ediliyor ve git geçmişinde commit `66c712d` ("feat(support): AI
destek chatbot…") ile kalıcı. Anahtar `git rev-list --all | git grep` ile tek commit'te
(`63f59f7…`) doğrulandı. **Bu anahtar derhal iptal/rotate edilmelidir.**

İkincil kritik bulgular:
- **Varsayılan admin kimlik bilgileri** (`admin@navlonix.com` / `Admin123!`) her başlangıçta
  ortam ayrımı olmadan seed ediliyor (prod dahil) ve mobil giriş ekranlarında gösteriliyor.
- **Suspend (askıya alma) müşteride etkisiz** — `LoginAsync` `IsActive` okumuyor (DENETİM TEYİT EDİLDİ).
- **Sunucu-tarafı logout / token iptali yok** — refresh token 7 gün boyunca geçerli kalır.
- **Web `register` payload'u (parola + TCKN dahil) `console.log` ile loglanıyor** (prod build'de de).
- **Dosya yükleme uçlarında tip/içerik (magic-byte) doğrulaması yok**; `AiController/ocr` boyut limiti de yok.

Olumlu tablo: Controller yetkilendirmesi genel olarak sağlam (her controller `[Authorize]`,
sahiplik kontrolleri mevcut), CORS `WithOrigins` (yıldız yok), global exception handler
RFC 7807 ProblemDetails (stack trace sızdırmıyor), parolalar BCrypt, refresh token rotation +
timing-safe karşılaştırma, JWT HS512 + `none` algoritma reddi, raw SQL parametreli.

---

## BÖLÜM 1 — SIZAN SIRLAR

### 1.1 [KRİTİK] · `.claude/settings.local.json:103` · Canlı Gemini API anahtarı git-tracked + geçmişte
- **Risk:** `AIzaSyCLpppN3Yf2_iuo3lhriUmirPsg5eyIOi0` düz metin, bir `curl …generateContent?key=AIza…`
  izin kuralı içinde. `git ls-files` çıktısında dosya TAKİP EDİLİYOR; `git check-ignore` BOŞ
  (ignore'da değil). Commit `66c712d`'de eklendi, blob `63f59f7…`'de mevcut.
- **Etki:** Anahtarı ele geçiren herkes proje faturasına Gemini API çağrısı yapabilir (mali +
  kota tükenmesi + kötüye kullanım). Repo herkese açık/forklanmışsa anahtar kalıcı olarak yayılmıştır.
- **Öneri (sırayla):**
  1. **DERHAL** Google Cloud Console > Credentials'tan bu anahtarı **iptal/rotate** et.
  2. `git rm --cached .claude/settings.local.json` ile takipten çıkar; kök `.gitignore`'a
     `.claude/settings.local.json` ekle (her iki konum: kök + `apps/api/Yukle.Api/.claude/`).
  3. Geçmişten temizle: `git filter-repo --path .claude/settings.local.json --invert-paths`
     (veya BFG `--delete-files settings.local.json`) → ardından `git push --force` (tüm
     branch + tag). Forklara/yerel klonlara haber ver.
  4. Yeni anahtarı YALNIZCA `dotnet user-secrets` / ortam değişkeni (`GeminiAI__ApiKey`) ile tut.

### 1.2 [KRİTİK] · `apps/api/Yukle.Api/.claude/settings.local.json:19` · DB parolası git-tracked dosyada
- **Risk:** İKİNCİ bir `.claude/settings.local.json` (API klasöründe) git'te TAKİP EDİLİYOR
  (`git ls-files` doğruladı) ve içinde `$env:PGPASSWORD = "adb16adb"` ile PostgreSQL `postgres`
  kullanıcı parolası düz metin yazılı.
- **Etki:** Yerel DB parolası repoda kalıcı. Aynı parola başka ortamda kullanılıyorsa yatay yayılma.
- **Öneri:** 1.1 ile birlikte bu dosyayı da `git rm --cached` + `.gitignore` + geçmiş temizliği.
  `adb16adb` parolasını dev DB'de döndür.

### 1.3 — Konfigürasyon dosyalarının sızıntı sınıflandırması (EK TARAMA)

| Dosya:satır | İçerik | Git durumu | Sınıf |
|---|---|---|---|
| `appsettings.json:10,11,14,19,20,23` | Tüm sırlar `REPLACE_WITH_USER_SECRET` | **gitignore (takip edilmiyor)** | TEMİZ |
| `appsettings.Development.json:9` | DB parolası `adb16adb` | gitignore (takip edilmiyor) | DEV-ONLY (yerel) |
| `appsettings.Development.json:10` | Redis parolası `YukleRedis123!` | gitignore | DEV-ONLY |
| `appsettings.Development.json:13` | JWT dev key (`LOCAL_DEV_ONLY…`) | gitignore | DEV-ONLY |
| `appsettings.Development.json:18,19` | Encryption Key/IV = **tümü sıfır-byte** base64 (`AAAA…`) | gitignore | DEV-ONLY (zayıf, bkz. 1.4) |
| `appsettings.Development.json:22` | Gemini `LOCAL_DEV_PLACEHOLDER` | gitignore | TEMİZ (placeholder) |
| `appsettings.example.json` | Tüm değerler `YOUR_…` şablon | takip ediliyor | TEMİZ (şablon) |
| `apps/mobile/yukle-mobile/.env.example` | Boş `EXPO_PUBLIC_*` değerleri | takip ediliyor | TEMİZ |
| `apps/mobile/yukle-mobile/.env:4` | Sadece LAN API URL (sır değil) | **gitignore (takip edilmiyor)** | TEMİZ |
| `apps/web/**/.env*` | — | dosya yok | YOK |

> Not: `appsettings.json` ve `appsettings.Development.json` `git check-ignore` ile IGNORE
> doğrulandı; `git ls-files --error-unmatch` "did not match" döndü → commitlenmemiş. Bu iyi
> haber: prod/dev DB-Redis-JWT sırları geçmişte DEĞİL. Geçmişteki tek canlı sır = Gemini anahtarı (1.1).

### 1.4 [ORTA] · `appsettings.Development.json:18-19` · Sıfır-byte AES anahtarı (KVKK şifreleme)
- **Risk:** TCKN şifreleme anahtarı/IV tamamen sıfır byte (`AAAA…=`). `EncryptionService` deterministik
  (sabit IV, CBC). Sıfır anahtar pratikte "şifreleme yok" demektir.
- **Etki:** Dev'de TCKN'ler trivial olarak çözülür. Prod user-secret kullanırsa risk yalnızca dev verisi.
- **Öneri:** Dev'de bile rastgele 32-byte key + 16-byte IV üret; prod'da KeyVault/Secret Manager zorunlu.

### 1.5 [ORTA] · `BackgroundServices/AdminSeederJob.cs:45,126` · Sabit kodlu varsayılan parolalar
- **Risk:** `Admin123!` (admin) ve `Test123!` (test müşteri/şoför) seeder'da sabit. `Program.cs:168`
  bu job'u **ortam guard'ı olmadan** her başlangıçta çalıştırır → prod'da da `admin@navlonix.com /
  Admin123!` hesabı oluşur/güncellenir.
- **Etki:** Bilinen kimlik bilgileriyle prod admin paneline tam erişim — **dikey yükselme**.
- **Öneri:** Admin seed'i yalnız ilk kurulum + güçlü parolayı ortam değişkeninden oku; test
  kullanıcılarını `IsDevelopment()` guard'ına al. Mevcut prod admin parolasını döndür.

### 1.6 [DÜŞÜK] · `apps/mobile/.../LoginScreen.tsx:87-88`, `app/(auth)/admin-login.tsx:59` · UI'da test kimlikleri
- **Risk:** Giriş ekranlarında `admin@navlonix.com / Admin123!`, `5000000001 / Test123!` açıkça yazılı.
- **Etki:** 1.5 ile birleşince herkese açık demo build'de prod admin'e giriş.
- **Öneri:** Bu ipuçlarını yalnız `__DEV__` koşuluna al veya tamamen kaldır.

---

## BÖLÜM 2 — YETKİLENDİRME

### 2.1 Controller yetki matrisi (genel: SAĞLAM)
Her controller sınıf düzeyinde `[Authorize]` taşıyor; rol/sahiplik kontrolleri mevcut:
- `UsersController.cs:28` `CanAccessUser` → admin VEYA kendi id'si (yatay koruma OK).
- `WalletController.cs:15-17,71,92` → tüm sorgular `userId`/owner filtreli (OK).
- `LoadsController.cs:506` `CanViewLoad` → Customer yalnız `OwnerId==self`, Driver yalnız Active
  ilan veya kendine atanan (OK).
- `BidsController.cs:73,86` → owner doğrulaması servis katmanında (`GetBidsByLoadIdAsync(loadId, customerId)`).
- `ChatController.cs:30` → `load.UserId==userId || load.DriverId==userId || admin` (OK).
- `PaymentsController.cs:51,75` → owner/driver/admin (OK).
- `LocationController.cs:74` → müşteri yalnız kendi yükünün şoför konumu (OK).
- `AdminController.cs:23` → sınıf düzeyi `[Authorize(Roles="Admin")]`; escalation yolu görülmedi.

### 2.2 [KRİTİK] · `Services/AuthService.cs:367-389` · LoginAsync `IsActive` okumuyor (DENETİM TEYİT EDİLDİ)
- **Risk:** `LoginAsync` yalnızca parola + `IsPhoneVerified` kontrol eder; `IsActive`'i HİÇ kontrol
  etmez. Admin `SuspendUser` (`AdminController.cs:695`) yalnızca `IsActive=false` yapar.
- **Etki:** Askıya alınmış **müşteri** yine login olur ve geçerli token alır. (Şoför tarafı
  `RequireActiveDriver` policy ile DB'den `IsActive` okuduğu için operasyonel uçlarda korunur;
  ama müşteri uçları `IsActive` policy'sine bağlı değil — örn. `CreateLoad` ayrı `customer.IsActive`
  kontrolü yapıyor `LoadsController.cs:58`, fakat genel login + token ele geçirme açık.)
- **Öneri:** `LoginAsync` içinde parola doğrulandıktan sonra `if (!user.IsActive && Role!=Admin)`
  ile reddet; ek olarak müşteri uçlarına da bir `RequireActiveUser` policy ekle.

### 2.3 [DÜŞÜK] · `Controllers/SystemController.cs:7-16` · Auth'suz status ucu
- **Risk:** `SystemController` sınıfında `[Authorize]` YOK → `GET api/System/status` anonim erişilebilir.
- **Etki:** Düşük — yalnız statik string döner. Ancak `Environment = "Development"` SABİT kodlu (gerçek
  ortamı yansıtmaz) ve framework/sürüm bilgisi (`.NET 9`) fingerprinting'e açık.
- **Öneri:** Sürüm/ortam bilgisini kaldır veya admin'e kısıtla; gerçek ortamı `IWebHostEnvironment`'tan oku.

### 2.4 `RequireActiveDriver` policy DB'den okuyor (DOĞRU)
- `Authorization/ActiveDriverAuthorizationHandler.cs:29-35` her istekte DB'den `IsActive` çeker
  (`AsNoTracking`), stale JWT claim'e güvenmez. Admin onayı anında etki eder. Bu sağlam bir tasarım.

---

## BÖLÜM 3 — DOĞRULAMA & INJECTION

### 3.1 Raw SQL — parametreli (TEMİZ)
- Tüm kod tabanında raw SQL yalnızca `Infrastructure/PostgresRowLock.cs:16,23`:
  `ExecuteSqlRawAsync(@"… WHERE ""Id"" = {0} FOR UPDATE", [loadId], ct)` — `{0}` placeholder +
  params dizisi, **string interpolation yok**. SQL injection riski yok. Geri kalan tüm erişim EF LINQ.
- `FromSqlRaw`/`ExecuteSqlInterpolated` ile string concat **bulunamadı**.

### 3.2 Giriş doğrulama — DataAnnotations + ModelState
- Controller'lar `if (!ModelState.IsValid) return BadRequest(ModelState)` kullanıyor
  (`AuthController`, `LoadsController:49`, `BidsController:44`, `UsersController:57`, `AdminController:903`).
- DriverId/owner gibi güvenlik-kritik alanlar DTO yerine **JWT claim'den** okunuyor
  (`BidsController.cs:47-49` yorumu: "DriverId … DTO'dan alınmaz") — kütle atama (mass-assignment) koruması iyi.
- IBAN regex doğrulaması `UsersController.cs:116` (`^TR\d{24}$`).

### 3.3 [ORTA] · `Controllers/AiController.cs:25-45, 180-209` · OCR yüklemede tip/boyut doğrulaması yok
- **Risk:** `ocr` ve `ocr/enqueue` uçlarında `RequestSizeLimit` YOK ve içerik (magic-byte) doğrulaması
  YOK. `mimeType` yalnız istemci-kontrollü `file.ContentType`'a göre map'lenip bilinmeyen her şey
  `image/jpeg`'e düşürülüyor (satır 33-38). Boyut sınırsız → bellek/Gemini kota tüketimi (DoS).
- **Etki:** Devasa veya kötü amaçlı dosyalar RAM'e okunur (`ms.ToArray()`); maliyet/DoS.
- **Öneri:** `[RequestSizeLimit]` ekle, gerçek magic-byte (JPEG/PNG/WEBP signature) doğrula,
  izinli MIME beyaz listesi uygula, reddet (default'a düşürme).

### 3.4 [DÜŞÜK] · `Controllers/AuthController.cs:189-206` · upload-document içerik doğrulaması zayıf
- **Risk:** Boyut sınırı VAR (`[RequestSizeLimit(15MB)]`, satır 189) ✔; ancak içerik tipi yine
  istemci `ContentType`'ına dayanıyor, magic-byte yok. Bilinmeyen tip sessizce `image/jpeg` sayılıyor.
- **Etki:** Düşük (Gemini multimodal hatalı dosyayı zaten reddeder), yine de doğrulama FE'ye güveniyor.
- **Öneri:** Sunucuda magic-byte kontrolü + MIME beyaz listesi.

---

## BÖLÜM 4 — HASSAS VERİ

### 4.1 Parola & telefon koruması (DOĞRU)
- Parola **BCrypt** ile hash'lenir (`AuthService.cs:175-176, 338-339, 354`); salt ayrı tutulmaz
  (BCrypt embedded salt — doğru). PasswordSalt alanı boş bırakılıyor.
- TCKN/telefon: `EncryptionService.cs` AES-256-CBC; telefon API yanıtlarında `PiiMasking` ile
  maskeleniyor (`UsersController.cs:168`, `AdminController.cs:219,298,349,680`).

### 4.2 [ORTA] · `Controllers/AuthController.cs:90-97` · register ham User entity döndürüyor
- **Risk:** `Register` yalnız `PasswordHash/PasswordSalt/VerificationCode` alanlarını sıfırlayıp
  **tüm User entity'sini** döner (satır 97). Yanıtta `Phone` (ham), `Email`, `TaxNumberOrTCKN`
  (TCKN/vergi no ham — maskelenmemiş), `IsActive`, `ApprovalStatus`, `RefreshToken` alanı
  (kayıt anında null ama şema sızar) yer alır. DTO projeksiyonu yok.
- **Etki:** Kullanıcının kendi TCKN'si maskesiz döner; ileride RefreshToken set edilirse aynı kalıpla
  sızma riski; entity şeması istemciye açılır.
- **Öneri:** Register için ayrı `RegisterResponseDto` (yalnız `userId`, `phone`(maskeli),
  `requiresVerification`) projeksiyonu kullan; ham entity döndürme.

### 4.3 [ORTA] · `apps/web/src/api/auth.ts:11` · Register payload'u console'a loglanıyor
- **Risk:** `console.log('[register payload]', data)` — `data` içinde **parola, TCKN, telefon, e-posta**
  açıkça var. Koşulsuz; production build'de de tarayıcı konsoluna/log toplayıcıya yazılır.
- **Etki:** PII + ham parola istemci log'larında (paylaşılan cihaz, hata raporlama araçları, crash log).
- **Öneri:** Bu satırı kaldır veya `import.meta.env.DEV` guard'ına al; parolayı asla loglama.

### 4.4 [DÜŞÜK] · `apps/mobile/.../services/auth.service.ts:58-75` · Login hatasında ham telefon log'u
- **Risk:** `logLoginFailure` her başarısızlıkta `console.log('[auth.login fail]', { sent: { phone: ham } })`
  yazar (satır 61-62). Parola uzunluğa maskelenmiş ama **telefon ham**. Yorum "Üretimde no-op" diyor
  ama kodda `__DEV__` guard'ı **yok** — prod'da da çalışır.
- **Etki:** PII (telefon) mobil cihaz log'larında.
- **Öneri:** Fonksiyonu `if (!__DEV__) return;` ile sınırla; telefonu da maskele.

### 4.5 Log'larda PII maskeleme (BACKEND — DOĞRU)
- `AuthService.cs:1069 MaskPii` ile kimlik/ TCKN log'larda maskeli (`A**** Y****`). Refresh akışı
  hata mesajları kimlik enumerate'i engellemek için generic (`MsgRefreshInvalid`, satır 84-87).

---

## BÖLÜM 5 — CORS / JWT / COOKIE

### 5.1 CORS — güvenli (DOĞRU)
- `Program.cs:78-85` `WithOrigins(allowedOrigins).AllowCredentials()` kullanıyor; **AllowAnyOrigin
  YOK**. Origin listesi config'ten (`Cors:AllowedOrigins`) + dev/Expo origin'leri ekleniyor.
  AllowAnyOrigin+AllowCredentials tehlikeli kombinasyonu **mevcut değil** (yorumda da uyarı var).
- **[DÜŞÜK]** Localhost/8081/8082/19006 ve `http://localhost:5173` koşulsuz ekleniyor
  (`Program.cs:60-76`) — prod ortamında bu dev origin'lerin de kabul edilmemesi için
  `IsDevelopment()` guard'ı önerilir.

### 5.2 [KRİTİK] · `Services/TokenService.cs` + tüm kod tabanı · Logout / sunucu-tarafı token iptali YOK
- **Risk:** `logout|Logout|RevokeRefreshToken` araması **sıfır sonuç**. Hiçbir logout ucu yok.
  Refresh token DB'de 7 gün geçerli (`AuthService.cs:78-79`), access token 7 gün ömürlü
  (`TokenService.cs:55`). Kullanıcı "çıkış" yapsa bile token revoke edilmiyor.
- **Etki:** Çalınmış/sızmış token, kullanıcı çıkış yapsa dahi 7 gün boyunca geçerli kalır. Erken
  iptal mekanizması yok.
- **Öneri:** `POST /auth/logout` ekle → `user.RefreshToken=null` yaz (denetimdeki bulgu). Access
  token kısa ömürlü yap (15-60 dk) + refresh ile yenile; kritik durumlar için jti deny-list/Redis blacklist.

### 5.3 JWT yapılandırması — sağlam (DOĞRU)
- `Program.cs:294-299` JWT key < 64 byte ise FATAL atar; `ValidateIssuer/Audience/Lifetime=true`,
  `ClockSkew=Zero` (`Program.cs:306-313`). HS512 imza (`TokenService.cs:50`). Refresh akışında
  `none` algoritma reddi (`TokenService.cs:115-121`) ve timing-safe refresh karşılaştırması
  (`AuthService.cs:491,557 FixedTimeEqualsString`). Token çalınma şüphesinde tüm refresh iptal
  (`AuthService.cs:495-497`). Bunlar iyi uygulamalar.

### 5.4 [DÜŞÜK] · `Services/TokenService.cs:159` · QR teslim token imza karşılaştırması constant-time değil
- **Risk:** `if (providedSignature != expectedSignature)` düz string `!=` — timing yan-kanalı.
- **Etki:** Düşük (15 dk ömür + loadId eşleşmesi + HMAC). Yine de imza tahmininde teorik zamanlama sızıntısı.
- **Öneri:** `CryptographicOperations.FixedTimeEquals` ile karşılaştır (refresh token'da zaten yapılıyor).

---

## BÖLÜM 6 — HATA MESAJI SIZINTISI

### 6.1 Global exception handler — RFC 7807, stack trace sızdırmıyor (DOĞRU)
- `Infrastructure/GlobalExceptionHandler.cs:43-55` `ProblemDetails` yazar, `Exception = null`
  (satır 54) → istemciye exception objesi/stack gitmez. Beklenmedik (default) hata yalnız
  generic mesaj + `traceId` döner (satır 92-96) — iç dosya yolu/SQL detayı yok.
- Bilinen istisnalar anlamlı status'a maplenir (DomainException, ApplicationException → 400/401/429).
- `Program.cs:471-474` `MapOpenApi()` yalnız `IsDevelopment()`; `app.UseExceptionHandler()`
  (satır 477) prod'da da global handler'ı devreye sokar. Developer Exception Page açıkça
  eklenmemiş → prod'da kapalı (DOĞRU).
- **[DÜŞÜK]** `app.UseExceptionHandler()` parametresiz; `AddProblemDetails()` kayıtlı olduğundan
  detay sızmaz, ancak prod'da `IncludeExceptionDetails`'in hiçbir koşulda açılmadığından emin olun.

---

## ÖNCELİKLİ AKSİYON LİSTESİ

| # | Seviye | Aksiyon | Konum |
|---|---|---|---|
| 1 | KRİTİK | Gemini anahtarını **iptal/rotate** et (Google Cloud) | 1.1 |
| 2 | KRİTİK | `.claude/settings.local.json` (her iki konum) `git rm --cached` + `.gitignore` + filter-repo + force-push | 1.1, 1.2 |
| 3 | KRİTİK | `LoginAsync`'a `IsActive` kontrolü ekle (suspend etkisiz) | 2.2 |
| 4 | KRİTİK | Varsayılan admin/test seed'ini `IsDevelopment()` guard'ına al + prod admin parolasını döndür | 1.5 |
| 5 | KRİTİK | Sunucu-tarafı `logout` + refresh iptali; access token ömrünü kısalt | 5.2 |
| 6 | ORTA | Web `auth.ts:11` register payload `console.log`'unu kaldır | 4.3 |
| 7 | ORTA | Register'ı ham User yerine DTO projeksiyonuna çevir (TCKN maskeli) | 4.2 |
| 8 | ORTA | OCR/upload uçlarına boyut + magic-byte + MIME beyaz listesi | 3.3, 3.4 |
| 9 | ORTA | Dev AES key/IV'i gerçek rastgele değerlerle değiştir (sıfır-byte) | 1.4 |
| 10 | DÜŞÜK | Mobil login hata log'unu `__DEV__` guard'ına al + telefonu maskele | 4.4 |
| 11 | DÜŞÜK | SystemController'ı auth/ortam-doğru hale getir; sürüm bilgisini gizle | 2.3 |
| 12 | DÜŞÜK | QR token imza karşılaştırmasını FixedTimeEquals'a çevir | 5.4 |
| 13 | DÜŞÜK | CORS dev origin'lerini `IsDevelopment()` guard'ına al | 5.1 |
| 14 | DÜŞÜK | Mobil giriş ekranlarındaki test kimliklerini kaldır/`__DEV__` | 1.6 |

---

### Doğrulama Notları (kanıt)
- Gemini anahtarı git'te: `git log -S "AIzaSyCLpppN3Yf2…" → 66c712d`; blob `63f59f7…:.claude/settings.local.json:103`.
- `appsettings*.json` commitlenmemiş: `git check-ignore` → ignore; `git ls-files --error-unmatch` → "did not match".
- Logout yok: `grep "logout|Logout|RevokeRefreshToken"` → "No matches found".
- Raw SQL yalnız `PostgresRowLock.cs:16,23`, parametreli.
