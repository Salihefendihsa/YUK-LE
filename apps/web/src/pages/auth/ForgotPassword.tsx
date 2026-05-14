import { Link } from 'react-router-dom'
import { useState } from 'react'
import Footer from '../../components/layout/Footer'
import { apiClient } from '../../api/client'
import { digitsOnly, formatPhone, validatePhone } from '../../utils/validators'
import './Login.css'

type Step = 1 | 2 | 3

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const phoneDigits = digitsOnly(phone)

  async function submitPhone() {
    if (!validatePhone(phoneDigits)) {
      setError('Telefon numarası 5 ile başlayan 10 haneli olmalıdır')
      return
    }
    setError('')
    setBusy(true)
    try {
      await apiClient.post('/Auth/forgot-password', { phone: phoneDigits })
      setStep(2)
    } catch (e: unknown) {
      const msg = (e as { uiMessage?: string })?.uiMessage ?? 'İşlem başarısız.'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  async function submitOtp() {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('6 haneli OTP girin.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await apiClient.post('/Auth/verify-otp', {
        phone: phoneDigits,
        code: otp.trim(),
        purpose: 'PasswordReset',
      })
      setStep(3)
    } catch (e: unknown) {
      const msg = (e as { uiMessage?: string })?.uiMessage ?? 'OTP doğrulanamadı.'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  async function submitReset() {
    if (newPassword.length < 8 || newPassword !== newPassword2) {
      setError('Yeni şifre en az 8 karakter olmalı ve tekrarı eşleşmelidir.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await apiClient.post('/Auth/reset-password', {
        phone: phoneDigits,
        otpCode: otp.trim(),
        newPassword,
      })
      setStep(1)
      setPhone('')
      setOtp('')
      setNewPassword('')
      setNewPassword2('')
      setError('')
      window.location.href = '/login'
    } catch (e: unknown) {
      const msg = (e as { uiMessage?: string })?.uiMessage ?? 'Şifre sıfırlanamadı.'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="login-page" style={{ flex: 1 }}>
        <div className="login-right" style={{ width: '100%' }}>
          <div className="login-form-wrap">
            <h2 className="login-title">Şifremi Unuttum</h2>
            <p className="login-subtitle">
              {step === 1 ? 'Telefon numaranı gir, SMS ile OTP gönderelim.' : null}
              {step === 2 ? 'Telefonuna gelen 6 haneli kodu gir.' : null}
              {step === 3 ? 'Yeni şifreni belirle.' : null}
            </p>
            {error ? <div className="error-banner">{error}</div> : null}
            {step === 1 ? (
              <>
                <input className="form-input" placeholder="5XXXXXXXXX" maxLength={10} value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
                <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} disabled={busy} onClick={() => void submitPhone()}>
                  OTP Gönder
                </button>
              </>
            ) : null}
            {step === 2 ? (
              <>
                <input className="form-input" placeholder="6 haneli kod" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
                <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} disabled={busy} onClick={() => void submitOtp()}>
                  OTP Doğrula
                </button>
              </>
            ) : null}
            {step === 3 ? (
              <>
                <input className="form-input" type="password" placeholder="Yeni şifre" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <input
                  className="form-input"
                  type="password"
                  placeholder="Yeni şifre tekrar"
                  style={{ marginTop: 12 }}
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                />
                <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} disabled={busy} onClick={() => void submitReset()}>
                  Şifreyi Sıfırla
                </button>
              </>
            ) : null}
            <p className="login-register-link">
              <Link to="/login">Girişe dön</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
