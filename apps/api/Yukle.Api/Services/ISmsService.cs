using System.Threading;
using System.Threading.Tasks;

namespace Yukle.Api.Services;

public interface ISmsService
{
    /// <summary>6 haneli (000000–999999) kriptografik olarak güvenli OTP üretir.</summary>
    string GenerateSixDigitOtp();

    /// <summary>Verilen OTP kodunu ilgili telefon numarasına SMS ile gönderir.</summary>
    Task SendOtpAsync(string phoneNumber, string otpCode, CancellationToken cancellationToken = default);
}
