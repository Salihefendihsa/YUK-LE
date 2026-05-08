import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/auth.store'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const data = await login({ phone: email, password })
      if (data.role !== 'Admin') throw new Error('forbidden')
      setAuth(data)
      navigate('/admin/dashboard')
    } catch {
      setError('Erişim reddedildi. Yetkisiz giriş girişimleri kayıt altına alınmaktadır.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#090B0E', padding: 16 }}>
      <form onSubmit={onSubmit} className="admin-card" style={{ width: '100%', maxWidth: 420, borderColor: '#3b0e12' }}>
        <h1 style={{ marginBottom: 8 }}>🛡️ Yönetici Girişi</h1>
        {error ? <div className="error-banner">{error}</div> : null}
        <input className="form-input" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="form-input" type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginTop: 10 }} />
        <button className="btn btn-danger btn-full" style={{ marginTop: 12 }} type="submit">Giriş Yap</button>
      </form>
    </div>
  )
}
