/**
 * Yük domaini — backend Enums.cs ile birebir hizalı, web + mobilde BİREBİR AYNI
 * kullanılan tipler. (Web'in VehicleType/LoadType string union'ları ve mobilin
 * string alanları platforma özgü kaldığından burada DEĞİL.)
 */
export type LoadStatus = 'Active' | 'Assigned' | 'OnWay' | 'Arrived' | 'Delivered' | 'Cancelled';

/** API enum: VehicleType (0..11 — Yukle.Api/Models/Enums.cs, sona eklemeli). */
export type VehicleTypeValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** API enum: LoadType (0..15 — Yukle.Api/Models/Enums.cs, sona eklemeli). */
export type LoadTypeValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
