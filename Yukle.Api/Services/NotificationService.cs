using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FirebaseAdmin.Messaging;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.Hubs;
using AppNotification = Yukle.Api.Models.Notification;

namespace Yukle.Api.Services;

public class NotificationService : INotificationService
{
    private readonly YukleDbContext               _context;
    private readonly IHubContext<NotificationHub> _hub;

    public NotificationService(YukleDbContext context, IHubContext<NotificationHub> hub)
    {
        _context = context;
        _hub     = hub;
    }

    // ── SendAsync ─────────────────────────────────────────────────────────────

    /// <summary>
    /// 1. DB'ye kalıcı kayıt
    /// 2. SignalR üzerinden anlık push (uygulama açıksa)
    /// 3. FCM üzerinden cihaz push'u (uygulama kapalı/arka planda olsa da çalışır)
    /// </summary>
    public async Task SendAsync(int userId, string title, string message)
    {
        // DB kaydı
        var notification = new AppNotification
        {
            UserId    = userId,
            Title     = title,
            Message   = message,
            IsRead    = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Notifications.AddAsync(notification);
        await _context.SaveChangesAsync();

        // SignalR — kullanıcı çevrimiçiyse anında alır
        await _hub.Clients
            .Group(userId.ToString())
            .SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.Title,
                notification.Message,
                notification.CreatedAt
            });

        // FCM — kullanıcının kayıtlı cihaz token'ı varsa push gönder
        var fcmToken = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.FcmToken)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrWhiteSpace(fcmToken))
            await SendPushAsync(fcmToken, title, message);
    }

    // ── SendPushAsync ─────────────────────────────────────────────────────────

    /// <summary>
    /// Firebase Admin SDK aracılığıyla belirtilen FCM token'ına push bildirim gönderir.
    /// Uygulama kapalı veya arka planda olsa bile çalışır.
    /// <paramref name="data"/> ile Flutter tarafında sayfa yönlendirmesi için
    /// yük ID'si, ilan ID'si gibi meta veriler iletilebilir.
    /// </summary>
    public async Task SendPushAsync(string fcmToken, string title, string body,
                                    Dictionary<string, string>? data = null)
    {
        var message = new Message
        {
            Token = fcmToken,
            Notification = new FirebaseAdmin.Messaging.Notification
            {
                Title = title,
                Body  = body
            },
            Android = new AndroidConfig
            {
                Priority = Priority.High,
                Notification = new AndroidNotification
                {
                    Sound       = "default",
                    ClickAction = "FLUTTER_NOTIFICATION_CLICK"
                }
            },
            Apns = new ApnsConfig
            {
                Aps = new Aps
                {
                    Sound       = "default",
                    ContentAvailable = true
                }
            },
            Data = data ?? new Dictionary<string, string>()
        };

        try
        {
            await FirebaseMessaging.DefaultInstance.SendAsync(message);
        }
        catch (FirebaseMessagingException ex)
            when (ex.MessagingErrorCode is MessagingErrorCode.Unregistered
                                        or MessagingErrorCode.InvalidArgument)
        {
            // Token geçersiz ya da silinmiş → kullanıcı kaydını temizle
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.FcmToken == fcmToken);

            if (user is not null)
            {
                user.FcmToken = null;
                await _context.SaveChangesAsync();
            }
        }
    }
}
