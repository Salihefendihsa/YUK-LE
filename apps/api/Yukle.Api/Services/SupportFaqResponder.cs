using System.Text;

namespace Yukle.Api.Services;

/// <summary>
/// Gemini erişilemediğinde (anahtar geçersiz/expired, timeout, hata) devreye giren
/// CURATED Türkçe sık-soru yanıtlayıcısı. Kullanıcı mesajını anahtar kelimelerle
/// eşleştirir; eşleşme yoksa nazikçe operatöre yönlendirir.
/// <para>Gerçek Gemini cevabı geldiğinde KULLANILMAZ — yalnızca güvenlik ağıdır.</para>
/// </summary>
public static class SupportFaqResponder
{
    private sealed record FaqEntry(string[] Keywords, string Answer);

    private static readonly string EscalateReply =
        "Bu konuda kesin bir bilgi veremiyorum. \"İnsan operatöre aktar\" diyerek destek " +
        "ekibimize bağlanabilirsiniz; en kısa sürede (hedef 24 saat) dönüş yapacağız.";

    // Sıralama önemli: daha spesifik konular üstte. İlk eşleşen yanıt döner.
    private static readonly FaqEntry[] Entries =
    {
        new(new[] { "odeme", "escrow", "emanet", "komisyon", "para", "cuzdan", "bakiye", "tahsilat", "ucret", "iban" },
            "Ödemeler emanet (escrow) ile güvenle yürür: bir teklif kabul edilince tutar emanete alınır, " +
            "teslimat QR koduyla onaylandığında komisyon düşülüp net tutar şoförün cüzdanına aktarılır. " +
            "Komisyon müşteriden %2 ve şoförden %2 alınır. (Ödeme altyapısı şu an demo/mock'tur.)"),

        new(new[] { "iptal", "vazgec", "geri al", "iade" },
            "İlanınızı İlanlarım → ilan detayından iptal edebilirsiniz. İptal yalnızca henüz bir teklifin " +
            "kabul edilmediği (yayında/Active) ilanlarda mümkündür. Yük şoföre atandıysa iptal için destek " +
            "ekibine başvurmanız gerekir; bu durumda iade kuralları uygulanır."),

        new(new[] { "teklif", "kabul", "fiyat ver", "ilan ver", "ilan olustur", "ilan nasil" },
            "Akış şöyle: Müşteri yük ilanı oluşturur → şoförler teklif verir → müşteri uygun bir teklifi " +
            "kabul eder → yük o şoföre atanır. Teklifleri ilan detayı veya Teklifler ekranından görüp " +
            "kabul edebilirsiniz."),

        new(new[] { "qr", "teslim", "teslimat", "kod okut", "tamamla" },
            "Teslimat, ekranda/alıcıda görünen QR kodun şoför tarafından okutulmasıyla onaylanır. " +
            "Onaydan sonra yük \"Teslim Edildi\" durumuna geçer ve emanetteki ödeme şoföre aktarılır."),

        new(new[] { "takip", "konum", "harita", "nerede", "canli" },
            "Atanan yükün şoför konumunu Canlı Harita / Takip ekranından gerçek zamanlı izleyebilirsiniz. " +
            "Takip, yük yola çıktığında (Yolda) aktif olur."),

        new(new[] { "rol", "musteri", "sofor", "admin", "yonetici", "kimdir", "kullanici tip" },
            "Navlonix'te roller: Müşteri yük ilanı verir, Şoför teklif verip yükü taşır, Yönetici (admin) " +
            "platformu yönetir. Hesabınızın rolüne göre menüler ve yetkiler değişir."),

        new(new[] { "adil fiyat", "ai fiyat", "yapay zeka fiyat", "onerilen fiyat", "navlun" },
            "İlan oluştururken sistem; güzergah, araç tipi ve yük bilgisine göre yapay zeka destekli " +
            "\"adil navlun fiyatı\" önerir. Bu öneriyi referans alıp kendi fiyatınızı belirleyebilirsiniz."),

        new(new[] { "belge", "evrak", "ehliyet", "src", "onay", "dogrulama", "psikoteknik", "ruhsat" },
            "Şoför belgeleri (ehliyet, SRC vb.) yapay zeka ile ön-denetimden geçer ve yönetici onayıyla " +
            "aktifleşir. Belgelerinizi Belgelerim ekranından yükleyip durumunu takip edebilirsiniz."),

        new(new[] { "sifre", "parola", "giris", "hesap", "kayit", "telefon dogrula", "otp" },
            "Hesap işlemleri için Ayarlar/Profil ekranını kullanabilirsiniz. Şifrenizi unuttuysanız giriş " +
            "ekranındaki \"Şifremi unuttum\" akışını izleyin. Telefon doğrulaması için size gelen kodu girin."),
    };

    /// <summary>
    /// Mesaja en uygun curated yanıtı döner; eşleşme yoksa operatöre yönlendirir.
    /// Asla boş dönmez.
    /// </summary>
    public static string Answer(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return EscalateReply;

        var norm = Normalize(message);

        foreach (var entry in Entries)
        {
            foreach (var kw in entry.Keywords)
            {
                if (norm.Contains(kw, StringComparison.Ordinal))
                    return entry.Answer;
            }
        }

        return EscalateReply;
    }

    /// <summary>Türkçe karakterleri sadeleştirip küçük harfe çevirir (aksanlı/aksansız eşleşme için).</summary>
    private static string Normalize(string input)
    {
        var sb = new StringBuilder(input.Length);
        foreach (var ch in input.ToLowerInvariant())
        {
            sb.Append(ch switch
            {
                'ı' or 'İ' or 'i' => 'i',
                'ş' => 's',
                'ç' => 'c',
                'ö' => 'o',
                'ü' => 'u',
                'ğ' => 'g',
                _   => ch
            });
        }
        return sb.ToString();
    }
}
