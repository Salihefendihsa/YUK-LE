import { Link } from 'react-router-dom'

const navLinks = [
  { href: '#yolculuk', label: 'Yolculuk' },
  { href: '#ozellikler', label: 'Özellikler' },
  { href: '#demo', label: 'Demo' },
]

export function LandingNavbar() {
  return (
    <header className="lm-nav liquid-glass-dark">
      <div className="lm-container lm-nav-inner">
        <Link
          to="/"
          data-hero-animate
          data-hero-delay="0.1"
          className="lm-logo"
        >
          YÜK<span>-LE</span>
        </Link>

        <nav className="lm-nav-links" aria-label="Ana menü">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-hero-animate
              data-hero-delay="0.2"
              className="nav-link-glow"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="lm-nav-actions">
          <Link
            to="/login"
            data-hero-animate
            data-hero-delay="0.2"
            className="lm-btn-ghost liquid-glass liquid-glass-hover"
          >
            Giriş Yap
          </Link>
          <Link
            to="/register"
            data-hero-animate
            data-hero-delay="0.2"
            className="lm-btn-primary-sm"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </header>
  )
}
