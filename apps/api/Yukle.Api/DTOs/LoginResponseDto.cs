using System;
using Yukle.Api.Models;

namespace Yukle.Api.DTOs;

/// <summary>
/// <b>v2.5.3 — JWT Yetkilendirme Bariyeri</b> yanıt modeli.
/// <para>
/// Login başarılı olduğunda mobil istemciye (Flutter) sadece JWT değil, aynı zamanda
/// hesabın AI onayından geçip geçmediğini (<see cref="IsActive"/>) ve hangi aşamada
/// olduğunu (<see cref="ApprovalStatus"/>) iletiriz. Uygulama bu alanlara bakarak
/// kullanıcıyı doğrudan <i>"Evrak Onay Bekleniyor"</i> ekranına yönlendirebilir —
/// böylece kullanıcı 403 aldığı operasyonel uç noktalara hiç dokunmadan akışı kavrar.
/// </para>
/// <para>
/// <b>Güvenlik Notu:</b> <see cref="IsActive"/> aynı değer JWT payload içinde
/// <c>"IsActive"</c> claim'i olarak da gönderilir ve <c>RequireActiveDriver</c> policy'si
/// bu claim üzerinden 403 barajını uygular. İstemci burada gelen değere güvenerek
/// yalnızca yönlendirme yapar; yetki kararı sunucu tarafındadır.
/// </para>
/// </summary>
public sealed class LoginResponseDto
{
    /// <summary>Bearer header'da taşınacak imzalı JWT (access token, kısa ömürlü).</summary>
    public required string Token { get; init; }

    /// <summary>Access token'ın geçerlilik süresinin UTC sonu.</summary>
    public required DateTime Expiration { get; init; }

    /// <summary>
    /// <b>v2.5.4 — Refresh Token.</b> Access token süresi dolduğunda veya claim'ler
    /// eskidiğinde <c>/auth/refresh-token</c> uç noktasında access token ile birlikte
    /// sunulur; sunucu rotation uyguladığı için her yanıtta yeni bir refresh token döner.
    /// </summary>
    public required string RefreshToken { get; init; }

    /// <summary>Refresh token'ın UTC son geçerlilik zamanı (tipik olarak 7 gün).</summary>
    public required DateTime RefreshTokenExpiration { get; init; }

    /// <summary>Oturum sahibinin iç <c>User.Id</c>'si.</summary>
    public required int UserId { get; init; }

    /// <summary>Kullanıcının görünen adı-soyadı.</summary>
    public required string FullName { get; init; }

    /// <summary>Rol (Customer / Driver / Admin).</summary>
    public required string Role { get; init; }

    /// <summary>Telefon OTP'si doğrulandı mı.</summary>
    public required bool IsPhoneVerified { get; init; }

    /// <summary>
    /// Hesap operasyonel uç noktalara (yük listesi, teklif, vb.) erişebilir mi.
    /// Yalnızca tüm zorunlu belgeler AI tarafından onaylandığında <c>true</c> olur.
    /// </summary>
    public required bool IsActive { get; init; }

    /// <summary>
    /// Belge onay yaşam döngüsü durumu. Flutter UI, bu enum'a bakarak doğru ekranı gösterir:
    /// <c>Pending</c> → evrak yükle; <c>Rejected</c> → hata + yeniden yükle;
    /// <c>ManualApprovalRequired</c> → "operatör inceliyor"; <c>Active</c> → ana ekran.
    /// </summary>
    public required ApprovalStatus ApprovalStatus { get; init; }
}
