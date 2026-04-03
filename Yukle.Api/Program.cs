using Microsoft.EntityFrameworkCore;
using Yukle.Api.Data;
using Yukle.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =============== 1. DATABASE & SERVICES CONTEXT ===============
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
var redisConn = builder.Configuration["Redis"]
    ?? throw new InvalidOperationException("[FATAL] 'Redis' bağlantı dizesi appsettings.json içinde bulunamadı.");

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration         = redisConn;
    options.InstanceName          = "yukle:";   // tüm key'ler "yukle:" prefix'i alır
    options.ConfigurationOptions  = StackExchange.Redis.ConfigurationOptions.Parse(redisConn);
    options.ConfigurationOptions.AbortOnConnectFail = false; // Redis geçici kapanırsa uygulama çökmez
});

builder.Services.AddControllers();
// Projede bulunan özel servisler buraya ekleniyor.
builder.Services.AddScoped<Yukle.Api.Services.ITokenService, Yukle.Api.Services.TokenService>(); // <-- Yeni Token Service!
builder.Services.AddScoped<Yukle.Api.Services.LoadService>();
builder.Services.AddScoped<Yukle.Api.Services.IAuthService, Yukle.Api.Services.AuthService>(); // <-- Tanıtım Yapıldı
builder.Services.AddScoped<Yukle.Api.Services.ISmsService, Yukle.Api.Services.NetgsmSmsService>();
builder.Services.AddScoped<Yukle.Api.Services.BidService>();
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

app.UseHttpsRedirection();

// UseAuthentication ve UseAuthorization SIRALAMASI KESİNLİKLE BÖYLE OLMALIDIR. (MapControllers'dan Önce!)
app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();

app.Run();
