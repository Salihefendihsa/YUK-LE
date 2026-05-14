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
        heading: 'AI destekli eşleştirme',
        body: [
          'Gemini tabanlı öneriler ile yük ve şoför profilleri analiz edilir; adil fiyat ve uyum skoru saniyeler içinde hesaplanır.',
          'Belge OCR ile ehliyet ve kurumsal evraklar otomatik okunur, manuel kontrol süresi kısalır.',
        ],
      },
      {
        heading: 'Güven ve uyumluluk',
        body: [
          'KVKK uyumlu veri işleme, güvenli havuz (escrow) ödeme ve U-ETDS entegrasyonu ile yasal süreçler şeffaftır.',
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
          'Yapay zekâyı operasyonun kalbine yerleştirerek fiyat keşfi, risk ve doluluk yönetimini iyileştirmek.',
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
        body: ['U-ETDS güncellemeleri, AI fiyatlandırma notları ve müşteri hikâyeleri bu alanda yayınlanacak.'],
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
