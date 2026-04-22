using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs;

/// <summary>
/// <b>v2.5.4 — Refresh Token İsteği.</b>
/// <para>
/// Erişim token'ı süresi dolduğunda veya şoförün evrak onayı sonrası <c>IsActive</c>
/// claim'i eskidiğinde istemci bu DTO ile <c>/auth/refresh-token</c> uç noktasına
/// başvurur. Sunucu:
/// <list type="number">
///   <item><see cref="AccessToken"/> imzasını doğrular (süresi dolmuş olsa bile).</item>
///   <item>Token içindeki <c>NameIdentifier</c> claim'iyle kullanıcıyı çözer.</item>
///   <item>DB'deki <c>RefreshToken</c> değeri ile <see cref="RefreshToken"/> eşleşiyor mu bakar.</item>
///   <item>Rotation uygular: eski refresh token üzerine yenisi yazılır.</item>
/// </list>
/// </para>
/// </summary>
public sealed class RefreshTokenRequestDto
{
    /// <summary>
    /// Süresi dolmuş olabilecek ancak imzası hâlâ doğrulanabilir olan mevcut JWT.
    /// Kullanıcı kimliğini kanıtlamak için (şifre tekrar girmeden) kullanılır.
    /// </summary>
    [Required(ErrorMessage = "AccessToken alanı zorunludur.")]
    public required string AccessToken { get; init; }

    /// <summary>Login veya bir önceki refresh cevabında alınan base64 refresh token.</summary>
    [Required(ErrorMessage = "RefreshToken alanı zorunludur.")]
    public required string RefreshToken { get; init; }
}
