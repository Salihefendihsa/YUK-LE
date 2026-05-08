import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../api/auth'
import './Register.css'

type Role = 'Customer' | 'Driver'

function isAdult(dateIso: string) {
  const birth = new Date(dateIso)
  const minDate = new Date()
  minDate.setFullYear(minDate.getFullYear() - 18)
  return birth <= minDate
}

function isValidTcIdentity(tc: string) {
  if (!/^\d{11}$/.test(tc) || tc[0] === '0') return false
  const digits = tc.split('').map(Number)
  const odd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
  const even = digits[1] + digits[3] + digits[5] + digits[7]
  const d10 = ((odd * 7) - even) % 10
  const d11 = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10
  return d10 === digits[9] && d11 === digits[10]
}

export default function Register() {
  const [role, setRole] = useState<Role | null>(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    taxNumberOrTCKN: '',
    isCorporate: false,
    companyName: '',
    taxNumber: '',
    companyAddress: '',
    tcIdentityNumber: '',
    birthDate: '',
    iban: '',
    address: '',
    licenseClass: 'B',
    acceptedKvkk: false,
    acceptedTerms: false,
    acceptedLocationTracking: false,
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
    const taxDigits = form.taxNumber.replace(/\D/g, '')
    const tcDigits = form.tcIdentityNumber.replace(/\D/g, '')
    const iban = form.iban.trim().toUpperCase()

    if (!form.acceptedKvkk || !form.acceptedTerms) {
      setError('KVKK ve Kullanım Koşulları onayları zorunludur.')
      return
    }

    if (role === 'Customer' && form.companyName.trim().length < 2) {
      setError('Şirket adı en az 2 karakter olmalıdır.')
      return
    }
    if (role === 'Customer' && !/^\d{10}$/.test(taxDigits)) {
      setError('Vergi numarası tam 10 hane olmalıdır.')
      return
    }
    if (role === 'Customer' && form.companyAddress.trim().length < 10) {
      setError('Şirket adresi en az 10 karakter olmalıdır.')
      return
    }

    if (role === 'Driver' && !/^\d{11}$/.test(tcDigits)) {
      setError('T.C. kimlik numarası tam 11 hane olmalıdır.')
      return
    }
    if (role === 'Driver' && !isValidTcIdentity(tcDigits)) {
      setError('T.C. kimlik numarası doğrulaması başarısız.')
      return
    }
    if (role === 'Driver' && !form.birthDate) {
      setError('Doğum tarihi zorunludur.')
      return
    }
    if (role === 'Driver' && !isAdult(form.birthDate)) {
      setError('Şoför kaydı için 18 yaşından büyük olmalısınız.')
      return
    }
    if (role === 'Driver' && !/^TR\d{24}$/.test(iban)) {
      setError('IBAN TR ile başlayan 26 karakter formatında olmalıdır.')
      return
    }
    if (role === 'Driver' && form.address.trim().length < 10) {
      setError('İkametgah adresi en az 10 karakter olmalıdır.')
      return
    }
    if (role === 'Driver' && !form.acceptedLocationTracking) {
      setError('Konum verisi onayı zorunludur.')
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
        isCorporate: role === 'Customer' || form.isCorporate,
        taxNumberOrTCKN: role === 'Driver' ? tcDigits : taxDigits,
        companyName: form.companyName,
        taxNumber: taxDigits,
        companyAddress: form.companyAddress,
        tcIdentityNumber: tcDigits,
        birthDate: form.birthDate,
        iban,
        address: form.address,
        licenseClass: form.licenseClass,
        acceptedKvkk: form.acceptedKvkk,
        acceptedTerms: form.acceptedTerms,
        acceptedLocationTracking: form.acceptedLocationTracking,
      })
      sessionStorage.setItem(
        'yükle-pending-auth',
        JSON.stringify({
          phone: normalizedPhone,
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
            <div className="item-row" style={{ marginTop: 12 }}>
              <span className={`badge ${step === 1 ? 'badge-info' : 'badge-muted'}`}>1) Hesap</span>
              <span className={`badge ${step === 2 ? 'badge-info' : 'badge-muted'}`}>2) Rol Bilgileri</span>
              <span className={`badge ${step === 3 ? 'badge-info' : 'badge-muted'}`}>3) Güvenlik ve Onay</span>
            </div>

            {error && <div className="error-banner" role="alert">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              {step === 1 ? (<>
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
              <div className="item-row" style={{ marginTop: 16 }}>
                <span />
                <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>İleri</button>
              </div>
              </>) : null}

              {step === 2 ? (<>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label" htmlFor="taxTCKN">
                  {role === 'Customer' ? 'Vergi Numarası *' : 'T.C. Kimlik No *'}
                </label>
                <input id="taxTCKN" type="text" className="form-input"
                  placeholder={role === 'Customer' ? '1234567890' : '12345678901'}
                  value={role === 'Customer' ? form.taxNumber : form.tcIdentityNumber}
                  onChange={(e) => update(role === 'Customer' ? 'taxNumber' : 'tcIdentityNumber', e.target.value)}
                  required />
              </div>

              {role === 'Customer' && (
                <>
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label" htmlFor="companyName">Şirket Adı *</label>
                    <input id="companyName" type="text" className="form-input" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label" htmlFor="companyAddress">Şirket Adresi *</label>
                    <input id="companyAddress" type="text" className="form-input" value={form.companyAddress} onChange={(e) => update('companyAddress', e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label" htmlFor="authorizedPerson">Yetkili Kişi Adı</label>
                    <input id="authorizedPerson" type="text" className="form-input" value={form.fullName} disabled />
                  </div>
                </>
              )}

              {role === 'Driver' && (
                <>
                  <div className="form-row" style={{ marginTop: 16 }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="birthDate">Doğum Tarihi *</label>
                      <input id="birthDate" type="date" className="form-input" value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="licenseClass">Ehliyet Sınıfı *</label>
                      <select id="licenseClass" className="form-input" value={form.licenseClass} onChange={(e) => update('licenseClass', e.target.value)}>
                        {['B', 'C', 'CE', 'D', 'E'].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label" htmlFor="iban">IBAN *</label>
                    <input id="iban" type="text" className="form-input" placeholder="TR000000000000000000000000" value={form.iban} onChange={(e) => update('iban', e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label" htmlFor="address">İkametgah Adresi *</label>
                    <input id="address" type="text" className="form-input" value={form.address} onChange={(e) => update('address', e.target.value)} required />
                  </div>
                </>
              )}
              <div className="item-row" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Geri</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>İleri</button>
              </div>
              </>) : null}

              {step === 3 ? (<>
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

              <label className="checkbox-row" style={{ marginTop: 16 }}>
                <input type="checkbox" checked={form.acceptedKvkk} onChange={(e) => update('acceptedKvkk', e.target.checked)} />
                <span>KVKK Aydınlatma Metni'ni okudum, anladım ve kabul ediyorum. <a href="/kvkk" target="_blank" rel="noreferrer">Metni aç</a></span>
              </label>
              <label className="checkbox-row" style={{ marginTop: 10 }}>
                <input type="checkbox" checked={form.acceptedTerms} onChange={(e) => update('acceptedTerms', e.target.checked)} />
                <span>Kullanım Koşulları'nı okudum ve kabul ediyorum. <a href="/kullanim-kosullari" target="_blank" rel="noreferrer">Metni aç</a></span>
              </label>
              {role === 'Driver' && (
                <label className="checkbox-row" style={{ marginTop: 10 }}>
                  <input type="checkbox" checked={form.acceptedLocationTracking} onChange={(e) => update('acceptedLocationTracking', e.target.checked)} />
                  <span>Konum verilerimin aktif sefer sırasında işlenmesine onay veriyorum.</span>
                </label>
              )}

              <button type="submit" className="btn btn-primary btn-full"
                style={{ marginTop: 24 }} disabled={loading}>
                {loading ? <span className="spinner" /> : null}
                {loading ? 'Kayıt yapılıyor...' : 'Hesap Oluştur'}
              </button>
              <button type="button" className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setStep(2)}>Geri</button>
              </>) : null}
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
