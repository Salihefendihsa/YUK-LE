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
            var masked = MaskPhone(phoneNumber);
            _logger.LogInformation("SMS [{Phone}]: {Code} (simulated — Development or Netgsm config missing)", masked, otpCode);
            return;
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
        if (_environment.IsDevelopment())
            return true;

        return !NetgsmApiClient.IsConfigured(_smsOptions.Netgsm);
    }

    private static string MaskPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length < 4) return "****";
        return $"{digits[..2]}******{digits[^2..]}";
    }
}
