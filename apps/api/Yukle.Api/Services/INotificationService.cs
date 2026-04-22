using System.Collections.Generic;
using System.Threading.Tasks;

namespace Yukle.Api.Services;

/// <summary>
/// Kullanıcıya bildirim gönderme sözleşmesi.
/// DB kaydı + SignalR push + FCM push (uygulama kapalıyken) üçlüsünü kapsar.
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Kullanıcıya DB + SignalR üzerinden bildirim gönderir.
    /// Kullanıcının kayıtlı FcmToken'ı varsa FCM push da tetiklenir.
    /// </summary>
    Task SendAsync(int userId, string title, string message);

    /// <summary>
    /// Belirli bir FCM token'ına doğrudan push bildirimi gönderir.
    /// Uygulama kapalı/arka planda olsa bile çalışır.
    /// </summary>
    Task SendPushAsync(string fcmToken, string title, string body,
                       Dictionary<string, string>? data = null);
}
