using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Yukle.Api.DTOs;

namespace Yukle.Api.Services;

/// <summary>
/// Şoför "Boş Araç" ilanı CRUD ve listeleme operasyonları için servis sözleşmesi.
/// (Bu dalga: CRUD + listeleme. Müşteri teklifi/eşleşme sonraki dalga.)
/// </summary>
public interface IDriverListingService
{
    /// <summary>Yeni şoför ilanı oluşturur ve oluşturulan kaydın ID'sini döner.</summary>
    Task<Guid> CreateAsync(CreateDriverListingDto dto, int driverId);

    /// <summary>
    /// Durumu Active olan ilanları döner. Opsiyonel çıkış/varış şehri filtresi uygulanır.
    /// </summary>
    Task<List<DriverListingDto>> GetActiveAsync(string? fromCity, string? toCity);

    /// <summary>Belirli bir şoförün tüm ilanları (tüm durumlar), en yeni üstte.</summary>
    Task<List<DriverListingDto>> GetMineAsync(int driverId);

    /// <summary>Belirli bir ID'ye sahip ilanın detayı; bulunamazsa null.</summary>
    Task<DriverListingDto?> GetByIdAsync(Guid id);

    /// <summary>
    /// Şoförün kendi ilanını iptal eder (Status → Cancelled).
    /// Bulunamazsa <see cref="KeyNotFoundException"/>, sahibi değilse
    /// <see cref="UnauthorizedAccessException"/>, zaten aktif değilse
    /// <see cref="InvalidOperationException"/> fırlatır.
    /// </summary>
    Task CancelAsync(Guid id, int driverId);
}
