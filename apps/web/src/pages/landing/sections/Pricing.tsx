import { Link } from 'react-router-dom'

const plans = [
  {
    name: 'Başlangıç',
    price: '₺0',
    sub: '',
    feats: ['5 ilan / ay', 'Temel destek', 'Standart eşleştirme'],
    cta: 'Başla',
    href: '/register',
    featured: false,
  },
  {
    name: 'Profesyonel',
    price: '₺499',
    sub: '/ ay',
    badge: 'EN POPÜLER',
    feats: ['Sınırsız ilan', 'AI öncelik', '7/24 destek'],
    cta: 'Seç',
    href: '/register',
    featured: true,
  },
  {
    name: 'Kurumsal',
    price: 'Özel',
    sub: '',
    feats: ['API erişimi', 'Hesap yöneticisi', 'SLA garantisi'],
    cta: 'İletişim',
    href: '/register',
    featured: false,
  },
]

export function PricingSection() {
  return (
    <section className="landing-pricing" id="pricing">
      <h2 className="landing-pricing__h2">Net fiyatlandırma</h2>
      <div className="landing-pricing__grid">
        {plans.map((p) => (
          <article
            key={p.name}
            className={`landing-pricing__card ${p.featured ? 'landing-pricing__card--pop' : ''}`}
            data-cursor-hover
          >
            {p.badge && <span className="landing-pricing__badge">{p.badge}</span>}
            <h3>{p.name}</h3>
            <p className="landing-pricing__price">
              {p.price}
              <small>{p.sub}</small>
            </p>
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
