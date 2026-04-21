using Microsoft.AspNetCore.Http;

namespace Yukle.Api.Exceptions;

/// <summary>
/// İş kuralı ihlali — <see cref="GlobalExceptionHandler"/> uygun HTTP durumu ve mesajı ile eşler.
/// </summary>
public sealed class DomainException : Exception
{
    public int StatusCode { get; }

    public DomainException(string message, int statusCode = StatusCodes.Status400BadRequest)
        : base(message)
    {
        StatusCode = statusCode;
    }
}
