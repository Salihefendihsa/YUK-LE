export const TR_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin',
  'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur',
  'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir',
  'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
]

const DISTRICT_MAP: Record<string, string[]> = {
  İstanbul: ['Kadıköy', 'Üsküdar', 'Beşiktaş', 'Şişli', 'Bakırköy'],
  Ankara: ['Çankaya', 'Keçiören', 'Yenimahalle', 'Etimesgut', 'Sincan'],
  İzmir: ['Konak', 'Bornova', 'Karşıyaka', 'Buca', 'Bayraklı'],
  Bursa: ['Osmangazi', 'Nilüfer', 'Yıldırım', 'Gemlik'],
  Antalya: ['Muratpaşa', 'Kepez', 'Konyaaltı', 'Alanya'],
}

const NEIGHBORHOOD_MAP: Record<string, string[]> = {
  Kadıköy: ['Koşuyolu', 'Fenerbahçe', 'Caddebostan', 'Erenköy'],
  Çankaya: ['Kızılay', 'Bahçelievler', 'Ayrancı', 'Dikmen'],
  Konak: ['Alsancak', 'Güzelyalı', 'Mithatpaşa', 'Hatay'],
}

export function getDistrictsByCity(city: string) {
  return DISTRICT_MAP[city] ?? ['Merkez']
}

export function getNeighborhoodsByDistrict(district: string) {
  return NEIGHBORHOOD_MAP[district] ?? ['Merkez Mahallesi']
}
