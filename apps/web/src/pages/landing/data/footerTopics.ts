export type FooterPoint = {
  label: string
  text: string
}

export type FooterTopic = {
  id: string
  label: string
  group: string
  summary: string
  customerTitle: string
  customerPoints: FooterPoint[]
  driverTitle: string
  driverPoints: FooterPoint[]
  /** Footer’da “Yakında” rozeti gösterilir; link yine tıklanabilir */
  soonBadge?: boolean
  docLink?: { to: string; label: string }
}

export const FOOTER_SOCIAL = ['Twitter', 'LinkedIn', 'Instagram'] as const

export const FOOTER_COLUMNS: { title: string; topics: FooterTopic[] }[] = [
  {
    title: 'Ürün',
    topics: [
      {
        id: 'ozellikler',
        label: 'Özellikler',
        group: 'Ürün',
        summary:
          'İlandan teslimata tek akış: AI fiyat önerisi, belgeli şoförler, güvenli ödeme ve canlı takip.',
        customerTitle: 'Yük veren',
        customerPoints: [
          { label: 'Hızlı ilan', text: 'Çıkış, varış, tonaj ve tarih ile dakikalar içinde yayın.' },
          { label: 'Akıllı fiyat', text: 'Piyasa bandı ve teklif filtreleri ile doğru navlun.' },
          { label: 'Güvenli ödeme', text: 'Tutar havuzda; teslim onayından sonra aktarım.' },
          { label: 'Canlı takip', text: 'Harita, ETA ve bildirimler tek panelde.' },
        ],
        driverTitle: 'Şoför',
        driverPoints: [
          { label: 'Uygun yükler', text: 'Mesafe, araç tipi ve boş dönüşe göre filtre.' },
          { label: 'Hızlı teklif', text: 'Tek tıkla teklif; karşı teklifte anlık uyarı.' },
          { label: 'Doğrulanmış profil', text: 'Belge ve araç bilgisi müşteriye güven verir.' },
          { label: 'Şeffaf ödeme', text: 'Teslim kanıtı sonrası ödeme takvimi net görünür.' },
        ],
        docLink: { to: '/#ozellikler', label: 'Özellikler bölümüne git' },
      },
      {
        id: 'fiyat',
        label: 'Fiyat',
        group: 'Ürün',
        summary: 'Gizli ücret yok; komisyon ve paketler önceden bellidir.',
        customerTitle: 'Yük veren',
        customerPoints: [
          { label: 'Öngörülebilir maliyet', text: 'İlan veya aylık paket; sürpriz kesinti yok.' },
          { label: 'Kurumsal plan', text: 'Hacim indirimi ve özel temsilci seçeneği.' },
          { label: 'AI desteği', text: 'Aşırı yüksek navlun riskini azaltır.' },
          { label: 'Raporlama', text: 'Fatura ve şube raporları panelden.' },
        ],
        driverTitle: 'Şoför',
        driverPoints: [
          { label: 'Ücretsiz teklif', text: 'Kayıt ve teklif verme ücreti alınmaz.' },
          { label: 'Sefer komisyonu', text: 'Kesinti yalnızca tamamlanan işlerde.' },
          { label: 'Ödeme takvimi', text: 'Bekleyen ve yatan tutarlar ayrı listelenir.' },
          { label: 'Performans', text: 'Yüksek puan öncelikli ilan akışı sağlar.' },
        ],
        docLink: { to: '/#pricing', label: 'Fiyatlandırmayı gör' },
      },
      {
        id: 'demo',
        label: 'Demo',
        group: 'Ürün',
        summary: '15 dakikalık canlı tur; kendi senaryonuzla ilan, teklif ve ödeme akışı.',
        customerTitle: 'Yük veren',
        customerPoints: [
          { label: 'Canlı oturum', text: 'Ekran paylaşımı ile ilan ve teklif karşılaştırma.' },
          { label: 'Roller', text: 'Operasyon ve muhasebe kullanıcı örnekleri.' },
          { label: 'Ödeme akışı', text: 'Havuz, teslim ve onay adımları anlatılır.' },
          { label: 'Özet PDF', text: 'Demo sonrası kurulum listesi e-postalanır.' },
        ],
        driverTitle: 'Şoför',
        driverPoints: [
          { label: 'Mobil tur', text: 'İlan listesi, filtre ve teklif ekranları.' },
          { label: 'Belge süreci', text: 'Yükleme ve onay adımları gösterilir.' },
          { label: 'Aktif sefer', text: 'Takip, iletişim ve teslim kanıtı örneği.' },
          { label: 'Ödeme ekranı', text: 'Geçmiş ödemeler ve puanlama tanıtımı.' },
        ],
        docLink: { to: '/demo', label: 'Demo talep et' },
      },
    ],
  },
  {
    title: 'Şirket',
    topics: [
      {
        id: 'hakkimizda',
        label: 'Hakkımızda',
        group: 'Şirket',
        summary:
          'Türkiye merkezli lojistik teknolojisi; fabrika ile belgeli taşıyıcıyı aracısız buluştururuz.',
        customerTitle: 'Yük veren',
        customerPoints: [
          { label: 'Geniş ağ', text: '2.847+ kayıtlı fabrika ve üretici.' },
          { label: 'Şeffaflık', text: 'Dijital sözleşme ve net navlun.' },
          { label: 'Destek', text: '7/24 operasyon hattı.' },
          { label: 'Bölgesel kapsam', text: 'Türkiye genelinde aktif ilan hatları.' },
        ],
        driverTitle: 'Şoför',
        driverPoints: [
          { label: 'Topluluk', text: '8.500+ doğrulanmış taşıyıcı.' },
          { label: 'Adil sıralama', text: 'Fiyat, puan ve tamamlama oranı birlikte.' },
          { label: 'Açık komisyon', text: 'Kesintiler panelde görünür.' },
          { label: 'Saha sesi', text: 'Geri bildirimler ürüne yansır.' },
        ],
        docLink: { to: '/hakkimizda', label: 'Hakkımızda sayfasına git' },
      },
      {
        id: 'kariyer',
        label: 'Kariyer',
        soonBadge: true,
        group: 'Şirket',
        summary: 'Ürün, mühendislik ve operasyon ekiplerinde uzaktan/hibrit çalışma.',
        customerTitle: 'Yük veren',
        customerPoints: [
          { label: 'Kurumsal satış', text: 'Fabrika ilişkileri ve demo süreçleri.' },
          { label: 'Operasyon', text: 'İlan kalitesi ve anlaşmazlık yönetimi.' },
          { label: 'İçerik', text: 'Sektör raporları ve vaka çalışmaları.' },
        ],
        driverTitle: 'Şoför',
        driverPoints: [
          { label: 'Saha ekibi', text: 'Şoför ilişkileri ve elçi rolleri.' },
          { label: 'Mobil ürün', text: 'Sahadan test ve UX geri bildirimi.' },
          { label: 'Destek', text: 'Belge, ödeme ve hesap güvenliği.' },
        ],
        docLink: { to: '/kariyer', label: 'Kariyer sayfasına git' },
      },
      {
        id: 'blog',
        label: 'Blog',
        soonBadge: true,
        group: 'Şirket',
        summary: 'Navlun, AI, mevzuat ve operasyon içerikleri; fabrika ve şoför için ayrı etiketler.',
        customerTitle: 'Yük veren',
        customerPoints: [
          { label: 'Maliyet', text: 'Navlun düşürme vaka yazıları.' },
          { label: 'Trend', text: 'Bölgesel talep ve sezon notları.' },
          { label: 'Rehber', text: 'KVKK ve dijital arşiv konuları.' },
        ],
        driverTitle: 'Şoför',
        driverPoints: [
          { label: 'Rota', text: 'Yakıt ve mesafe optimizasyonu.' },
          { label: 'Belge', text: 'SRC ve yenileme hatırlatmaları.' },
          { label: 'Saha', text: 'Güvenli teslimat uygulamaları.' },
        ],
        docLink: { to: '/blog', label: 'Blog sayfasına git' },
      },
      {
        id: 'basin',
        label: 'Basın',
        soonBadge: true,
        group: 'Şirket',
        summary: 'Basın kiti, logo kuralları ve onaylı kurucu görüşmeleri.',
        customerTitle: 'Yük veren',
        customerPoints: [
          { label: 'Duyurular', text: 'İş birlikleri ve ağ genişlemesi.' },
          { label: 'Vaka', text: 'İzinli müşteri başarı hikâyeleri.' },
          { label: 'Uzman görüş', text: 'Dijital lojistik ve maliyet trendleri.' },
        ],
        driverTitle: 'Şoför',
        driverPoints: [
          { label: 'Etkinlik', text: 'Şoför topluluğu buluşmaları.' },
          { label: 'Ödeme', text: 'Güvenli ödeme altyapısı haberleri.' },
          { label: 'Görsel', text: 'Saha ve mobil uygulama materyalleri.' },
        ],
        docLink: { to: '/basin', label: 'Basın sayfasına git' },
      },
    ],
  },
  {
    title: 'Yasal',
    topics: [
      {
        id: 'kvkk',
        label: 'KVKK',
        group: 'Yasal',
        summary: 'Kişisel veriler 6698 sayılı Kanun’a uygun işlenir, saklanır ve korunur.',
        customerTitle: 'Yük veren',
        customerPoints: [
          { label: 'Firma verisi', text: 'Yetkili, iletişim ve sözleşme kayıtları.' },
          { label: 'Saklama', text: 'İlan ve fatura için mevzuat süreleri.' },
          { label: 'Başvuru', text: 'Erişim, düzeltme ve silme talepleri.' },
        ],
        driverTitle: 'Şoför',
        driverPoints: [
          { label: 'Belgeler', text: 'Ehliyet ve SRC şifreli saklanır.' },
          { label: 'Konum', text: 'Yalnızca aktif seferde işlenir.' },
          { label: 'İzinler', text: 'Pazarlama için ayrı onay; geri çekilebilir.' },
        ],
        docLink: { to: '/kvkk', label: 'KVKK metnini oku' },
      },
      {
        id: 'kosullar',
        label: 'Koşullar',
        group: 'Yasal',
        summary: 'Platform kullanımında tarafların hak ve yükümlülükleri yazılıdır.',
        customerTitle: 'Yük veren',
        customerPoints: [
          { label: 'Doğru ilan', text: 'Tonaj ve adres bilgisi sorumluluğu.' },
          { label: 'Ödeme', text: 'Havuz, teslim ve itiraz kuralları.' },
          { label: 'İptal', text: 'Ceza ve mücbir sebep hükümleri.' },
        ],
        driverTitle: 'Şoför',
        driverPoints: [
          { label: 'Belgeli çalışma', text: 'Geçerli ehliyet ve araç uygunluğu.' },
          { label: 'Teslim', text: 'Gecikme bildirimi ve hasar tutanağı.' },
          { label: 'Güvenlik', text: 'Platform dışı ödeme yasaktır.' },
        ],
        docLink: { to: '/kullanim-kosullari', label: 'Kullanım koşulları' },
      },
      {
        id: 'gizlilik',
        label: 'Gizlilik',
        group: 'Yasal',
        summary: 'Veri toplama, kullanım ve paylaşım gizlilik politikasında açıklanır.',
        customerTitle: 'Yük veren',
        customerPoints: [
          { label: 'Roller', text: 'Kurumsal hesapta veri erişim sınırları.' },
          { label: 'Çerez', text: 'Zorunlu oturum; analitik isteğe bağlı.' },
          { label: 'İhlal', text: 'Olayda bildirim prosedürü tanımlı.' },
        ],
        driverTitle: 'Şoför',
        driverPoints: [
          { label: 'Mobil izin', text: 'Konum ve bildirim ayrı yönetilir.' },
          { label: 'Maskeleme', text: 'Sefer bitince iletişim gizlenir.' },
          { label: 'Silme', text: 'Hesap kapanınca profil silme takvimi.' },
        ],
        docLink: { to: '/gizlilik', label: 'Gizlilik politikası' },
      },
      {
        id: 'cerezler',
        label: 'Çerezler',
        group: 'Yasal',
        summary: 'Zorunlu, performans ve tercih çerezleri; mobilde eşdeğer izinler.',
        customerTitle: 'Yük veren',
        customerPoints: [
          { label: 'Zorunlu', text: 'Giriş ve güvenlik için gerekli.' },
          { label: 'Tercih', text: 'Dil ve panel ayarları.' },
          { label: 'Analitik', text: 'İsteğe bağlı; banner’dan kapatılır.' },
        ],
        driverTitle: 'Şoför',
        driverPoints: [
          { label: 'Uygulama', text: 'Depolama ve sistem izinleri.' },
          { label: 'Konum', text: 'Sadece sefer takibi için.' },
          { label: 'Bildirim', text: 'Pazarlama ayrı onaylı.' },
        ],
        docLink: { to: '/cerezler', label: 'Çerez politikası' },
      },
    ],
  },
]

export function getFooterTopic(id: string): FooterTopic | undefined {
  for (const col of FOOTER_COLUMNS) {
    const hit = col.topics.find((t) => t.id === id)
    if (hit) return hit
  }
  return undefined
}
