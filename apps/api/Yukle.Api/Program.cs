using System.Net;
using FirebaseAdmin;
using Yukle.Api.BackgroundServices;
using Google.Apis.Auth.OAuth2;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Http.Resilience;
using Polly;
using Yukle.Api.Data;
using Yukle.Api.Infrastructure;
using Yukle.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// =============== -1. SERILOG & MERKEZİ LOGLAMA ===============
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithCorrelationId()
    .WriteTo.Console()
    .WriteTo.Seq("http://localhost:5341")
);

// =============== 0. FIREBASE ADMIN SDK ===============
var firebaseCredPath = builder.Configuration["Firebase:CredentialPath"]
    ?? "firebase-service-account.json";

if (File.Exists(firebaseCredPath))
{
#pragma warning disable CS0618
    FirebaseApp.Create(new AppOptions
    {
        Credential = GoogleCredential.FromFile(firebaseCredPath)
    });
#pragma warning restore CS0618
}
else
{
    Console.WriteLine($"[WARN] Firebase kimlik dosyası bulunamadı: '{firebaseCredPath}'. " +
                      "FCM push bildirimleri devre dışı. " +
                      "Dosyayı Firebase Console'dan indirip projeye ekleyin.");
}

// =============== 1. CORS POLİTİKASI ===============
// Yıldız (*) kullanımı yasak — SignalR AllowCredentials() ile uyumlu değil.
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy("YuklePolicy", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());   // SignalR WebSocket handshake için zorunlu
});

// =============== 2. DATABASE & SERVICES CONTEXT ===============
builder.Services.AddDbContext<YukleDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        o =>
        {
            o.UseNetTopologySuite();
            o.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
        }));

// =============== 2. DEPENDENCY INJECTION (DI) ===============
var redisConn = builder.Configuration.GetConnectionString("Redis")
    ?? throw new InvalidOperationException(
        "[FATAL] ConnectionStrings:Redis appsettings.json içinde bulunamadı.");

// Distributed cache (IDistributedCache — rate limiting, OTP, session)
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration        = redisConn;
    options.InstanceName         = "yukle:";
    options.ConfigurationOptions = StackExchange.Redis.ConfigurationOptions.Parse(redisConn);
    options.ConfigurationOptions.AbortOnConnectFail = false;
});

builder.Services.AddControllers();

// ── Phase 1.2 · Merkezi hata yönetimi (RFC 7807 ProblemDetails + IExceptionHandler) ──
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// SignalR + Redis Backplane — çok sunucu ortamında mesajları tüm node'lara iletir
builder.Services.AddSignalR(hubOptions =>
{
    // Production'da hata detayları istemciye gitmesin (bilgi sızıntısı riski)
    hubOptions.EnableDetailedErrors  = builder.Environment.IsDevelopment();

    // İstemci, handshake'i 15 s içinde tamamlayamazsa bağlantı kesilir
    hubOptions.HandshakeTimeout      = TimeSpan.FromSeconds(15);

    // Sunucu, bağlantının canlı olduğunu 15 s'de bir doğrular
    hubOptions.KeepAliveInterval     = TimeSpan.FromSeconds(15);

    // İstemciden 30 s içinde yanıt gelmezse bağlantı ölü sayılır
    hubOptions.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
})
.AddStackExchangeRedis(redisConn, options =>
{
    options.Configuration.ChannelPrefix =
        new StackExchange.Redis.RedisChannel("yukle-signalr",
            StackExchange.Redis.RedisChannel.PatternMode.Literal);
});

// Projede bulunan özel servisler buraya ekleniyor.
// ── v2.5.5 · KVKK AES-256 Şifreleme Servisi ───────────────────────────────
// Singleton: anahtar ve IV yapılandırmadan tek seferlik okunur; stateless kalır.
// EF Core ValueConverter cached model'de sabitlendiği için servisin yaşam döngüsü
// DbContext (scoped) ömründen DAHA GENİŞ olmalıdır → singleton zorunlu.
builder.Services.AddSingleton<Yukle.Api.Services.IEncryptionService,
                              Yukle.Api.Services.EncryptionService>();

builder.Services.AddScoped<Yukle.Api.Services.ITokenService,        Yukle.Api.Services.TokenService>();
builder.Services.AddScoped<Yukle.Api.Services.ILoadService,         Yukle.Api.Services.LoadService>();
builder.Services.AddScoped<Yukle.Api.Services.IAuthService,         Yukle.Api.Services.AuthService>();
builder.Services.AddScoped<Yukle.Api.Services.ISmsService,          Yukle.Api.Services.NetgsmSmsService>();
builder.Services.AddScoped<Yukle.Api.Services.IBidService,          Yukle.Api.Services.BidService>();
builder.Services.AddScoped<Yukle.Api.Services.INotificationService, Yukle.Api.Services.NotificationService>();
builder.Services.AddScoped<Yukle.Api.Services.IDashboardService,    Yukle.Api.Services.DashboardService>();
builder.Services.AddScoped<Yukle.Api.Services.AiPricingService>();
builder.Services.AddScoped<Yukle.Api.Services.PricingService>();
builder.Services.AddScoped<Yukle.Api.Services.IPaymentService,      Yukle.Api.Services.MockPaymentService>();

