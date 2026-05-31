import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'

const links = [
  { id: 'journey', label: 'Türkiye Ağı' },
  { id: 'yolculuk', label: 'Nasıl Çalışır' },
  { id: 'ozellikler', label: 'Özellikler' },
  { id: 'ai', label: 'AI' },
  { id: 'pricing', label: 'Fiyat' },
]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const scrollRafRef = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      if (scrollRafRef.current) return
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = 0
        const next = window.scrollY > 100
        setScrolled((prev) => (prev === next ? prev : next))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
    }
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={`landing-nav ${scrolled ? 'landing-nav--scrolled landing-nav--compact' : ''}`}
    >
      <div className="landing-nav__inner">
        <Link to="/" className="landing-nav__brand">
          <Logo variant="full" size="md" theme="dark" />
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
