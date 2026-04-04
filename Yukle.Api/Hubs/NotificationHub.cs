using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Yukle.Api.Hubs;

/// <summary>
/// Gerçek zamanlı bildirim hub'ı.
/// Her kullanıcı bağlandığında kendi userId'siyle adlandırılmış bir gruba girer.
/// Bildirimler <c>NotificationService</c> üzerinden bu gruba push edilir.
/// </summary>
[Authorize]
public sealed class NotificationHub : Hub
{
    /// <summary>
    /// Bağlantı kurulduğunda kullanıcıyı kendi ID'sine özel gruba ekler.
    /// SignalR, <c>Context.UserIdentifier</c>'ı JWT'deki <c>NameIdentifier</c> claim'inden okur.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;

        if (userId is not null)
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);

        await base.OnConnectedAsync();
    }

    /// <summary>Bağlantı koptuğunda gruptan çıkış otomatik yapılır; override gerekmiyor.</summary>
    public override Task OnDisconnectedAsync(Exception? exception)
        => base.OnDisconnectedAsync(exception);
}
