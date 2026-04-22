using System;
using System.Threading.Tasks;

namespace Yukle.Api.Services;

/// <summary>
/// <b>Faz 4.1 — IPaymentService Arayüzü</b>
/// <para>
/// Mimari bağımsızlık için oluşturuldu. Yarın Iyzico, Stripe vb. bir entegrasyona 
/// geçildiğinde sadece bu interface'i implemente eden yeni bir sınıf yazılarak DI container'dan değiştirilecek.
/// </para>
/// </summary>
public interface IPaymentService
{
    /// <summary>
    /// Şoför teklifi kabul edildiği anda, tutarı müşteriden çeker ve 
    /// havuza (Escrow/Bloke) alır. Gerçek bir Iyzico entegrasyonunda 
    /// ThreedsInitialize veya Auth işlemleri buraya denk gelir.
    /// </summary>
    Task<bool> HoldPaymentAsync(Guid loadId, decimal amount, string creditCardToken);

    /// <summary>
    /// Teslimat şoför tarafından QR kod vs. ile tamamlandığında,
    /// havuzdaki paranın komisyon kesilerek şoförün hesabına (Sub-merchant) 
    /// aktarılmasını (Release) tetikler.
    /// </summary>
    Task<bool> ReleasePaymentAsync(Guid loadId, int driverUserId);
}
