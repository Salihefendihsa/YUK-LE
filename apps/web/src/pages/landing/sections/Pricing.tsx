import { Link } from 'react-router-dom'

const plans = [
  {
    role: 'Müşteri (Yük Sahibi)',
    title: '%2 Komisyon',
    description:
      'Önerilen fiyattan yalnızca %2 platform payı. Gerisi tamamen şoföre aktarılır.',
    feats: ['Sınırsız ilan', 'Akıllı fiyat önerisi', 'Güvenli ödeme havuzu'],
    cta: 'İlan Ver →',
    href: '/customer/loads/create',
    featured: false,
  },
  {
    role: 'Şoför',
    title: '%2 Komisyon',
    description: 'Kazancının %98’i doğrudan hesabına. Boş dönme, bekleme yok.',
    feats: ['Aylık ücret yok', 'Hızlı ödeme garantisi', 'Belgeli şoför avantajı'],
    cta: 'Yük Bul →',
    href: '/driver/loads',
    featured: true,
  },
  {
    role: 'Platform Toplamı',
    title: '%4 Toplam',
    description:
      'Müşteri %2 + şoför %2. Gizli ücret, aylık abonelik, sürpriz yok.',
    feats: ['Net fiyat şeffaflığı', '7/24 destek', 'Sürekli gelişen platform'],
    cta: 'Bize Ulaşın →',
    href: '/demo',
    featured: false,
  },
]

export function PricingSection() {
  return (
    <section className="landing-pricing" id="pricing">
      <h2 className="landing-pricing__h2">Net Fiyatlandırma</h2>
      <div className="landing-pricing__grid">
        {plans.map((p) => (
          <article
            key={p.role}
            className={`landing-pricing__card ${p.featured ? 'landing-pricing__card--pop' : ''}`}
            data-cursor-hover
          >
            <p className="landing-pricing__role">{p.role}</p>
            <h3 className="landing-pricing__title">{p.title}</h3>
            <p className="landing-pricing__desc">{p.description}</p>
            <ul>
              {p.feats.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <Link to={p.href} className={p.featured ? 'landing-pricing__btn' : 'landing-pricing__btn ghost'}>
              {p.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
