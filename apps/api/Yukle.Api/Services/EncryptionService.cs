using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace Yukle.Api.Services;

/// <summary>
/// <b>v2.5.5 — KVKK AES-256 Şifreleme Sözleşmesi.</b>
/// <para>
/// Kişisel Verilerin Korunması Kanunu (KVKK) Madde 12/1 gereği hassas kişisel
/// veriler (TCKN gibi kimlik numaraları) veritabanında düz metin olarak saklanamaz.
/// Bu servis, <see cref="EncryptionService"/> implementasyonu ile AES-256-CBC
/// kullanarak string-seviyesinde şifreleme/çözme sağlar ve EF Core ValueConverter
/// üzerinden DB yaz/oku akışına şeffaf olarak bağlanır.
/// </para>
/// </summary>
public interface IEncryptionService
{
    /// <summary>
    /// UTF-8 kodlu düz metni AES-256-CBC ile şifreler ve sonucu base64 döner.
    /// <c>null</c> veya boş string aynen geçer (değişmeden döner).
    /// </summary>
    string? Encrypt(string? plaintext);

    /// <summary>
    /// Base64 ciphertext'i AES-256-CBC ile çözer ve UTF-8 düz metin döner.
    /// Eğer veri base64 değilse veya çözülemezse (legacy/migration senaryosu)
    /// giriş değeri aynen döndürülür — sistemin çökmesi engellenir.
    /// </summary>
    string? Decrypt(string? ciphertext);
}

/// <summary>
/// <b>v2.5.5</b> — AES-256-CBC tabanlı deterministik şifreleme servisi.
/// <para>
/// <b>Neden deterministik (sabit IV)?</b><br/>
/// EF Core ValueConverter C# tarafında çalışır; <c>Where(u =&gt; u.TCKN == "123...")</c>
/// sorgusu <b>ciphertext'e karşı</b> SQL'de çalışır. Her yazmada random IV kullanılsa
/// aynı TCKN her satırda farklı ciphertext üretir ve eşitlik sorguları kırılır.
/// Bu nedenle bilinçli olarak sabit IV tercih edilmiştir (GCM/XTS değil CBC);
/// trade-off: aynı TCKN aynı ciphertext verir (pattern inference riski). KVKK açısından
/// veri SİCİL kaydı yerine ERİŞİM kontrolü ile de güvence altına alınır — bu yüzden
/// sadece <see cref="Models.User.TaxNumberOrTCKN"/> alanında uygulanır.
/// </para>
/// <para>
/// Anahtarın kendisi ASLA koda gömülmez; <c>Encryption:Key</c> ve <c>Encryption:IV</c>
/// yapılandırmadan (appsettings.Development.json / user-secrets / env var) okunur.
/// Production'da <b>KeyVault / Secret Manager</b> zorunludur.
/// </para>
/// </summary>
public sealed class EncryptionService : IEncryptionService
{
    // AES-256 → 32 byte anahtar, 16 byte IV (128-bit blok)
    private const int ExpectedKeyLength = 32;
    private const int ExpectedIvLength  = 16;

    private readonly byte[] _key;
    private readonly byte[] _iv;

    public EncryptionService(IConfiguration configuration)
    {
        string? keyB64 = configuration["Encryption:Key"];
        string? ivB64  = configuration["Encryption:IV"];

        if (string.IsNullOrWhiteSpace(keyB64))
            throw new InvalidOperationException(
                "[FATAL] Encryption:Key yapılandırması eksik. " +
                "AES-256 için 32 byte base64 bir anahtar tanımlanmalı " +
                "(appsettings.Development.json, user-secrets veya env var üzerinden).");

        if (string.IsNullOrWhiteSpace(ivB64))
            throw new InvalidOperationException(
                "[FATAL] Encryption:IV yapılandırması eksik. " +
                "AES-CBC için 16 byte base64 IV tanımlanmalı.");

        try
        {
            _key = Convert.FromBase64String(keyB64);
            _iv  = Convert.FromBase64String(ivB64);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException(
                "Encryption:Key veya Encryption:IV geçerli base64 değil.", ex);
        }

        if (_key.Length != ExpectedKeyLength)
            throw new InvalidOperationException(
                $"Encryption:Key 32 byte (AES-256) olmalı — mevcut: {_key.Length} byte.");

        if (_iv.Length != ExpectedIvLength)
            throw new InvalidOperationException(
                $"Encryption:IV 16 byte olmalı — mevcut: {_iv.Length} byte.");
    }

    public string? Encrypt(string? plaintext)
    {
        if (string.IsNullOrEmpty(plaintext)) return plaintext;

        using var aes  = Aes.Create();
        aes.Key        = _key;
        aes.IV         = _iv;
        aes.Mode       = CipherMode.CBC;
        aes.Padding    = PaddingMode.PKCS7;

        using var encryptor = aes.CreateEncryptor();
        byte[] plainBytes   = Encoding.UTF8.GetBytes(plaintext);
        byte[] cipherBytes  = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        return Convert.ToBase64String(cipherBytes);
    }

    public string? Decrypt(string? ciphertext)
    {
        if (string.IsNullOrEmpty(ciphertext)) return ciphertext;

        // Geriye uyum: Şifreleme öncesi kaydedilmiş legacy TCKN verisi (ör: migration
        // öncesi eski satırlar) base64 olmayan düz metin olabilir. Bozuk/base64 olmayan
        // değer geldiğinde aynen döndürerek sistemin çalışmaya devam etmesini sağlarız.
        // Üretimde migration sonrası tüm veriler şifrelidir.
        byte[] cipherBytes;
        try
        {
            cipherBytes = Convert.FromBase64String(ciphertext);
        }
        catch (FormatException)
        {
            return ciphertext;
        }

        using var aes = Aes.Create();
        aes.Key       = _key;
        aes.IV        = _iv;
        aes.Mode      = CipherMode.CBC;
        aes.Padding   = PaddingMode.PKCS7;

        try
        {
            using var decryptor = aes.CreateDecryptor();
            byte[] plainBytes   = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
            return Encoding.UTF8.GetString(plainBytes);
        }
        catch (CryptographicException)
        {
            // Ciphertext bozuk / farklı anahtarla şifrelenmiş → güvenli fallback.
            // Log'a gizli veri yazmamak için sadece uzunluğu belirtmek yeterli olur.
            return ciphertext;
        }
    }
}
