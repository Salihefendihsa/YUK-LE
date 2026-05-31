import { Link } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'

export function LandingFooter() {
  return (
    <footer className="lm-footer section-rhythm-a">
      <div className="lm-container">
        <p className="lm-footer-brand-line">
          <Logo variant="wordmark" size="sm" theme="dark" /> — Yapay zeka destekli yük platformu
        </p>
        <div className="lm-footer-links">
          <Link to="/login">Giriş Yap</Link>
          <Link to="/register">Kayıt Ol</Link>
          <Link to="/demo">Demo</Link>
          <Link to="/kvkk">KVKK</Link>
        </div>
      </div>
    </footer>
  )
}
