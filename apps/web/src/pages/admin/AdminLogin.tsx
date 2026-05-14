import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/auth.store'
import { toast } from '@/components/common/Toast'
import '../auth/Login.css'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login({ phone: email, password })
      if (data.role !== 'Admin') throw new Error('forbidden')
      setAuth(data)
      toast.success('Yönetici oturumu açıldı.')
      navigate('/admin/dashboard')
    } catch {
      const msg =
        'Erişim reddedildi. Yetkisiz giriş girişimleri kayıt altına alınmıştır.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ap-login-root">
      <Link to="/" className="back-to-home">
        ← Ana Sayfa
      </Link>
      <Link to="/" className="login-logo-link ap-login-brand-link">
        <span className="ap-login-brand-icon" aria-hidden>
          🚛
        </span>
        <span className="ap-login-brand-text">YÜK-LE</span>
      </Link>
      <form className="ap-login-card glass-card" onSubmit={onSubmit} noValidate>
        <div className="ap-login-shield" aria-hidden>
          🛡️
        </div>
        <h1 className="ap-login-title">Yönetici Girişi</h1>
        <p className="ap-login-sub">Yetkili personel girişi</p>

        {error ? (
          <div className="ap-login-error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="ap-login-field">
          <label className="form-label" htmlFor="admin-email">
            E-posta
          </label>
          <input
            id="admin-email"
            className="form-input"
            type="email"
            autoComplete="username"
            placeholder="yonetici@yukle.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="ap-login-field">
          <label className="form-label" htmlFor="admin-pass">
            Şifre
          </label>
          <div className="ap-login-pass-wrap">
            <input
              id="admin-pass"
              className="form-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="ap-login-eye"
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button className="ap-login-submit" type="submit" disabled={loading}>
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>

        <div className="ap-login-secure">
          <div>🔒 Bu sayfa korumalıdır.</div>
          <div>Tüm giriş denemeleri kayıt altındadır.</div>
        </div>
      </form>
    </div>
  )
}
