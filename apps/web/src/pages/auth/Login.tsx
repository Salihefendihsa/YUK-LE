import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/auth.store'
import './Login.css'

type RoleOption = 'Customer' | 'Driver'

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<RoleOption>('Customer')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !password) { setError('Lutfen tum alanlari doldurun'); return }
    setLoading(true)
    setError('')
    try {
      const data = await login({ phone: phone.replace(/\D/g, ''), password })
      if (selectedRole && data.role !== selectedRole) {
        setError(
          selectedRole === 'Customer'
            ? 'Bu hesap sofor hesabı olarak gorunuyor. Lutfen Sofor kartini secin.'
            : 'Bu hesap fabrika hesabı olarak gorunuyor. Lutfen Fabrika kartini secin.'
        )
        return
      }
      setAuth(data)
      if (data.role === 'Customer') navigate('/customer/dashboard')
      else if (data.role === 'Driver') navigate('/driver/dashboard')
      else navigate('/admin/dashboard')
    } catch (err: unknown) {
      const msg = (err as { uiMessage?: string; response?: { data?: { message?: string } } })?.uiMessage
        ?? (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Telefon numarasi veya sifre hatali. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* ── Left Panel ────────────────────────────────────── */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M3 12L12 4L21 12V20H15V15H9V20H3V12Z" fill="white" />
              </svg>
            </div>
            <span>YÜK-LE</span>
          </div>

          <h1 className="login-tagline">
            Yükünüz Güvende,<br />Yolunuz Açık.
          </h1>

          <ul className="login-features">
            {[
              { icon: '⚡', text: 'Saniyeler içinde eşleştirme' },
              { icon: '🤖', text: 'AI destekli adil fiyat' },
              { icon: '🔒', text: 'KVKK uyumlu güvenli ödeme' },
            ].map((f) => (
              <li key={f.text}>
                <span className="feature-icon">{f.icon}</span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="login-truck-anim" aria-hidden>🚛</div>
        </div>
      </div>

      {/* ── Right Panel ───────────────────────────────────── */}
      <div className="login-right">
        <div className="login-form-wrap">
          <h2 className="login-title">Tekrar hoşgeldiniz</h2>
          <p className="login-subtitle">Hesabınıza girin</p>

          {error && <div className="error-banner" role="alert">{error}</div>}

          <div className="login-role-cards">
            <button
              type="button"
              className={`login-role-card ${selectedRole === 'Customer' ? 'active customer' : ''}`}
              onClick={() => setSelectedRole('Customer')}
            >
              <span className="role-icon">🏭</span>
              <strong>Fabrika</strong>
            </button>
            <button
              type="button"
              className={`login-role-card ${selectedRole === 'Driver' ? 'active driver' : ''}`}
              onClick={() => setSelectedRole('Driver')}
            >
              <span className="role-icon">🚛</span>
              <strong>Sofor</strong>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Telefon</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="5XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <div className="password-label-row">
                <label className="form-label" htmlFor="password">Şifre</label>
                <a href="#forgot" className="forgot-link">Şifremi Unuttum</a>
              </div>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-full ${selectedRole === 'Customer' ? 'btn-customer' : 'btn-driver'}`}
              style={{ marginTop: 24 }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="divider">veya</div>

          <button className="btn btn-ghost btn-full google-btn">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.1 29.2 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 28.9 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
              <path fill="#FF3D00" d="M6.3 15.1l6.6 4.8C14.7 17 19 14 24 14c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 28.9 5 24 5c-7.7 0-14.4 4.4-17.7 10.1z" />
              <path fill="#4CAF50" d="M24 45c4.8 0 9.2-1.8 12.5-4.8l-5.8-4.9C28.8 36.8 26.5 38 24 38c-5.1 0-9.6-2.9-11.3-7h-.1l-6.8 5.3C8.8 41.5 16 45 24 45z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l5.8 4.9c-.4.4 6-4.4 6-13.3 0-1.3-.1-2.6-.4-3.9z" />
            </svg>
            Google ile Devam Et
          </button>

          <p className="login-register-link">
            Hesabınız yok mu?{' '}
            <Link to="/register">Kayıt Olun</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
