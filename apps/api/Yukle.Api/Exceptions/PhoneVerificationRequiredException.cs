namespace Yukle.Api.Exceptions;

public sealed class PhoneVerificationRequiredException : Exception
{
    public string Phone { get; }

    public PhoneVerificationRequiredException(string message, string phone)
        : base(message)
    {
        Phone = phone;
    }
}