// ── Rota Servisi (OSRM) ────────────────────────────────────────────────────
// Named HttpClient: zaman aşımı kısa tutulur (OSRM yavaş cevap verirse Haversine'e düşsün).
builder.Services.AddHttpClient<Yukle.Api.Services.RouteService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(8);
});
builder.Services.AddScoped<Yukle.Api.Services.IRouteService>(
    sp => sp.GetRequiredService<Yukle.Api.Services.RouteService>());

// ── Yakıt Fiyatı Worker (CollectAPI) ─────────────────────────────────────
builder.Services.AddHttpClient("CollectAPI", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddHostedService<Yukle.Api.BackgroundServices.FuelPriceUpdateWorker>();

// ── Phase 2.5.7 · Admin Kurulum Servisi ──────────────────────────────────
// Her başlatmada admin rolü olup olmadığını kontrol eder. Yoksa ilk setup'ı atılım yapar.
builder.Services.AddHostedService<Yukle.Api.BackgroundServices.AdminSeederJob>();

// ── Phase 4.3 · U-ETDS Background Worker ─────────────────────────────────
// Outbox tablosundaki gönderilmeyi bekleyen bakanlık loglarını asenkron temizler.
builder.Services.AddHostedService<Yukle.Api.BackgroundServices.UetdsBackgroundWorker>();

// ── Phase 2.3 · KVKK Veri Temizlik Görevi ────────────────────────────────
// Her gün DocumentCleanup:RunHour (UTC, varsayılan: 02:00) saatinde çalışır.
// PendingReview/Rejected statüsünde 30 günden uzun süre kalan kayıtları siler.
builder.Services.AddHostedService<Yukle.Api.BackgroundServices.DocumentCleanupJob>();


// ── Gemini Görev Kuyruğu ──────────────────────────────────────────────────
// Singleton: tüm scope'lar aynı kuyruğu paylaşır — thread-safe Channel<T> içerir.
builder.Services.AddSingleton<GeminiTaskQueue>();
// BackgroundService: kuyruktan işlem çeker, throttle uygular, SignalR ile push yapar.
builder.Services.AddHostedService<GeminiQueueProcessor>();

// ── Gemini HttpClient + Resilience Pipeline ───────────────────────────────
// Strateji sırası (dıştan içe): Retry → CircuitBreaker → AttemptTimeout
// Retry, CB kapalıyken ve timeout patlarken tekrar dener.
// CB açıkken BrokenCircuitException fırlar → GeminiServiceClient.catch → Fallback.
builder.Services.AddHttpClient<GeminiServiceClient>()
    .AddResilienceHandler("gemini-pipeline", (pipelineBuilder, ctx) =>
    {
        var logger = ctx.ServiceProvider
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("Yukle.GeminiResilience");

        // ── 1. Retry: Exponential Backoff (2s → 4s → 8s) ─────────────────
        pipelineBuilder.AddRetry(new HttpRetryStrategyOptions
        {
            MaxRetryAttempts = 3,
            BackoffType      = DelayBackoffType.Exponential,
            Delay            = TimeSpan.FromSeconds(2),
            UseJitter        = false,   // Deterministik bekleme süresi
            ShouldHandle     = new PredicateBuilder<HttpResponseMessage>()
                .Handle<HttpRequestException>()
                .Handle<TaskCanceledException>()   // Timeout'tan gelen iptal
                .HandleResult(r =>
                    r.StatusCode == HttpStatusCode.TooManyRequests ||      // 429
                    r.StatusCode == HttpStatusCode.ServiceUnavailable),    // 503
            OnRetry = args =>
            {
                logger.LogWarning(
                    "Warning: Gemini API rate limit hit, retrying... " +
                    "Attempt {Attempt}/{Max}, next retry in {Delay:F0}s. " +
                    "Reason: {Reason}",
                    args.AttemptNumber + 1,
                    3,
                    args.RetryDelay.TotalSeconds,
                    args.Outcome.Exception?.Message
                        ?? args.Outcome.Result?.StatusCode.ToString()
                        ?? "unknown");
                return ValueTask.CompletedTask;
            }
        });

        // ── 2. Circuit Breaker: 5 hata → 30s devre açık ──────────────────
        // MinimumThroughput=5 + FailureRatio=1.0 → art arda 5 başarısız istek devreyi açar.
        pipelineBuilder.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
        {
            SamplingDuration  = TimeSpan.FromSeconds(30),
            MinimumThroughput = 5,
            FailureRatio      = 1.0,
            BreakDuration     = TimeSpan.FromSeconds(30),
            ShouldHandle      = new PredicateBuilder<HttpResponseMessage>()
                .Handle<HttpRequestException>()
                .Handle<TaskCanceledException>()
                .HandleResult(r =>
                    r.StatusCode == HttpStatusCode.TooManyRequests ||
                    r.StatusCode == HttpStatusCode.ServiceUnavailable ||
                    r.StatusCode == HttpStatusCode.InternalServerError),
            OnOpened = args =>
            {
                logger.LogWarning(
                    "Warning: Gemini API circuit breaker OPENED after {Count} failures. " +
                    "All requests will use fallback for {Duration}s.",
                    5,
                    args.BreakDuration.TotalSeconds);
                return ValueTask.CompletedTask;
            },
            OnClosed = args =>
            {
                logger.LogInformation(
                    "Gemini API circuit breaker CLOSED. Resuming normal AI operation.");
                return ValueTask.CompletedTask;
            },
            OnHalfOpened = args =>
            {
                logger.LogInformation(
                    "Gemini API circuit breaker HALF-OPEN. Sending probe request.");
                return ValueTask.CompletedTask;
            }
        });

        // ── 3. Attempt Timeout: Her deneme için 10s ───────────────────────
        // Retry'dan içeride — her bireysel istek en fazla 10s bekler.
        pipelineBuilder.AddTimeout(TimeSpan.FromSeconds(10));
    });

