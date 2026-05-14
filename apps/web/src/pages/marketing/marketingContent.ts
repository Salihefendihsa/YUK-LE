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
    subtitle: 'YÜK-LE ile lojistik süreçlerinizi tek platformda yönetin.',
    sections: [
      {
        heading: 'Yapay Zeka Destekli Eşleştirme',
        body: [
          'Gemini tabanlı öneriler ile yük ve şoför profilleri analiz edilir; adil fiyat ve uyum skoru saniyeler içinde hesaplanır.',
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
        body: ['Sınırsız ilan, AI önceliği ve 7/24 destek ile büyüyen fabrikalar için tam güç paketi.'],
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
    subtitle: 'Türkiye merkezli, veri odaklı lojistik teknolojisi.',
    sections: [
      {
        heading: 'Misyon',
        body: [
          'Yük sahipleri ile profesyonel şoförleri güvenli, ölçülebilir ve hukuka uygun biçimde buluşturmak.',
          'Yapay zekayı operasyonun kalbine yerleştirerek fiyat keşfi, risk ve doluluk yönetimini iyileştirmek.',
        ],
      },
      {
        heading: 'Değerler',
        body: ['Şeffaflık, güvenlik, saha gerçekleriyle tasarım ve sürekli öğrenen ürün geliştirme.'],
      },
    ],
  },
  kariyer: {
    title: 'Kariyer',
    subtitle: 'Ürün ve mühendislikte birlikte büyüyelim.',
    sections: [
      {
        heading: 'Açık pozisyonlar',
        body: [
          'Backend (.NET), frontend (React), mobil ve veri bilimi rolleri için başvuruları people@yukle.tr adresine iletebilirsiniz.',
          'Uzaktan hibrit çalışma; Elazığ ve İstanbul ofis buluşmaları.',
        ],
      },
    ],
  },
  blog: {
    title: 'Blog',
    subtitle: 'Lojistikte ürün ve regülasyon notları.',
    sections: [
      {
        heading: 'Yakında',
        body: ['U-ETDS güncellemeleri, yapay zeka fiyatlandırma notları ve müşteri hikayeleri bu alanda yayınlanacak.'],
      },
    ],
  },
  basin: {
    title: 'Basın',
    subtitle: 'Medya ve iş birlikleri.',
    sections: [
      {
        heading: 'İletişim',
        body: ['Basın bültenleri ve görsel materyaller için press@yukle.tr adresinden bize ulaşın.'],
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
    title: 'Çerezler',
    subtitle: 'Deneyimi iyileştirmek için sınırlı çerez kullanımı.',
    sections: [
      {
        heading: 'Amaç',
        body: [
          'Oturum güvenliği, tercih hatırlama ve anonim kullanım istatistikleri için çerezler kullanılabilir.',
          'Tarayıcı ayarlarından çerezleri yönetebilir; ayrıntılı bilgi için Gizlilik Politikası sayfamıza bakabilirsiniz.',
        ],
      },
    ],
  },
}
