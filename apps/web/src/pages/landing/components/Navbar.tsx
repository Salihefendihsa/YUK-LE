import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const links = [
  { id: 'journey', label: 'Yolculuk' },
  { id: 'ai', label: 'AI Destek' },
  { id: 'security', label: 'Güvenlik' },
  { id: 'pricing', label: 'Fiyat' },
]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 100)
      setCompact(y > 100)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''} ${compact ? 'landing-nav--compact' : ''}`}
    >
      <div className="landing-nav__inner">
        <Link to="/" className="landing-nav__brand">
          <span className="landing-nav__brand-icon" aria-hidden>
            🚛
          </span>
          <span className="landing-nav__brand-text">YÜK-LE</span>
        </Link>

        <nav className="landing-nav__menu" aria-label="Ana menü">
          {links.map((l) => (
            <button key={l.id} type="button" className="landing-nav__link" onClick={() => scrollTo(l.id)}>
              {l.label}
            </button>
          ))}
        </nav>

        <div className="landing-nav__actions">
          <Link to="/login" className="landing-nav__login">
            Giriş
          </Link>
          <Link to="/register" className="landing-nav__cta">
            Başla
          </Link>
        </div>
      </div>
    </header>
  )
}
