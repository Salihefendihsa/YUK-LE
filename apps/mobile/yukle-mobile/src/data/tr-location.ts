/**
 * Port: apps/web/src/data/tr-location.ts — ayni il/ilce/mahalle verisi.
 * Koordinatlar il merkezi + ilce hash ofseti ile uretilir (harici API yok).
 */

export const TR_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin',
  'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur',
  'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir',
  'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
] as const;

import { DISTRICT_MAP } from './tr-location-districts';

const NEIGHBORHOOD_MAP: Record<string, string[]> = {
  Kadıköy: ['Koşuyolu', 'Fenerbahçe', 'Caddebostan', 'Erenköy'],
  Çankaya: ['Kızılay', 'Bahçelievler', 'Ayrancı', 'Dikmen'],
  Konak: ['Alsancak', 'Güzelyalı', 'Mithatpaşa', 'Hatay'],
  Merkez: ['Merkez Mahallesi'],
  OSB: ['Organize Sanayi'],
};

/** Il merkezi koordinatlari (yaklasik, statik — demo icin yeterli). */
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Adana: { lat: 37.0, lng: 35.3213 },
  Adıyaman: { lat: 37.7648, lng: 38.2786 },
  Afyonkarahisar: { lat: 38.7507, lng: 30.5567 },
  Ağrı: { lat: 39.7191, lng: 43.0503 },
  Aksaray: { lat: 38.3687, lng: 34.037 },
  Amasya: { lat: 40.6499, lng: 35.8353 },
  Ankara: { lat: 39.9334, lng: 32.8597 },
  Antalya: { lat: 36.8969, lng: 30.7133 },
  Ardahan: { lat: 41.1105, lng: 42.7022 },
  Artvin: { lat: 41.1828, lng: 41.8183 },
  Aydın: { lat: 37.856, lng: 27.8416 },
  Balıkesir: { lat: 39.6484, lng: 27.8826 },
  Bartın: { lat: 41.6344, lng: 32.3375 },
  Batman: { lat: 37.8812, lng: 41.1351 },
  Bayburt: { lat: 40.2552, lng: 40.2249 },
  Bilecik: { lat: 40.1426, lng: 29.9793 },
  Bingöl: { lat: 38.8855, lng: 40.4966 },
  Bitlis: { lat: 38.3938, lng: 42.1232 },
  Bolu: { lat: 40.7395, lng: 31.6116 },
  Burdur: { lat: 37.4613, lng: 30.0665 },
  Bursa: { lat: 40.1885, lng: 29.061 },
  Çanakkale: { lat: 40.1553, lng: 26.4142 },
  Çankırı: { lat: 40.6013, lng: 33.6134 },
  Çorum: { lat: 40.5506, lng: 34.9556 },
  Denizli: { lat: 37.7765, lng: 29.0864 },
  Diyarbakır: { lat: 37.9144, lng: 40.2306 },
  Düzce: { lat: 40.8438, lng: 31.1565 },
  Edirne: { lat: 41.6771, lng: 26.5557 },
  Elazığ: { lat: 38.681, lng: 39.2264 },
  Erzincan: { lat: 39.75, lng: 39.5 },
  Erzurum: { lat: 39.9043, lng: 41.2679 },
  Eskişehir: { lat: 39.7767, lng: 30.5206 },
  Gaziantep: { lat: 37.0662, lng: 37.3833 },
  Giresun: { lat: 40.9128, lng: 38.3895 },
  Gümüşhane: { lat: 40.4386, lng: 39.5086 },
  Hakkari: { lat: 37.5744, lng: 43.7408 },
  Hatay: { lat: 36.4018, lng: 36.3498 },
  Iğdır: { lat: 39.888, lng: 44.0048 },
  Isparta: { lat: 37.7648, lng: 30.5566 },
  İstanbul: { lat: 41.0082, lng: 28.9784 },
  İzmir: { lat: 38.4192, lng: 27.1287 },
  Kahramanmaraş: { lat: 37.5858, lng: 36.9371 },
  Karabük: { lat: 41.2061, lng: 32.6204 },
  Karaman: { lat: 37.1759, lng: 33.2287 },
  Kars: { lat: 40.6013, lng: 43.0975 },
  Kastamonu: { lat: 41.3887, lng: 33.7827 },
  Kayseri: { lat: 38.7312, lng: 35.4787 },
  Kırıkkale: { lat: 39.8468, lng: 33.5153 },
  Kırklareli: { lat: 41.7333, lng: 27.2167 },
  Kırşehir: { lat: 39.1425, lng: 34.1709 },
  Kilis: { lat: 36.7184, lng: 37.1212 },
  Kocaeli: { lat: 40.8533, lng: 29.8815 },
  Konya: { lat: 37.8746, lng: 32.4932 },
  Kütahya: { lat: 39.4167, lng: 29.9833 },
  Malatya: { lat: 38.3552, lng: 38.3095 },
  Manisa: { lat: 38.6191, lng: 27.4289 },
  Mardin: { lat: 37.3212, lng: 40.7245 },
  Mersin: { lat: 36.8121, lng: 34.6415 },
  Muğla: { lat: 37.2153, lng: 28.3636 },
  Muş: { lat: 38.9462, lng: 41.7539 },
  Nevşehir: { lat: 38.6939, lng: 34.6857 },
  Niğde: { lat: 37.9667, lng: 34.6833 },
  Ordu: { lat: 40.9839, lng: 37.8764 },
  Osmaniye: { lat: 37.0742, lng: 36.2478 },
  Rize: { lat: 41.0201, lng: 40.5234 },
  Sakarya: { lat: 40.7569, lng: 30.3783 },
  Samsun: { lat: 41.2867, lng: 36.33 },
  Siirt: { lat: 37.9333, lng: 41.95 },
  Sinop: { lat: 42.0267, lng: 35.1551 },
  Sivas: { lat: 39.7477, lng: 37.0179 },
  Şanlıurfa: { lat: 37.1591, lng: 38.7969 },
  Şırnak: { lat: 37.4187, lng: 42.4918 },
  Tekirdağ: { lat: 40.978, lng: 27.511 },
  Tokat: { lat: 40.3167, lng: 36.55 },
  Trabzon: { lat: 41.0027, lng: 39.7168 },
  Tunceli: { lat: 39.1079, lng: 39.5401 },
  Uşak: { lat: 38.6823, lng: 29.4082 },
  Van: { lat: 38.4891, lng: 43.4089 },
  Yalova: { lat: 40.65, lng: 29.2667 },
  Yozgat: { lat: 39.8181, lng: 34.8147 },
  Zonguldak: { lat: 41.4564, lng: 31.7987 },
};

