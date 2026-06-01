export type MarketingDocId =
  | 'features'
  | 'pricing'
  | 'demo'
  | 'api-docs'
  | 'hakkimizda'
  | 'kariyer'
  | 'blog'
  | 'basin'
  | 'cerezler'
  | 'belge-tanima'
  | 'adil-fiyat'
  | 'akilli-eslestirme'

export type MarketingSection = { heading: string; body: string[] }

export type MarketingDoc = {
  title: string
  subtitle: string
  sections: MarketingSection[]
}

export const MARKETING_DOCS: Record<MarketingDocId, MarketingDoc> = {
  features: {
    title: 'Özellikler',
    subtitle: 'Navlonix ile lojistik süreçlerinizi tek platformda yönetin.',
    sections: [
      {
        heading: 'Yapay Zeka Destekli Eşleştirme',
        body: [
          'Yapay zeka destekli öneriler ile yük ve şoför profilleri analiz edilir; adil fiyat ve uyum skoru saniyeler içinde hesaplanır.',
          'Belge tanıma ile ehliyet ve kurumsal evraklar otomatik okunur, manuel kontrol süresi kısalır.',
        ],
      },
      {
        heading: 'Güven ve uyumluluk',
        body: [
          'KVKK uyumlu veri işleme, güvenli havuz ödemesi ve U-ETDS entegrasyonu ile yasal süreçler şeffaftır.',
          'Tüm kritik işlemler denetlenebilir; müşteri ve şoför için ayrı roller ve yetkiler tanımlıdır.',
        ],
      },
      {
        heading: 'Operasyonel verimlilik',
        body: [
          'Canlı takip, teklif yönetimi, bildirim merkezi ve mobil uyumlu arayüz ile sahadan ofise kesintisiz akış.',
        ],
      },
    ],
  },
  pricing: {
    title: 'Fiyatlandırma',
    subtitle: 'Şeffaf planlar; ihtiyacınıza göre ölçeklenir.',
    sections: [
      {
        heading: 'Başlangıç',
        body: ['Aylık sınırlı ilan kotası, temel destek ve standart eşleştirme — küçük işletmeler için risksiz başlangıç.'],
      },
      {
        heading: 'Profesyonel',
        body: ['Sınırsız ilan, öncelikli eşleştirme ve 7/24 destek ile büyüyen fabrikalar için tam güç paketi.'],
      },
      {
        heading: 'Kurumsal',
        body: ['API erişimi, hesap yöneticisi ve SLA; özel entegrasyon ve raporlama talepleri için bizimle iletişime geçin.'],
      },
    ],
  },
  demo: {
    title: 'Demo',
    subtitle: 'Ürünü canlı görün, ekibinize anlatın.',
    sections: [
      {
        heading: 'Canlı tur',
        body: [
          'Müşteri ve şoför panellerini örnek verilerle geziyoruz; ilan oluşturma, teklif ve teslim akışını uçtan uca gösteriyoruz.',
          'Demo talebi için ana sayfadaki CTA veya kayıt sonrası destek hattından bize ulaşabilirsiniz.',
        ],
      },
    ],
  },
  'api-docs': {
    title: 'API',
    subtitle: 'Kurumsal entegrasyonlar için REST API.',
    sections: [
      {
        heading: 'Yetkilendirme',
        body: ['OAuth benzeri token yenileme ve rol bazlı erişim; üretim ve sandbox ortamları ayrıştırılabilir.'],
      },
      {
        heading: 'Uç noktalar',
        body: ['İlan, teklif, ödeme ve bildirim webhooks; OpenAPI şeması kurumsal sözleşmeyle birlikte sunulur.'],
      },
    ],
  },
  hakkimizda: {
    title: 'Hakkımızda',
    subtitle: 'Navlonix Hakkında',
    sections: [
      {
        heading: 'Navlonix Hakkında',
        body: [
          'Navlonix, yük verenler ile tır şoförlerini yapay zekâ destekli bir pazaryerinde buluşturan dijital lojistik platformudur. Fabrikalar ve işletmeler yüklerini saniyeler içinde ilana çevirir, uygun şoförlerle hızlıca eşleşir ve tüm süreci tek bir yerden şeffaf biçimde yönetir.',
        ],
      },
      {
        heading: 'Türkiye\'de dijital lojistik',
        body: [
          'Türkiye\'de yük taşımacılığı uzun süredir telefon trafiği, belirsiz fiyatlar ve güven sorunlarıyla yürüyor. Navlonix bu süreci dijitalleştirir: yapay zekâ; mesafe, yük tipi ve piyasa verilerini analiz ederek gerekçeli ve adil bir navlun bandı önerir — ne eksik ne fazla. Böylece hem yük veren hem şoför kazanır.',
        ],
      },
      {
        heading: 'Platformun temelleri',
        body: [
          'Şeffaf fiyatlandırma, güvenli ödeme, belge doğrulama ve canlı konum takibi platformun temelinde yer alır. Amacımız lojistiği herkes için daha hızlı, adil ve güvenilir hâle getirmek.',
        ],
      },
      {
        heading: 'Vizyonumuz',
        body: [
          'Türkiye\'den başlayıp bölgesel ticaretin akıllı altyapısı olmak için yola çıktık. Navlonix ile yükünüz güvende, yolunuz açık.',
        ],
      },
    ],
  },
  kariyer: {
    title: 'Kariyer',
    subtitle: 'Navlonix\'te birlikte büyüyelim.',
    sections: [
      {
        heading: 'Yakında',
        body: [
          'Şu anda aktif açık pozisyonumuz bulunmuyor; ancak lojistik, yazılım veya yapay zekâ alanında fark yaratmak isteyen yetenekli insanlarla tanışmaya her zaman açığız.',
          'CV\'nizi kariyer@navlonix.com adresine gönderin. Yeni pozisyonlar açıldığında ilk burada duyuracağız.',
        ],
      },
    ],
  },
  blog: {
    title: 'Blog',
    subtitle: 'Lojistik, yapay zekâ ve sektör içgörüleri yakında burada.',
    sections: [
      {
        heading: 'Yakında',
        body: [
          'Navlonix\'in yük taşımacılığını nasıl dönüştürdüğüne dair yazılar, ipuçları ve güncellemeler için takipte kal.',
        ],
      },
    ],
  },
  basin: {
    title: 'Basın',
    subtitle: 'Medya ve iş birlikleri.',
    sections: [
      {
        heading: 'İletişim',
        body: [
          'Basın, medya ve iş birliği talepleriniz için: basin@navlonix.com.',
          'Marka varlıkları (logo, görseller) ve şirket bilgileri talep üzerine paylaşılır.',
        ],
      },
    ],
  },
  'belge-tanima': {
    title: 'Yapay Zeka Destekli Belge Tanıma',
    subtitle: 'Ehliyet, SRC ve psikoteknik belgelerinizi güvenle dijitalleştirin.',
    sections: [
      {
        heading: 'Nasıl Çalışır?',
        body: [
          '1) Belge fotoğrafı veya PDF yüklenir. 2) Model metni ve alanları okur, doğruluk skoru üretir. 3) Sonuçlar operasyon ekibine ve gerekiyorsa yasal süreçlere aktarılır.',
        ],
      },
      {
        heading: 'Hangi Belgeler Desteklenir?',
        body: [
          'Sürücü belgesi, SRC belgesi ve psikoteknik raporları desteklenir. Net, gölgeli olmayan çekimler en iyi sonucu verir.',
        ],
      },
      {
        heading: 'Güvenlik',
        body: [
          'Belgeler şifreli kanaldan iletilir; erişim rolleri ile sınırlandırılır. İnceleme kayıtları denetlenebilir şekilde saklanır.',
        ],
      },
    ],
  },
  'adil-fiyat': {
    title: 'Yapay Zeka ile Adil Fiyatlandırma',
    subtitle: 'Mesafe, yük ve piyasa koşullarına göre şeffaf öneri.',
    sections: [
      {
        heading: 'Fiyat Nasıl Hesaplanır?',
        body: [
          'Yakıt, mesafe, ağırlık, zaman penceresi ve talep yoğunluğu gibi sinyaller bir araya getirilir. Amaç hem müşteri hem şoför için sürdürülebilir bir denge kurmaktır.',
        ],
      },
      {
        heading: 'Örnek Hesaplama',
        body: [
          'Örnek: 420 km, 22 ton, iki gün içinde yükleme penceresi için sistem; güzergah ortalaması ve mevcut teklif dağılımına göre öneri sunar.',
        ],
      },
      {
        heading: 'Şoför ve Fabrika İçin Kazanç Dengesi',
        body: [
          'Şoför tarafında boş dönüş riski azaltılır; fabrika tarafında ise beklenmeyen maliyet artışları için üst sınır ve şeffaflık sağlanır.',
        ],
      },
    ],
  },
  'akilli-eslestirme': {
    title: 'Akıllı Eşleştirme Sistemi',
    subtitle: 'Profil, geçmiş performans ve güzergah uyumu tek skorda birleşir.',
    sections: [
      {
        heading: 'Yapay Zeka Nasıl Eşleştirir?',
        body: [
          'Yük özellikleri ile şoför kapasitesi, belge durumu ve uygunluk pencereleri karşılaştırılır. Riskli eşleşmeler elenir, güçlü adaylar öne çıkar.',
        ],
      },
      {
        heading: 'Uyum Skoru',
        body: [
          'Uyum skoru; güzergah deneyimi, tamamlanan seferler, müşteri geri bildirimleri ve zamanında teslim oranı gibi metriklerden türetilir.',
        ],
      },
      {
        heading: 'Örnek Senaryolar',
        body: [
          'Yoğun güzergahta deneyimli şoför önceliklendirilir. Dar zaman penceresinde yakın konumdaki araçlar öne alınır.',
        ],
      },
    ],
  },
  cerezler: {
    title: 'Çerez Politikası',
    subtitle:
      'Bu Çerez Politikası, Navlonix tarafından işletilen web sitesi ve uygulamalarında çerezlerin nasıl kullanıldığını açıklar.',
    sections: [
      {
        heading: 'Çerez Nedir?',
        body: [
          'Çerezler, bir siteyi ziyaret ettiğinizde cihazınıza kaydedilen küçük metin dosyalarıdır; tercihlerinizi hatırlamamızı ve daha iyi bir deneyim sunmamızı sağlar.',
        ],
      },
      {
        heading: 'Kullandığımız Çerez Türleri',
        body: [
          'Zorunlu çerezler: Oturum açma, güvenlik gibi temel işlevler için gereklidir; devre dışı bırakılamaz.',
          'İşlevsel çerezler: Dil, tema gibi tercihlerinizi hatırlar.',
          'Performans/analitik çerezler: Platformun nasıl kullanıldığını anlayıp iyileştirmemize yardımcı olur (anonim istatistik).',
          'Pazarlama çerezleri: Yalnızca onayınızla, ilgi alanınıza uygun içerik için kullanılabilir.',
        ],
      },
      {
        heading: 'Çerezleri Yönetme',
        body: [
          'Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz; ancak zorunlu çerezleri kapatmak bazı bölümlerin düzgün çalışmamasına yol açabilir.',
        ],
      },
      {
        heading: 'Veri Sorumlusu',
        body: [
          'Veri Sorumlusu: Navlonix Lojistik Teknolojileri A.Ş. Sorularınız için: kvkk@navlonix.com. Detay için Gizlilik Politikası ve KVKK Aydınlatma Metni\'ni inceleyebilirsiniz.',
          'Bu politika güncellenebilir; güncel sürüm her zaman bu sayfada yayımlanır.',
        ],
      },
    ],
  },
}
