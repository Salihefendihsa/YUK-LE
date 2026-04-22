namespace Yukle.Api.DTOs;

/// <summary>Şoförün genel istatistik özetini taşıyan DTO.</summary>
public sealed class DriverDashboardDto
{
    /// <summary>Teslim edilmiş (Delivered) toplam iş sayısı.</summary>
    public int     CompletedJobCount { get; set; }

    /// <summary>Henüz sonuçlanmamış (Pending) aktif teklif sayısı.</summary>
    public int     ActiveBidCount    { get; set; }

    /// <summary>Tamamlanan işlerden elde edilen toplam kazanç.</summary>
    public decimal TotalEarnings     { get; set; }
}
