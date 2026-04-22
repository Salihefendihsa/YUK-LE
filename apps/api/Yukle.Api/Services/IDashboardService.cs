using System.Threading.Tasks;
using Yukle.Api.DTOs;

namespace Yukle.Api.Services;

/// <summary>Dashboard istatistikleri için servis sözleşmesi.</summary>
public interface IDashboardService
{
    /// <summary>Müşterinin yük ilanı özet istatistiklerini döner.</summary>
    Task<CustomerDashboardDto> GetCustomerStatsAsync(int userId);

    /// <summary>Şoförün teklif ve teslim özet istatistiklerini döner.</summary>
    Task<DriverDashboardDto> GetDriverStatsAsync(int userId);
}
