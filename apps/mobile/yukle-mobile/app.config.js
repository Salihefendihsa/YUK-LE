/** Expo config — .env EXPO_PUBLIC_* değerlerini extra'ya da yazar (Metro cache sonrası tutarlı URL). */
const appJson = require('./app.json');

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'http://10.192.149.18:5151';

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      apiBaseUrl,
    },
  },
};
