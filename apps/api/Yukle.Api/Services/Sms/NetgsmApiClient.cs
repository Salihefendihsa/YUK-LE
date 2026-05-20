using System.Net;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Yukle.Api.Services.Sms;

/// <summary>Low-level Netgsm HTTP client (GET send). Swap provider by replacing ISmsService impl only.</summary>
public sealed class NetgsmApiClient
{
    private const string SendPath = "sms/send/get";
    private readonly HttpClient _httpClient;
    private readonly NetgsmOptions _options;
    private readonly ILogger<NetgsmApiClient> _logger;

    public NetgsmApiClient(
        IHttpClientFactory httpClientFactory,
        IOptions<SmsOptions> smsOptions,
        ILogger<NetgsmApiClient> logger)
    {
        _httpClient = httpClientFactory.CreateClient("Netgsm");
        _options    = smsOptions.Value.Netgsm;
        _logger     = logger;
    }

    public static bool IsConfigured(NetgsmOptions options)
        => !string.IsNullOrWhiteSpace(options.UserCode)
        && !string.IsNullOrWhiteSpace(options.Password)
        && !string.IsNullOrWhiteSpace(options.Header);

    public async Task SendAsync(string phoneNumber, string message, CancellationToken ct)
    {
        var gsm = NormalizeGsm(phoneNumber);
        var query = new Dictionary<string, string?>
        {
            ["usercode"]  = _options.UserCode.Trim(),
            ["password"]  = _options.Password,
            ["gsmno"]     = gsm,
            ["message"]   = message,
            ["msgheader"] = _options.Header.Trim()
        };

        var url = QueryHelpers.AddQueryString(SendPath, query);

        string body = await SendWithRetryAsync(url, ct);
        EnsureSuccess(body);
    }

    private async Task<string> SendWithRetryAsync(string url, CancellationToken ct)
    {
        const int maxAttempts = 3;
        Exception? last = null;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                using var response = await _httpClient.GetAsync(url, ct);
                var body = (await response.Content.ReadAsStringAsync(ct)).Trim();

                if (response.IsSuccessStatusCode)
                    return body;

                if (IsTransientStatus(response.StatusCode) && attempt < maxAttempts)
                {
                    _logger.LogWarning(
                        "Netgsm HTTP {Status}, retry {Attempt}/{Max}",
                        (int)response.StatusCode, attempt, maxAttempts);
                    await Task.Delay(TimeSpan.FromSeconds(attempt), ct);
                    continue;
                }

                _logger.LogError("Netgsm HTTP error {Status}, body={Body}", (int)response.StatusCode, body);
                throw new NetgsmSmsException($"Netgsm HTTP {(int)response.StatusCode}", body);
            }
            catch (NetgsmSmsException)
            {
                throw;
            }
            catch (Exception ex) when (attempt < maxAttempts && ex is HttpRequestException or TaskCanceledException)
            {
                last = ex;
                _logger.LogWarning(ex, "Netgsm request failed, retry {Attempt}/{Max}", attempt, maxAttempts);
                await Task.Delay(TimeSpan.FromSeconds(attempt), ct);
            }
        }

        throw new NetgsmSmsException("Netgsm request failed after retries", last?.Message ?? "unknown");
    }

    private void EnsureSuccess(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            _logger.LogError("Netgsm empty response body");
            throw new NetgsmSmsException("empty_response", body);
        }

        var code = body.Split(' ', StringSplitOptions.RemoveEmptyEntries)[0];

        if (code is "00" or "0")
            return;

        _logger.LogError("Netgsm API error code={Code}, raw={Body}", code, body);
        throw new NetgsmSmsException(code, body);
    }

    private static bool IsTransientStatus(HttpStatusCode status)
        => status is HttpStatusCode.RequestTimeout
            or HttpStatusCode.TooManyRequests
            or HttpStatusCode.InternalServerError
            or HttpStatusCode.BadGateway
            or HttpStatusCode.ServiceUnavailable
            or HttpStatusCode.GatewayTimeout;

    internal static string NormalizeGsm(string phoneNumber)
    {
        var digits = new string(phoneNumber.Where(char.IsDigit).ToArray());

        if (digits.StartsWith("90", StringComparison.Ordinal) && digits.Length == 12)
            digits = digits[2..];

        if (digits.StartsWith('0') && digits.Length == 11)
            digits = digits[1..];

        if (digits.Length != 10 || digits[0] != '5')
            throw new ArgumentException("Gecerli bir Turkiye GSM numarasi giriniz.", nameof(phoneNumber));

        return digits;
    }
}

public sealed class NetgsmSmsException : Exception
{
    public string ProviderCode { get; }
    public string RawResponse { get; }

    public NetgsmSmsException(string providerCode, string rawResponse)
        : base($"Netgsm error: {providerCode}")
    {
        ProviderCode = providerCode;
        RawResponse  = rawResponse ?? string.Empty;
    }
}
