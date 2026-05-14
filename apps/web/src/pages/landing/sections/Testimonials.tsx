const reviews = [
  {
    name: 'Ayşe Korkmaz',
    role: 'Operasyon Müdürü',
    company: 'Anadolu Gıda',
    text: 'Teklif süreleri ciddi anlamda kısaldı. AI fiyat önerisi ekibimize güven veriyor.',
  },
  {
    name: 'Mehmet Yılmaz',
    role: 'Lojistik Şefi',
    company: 'Doğu Çelik',
    text: 'Şoför eşleşmesi ve canlı takip sayesinde müşteri şikayetleri neredeyse sıfırlandı.',
  },
  {
    name: 'Elif Demir',
    role: 'Satın Alma',
    company: 'Vadi Mobilya',
    text: 'KVKK ve evrak süreçleri düzgün akıyor. Kurumsal kullanım için ideal.',
  },
  {
    name: 'Can Arslan',
    role: 'Filo Yöneticisi',
    company: 'Kuzey Nakliyat',
    text: 'Sürücülerimiz için arayüz sade, ödeme akışı net. Platforma geçiş kolaydı.',
  },
]

export function TestimonialsSection() {
  return (
    <section className="landing-reviews" id="reviews">
      <h2 className="landing-reviews__h2">Sahadan notlar</h2>
      <div className="landing-reviews__track" tabIndex={0}>
        {reviews.map((r) => (
          <article key={r.name} className="landing-reviews__card" data-cursor-hover>
            <div className="landing-reviews__head">
              <div className="landing-reviews__avatar" aria-hidden />
              <div>
                <p className="landing-reviews__name">{r.name}</p>
                <p className="landing-reviews__role">
                  {r.role} · {r.company}
                </p>
              </div>
            </div>
            <div className="landing-reviews__stars" aria-label="5 üzerinden 5">
              ★★★★★
            </div>
            <p className="landing-reviews__text">{r.text}</p>
            <p className="landing-reviews__logo">{r.company}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
