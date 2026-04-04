using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddScoped<Yukle.Api.Services.ITokenService,        Yukle.Api.Services.TokenService>();
builder.Services.AddScoped<Yukle.Api.Services.ILoadService,         Yukle.Api.Services.LoadService>();
builder.Services.AddScoped<Yukle.Api.Services.IAuthService,         Yukle.Api.Services.AuthService>();
builder.Services.AddScoped<Yukle.Api.Services.ISmsService,          Yukle.Api.Services.NetgsmSmsService>();
builder.Services.AddScoped<Yukle.Api.Services.IBidService,          Yukle.Api.Services.BidService>();
builder.Services.AddScoped<Yukle.Api.Services.INotificationService, Yukle.Api.Services.NotificationService>();
builder.Services.AddScoped<Yukle.Api.Services.IDashboardService,    Yukle.Api.Services.DashboardService>();
builder.Services.AddScoped<Yukle.Api.Services.AiPricingService>();
builder.Services.AddHttpClient<GeminiService>();

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
builder.Services.AddAuthorization();

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
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// HTTPS zorunlu — HTTP bağlantıları HTTPS'e yönlendirilir (WSS güvencesi)
app.UseHttpsRedirection();

// CORS: Authentication'dan ÖNCE gelmelidir (preflight OPTIONS istekleri JWT taşımaz)
app.UseCors("YuklePolicy");

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
