namespace Yukle.Api.Infrastructure;

/// <summary>KVKK uyumlu PII maskeleme yardımcıları.</summary>
public static class PiiMasking
{
    /// <summary>Telefon: ilk 2 + son 2 açık, orta gizli. Örn. 5000000001 → 50******01</summary>
    public static string MaskPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone) || phone.Length < 4)
            return "****";
        return $"{phone[..2]}{new string('*', Math.Max(phone.Length - 4, 2))}{phone[^2..]}";
    }

    /// <summary>TCKN: yalnızca son 2 hane açık. Örn. 12345678901 → *********01</summary>
    public static string MaskTc(string? tc)
    {
        if (string.IsNullOrWhiteSpace(tc) || tc.Length != 11)
            return "***********";
        return $"{new string('*', 9)}{tc[^2..]}";
    }

    /// <summary>Vergi no: son 4 hane açık.</summary>
    public static string MaskTax(string? tax)
    {
        if (string.IsNullOrWhiteSpace(tax) || tax.Length < 4)
            return "******";
        return $"{new string('*', tax.Length - 4)}{tax[^4..]}";
    }

    /// <summary>IBAN: son 4 hane açık. Örn. TR330006100519786457841326 → TR********************1326</summary>
    public static string? MaskIban(string? iban)
    {
        if (string.IsNullOrWhiteSpace(iban))
            return null;
        var trimmed = iban.Trim();
        if (trimmed.Length <= 4)
            return new string('*', trimmed.Length);
        return $"{new string('*', trimmed.Length - 4)}{trimmed[^4..]}";
    }
}
