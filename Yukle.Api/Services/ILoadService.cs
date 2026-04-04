using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Yukle.Api.DTOs;

namespace Yukle.Api.Services;

/// <summary>
/// Yük ilanı CRUD ve listeleme operasyonları için servis sözleşmesi.
/// </summary>
public interface ILoadService
{
    /// <summary>Yeni yük ilanı oluşturur ve oluşturulan kaydın ID'sini döner.</summary>
    Task<Guid> CreateLoadAsync(CreateLoadDto dto, int userId);

    /// <summary>Durumu Active olan tüm yük ilanlarını özet DTO listesi olarak döner.</summary>
    Task<List<LoadListDto>> GetActiveLoadsAsync();

    /// <summary>Belirli bir ID'ye sahip yük ilanının detayını döner; bulunamazsa null.</summary>
    Task<LoadListDto?> GetLoadByIdAsync(Guid id);

    /// <summary>
    /// Şoförün yükü teslim aldığını bildirir; yük durumunu <c>OnWay</c> yapar.
    /// Sahiplik ve durum kontrolü yapılır.
    /// </summary>
    Task PickupAsync(Guid loadId, int driverId);

    /// <summary>
    /// Şoförün yükü teslim ettiğini bildirir; yük durumunu <c>Delivered</c> yapar.
    /// Sahiplik ve durum kontrolü yapılır.
    /// </summary>
    Task DeliverAsync(Guid loadId, int driverId);

    /// <summary>
    /// Yükün durumunu doğrudan günceller.
    /// TrackingHub içindeki otomatik varış algılama tarafından kullanılır.
    /// </summary>
    Task UpdateStatusAsync(Guid loadId, LoadStatus newStatus);
}
