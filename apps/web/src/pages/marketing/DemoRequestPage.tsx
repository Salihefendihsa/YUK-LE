import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from '@/components/common/Toast'
import './marketing.css'

export default function DemoRequestPage() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Ad Soyad, e-posta ve telefon zorunludur.')
      return
    }
    toast.success('Talebiniz alındı. Ekibimiz en kısa sürede size dönecek.')
    setMessage('')
  }

  return (
    <div className="marketing-page">
      <div className="marketing-page__bg" aria-hidden />
      <header className="marketing-page__header">
        <Link to="/" className="marketing-page__logo">
          🚛 <span>YÜK-LE</span>
        </Link>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link to="/login" className="marketing-page__link">
            Giriş
          </Link>
          <Link to="/register" className="marketing-page__link">
            Kayıt Ol
          </Link>
        </div>
      </header>

      <div className="demo-page__grid">
        <article className="marketing-page__article glass-card demo-page__form-card">
          <p className="marketing-page__eyebrow">Kurumsal</p>
          <h1 className="marketing-page__title">Demo Talebi</h1>
          <p className="marketing-page__subtitle">Ekibiniz için canlı tur planlayalım; formu doldurmanız yeterli.</p>
          <form className="demo-page__form" onSubmit={onSubmit}>
            <label className="demo-page__field">
              <span>Ad Soyad</span>
              <input className="demo-page__input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </label>
            <label className="demo-page__field">
              <span>Şirket</span>
              <input className="demo-page__input" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
            </label>
            <label className="demo-page__field">
              <span>E-posta</span>
              <input className="demo-page__input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </label>
            <label className="demo-page__field">
              <span>Telefon</span>
              <input className="demo-page__input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required />
            </label>
            <label className="demo-page__field">
              <span>Mesaj</span>
              <textarea className="demo-page__input demo-page__textarea" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="İhtiyaçlarınızı kısaca yazın…" />
            </label>
            <button type="submit" className="demo-page__submit">
              Talep Gönder
            </button>
          </form>
          <p className="marketing-page__footer" style={{ marginTop: '1.5rem' }}>
            <Link to="/">← Ana sayfa</Link>
          </p>
        </article>

        <aside className="demo-page__aside glass-card" aria-label="Tanıtım videosu">
          <p className="marketing-page__eyebrow">Tanıtım</p>
          <h2 className="demo-page__aside-title">Video Alanı</h2>
          <p className="marketing-page__subtitle">Ürün turu videosu burada yer alacak. Şimdilik yer tutucu.</p>
          <div className="demo-page__video-placeholder">▶</div>
        </aside>
      </div>
    </div>
  )
}
