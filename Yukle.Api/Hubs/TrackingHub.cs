using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Yukle.Api.Hubs;

/// <summary>
/// Gerçek zamanlı araç takip hub'ı.
/// Şoförler konum verisi yayınlar; müşteriler ve operatörler bu veriyi anlık izler.
/// İleride UpdateLocation, JoinLoadRoom gibi metodlarla genişletilecektir.
/// </summary>
[Authorize]
public sealed class TrackingHub : Hub
{
}
