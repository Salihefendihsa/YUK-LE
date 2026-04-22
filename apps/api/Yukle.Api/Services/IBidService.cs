using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

/// <summary>
/// Teklif verme, listeleme ve kabul etme operasyonları için servis sözleşmesi.
/// </summary>
public interface IBidService
{
    /// <summary>
    /// Şoförün belirtilen yüke teklif vermesini sağlar.
    /// Oluşturulan <see cref="Bid"/> nesnesini döner.
    /// </summary>
    Task<Bid> SubmitBidAsync(CreateBidDto dto, int driverId);

    /// <summary>
    /// Belirli bir yük ilanına gelen teklifleri şoför bilgileriyle döner.
    /// Sahiplik doğrulaması yapılır: yalnızca yük sahibi erişebilir.
    /// </summary>
    Task<List<BidListDto>> GetBidsByLoadIdAsync(Guid loadId, int customerId);

    /// <summary>
    /// Beklemedeki bir teklifi kabul eder; yükü şoföre atar,
    /// diğer teklifleri reddeder. Atomik (transaction) çalışır.
    /// Sahiplik doğrulaması yapılır: yalnızca yük sahibi kabul edebilir.
    /// </summary>
    Task AcceptBidAsync(int bidId, int customerId);
}
