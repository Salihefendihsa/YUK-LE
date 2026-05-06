import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../api/auth'
import './Register.css'

type Role = 'Customer' | 'Driver'

export default function Register() {
  const [role, setRole] = useState<Role | null>(null)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    taxNumberOrTCKN: '',
    isCorporate: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function normalizePhone(rawPhone: string) {
    const digits = rawPhone.replace(/\D/g, '')
    if (digits.startsWith('90') && digits.length === 12) return digits
    if (digits.startsWith('0') && digits.length === 11) return digits.slice(1)
    return digits
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) { setError('Lütfen hesap türü seçin'); return }
    if (form.password !== form.confirmPassword) { setError('Şifreler eşleşmiyor'); return }
    const normalizedPhone = normalizePhone(form.phone)
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      setError('Telefon numarasi yalnizca rakamlardan olusmali ve 10-15 hane arasinda olmalidir.')
      return
    }
    const taxDigits = form.taxNumberOrTCKN.replace(/\D/g, '')
    if (role === 'Customer' && taxDigits.length < 10) {
      setError('Vergi numarasi en az 10 hane olmali.')
      return
    }
    if (role === 'Driver' && taxDigits.length !== 11) {
      setError('TCKN 11 hane olmali.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register({
        fullName: form.fullName,
        phone: normalizedPhone,
        email: form.email,
        password: form.password,
        role,
        isCorporate: form.isCorporate,
        taxNumberOrTCKN: taxDigits,
      })
      sessionStorage.setItem(
        'yukle-pending-auth',
        JSON.stringify({
          role,
          phone: normalizedPhone,
          password: form.password,
        })
      )
      navigate(`/verify-phone?phone=${encodeURIComponent(normalizedPhone)}`)
    } catch (err: unknown) {
      const details = (err as { uiDetails?: string[] })?.uiDetails
      const msg = (err as { uiMessage?: string; response?: { data?: { message?: string } } })?.uiMessage
        ?? (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(details && details.length > 0 ? details.join('\n') : (msg || 'Kayit basarisiz. Bilgilerinizi kontrol edin.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-box">
        <div className="register-logo">
          <div className="logo-icon-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 12L12 4L21 12V20H15V15H9V20H3V12Z" fill="white" />
            </svg>
          </div>
          <span>YÜK-LE</span>
        </div>

        <h1 className="register-title">Hesap Oluştur</h1>
        <p className="register-subtitle">Platforma ücretsiz katılın</p>

        {/* Role Selection */}
        {!role && (
          <div className="role-selection">
            <p className="role-question">Nasıl kullanacaksınız?</p>
            <div className="role-cards">
              <button className="role-card" onClick={() => setRole('Customer')}>
                <span className="role-icon">🏭</span>
                <strong>Fabrika / Yük Sahibi</strong>
                <span>Yük ilanı oluştur, şoför bul</span>
              </button>
              <button className="role-card" onClick={() => setRole('Driver')}>
                <span className="role-icon">🚛</span>
                <strong>Şoför</strong>
                <span>İş bul, teklif ver, para kazan</span>
              </button>
            </div>
          </div>
        )}

        {/* Registration Form */}
        {role && (
          <>
            <div className="role-selected-bar">
              <span>{role === 'Customer' ? '🏭 Fabrika Hesabı' : '🚛 Şoför Hesabı'}</span>
              <button onClick={() => setRole(null)} className="change-role-btn">Değiştir</button>
            </div>

            {error && <div className="error-banner" role="alert">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">Ad Soyad *</label>
                  <input id="fullName" type="text" className="form-input"
                    placeholder="Ahmet Yılmaz"
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                    required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Telefon *</label>
                  <input id="phone" type="tel" className="form-input"
                    placeholder="05XX XXX XX XX"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    required />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label" htmlFor="email">E-posta *</label>
                <input id="email" type="email" className="form-input"
                  placeholder="ornek@firma.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required />
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label" htmlFor="taxTCKN">
                  {role === 'Customer' ? 'Vergi Numarası *' : 'TCKN *'}
                  {role === 'Driver' && <span className="secure-hint" title="AES şifrelemesi ile güvenle saklanır"> 🔒 Güvenli</span>}
                </label>
                <input id="taxTCKN" type="text" className="form-input"
                  placeholder={role === 'Customer' ? '1234567890' : '12345678901'}
                  value={form.taxNumberOrTCKN}
                  onChange={(e) => update('taxNumberOrTCKN', e.target.value)}
                  required />
              </div>

              <div className="form-row" style={{ marginTop: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="password">Şifre *</label>
                  <input id="password" type="password" className="form-input"
                    placeholder="En az 6 karakter"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Şifre Tekrar *</label>
                  <input id="confirmPassword" type="password" className="form-input"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    required />
                </div>
              </div>

              {role === 'Customer' && (
                <label className="checkbox-row" style={{ marginTop: 16 }}>
                  <input type="checkbox"
                    checked={form.isCorporate}
                    onChange={(e) => update('isCorporate', e.target.checked)} />
                  <span>Kurumsal hesap (KDV faturası için)</span>
                </label>
              )}

              <button type="submit" className="btn btn-primary btn-full"
                style={{ marginTop: 24 }} disabled={loading}>
                {loading ? <span className="spinner" /> : null}
                {loading ? 'Kayıt yapılıyor...' : 'Hesap Oluştur'}
              </button>
            </form>
          </>
        )}

        <p className="register-login-link">
          Zaten hesabınız var mı? <Link to="/login">Giriş Yapın</Link>
        </p>
      </div>
    </div>
  )
}
