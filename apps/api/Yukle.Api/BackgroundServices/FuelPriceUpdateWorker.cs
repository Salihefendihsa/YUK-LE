using Yukle.Api.Infrastructure;
using Yukle.Api.Services;

namespace Yukle.Api.BackgroundServices;

/// <summary>
/// Il bazli canli yakit fiyatlarini periyodik ceker ve <see cref="FuelPrice"/> tablosuna yazar.
/// </summary>
public sealed class FuelPriceUpdateWorker(
    IServiceScopeFactory           scopeFactory,
    IConfiguration                 configuration,
    ILogger<FuelPriceUpdateWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var fuelOpts = FuelOptions.FromConfiguration(configuration);
        logger.LogInformation(
            "FuelPriceUpdateWorker basladi (yenileme: {Hours} saat, istek araligi: {Delay} ms).",
            fuelOpts.RefreshHours, fuelOpts.RequestDelayMs);

        await RunOnceAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromHours(fuelOpts.RefreshHours), stoppingToken);
            fuelOpts = FuelOptions.FromConfiguration(configuration);
            await RunOnceAsync(stoppingToken);
        }
    }

    private async Task RunOnceAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var refresh = scope.ServiceProvider.GetRequiredService<FuelPriceRefreshService>();
        await refresh.RefreshAllAsync(ct);
    }
}
