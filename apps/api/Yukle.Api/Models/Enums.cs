namespace Yukle.Api.Models;

/// <summary>Araç türleri.</summary>
public enum VehicleType
{
    TIR,
    Kamyon,
    Kamyonet,
    Panelvan
}

/// <summary>Yük türleri.</summary>
public enum LoadType
{
    Paletli,
    Dökme,
    SoğukZincir,
    TehlikeliMadde,
    Parsiyel
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

/// <summary>Teklif durumları.</summary>
public enum BidStatus
{
    Pending,
    Accepted,
    Rejected,
    Cancelled
}

/// <summary>Yakıt türleri — <c>FuelPrice</c> tablosunda kullanılır.</summary>
public enum FuelType
{
    Motorin,
    Benzin,
    Lpg
}