// IGeminiService → GeminiServiceClient (IHttpClientFactory'den üretilen instance'ı yeniden kullan)
builder.Services.AddScoped<IGeminiService>(
    sp => sp.GetRequiredService<GeminiServiceClient>());

// =============== 3. JWT & AUTHENTICATION ===============
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "[FATAL] Jwt:Key değeri null veya boş! " +
        "Kontrol listesi: " +
        "(1) appsettings.json ve appsettings.Development.json içinde 'Jwt' section (büyük J) ve 'Key' (büyük K) var mı? " +
        "(2) JSON formatı bozuk mu? (virgül, süslü parantez) " +
        "(3) Ortam değişkeni (env var) üzerinden override mi geliyor? " +
        "(4) ASPNETCORE_ENVIRONMENT değeri: " + builder.Environment.EnvironmentName);
}

if (Encoding.UTF8.GetByteCount(jwtKey) < 64)
{
    throw new InvalidOperationException(
        $"[FATAL] Jwt:Key en az 64 byte (512 bit) olmalıdır (HmacSha512). " +
        $"Mevcut: {Encoding.UTF8.GetByteCount(jwtKey)} byte.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // SignalR WebSocket bağlantısında token query string üzerinden iletilir
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) &&
                    ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                {
                    ctx.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });
// ── v2.5.3 · Policy-Based Authorization (RequireActiveDriver) ─────────────
//
// JWT imzası geçerli olsa bile, Gemini AI belgeleri onaylamadığı sürece şoförün
// operasyonel uç noktalara erişmesini 403 Forbidden ile engelleriz. 401 değil 403
// dönmesi iş mantığı açısından kritik: "kimliği tanıyoruz ama yetkin yok" semantiği.
//
// ASP.NET Core davranışı:
//   • Token yoksa / imza bozuksa → JwtBearer middleware 401 Unauthorized üretir.
//   • Token geçerli ama policy şartlarını sağlamıyorsa → 403 Forbidden üretir.
//
// Şartlar:
//   1) Rol = "Driver"
//   2) "IsActive" custom claim değeri kesinlikle "True" olmalı.
//      (bool.ToString() "True"/"False" üretir; RequireClaim ordinal karşılaştırır.)
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireActiveDriver", policy =>
        policy.RequireAuthenticatedUser()
              .RequireRole("Driver")
              .RequireClaim("IsActive", "True"));
});

