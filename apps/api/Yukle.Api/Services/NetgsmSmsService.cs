using System;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;

namespace Yukle.Api.Services;

public class NetgsmSmsService : ISmsService
{
    public string GenerateSixDigitOtp()
    {
        if (string.Equals(
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                "Development",
                StringComparison.OrdinalIgnoreCase))
        {
            // Development ortaminda E2E testin deterministik calismasi icin sabit OTP.
            return "123456";
        }

        int value = RandomNumberGenerator.GetInt32(0, 1_000_000);
        return value.ToString("D6");
    }

    public Task SendOtpAsync(string phoneNumber, string otpCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            throw new ArgumentException("Telefon numarası boş olamaz.", nameof(phoneNumber));
        if (string.IsNullOrWhiteSpace(otpCode) || otpCode.Length != 6)
            throw new ArgumentException("OTP 6 haneli olmalıdır.", nameof(otpCode));

        // TODO: Netgsm API entegrasyonu — phoneNumber ve otpCode ile gerçek SMS gönderimi
        _ = cancellationToken;
        return Task.CompletedTask;
    }
}
