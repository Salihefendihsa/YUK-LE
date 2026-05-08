import { useEffect, useState } from 'react'
import { PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 250)
    return () => clearTimeout(timer)
  }, [])
  if (loading) return <PageSkeleton rows={3} variant="card" />
  return (
    <div className="page-wrap">
      <h1 className="page-title">Müşteri Profili</h1>
      <div className="card form-grid">
        <input className="form-input" placeholder="Ad Soyad" />
        <input className="form-input" placeholder="E-posta" />
        <input className="form-input" placeholder="Telefon" disabled value="5XX XXX XX XX" />
      </div>
      <div className="card form-grid">
        <input className="form-input" placeholder="Şirket Adı" />
        <input className="form-input" placeholder="Vergi Numarası" disabled />
        <input className="form-input" style={{ gridColumn: '1 / -1' }} placeholder="Şirket Adresi" />
      </div>
      <div className="card form-grid">
        <input className="form-input" type="password" placeholder="Mevcut Şifre" />
        <input className="form-input" type="password" placeholder="Yeni Şifre" />
        <input className="form-input" type="password" placeholder="Yeni Şifre Tekrar" />
      </div>
      <div className="card" style={{ borderColor: '#7f1d1d' }}>
        <button className="btn btn-danger">Hesabımı Sil</button>
      </div>
    </div>
  )
}
