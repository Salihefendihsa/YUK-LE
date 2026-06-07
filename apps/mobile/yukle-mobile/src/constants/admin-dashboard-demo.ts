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