// =============== 3b. RATE LIMITING (Phase 2.2) ===============
// Microsoft.AspNetCore.RateLimiting — yerleşik, paket gerektirmez (.NET 7+)
builder.Services.AddRateLimiter(limiterOptions =>
{
    // ── Shared: 429 ProblemDetails yanıtı ────────────────────────────────────
    // Phase 1.2 GlobalExceptionHandler ile tutarlı RFC 7807 formatı.
    limiterOptions.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode  = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/problem+json";

        // Retry-After header: ilgili politika bilgi veriyorsa kullan
        var retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfterVal)
            ? (int)retryAfterVal.TotalSeconds
            : 60;

        context.HttpContext.Response.Headers["Retry-After"] = retryAfter.ToString();

        await context.HttpContext.Response.WriteAsJsonAsync(
            new
            {
                type     = "https://tools.ietf.org/html/rfc6585#section-4",
                title    = "Too Many Requests",
                status   = 429,
                detail   = $"Çok fazla istek gönderdiniz. Lütfen {retryAfter} saniye sonra tekrar deneyin.",
                instance = context.HttpContext.Request.Path.ToString()
            },
            cancellationToken: cancellationToken);
    };

    // ── 1. login-policy ───────────────────────────────────────────────────────
    // Brute-force login koruması: IP başına 1 dakikada en fazla 5 istek.
    // FixedWindow: pencere süresi dolunca sayaç sıfırlanır.
    limiterOptions.AddFixedWindowLimiter("login-policy", options =>
    {
        options.Window              = TimeSpan.FromMinutes(1);
        options.PermitLimit         = 5;
        options.QueueLimit          = 0;   // Sıraya almadan direkt reddet
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;

        // Partition: RemoteIpAddress bazlı, null ise "anonymous" fallback
        // Not: FixedWindowLimiter global metod AddFixedWindowLimiter partition desteklemez;
        //      ayrım için AddPolicy<> kullanılır — bkz. otp-policy örneği.
    });

    // ── 2. otp-policy ────────────────────────────────────────────────────────
    // OTP brute-force koruması: IP başına 1 dakikada en fazla 3 doğrulama isteği.
    // IP bazlı partition → her IP ayrı sayaç alır.
    limiterOptions.AddPolicy("otp-policy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                Window              = TimeSpan.FromMinutes(1),
                PermitLimit         = 3,
                QueueLimit          = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            }));

    // ── 3. global-policy ─────────────────────────────────────────────────────
    // Genel API koruması: Token Bucket algoritması.
    // Kimlik doğrulanmış kullanıcı → UserId bazlı partition (adil paylaşım).
    // Anonim istekler → IP bazlı partition.
    // TokenLimit: 10, ReplenishmentPeriod: 1s, TokensPerPeriod: 10
    limiterOptions.AddPolicy("global-policy", httpContext =>
    {
        // Authenticated kullanıcı: ClaimTypes.NameIdentifier üzerinden userId
        var userId = httpContext.User.Identity?.IsAuthenticated == true
            ? httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            : null;

        var partitionKey = userId
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous";

        return RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: partitionKey,
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit             = 10,
                ReplenishmentPeriod    = TimeSpan.FromSeconds(1),
                TokensPerPeriod        = 10,
                AutoReplenishment      = true,
                QueueLimit             = 0,
                QueueProcessingOrder   = QueueProcessingOrder.OldestFirst
            });
    });
});

// =============== 4. SWAGGER (OPENAPI) & JWT SECURITY ===============
// .NET 9'un standart OpenAPI konfigürasyonuna JWT Bearer Authorization ekliyoruz
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes.Add("Bearer", new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "JWT Authorization header using the Bearer scheme. Örnek: 'eyJh...'"
        });

        document.SecurityRequirements.Add(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
        return Task.CompletedTask;
    });
});

var app = builder.Build();

// =============== 5. HTTP REQUEST PIPELINE (MIDDLEWARE) ===============
// HTTP isteklerinin kısa ve öz kaydını tutar, CorrelationId içerir
app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Merkezi exception → ProblemDetails (controller try-catch'lerinden önce)
app.UseExceptionHandler();

// HTTPS zorunlu — HTTP bağlantıları HTTPS'e yönlendirilir (WSS güvencesi)
app.UseHttpsRedirection();

// CORS: Authentication'dan ÖNCE gelmelidir (preflight OPTIONS istekleri JWT taşımaz)
app.UseCors("YuklePolicy");

// ── Phase 2.2: Rate Limiting ──────────────────────────────────────────────
// Sıralama: Routing'den sonra, Authentication'dan önce.
// Anonim istekler (login/register) de limitlenmeli → Auth öncesi zorunlu.
app.UseRateLimiter();

// Sıralama kritik: Authentication → Authorization → Endpoint
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// .RequireAuthorization() → [Authorize] attribute'una ek olarak routing seviyesinde
// JWT zorunluluğu. /negotiate dahil tüm hub isteklerine çift güvenlik katmanı.
app.MapHub<Yukle.Api.Hubs.NotificationHub>("/hubs/notifications").RequireAuthorization();
app.MapHub<Yukle.Api.Hubs.TrackingHub>("/hubs/tracking").RequireAuthorization();
app.MapHub<Yukle.Api.Hubs.ChatHub>("/hubs/chat").RequireAuthorization();

app.Run();
