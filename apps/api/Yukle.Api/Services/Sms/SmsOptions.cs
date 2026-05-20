namespace Yukle.Api.Services.Sms;

public sealed class SmsOptions
{
    public const string SectionName = "Sms";

    public string Provider { get; set; } = "Netgsm";

    public NetgsmOptions Netgsm { get; set; } = new();
}

public sealed class NetgsmOptions
{
    public string UserCode { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Header { get; set; } = string.Empty;
}
