import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/auth.store'
import GlassCard from '../../components/common/GlassCard'
import './Login.css'

type RoleOption = 'Customer' | 'Driver'

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<RoleOption>('Customer')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    const verified = params.get('verified')
    const prefillPhone = params.get('phone')

    if (prefillPhone) {
      setPhone(prefillPhone)
    }

    if (verified === '1') {
      setToast('Kayıt başarılı, lütfen giriş yapın')
      const timer = setTimeout(() => setToast(''), 3500)
      return () => clearTimeout(timer)
    }
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !password) { setError('Lütfen tum alanlari doldurun'); return }
    setLoading(true)
    setError('')
    try {
      const data = await login({ phone: phone.replace(/\D/g, ''), password })
      if (selectedRole && data.role !== selectedRole) {
        setError(
          selectedRole === 'Customer'
            ? 'Bu hesap şoför hesabı olarak gorunuyor. Lütfen Şoför kartini secin.'
            : selectedRole === 'Driver'
              ? 'Bu hesap fabrika hesabı olarak görünüyor. Lütfen Fabrika kartını seçin.'
              : 'Bu hesap yönetici hesabı olarak görünmüyor. Lütfen doğru rolü seçin.'
        )
        return
      }
      setAuth(data)
      if (data.role === 'Customer') navigate('/customer/dashboard')
      else if (data.role === 'Driver') navigate('/driver/dashboard')
      else navigate('/driver/dashboard')
    } catch (err: unknown) {
      const verificationPayload = (err as {
        response?: { status?: number; data?: { requiresVerification?: boolean; phone?: string } }
      })?.response?.data
      const statusCode = (err as { response?: { status?: number } })?.response?.status

      if (statusCode === 403 && verificationPayload?.requiresVerification) {
        setToast('Telefon doğrulama gerekiyor')
        setTimeout(() => setToast(''), 3000)
        navigate(`/verify-phone?phone=${encodeURIComponent(verificationPayload.phone || phone.replace(/\D/g, ''))}`)
        return
      }

      const msg = (err as { uiMessage?: string; response?: { data?: { message?: string } } })?.uiMessage
        ?? (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Telefon numarasi veya şifre hatali. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-orb login-orb--1" aria-hidden />
      <div className="login-orb login-orb--2" aria-hidden />
      <div className="login-orb login-orb--3" aria-hidden />
      {/* ── Left Panel ────────────────────────────────────── */}
      <div className="login-left">
        <div className="login-left-content">
          <GlassCard className="login-glass-panel">
            <div className="login-logo">
              <div className="login-logo-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12L12 4L21 12V20H15V15H9V20H3V12Z" fill="white" />
                </svg>
              </div>
              <span>YÜK-LE</span>
            </div>

            <h1 className="login-tagline">
              <span className="login-tagline-line">Yükünüz</span>{' '}
              <em className="login-tagline-em">güvende,</em>
              <br />
              <span className="login-tagline-line login-tagline-accent">yolunuz açık.</span>
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
          </GlassCard>
        </div>
      </div>

      {/* ── Right Panel ───────────────────────────────────── */}
      <div className="login-right">
        <GlassCard className="login-form-wrap">
          {toast && <div className="success-banner" role="status">{toast}</div>}
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
              <strong>Şoför</strong>
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
                <Link to="/forgot-password" className="forgot-link">Şifremi Unuttum</Link>
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
              className="btn btn-full btn-login-submit"
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
          <p className="login-register-link" style={{ marginTop: 6, opacity: 0.7 }}>
            <Link to="/admin/login">Yönetici girişi →</Link>
          </p>
        </GlassCard>
      </div>
    </div>
  )
}
