/**
 * Komuta Merkezi "Demo veriler" bölümü için sahte sabitler.
 *
 * ⚠️ Bunlar GERÇEK değildir. Backend bu metrikleri (tamamlanan/aktif sefer,
 * aylık komisyon, ortalama teslimat süresi) henüz döndürmüyor. Ekranda her biri
 * amber "DEMO" rozetiyle açıkça işaretlenerek gösterilir; gerçek veriymiş gibi
 * sunulmaz. Gerçek uçlar eklendiğinde bu dosya kaldırılıp hook'a bağlanmalıdır.
 */
export const ADMIN_DASHBOARD_DEMO = {
  /** Bugüne dek tamamlanmış (teslim edilmiş) toplam sefer — sahte. */
  completedTrips: 1284,
  /** Şu an yolda olan aktif sefer — sahte. */
  activeTrips: 37,
  /** Bu ayki platform komisyon geliri (TRY) — sahte. */
  monthlyCommissionTRY: 48650,
  /** Ortalama teslimat süresi (saat) — sahte. */
  avgDeliveryHours: 14.5,
} as const;

/** Demo metrik anahtarları — kart ↔ detay sheet eşleşmesi. */
export type AdminDemoKey = 'completedTrips' | 'activeTrips' | 'monthlyCommission' | 'avgDelivery';

export type AdminDemoDetail = {
  /** Detay sheet başlığı. */
  title: string;
  /** Öne çıkan (özet) değer — ekranda formatlanmış metin. */
  headline: string;
  /** Küçük demo kırılım/trend satırları. */
  breakdown: { label: string; value: string }[];
};

/** Her demo kartının tıklanınca açılan detayındaki sahte kırılım/trend. */
export const ADMIN_DEMO_DETAILS: Record<AdminDemoKey, AdminDemoDetail> = {
  completedTrips: {
    title: 'Tamamlanan sefer',
    headline: '1.284 sefer',
    breakdown: [
      { label: 'Bu hafta', value: '86' },
      { label: 'Bu ay', value: '342' },
      { label: 'Geçen ay', value: '310' },
      { label: 'Aylık değişim', value: '+10%' },
    ],
  },
  activeTrips: {
    title: 'Aktif sefer',
    headline: '37 sefer yolda',
    breakdown: [
      { label: 'Yolda', value: '29' },
      { label: 'Yüklemede', value: '6' },
      { label: 'Varışta', value: '2' },
      { label: 'Gecikmeli', value: '1' },
    ],
  },
  monthlyCommission: {
    title: 'Bu ay komisyon',
    headline: '₺48.650',
    breakdown: [
      { label: 'Müşteri payı (%2)', value: '₺24.180' },
      { label: 'Şoför payı (%2)', value: '₺24.470' },
      { label: 'Geçen aya göre', value: '+8%' },
    ],
  },
  avgDelivery: {
    title: 'Ort. teslimat süresi',
    headline: '14,5 saat',
    breakdown: [
      { label: 'Şehir içi', value: '4,2 sa' },
      { label: 'Şehirler arası', value: '18,9 sa' },
      { label: 'Geçen aya göre', value: '-1,3 sa' },
    ],
  },
};