function normalizeCityKey(city: string): string {
  const trimmed = city.trim();
  const exact = TR_CITIES.find((c) => c === trimmed);
  if (exact) return exact;
  const lower = trimmed.toLocaleLowerCase('tr-TR');
  const fuzzy = TR_CITIES.find((c) => c.toLocaleLowerCase('tr-TR') === lower);
  if (fuzzy) return fuzzy;
  const ascii = trimmed
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
  const fuzzyAscii = TR_CITIES.find(
    (c) =>
      c
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'I')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .toLowerCase() === ascii.toLowerCase()
  );
  return fuzzyAscii ?? trimmed;
}

export function getDistrictsByCity(city: string): string[] {
  const key = normalizeCityKey(city);
  return DISTRICT_MAP[key] ?? ['Merkez'];
}

export function getNeighborhoodsByDistrict(district: string): string[] {
  return NEIGHBORHOOD_MAP[district] ?? ['Merkez Mahallesi'];
}

export function resolveCoordinates(
  city: string,
  _district: string
): { latitude: number; longitude: number } {
  const key = normalizeCityKey(city);
  const base = CITY_COORDINATES[key] ?? CITY_COORDINATES.Ankara;
  // İlçe için ayrı koordinat yok; il merkezini kullan. (Eski hash tabanlı "jitter"
  // kıyı illerinde noktayı denize taşıyordu; kaldırıldı — nokta hep merkezde, karada.)
  return {
    latitude: base.lat,
    longitude: base.lng,
  };
}

export function filterCities(query: string): string[] {
  const q = query.trim().toLocaleLowerCase('tr-TR');
  if (!q) return [...TR_CITIES];
  return TR_CITIES.filter((c) => c.toLocaleLowerCase('tr-TR').includes(q));
}
