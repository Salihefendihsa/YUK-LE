namespace Yukle.Api.DTOs;

/// <summary>Müşterinin genel istatistik özetini taşıyan DTO.</summary>
public sealed class CustomerDashboardDto
{
    /// <summary>Şu an ilanda olan (Active) yük sayısı.</summary>
    public int     ActiveLoadCount    { get; set; }

    /// <summary>Şoföre atanmış ve yolda olan (OnWay) yük sayısı.</summary>
    public int     OnWayLoadCount     { get; set; }

    /// <summary>Teslim edilmiş (Delivered) toplam yük sayısı.</summary>
    public int     DeliveredLoadCount { get; set; }

    /// <summary>Teslim edilen yükler için ödenen toplam tutar.</summary>
    public decimal TotalSpent         { get; set; }
}
