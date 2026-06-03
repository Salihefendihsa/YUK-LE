# Navlonix Mobile

Expo SDK 54 / React Native 0.81 / expo-router 6 — Navlonix logistic platform mobile client.

## Hızlı Başlangıç

```bash
npm install
cp .env.example .env
# .env içindeki değerleri doldur (aşağıya bak)
npm run start         # Expo dev server (LAN modu)
npm run web           # Web preview (localhost:8082)
npm run android       # Android emulator/device
npm run ios           # iOS Simulator (macOS)
```

## Geliştirme Kurulumu

### 1. API'yi çalıştır

Backend (`apps/api/Yukle.Api`) `0.0.0.0:5151` üzerinde dinlemeli:

```bash
cd ../../api/Yukle.Api
dotnet run --launch-profile http
# → http://0.0.0.0:5151
```

`launchSettings.json` `http` profili `applicationUrl: "http://0.0.0.0:5151"` olarak ayarlı.
`0.0.0.0` LAN üzerinden gelen bağlantılara izin verir (gerçek cihaz testi için zorunlu).

### 2. `EXPO_PUBLIC_API_BASE_URL` — mobil → API yönlendirmesi

`.env` içinde set et. Sabit IP **yok** — her geliştirici kendi makinasının LAN IP'sini girer.

| Hedef | Değer |
|---|---|
| Web (`npm run web`) | Boş bırak — `constants/api.ts` otomatik `localhost:5151` kullanır |
| Android emulator | Boş bırak — `10.0.2.2:5151` (emulator → host loopback) otomatik |
| iOS Simulator | Boş bırak — `localhost:5151` otomatik |
| **Gerçek cihaz** (Expo Go) | `http://<bilgisayar-LAN-IP>:5151` — zorunlu |

#### LAN IP bulma

**Windows (PowerShell veya cmd):**
```powershell
ipconfig
# "Wireless LAN adapter Wi-Fi" altındaki "IPv4 Address" satırı
# Örnek: 192.168.1.42  veya  10.0.0.55
```

**macOS:**
```bash
ipconfig getifaddr en0     # Wi-Fi
ipconfig getifaddr en1     # Ethernet (gerekirse)
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

Sonra `.env`:
```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.42:5151
```

Telefonun **aynı Wi-Fi ağında** olduğundan emin ol (misafir ağı / VPN bağlıyken çalışmaz).

### 3. Google Maps Android API Key (opsiyonel)

Sadece Android'de yerleşik harita için gerekli. iOS Apple Maps kullanır; web `react-native-maps` placeholder gösterir.

1. [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**
2. Yeni API key oluştur, "Maps SDK for Android" iznini ver
3. Application restriction = Android, package name = (app.json `slug` / paket adı)
4. `.env`:
   ```bash
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
   ```

Boş bırakılırsa Android'de harita render edilmez (`mapConfig.ts` placeholder tespit eder ve degraded mode'a düşer).

## Marka Asset'lerini Yeniden Üret

`assets/icon.png`, `splash-icon.png`, `adaptive-icon.png`, `favicon.png` — NavlonixMonogram'dan üretilir:

```bash
node scripts/generate-brand-assets.mjs
```

Tek kaynak: `src/components/brand/NavlonixMonogram.tsx`. Geometri değişirse script otomatik yeniden üretir (pngjs SDF rasterizer, harici araç gerekmez).

## Proje Yapısı

```
app/                          expo-router rotaları
  (auth)/                     login, register, verify-phone, admin-login
  (customer)/                 dashboard, loads, bids, create-load, history, ...
  (driver)/                   dashboard, loads, active-load, wallet, ...
  (admin)/                    dashboard, users, payments, reviews, ...
  onboarding.tsx              ilk açılış (AsyncStorage flag)
  index.tsx                   role-based redirect entry
src/
  components/                 reusable UI (Logo, ConfirmDialog, TextField, ...)
  screens/                    LoginScreen, OnboardingScreen, ...
  services/                   API client (apiClient + per-domain services)
  store/                      Zustand (auth, notification-prefs)
  hooks/                      useConfirm, useStoreHydration, ...
  utils/                      validators, format, onboarding, storage
  theme/                      colors, typography, spacing, motion
  constants/                  api.ts (base URL), layout.ts
assets/                       icon/splash/adaptive PNG'ler
scripts/                      generate-brand-assets.mjs + test/seed scripts
```

## Tip Kontrolü

```bash
npx tsc --noEmit
```

CI / pre-commit: tsc temiz olmadan commit etme.

## Faz Geçmişi (Mobil İyileştirme)

| Faz | Başlık | İçerik |
|---|---|---|
| 0 | Stabilizasyon | Login fix (normalizeLoginPhone), CORS Expo Web (8082), api.client unifikasyonu |
| 1 | Marka temeli | `<Logo />` SVG, `#FF7A1A`, Sora wordmark, monogramdan 1024 PNG icon/splash/adaptive |
| 2 | Onboarding | 3 slide (AI lojistik + adil fiyat + roller), AsyncStorage flag, "Atla" |
| 3 | Auth premium | TextField parity (register), staggered fade-in, `5XXXXXXXXX` |
| 4 | Fonksiyonel | Müşteri Teklifler hub, Admin Ayarlar canlı, Analitik "Yakında", ConfirmDialog + useConfirm |
| 5 | Config/deploy | Sabit IP yok, Maps key env, `.env.example`, README, marka asset script'i |
