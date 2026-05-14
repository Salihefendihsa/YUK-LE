import { Link } from 'react-router-dom'

const cols = [
  {
    title: 'Ürün',
    links: [
      { to: '/features', label: 'Özellikler' },
      { to: '/pricing', label: 'Fiyat' },
      { to: '/demo', label: 'Demo' },
      { to: '/api-docs', label: 'API' },
    ],
  },
  {
    title: 'Şirket',
    links: [
      { to: '/hakkimizda', label: 'Hakkımızda' },
      { to: '/kariyer', label: 'Kariyer' },
      { to: '/blog', label: 'Blog' },
      { to: '/basin', label: 'Basın' },
    ],
  },
  {
    title: 'Yasal',
    links: [
      { to: '/kvkk', label: 'KVKK' },
      { to: '/kullanim-kosullari', label: 'Koşullar' },
      { to: '/gizlilik', label: 'Gizlilik' },
      { to: '/cerezler', label: 'Çerezler' },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <p className="landing-footer__strip">500+ FABRİKA İLE GÜVENİLİYORUZ</p>
      <div className="landing-footer__marquee" aria-hidden>
        <div className="landing-footer__marquee-track">
          <span>YÜK-LE · LOJİSTİK · YAPAY ZEKA · GÜVEN · TÜRKİYE · </span>
          <span>YÜK-LE · LOJİSTİK · YAPAY ZEKA · GÜVEN · TÜRKİYE · </span>
        </div>
      </div>
      <div className="landing-footer__grid">
        <div>
          <p className="landing-footer__brand">🚛 YÜK-LE</p>
          <p className="landing-footer__tag">Yapay zekâ destekli yük platformu</p>
          <div className="landing-footer__social">
            <a href="https://twitter.com" data-cursor-hover>
              Twitter
            </a>
            <a href="https://linkedin.com" data-cursor-hover>
              LinkedIn
            </a>
            <a href="https://instagram.com" data-cursor-hover>
              Instagram
            </a>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="landing-footer__col-title">{c.title}</p>
            <ul>
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} data-cursor-hover>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="landing-footer__bottom">
        <p>© 2026 YÜK-LE — Yapay zeka destekli lojistik.</p>
        <p>Türkiye 🇹🇷</p>
      </div>
    </footer>
  )
}
