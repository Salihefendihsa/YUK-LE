export type CitySize = 'xl' | 'lg' | 'md' | 'sm'

export interface City {
  name: string
  lat: number
  lng: number
  size: CitySize
  factories?: number
  highlighted?: boolean
}

export interface CountryConfig {
  code: string
  isoNumeric: string
  name: string
  shortName: string
  flag: string
  status: 'active' | 'coming_soon'
  hubInfo: string
  cities: City[]
  routes?: ReadonlyArray<readonly [string, string]>
}

export const COUNTRIES: CountryConfig[] = [
  {
    code: 'tr',
    isoNumeric: '792',
    name: 'Türkiye',
    shortName: 'Türkiye',
    flag: '🇹🇷',
    status: 'active',
    hubInfo: 'Ana operasyon merkezi · 81 ilde aktif',
    cities: [
      { name: 'İstanbul', lat: 41.0, lng: 28.97, size: 'xl', factories: 487 },
      { name: 'Ankara', lat: 39.93, lng: 32.86, size: 'xl', factories: 312 },
      { name: 'İzmir', lat: 38.42, lng: 27.13, size: 'lg', factories: 234 },
      { name: 'Adana', lat: 37.0, lng: 35.32, size: 'lg', factories: 156 },
      { name: 'Bursa', lat: 40.18, lng: 29.07, size: 'md', factories: 178 },
      { name: 'Antalya', lat: 36.88, lng: 30.7, size: 'md', factories: 142 },
      { name: 'Gaziantep', lat: 37.07, lng: 37.38, size: 'md', factories: 128 },
      { name: 'Konya', lat: 37.87, lng: 32.49, size: 'md', factories: 98 },
      { name: 'Kayseri', lat: 38.73, lng: 35.48, size: 'md', factories: 87 },
      { name: 'Elazığ', lat: 38.68, lng: 39.22, size: 'md', factories: 48, highlighted: true },
      { name: 'Samsun', lat: 41.29, lng: 36.33, size: 'sm', factories: 76 },
      { name: 'Trabzon', lat: 41.0, lng: 39.73, size: 'sm', factories: 54 },
      { name: 'Diyarbakır', lat: 37.91, lng: 40.24, size: 'sm', factories: 67 },
      { name: 'Erzurum', lat: 39.9, lng: 41.27, size: 'sm', factories: 42 },
    ],
    routes: [
      ['İstanbul', 'Ankara'],
      ['İstanbul', 'İzmir'],
      ['Ankara', 'Adana'],
      ['Ankara', 'Elazığ'],
      ['Gaziantep', 'Elazığ'],
    ],
  },
  {
    code: 'de',
    isoNumeric: '276',
    name: 'Almanya',
    shortName: 'Almanya',
    flag: '🇩🇪',
    status: 'coming_soon',
    hubInfo: 'Avrupa hub merkezi · Yakında',
    cities: [
      { name: 'Berlin', lat: 52.52, lng: 13.4, size: 'xl', factories: 23 },
      { name: 'Hamburg', lat: 53.55, lng: 9.99, size: 'lg', factories: 18 },
      { name: 'Münih', lat: 48.14, lng: 11.58, size: 'lg', factories: 15 },
      { name: 'Frankfurt', lat: 50.11, lng: 8.68, size: 'md', factories: 12 },
      { name: 'Köln', lat: 50.94, lng: 6.96, size: 'md', factories: 9 },
    ],
  },
  {
    code: 'gb',
    isoNumeric: '826',
    name: 'Birleşik Krallık',
    shortName: 'UK',
    flag: '🇬🇧',
    status: 'coming_soon',
    hubInfo: 'Yakında · UK operasyonu',
    cities: [
      { name: 'Londra', lat: 51.51, lng: -0.13, size: 'xl', factories: 19 },
      { name: 'Manchester', lat: 53.48, lng: -2.24, size: 'lg', factories: 11 },
      { name: 'Birmingham', lat: 52.49, lng: -1.89, size: 'md', factories: 8 },
      { name: 'Liverpool', lat: 53.41, lng: -2.99, size: 'md', factories: 6 },
    ],
  },
  {
    code: 'it',
    isoNumeric: '380',
    name: 'İtalya',
    shortName: 'İtalya',
    flag: '🇮🇹',
    status: 'coming_soon',
    hubInfo: 'Akdeniz koridoru · Yakında',
    cities: [
      { name: 'Roma', lat: 41.9, lng: 12.5, size: 'xl', factories: 14 },
      { name: 'Milano', lat: 45.46, lng: 9.19, size: 'lg', factories: 17 },
      { name: 'Napoli', lat: 40.85, lng: 14.27, size: 'md', factories: 9 },
      { name: 'Torino', lat: 45.07, lng: 7.69, size: 'md', factories: 8 },
    ],
  },
  {
    code: 'us',
    isoNumeric: '840',
    name: 'Amerika Birleşik Devletleri',
    shortName: 'ABD',
    flag: '🇺🇸',
    status: 'coming_soon',
    hubInfo: 'Amerika operasyonu · Yakında',
    cities: [
      { name: 'New York', lat: 40.71, lng: -74.0, size: 'xl', factories: 31 },
      { name: 'Los Angeles', lat: 34.05, lng: -118.24, size: 'xl', factories: 28 },
      { name: 'Chicago', lat: 41.88, lng: -87.63, size: 'lg', factories: 14 },
      { name: 'Houston', lat: 29.76, lng: -95.37, size: 'md', factories: 11 },
      { name: 'Miami', lat: 25.76, lng: -80.19, size: 'md', factories: 9 },
    ],
  },
  {
    code: 'ae',
    isoNumeric: '784',
    name: 'Birleşik Arap Emirlikleri',
    shortName: 'BAE',
    flag: '🇦🇪',
    status: 'coming_soon',
    hubInfo: 'Orta Doğu hub · Yakında',
    cities: [
      { name: 'Dubai', lat: 25.2, lng: 55.27, size: 'xl', factories: 16 },
      { name: 'Abu Dabi', lat: 24.47, lng: 54.37, size: 'lg', factories: 10 },
      { name: 'Şarja', lat: 25.35, lng: 55.42, size: 'md', factories: 6 },
    ],
  },
  {
    code: 'sg',
    isoNumeric: '702',
    name: 'Singapur',
    shortName: 'Singapur',
    flag: '🇸🇬',
    status: 'coming_soon',
    hubInfo: 'Asya-Pasifik geçişi · Yakında',
    cities: [{ name: 'Singapur', lat: 1.35, lng: 103.82, size: 'xl', factories: 12 }],
  },
  {
    code: 'jp',
    isoNumeric: '392',
    name: 'Japonya',
    shortName: 'Japonya',
    flag: '🇯🇵',
    status: 'coming_soon',
    hubInfo: 'Uzak Doğu pazarı · Yakında',
    cities: [
      { name: 'Tokyo', lat: 35.68, lng: 139.65, size: 'xl', factories: 22 },
      { name: 'Osaka', lat: 34.69, lng: 135.5, size: 'lg', factories: 14 },
      { name: 'Yokohama', lat: 35.44, lng: 139.64, size: 'md', factories: 9 },
    ],
  },
  {
    code: 'au',
    isoNumeric: '036',
    name: 'Avustralya',
    shortName: 'Avustralya',
    flag: '🇦🇺',
    status: 'coming_soon',
    hubInfo: 'Okyanusya operasyonu · Yakında',
    cities: [
      { name: 'Sidney', lat: -33.87, lng: 151.21, size: 'xl', factories: 11 },
      { name: 'Melbourne', lat: -37.81, lng: 144.96, size: 'lg', factories: 9 },
      { name: 'Brisbane', lat: -27.47, lng: 153.03, size: 'md', factories: 6 },
    ],
  },
  {
    code: 'br',
    isoNumeric: '076',
    name: 'Brezilya',
    shortName: 'Brezilya',
    flag: '🇧🇷',
    status: 'coming_soon',
    hubInfo: 'Güney Amerika genişlemesi · Yakında',
    cities: [
      { name: 'São Paulo', lat: -23.55, lng: -46.63, size: 'xl', factories: 13 },
      { name: 'Rio de Janeiro', lat: -22.91, lng: -43.17, size: 'lg', factories: 10 },
      { name: 'Brasília', lat: -15.78, lng: -47.93, size: 'md', factories: 5 },
    ],
  },
]

export function getCountry(code: string): CountryConfig | undefined {
  return COUNTRIES.find((c) => c.code === code)
}
