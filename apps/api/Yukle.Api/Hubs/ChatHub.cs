using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Yukle.Api.Data;
using Yukle.Api.Models;
using Yukle.Api.Services;

namespace Yukle.Api.Hubs;

/// <summary>
/// Yük özelinde şoför–müşteri anlık mesajlaşma hub'ı.
/// SignalR grup adı = loadId (GUID string).
/// </summary>
[Authorize]
public sealed class ChatHub(
    ILogger<ChatHub>           logger,
    IDistributedCache          cache,
    ILoadService               loadService,
    IChatModerationService     moderationService,
    YukleDbContext             db) : Hub
{
    private readonly ILogger<ChatHub>           _logger              = logger;
    private readonly IDistributedCache          _cache               = cache;
    private readonly ILoadService               _loadService         = loadService;
    private readonly IChatModerationService     _moderationService   = moderationService;
    private readonly YukleDbContext             _db                  = db;

    private static readonly DistributedCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
    };

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;

        if (userId is not null)
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var loadId = await _cache.GetStringAsync(GetConnectionKey(Context.ConnectionId));

        if (loadId is not null)
        {
            _logger.LogInformation(
                "ChatHub: Connection {ConnectionId} left chat room for Load {LoadId}. Reason: {Reason}",
                Context.ConnectionId,
                loadId,
                exception?.Message ?? "Normal disconnect");

            await _cache.RemoveAsync(GetConnectionKey(Context.ConnectionId));
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinChatGroup(string loadId)
    {
        if (!int.TryParse(
                Context.User?.FindFirstValue(ClaimTypes.NameIdentifier),
                out var userId))
            throw new HubException("Kimlik doğrulaması başarısız.");

        if (!Guid.TryParse(loadId, out var loadGuid))
            throw new HubException("Geçersiz yük kimliği formatı.");

        var load = await _loadService.GetLoadByIdAsync(loadGuid)
            ?? throw new HubException("Yük bulunamadı.");

        var isOwner  = load.OwnerId  == userId;
        var isDriver = load.DriverId == userId;

        if (!isOwner && !isDriver)
        {
            _logger.LogWarning(
                "ChatHub: Unauthorized JoinChatGroup attempt. User {UserId} tried Load {LoadId}.",
                userId, loadId);

            throw new HubException("Bu yüke ait sohbet odasına giriş yetkiniz bulunmuyor.");
        }

        var roomName = GetRoomName(loadId);
        await Groups.AddToGroupAsync(Context.ConnectionId, roomName);

        await _cache.SetStringAsync(
            GetConnectionKey(Context.ConnectionId),
            loadId,
            CacheOptions);

        _logger.LogInformation(
            "ChatHub: User {UserId} ({Role}) joined chat room {Room}.",
            userId, isDriver ? "Driver" : "Owner", roomName);
    }

    public async Task SendMessage(string loadId, string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            throw new HubException("Mesaj boş gönderilemez.");

        if (!int.TryParse(
                Context.User?.FindFirstValue(ClaimTypes.NameIdentifier),
                out var senderUserId))
            throw new HubException("Kimlik doğrulaması başarısız.");

        if (!Guid.TryParse(loadId, out var loadGuid))
            throw new HubException("Geçersiz yük kimliği formatı.");

        var load = await _loadService.GetLoadByIdAsync(loadGuid)
            ?? throw new HubException("Yük bulunamadı.");

        var isOwner  = load.OwnerId  == senderUserId;
        var isDriver = load.DriverId == senderUserId;

        if (!isOwner && !isDriver)
            throw new HubException("Bu yüke mesaj gönderme yetkiniz yok.");

        var senderName = Context.User?.FindFirstValue(ClaimTypes.Name)
                         ?? $"Kullanıcı #{senderUserId}";

        var roleClaim = Context.User?.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var senderRole = roleClaim switch
        {
            nameof(UserRole.Driver)   => "Driver",
            nameof(UserRole.Customer) => "Customer",
            _                         => roleClaim
        };

        var trimmed = message.Trim();
        var blocked = _moderationService.ContainsBlockedContent(trimmed);

        if (blocked)
        {
            var entity = new ChatMessage
            {
                Id            = Guid.NewGuid(),
                LoadId        = loadGuid,
                SenderUserId  = senderUserId,
                SenderName    = senderName,
                SenderRole    = senderRole,
                Message       = trimmed,
                CreatedAt     = DateTime.UtcNow,
                IsBlocked     = true,
                BlockReason   = "Uygunsuz içerik filtresi",
                BlockedAt     = DateTime.UtcNow
            };
            _db.ChatMessages.Add(entity);
            await _db.SaveChangesAsync();

            throw new HubException("Uygunsuz içerik tespit edildi. Lütfen saygılı bir dil kullanınız.");
        }

        var saved = new ChatMessage
        {
            Id            = Guid.NewGuid(),
            LoadId        = loadGuid,
            SenderUserId  = senderUserId,
            SenderName    = senderName,
            SenderRole    = senderRole,
            Message       = trimmed,
            CreatedAt     = DateTime.UtcNow,
            IsBlocked     = false
        };
        _db.ChatMessages.Add(saved);
        await _db.SaveChangesAsync();

        var room = GetRoomName(loadId);
        await Clients.Group(room).SendAsync("ReceiveMessage", new
        {
            id          = saved.Id,
            senderId    = saved.SenderUserId,
            senderName  = saved.SenderName,
            senderRole  = saved.SenderRole,
            message     = saved.Message,
            timestamp   = saved.CreatedAt,
            timestampUtc = saved.CreatedAt
        });

        _logger.LogDebug("ChatHub: User {SenderId} sent message to Load {LoadId} room.", senderUserId, loadId);
    }

    /// <summary>SignalR grup adı = yük GUID string (istenen sözleşme).</summary>
    private static string GetRoomName(string loadId) => loadId;

    private static string GetConnectionKey(string connId) => $"chat_conn:{connId}";
}
