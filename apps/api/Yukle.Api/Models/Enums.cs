namespace Yukle.Api.Models;

/// <summary>
/// Araç türleri. ÖNEMLİ: Mevcut üyeler (0–3) SİLİNMEZ/YENİDEN SIRALANMAZ —
/// veritabanında integer olarak saklandığı için yeni üyeler yalnızca SONA eklenir.
/// </summary>
public enum VehicleType
{
    TIR,            // 0
    Kamyon,         // 1
    Kamyonet,       // 2
    Panelvan,       // 3
    // ── v3 ek araç tipleri (sona eklendi) ──
    Frigorifik,        // 4
    Tenteli,           // 5
    AcikKasa,          // 6  (Açık Kasa / Platform)
    Lowboy,            // 7
    Tanker,            // 8
    Damperli,          // 9
    KonteynerTasiyici, // 10 (Konteyner Taşıyıcı)
    Silobas            // 11
}

/// <summary>
/// Yük türleri. ÖNEMLİ: Mevcut üyeler (0–4) SİLİNMEZ/YENİDEN SIRALANMAZ —
/// veritabanında integer olarak saklandığı için yeni üyeler yalnızca SONA eklenir.
/// </summary>
public enum LoadType
{
    Paletli,        // 0
    Dökme,          // 1  (Dökme Yük)
    SoğukZincir,    // 2  (Soğuk Zincir)
    TehlikeliMadde, // 3  (Tehlikeli Madde / ADR)
    Parsiyel,       // 4
    // ── v3 ek yük türleri (sona eklendi) ──
    GenelKargo,       // 5
    Konteyner,        // 6
    ProjeAgirYuk,     // 7  (Proje / Ağır Yük)
    CanliHayvan,      // 8
    Gida,             // 9
    InsaatMalzemesi,  // 10
    AkaryakitSivi,    // 11 (Akaryakıt / Sıvı)
    TahilHububat,     // 12 (Tahıl / Hububat)
    Otomotiv,         // 13 (Araç Taşıma)
    MobilyaBeyazEsya, // 14 (Mobilya / Beyaz Eşya)
    Kimyasal          // 15
}

/// <summary>Yük ilanının yaşam döngüsü.</summary>
public enum LoadStatus
{
    Active,     // İlanda
    Assigned,   // Atandı
    OnWay,      // Yolda
    Arrived,    // Hedefe Ulaştı — Haversine ile otomatik algılandı
    Delivered,  // Teslim Edildi
    Cancelled   // İptal
}

/// <summary>Şoför "Boş Araç" ilanının yaşam döngüsü.</summary>
public enum DriverListingStatus
{
    Active,    // 0 — Yayında
    Matched,   // 1 — Eşleşti
    Cancelled, // 2 — İptal
    Expired    // 3 — Süresi doldu
}

/// <summary>Teklif durumları.</summary>
public enum BidStatus
{
    Pending,
    Accepted,
    Rejected,
    Cancelled
}

/// <summary>
/// Müşterinin bir şoför "Boş Araç" ilanına verdiği yük teklifinin durumları.
/// DB'de integer saklanır — mevcut üyeler SİLİNMEZ/YENİDEN SIRALANMAZ, yeni üyeler SONA eklenir.
/// </summary>
public enum ListingOfferStatus
{
    Pending,    // 0 — Beklemede
    Accepted,   // 1 — Şoför kabul etti (yük atandı, ilan Eşleşti)
    Rejected,   // 2 — Şoför reddetti (veya başka teklif kabul edilince)
    Withdrawn   // 3 — Müşteri geri çekti
}

/// <summary>Yakıt türleri — <c>FuelPrice</c> tablosunda kullanılır.</summary>
public enum FuelType
{
    Motorin,
    Benzin,
    Lpg
}
