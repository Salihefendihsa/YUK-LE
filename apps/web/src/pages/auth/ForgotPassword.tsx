import { Link } from 'react-router-dom'
import { useState } from 'react'
import Footer from '../../components/layout/Footer'
import { digitsOnly, formatPhone, validatePhone } from '../../utils/validators'
import './Login.css'

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  function submit() {
    if (!validatePhone(digitsOnly(phone))) {
      setError('Telefon numarası 5 ile başlayan 10 haneli olmalıdır')
      return
    }
    setError('')
    setDone(true)
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="login-page" style={{ flex: 1 }}>
        <div className="login-right" style={{ width: '100%' }}>
          <div className="login-form-wrap">
            <h2 className="login-title">Şifremi Unuttum</h2>
            <p className="login-subtitle">Telefon numaranı gir, sıfırlama bağlantısı gönderelim.</p>
            {error ? <div className="error-banner">{error}</div> : null}
            {!done ? (
              <>
                <input className="form-input" placeholder="5XXXXXXXXX" maxLength={10} value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
                <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={submit}>Sıfırlama Linki Gönder</button>
              </>
            ) : <div className="success-banner">Sıfırlama adımları SMS ile gönderildi.</div>}
            <p className="login-register-link"><Link to="/login">Girişe dön</Link></p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
