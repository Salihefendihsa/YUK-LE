import { Link } from 'react-router-dom'
import { useState } from 'react'
import './Login.css'

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false)
  return (
    <div className="login-page">
      <div className="login-right" style={{ width: '100%' }}>
        <div className="login-form-wrap">
          <h2 className="login-title">Şifremi Unuttum</h2>
          <p className="login-subtitle">Telefon numaranı gir, sıfırlama bağlantısı gönderelim.</p>
          {!done ? (
            <>
              <input className="form-input" placeholder="5XXXXXXXXX" />
              <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={() => setDone(true)}>Sıfırlama Linki Gönder</button>
            </>
          ) : <div className="success-banner">Sıfırlama adımları SMS ile gönderildi.</div>}
          <p className="login-register-link"><Link to="/login">Girişe dön</Link></p>
        </div>
      </div>
    </div>
  )
}
