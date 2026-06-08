using System.Security.Cryptography;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yukle.Api.Services.Sms;

namespace Yukle.Api.Services;

/// <summary>
/// ISmsService implementation (Netgsm). Development or missing config: simulated send + fixed OTP.
/// Production with credentials: real Netgsm HTTP.
/// </summary>
public sealed class NetgsmSmsService : ISmsService
{
    private readonly IHostEnvironment _environment;
    private readonly SmsOptions _smsOptions;
    private readonly NetgsmApiClient _netgsm;
    private readonly ILogger<NetgsmSmsService> _logger;

    public NetgsmSmsService(
        IHostEnvironment environment,
        IOptions<SmsOptions> smsOptions,
        NetgsmApiClient netgsm,
        ILogger<NetgsmSmsService> logger)
    {
        _environment = environment;
        _smsOptions  = smsOptions.Value;
        _netgsm      = netgsm;
        _logger      = logger;
    }

    public string GenerateSixDigitOtp()
    {
        if (ShouldSimulateSms())
            return "123456";

        int value = RandomNumberGenerator.GetInt32(0, 1_000_000);
        return value.ToString("D6");
    }

    public async Task SendOtpAsync(string phoneNumber, string otpCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            throw new ArgumentException("Telefon numarasi bos olamaz.", nameof(phoneNumber));
        if (string.IsNullOrWhiteSpace(otpCode) || otpCode.Length != 6)
            throw new ArgumentException("OTP 6 haneli olmalidir.", nameof(otpCode));

        if (ShouldSimulateSms())
        {
            // OTP kodu HİÇBİR log seviyesinde yazılmaz — yalnız maskeli telefon.
            _logger.LogInformation("SMS simulated for {Phone} (Development)", MaskPhone(phoneNumber));
            return;
        }

        // Prod'da Netgsm yapılandırılmamışsa: simülasyona DÜŞMEYİZ ve OTP'yi loglamayız;
        // açıkça hata döneriz (kod sızdırmaktansa SMS akışı sesli başarısız olur).
        if (!NetgsmApiClient.IsConfigured(_smsOptions.Netgsm))
        {
            _logger.LogWarning("Netgsm yapilandirmasi eksik; SMS gonderilemiyor (Phone={Phone}).", MaskPhone(phoneNumber));
            throw new ApplicationException("SMS gonderilemedi. Lutfen daha sonra tekrar deneyin.");
        }

        var message = $"Dogrulama kodunuz: {otpCode}. 5 dakika gecerlidir.";

        try
        {
            await _netgsm.SendAsync(phoneNumber, message, cancellationToken);
            _logger.LogInformation("Netgsm OTP sent to {Phone}", MaskPhone(phoneNumber));
        }
        catch (NetgsmSmsException ex)
        {
            _logger.LogError(ex, "Netgsm send failed. Code={Code}", ex.ProviderCode);
            throw new ApplicationException("SMS gonderilemedi. Lutfen daha sonra tekrar deneyin.");
        }
        catch (Exception ex) when (ex is not ApplicationException)
        {
            _logger.LogError(ex, "Netgsm send unexpected error");
            throw new ApplicationException("SMS gonderilemedi. Lutfen daha sonra tekrar deneyin.");
        }
    }

    private bool ShouldSimulateSms()
    {
        // Simülasyon YALNIZ Development'ta. Prod'da config eksik olsa bile simüle etmeyiz
        // (OTP asla loglanmaz; SendOtpAsync yapılandırma yoksa açıkça hata döner).
        return _environment.IsDevelopment();
    }

    private static string MaskPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length < 4) return "****";
        return $"{digits[..2]}******{digits[^2..]}";
    }
}
