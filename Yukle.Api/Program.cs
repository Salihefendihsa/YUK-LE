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
        o => o.UseNetTopologySuite()));

// =============== 2. DEPENDENCY INJECTION (DI) ===============
builder.Services.AddControllers();
// Projede bulunan özel servisler buraya ekleniyor.
builder.Services.AddScoped<Yukle.Api.Services.ITokenService, Yukle.Api.Services.TokenService>(); // <-- Yeni Token Service!
builder.Services.AddScoped<Yukle.Api.Services.LoadService>();
builder.Services.AddScoped<Yukle.Api.Services.IAuthService, Yukle.Api.Services.AuthService>(); // <-- Tanıtım Yapıldı
builder.Services.AddScoped<Yukle.Api.Services.BidService>();
builder.Services.AddScoped<Yukle.Api.Services.AiPricingService>();
builder.Services.AddHttpClient<GeminiService>();

// =============== 3. JWT & AUTHENTICATION ===============
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new ArgumentNullException("Jwt:Key"))),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
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
