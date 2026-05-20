using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Yukle.Api.Services.Sms;

public static class SmsServiceRegistration
{
    public static IServiceCollection AddYukleSms(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SmsOptions>(configuration.GetSection(SmsOptions.SectionName));

        services.AddHttpClient("Netgsm", client =>
        {
            client.BaseAddress = new Uri("https://api.netgsm.com.tr/");
            client.Timeout     = TimeSpan.FromSeconds(10);
        });

        services.AddSingleton<NetgsmApiClient>();

        var provider = configuration["Sms:Provider"] ?? "Netgsm";

        switch (provider.Trim().ToLowerInvariant())
        {
            case "netgsm":
                services.AddScoped<ISmsService, NetgsmSmsService>();
                break;
            default:
                services.AddScoped<ISmsService, NetgsmSmsService>();
                break;
        }

        return services;
    }
}
