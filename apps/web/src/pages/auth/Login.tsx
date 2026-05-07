import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/auth.store'
import './Login.css'

type RoleOption = 'Customer' | 'Driver' | 'Admin'

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
            : selectedRole === 'Driver'
              ? 'Bu hesap fabrika hesabı olarak görünüyor. Lütfen Fabrika kartını seçin.'
              : 'Bu hesap yönetici hesabı olarak görünmüyor. Lütfen doğru rolü seçin.'
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
            <button
              type="button"
              className={`login-role-card ${selectedRole === 'Admin' ? 'active' : ''}`}
              onClick={() => setSelectedRole('Admin')}
            >
              <span className="role-icon">🛡️</span>
              <strong>Admin</strong>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Telefon veya E-posta</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="5XXXXXXXXX veya e-posta"
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

          <p className="login-register-link">
            Hesabınız yok mu?{' '}
            <Link to="/register">Kayıt Olun</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
