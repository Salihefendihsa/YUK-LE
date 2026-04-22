using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Yukle.Api.Exceptions;

namespace Yukle.Api.Infrastructure;

/// <summary>
/// RFC 7807 <see cref="ProblemDetails"/> üretir; beklenmedik hatalarda teknik ayrıntı sızdırmaz.
/// </summary>
public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IProblemDetailsService          _problemDetailsService;

    public GlobalExceptionHandler(
        ILogger<GlobalExceptionHandler> logger,
        IProblemDetailsService          problemDetailsService)
    {
        _logger              = logger;
        _problemDetailsService = problemDetailsService;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext                          httpContext,
        Exception                            exception,
        CancellationToken                    cancellationToken)
    {
        _logger.LogError(
            exception,
            "İstisna: {ExceptionType} — {Message} — Path: {Path}",
            exception.GetType().FullName,
            exception.Message,
            httpContext.Request.Path);

        var traceId = Activity.Current?.Id ?? httpContext.TraceIdentifier;

        var mapped = MapException(exception, httpContext, traceId);

        httpContext.Response.StatusCode = mapped.StatusCode;

        await _problemDetailsService.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = new ProblemDetails
            {
                Type     = mapped.Type,
                Title    = mapped.Title,
                Status   = mapped.StatusCode,
                Detail   = mapped.Detail,
                Instance = httpContext.Request.Path.Value
            },
            Exception = null
        });

        return true;
    }

    private static MappedProblem MapException(Exception exception, HttpContext httpContext, string traceId)
    {
        switch (exception)
        {
            case DomainException domain:
                return new MappedProblem(
                    domain.StatusCode,
                    TitleFor(domain.StatusCode),
                    domain.Message,
                    RfcTypeUri(domain.StatusCode));

            case UnauthorizedAccessException unauth:
                return new MappedProblem(
                    StatusCodes.Status403Forbidden,
                    "Erişim Reddedildi",
                    unauth.Message,
                    RfcTypeUri(StatusCodes.Status403Forbidden));

            case ApplicationException app:
                return MapApplicationException(app, httpContext);

            case InvalidOperationException invalidOp:
                return MapInvalidOperationException(invalidOp, httpContext);

            case ArgumentException arg:
                return new MappedProblem(
                    StatusCodes.Status400BadRequest,
                    "Geçersiz İstek",
                    arg.Message,
                    RfcTypeUri(StatusCodes.Status400BadRequest));

            default:
                return new MappedProblem(
                    StatusCodes.Status500InternalServerError,
                    "Sunucu Hatası",
                    $"Beklenmedik bir hata oluştu. Lütfen referans numarası ile destek ekibine ulaşın: {traceId}",
                    RfcTypeUri(StatusCodes.Status500InternalServerError));
        }
    }

    private static MappedProblem MapApplicationException(
        ApplicationException app,
        HttpContext          httpContext)
    {
        var msg = app.Message;

        if (IsRateLimitedApplicationMessage(msg))
        {
            return new MappedProblem(
                StatusCodes.Status429TooManyRequests,
                "Çok Fazla İstek",
                msg,
                "https://tools.ietf.org/html/rfc6585#section-4");
        }

        var path = httpContext.Request.Path.Value ?? string.Empty;
        if (path.Contains("/refresh-token", StringComparison.OrdinalIgnoreCase))
        {
            return new MappedProblem(
                StatusCodes.Status401Unauthorized,
                "Yetkisiz",
                msg,
                RfcTypeUri(StatusCodes.Status401Unauthorized));
        }

        return new MappedProblem(
            StatusCodes.Status400BadRequest,
            "Geçersiz İstek",
            msg,
            RfcTypeUri(StatusCodes.Status400BadRequest));
    }

    private static MappedProblem MapInvalidOperationException(
        InvalidOperationException invalidOp,
        HttpContext               httpContext)
    {
        if (IsGetBidsByLoadEndpoint(httpContext))
        {
            return new MappedProblem(
                StatusCodes.Status404NotFound,
                "Bulunamadı",
                invalidOp.Message,
                RfcTypeUri(StatusCodes.Status404NotFound));
        }

        return new MappedProblem(
            StatusCodes.Status400BadRequest,
            "İşlem Reddedildi",
            invalidOp.Message,
            RfcTypeUri(StatusCodes.Status400BadRequest));
    }

    private static bool IsGetBidsByLoadEndpoint(HttpContext ctx)
    {
        return HttpMethods.IsGet(ctx.Request.Method)
            && ctx.Request.Path.Value?.Contains("/bids/load/", StringComparison.OrdinalIgnoreCase) == true;
    }

    private static bool IsRateLimitedApplicationMessage(string message)
    {
        if (string.IsNullOrEmpty(message)) return false;
        return message.Contains("engellendiniz", StringComparison.OrdinalIgnoreCase)
            || message.Contains("kara listeye", StringComparison.OrdinalIgnoreCase)
            || message.Contains("Çok fazla hatalı deneme", StringComparison.OrdinalIgnoreCase);
    }

    private static string TitleFor(int statusCode) => statusCode switch
    {
        StatusCodes.Status400BadRequest       => "Geçersiz İstek",
        StatusCodes.Status401Unauthorized       => "Yetkisiz",
        StatusCodes.Status403Forbidden          => "Erişim Reddedildi",
        StatusCodes.Status404NotFound           => "Bulunamadı",
        StatusCodes.Status429TooManyRequests    => "Çok Fazla İstek",
        StatusCodes.Status500InternalServerError => "Sunucu Hatası",
        _                                       => "Hata"
    };

    private static string RfcTypeUri(int statusCode) => statusCode switch
    {
        StatusCodes.Status400BadRequest => "https://tools.ietf.org/html/rfc7231#section-6.5.1",
        StatusCodes.Status401Unauthorized => "https://tools.ietf.org/html/rfc7235#section-3.1",
        StatusCodes.Status403Forbidden => "https://tools.ietf.org/html/rfc7231#section-6.5.3",
        StatusCodes.Status404NotFound => "https://tools.ietf.org/html/rfc7231#section-6.5.4",
        StatusCodes.Status429TooManyRequests => "https://tools.ietf.org/html/rfc6585#section-4",
        _ => "https://tools.ietf.org/html/rfc7231#section-6.6.1"
    };

    private readonly record struct MappedProblem(
        int    StatusCode,
        string Title,
        string Detail,
        string Type);
}
