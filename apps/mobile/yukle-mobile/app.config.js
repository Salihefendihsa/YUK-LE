/** Expo dynamic config — .env EXPO_PUBLIC_* değerlerini extra'ya geçirir ve
 *  Android Google Maps API key'i runtime'da set eder.
 *  Sabit LAN IP yok — README.md > Geliştirme Kurulumu'na bak.
 */
const appJson = require('./app.json');

// Boş bırakılırsa: web localhost, Android emulator 10.0.2.2, iOS simulator localhost
// (constants/api.ts içinde platform-bazlı default seçilir).
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';

// Google Maps Android key — env'den; yoksa app.json placeholder kalır
// (mapConfig.ts placeholder'ı tespit eder).
const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? 'YOUR_GOOGLE_MAPS_API_KEY';

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      config: {
        ...appJson.expo.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    extra: {
      apiBaseUrl,
      googleMapsApiKey,
    },
  },
};
