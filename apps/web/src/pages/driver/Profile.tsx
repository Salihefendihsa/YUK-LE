import { useEffect, useState } from 'react'
import { PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function DriverProfilePage() {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 250)
    return () => clearTimeout(timer)
  }, [])
  if (loading) return <PageSkeleton rows={3} variant="card" />
  return (
    <div className="page-wrap">
      <h1 className="page-title">Şoför Profili</h1>
      <div className="card form-grid">
        <input className="form-input" placeholder="Ad Soyad" />
        <input className="form-input" placeholder="Telefon" />
        <input className="form-input" placeholder="E-posta" />
        <input className="form-input" placeholder="IBAN" />
        <input className="form-input" placeholder="Ehliyet Sınıfı" />
      </div>
      <div className="card">
        <h3>Belgeler</h3>
        <p className="muted">Ruhsat, SRC ve ehliyet durumlarını bu alandan takip edebilirsiniz.</p>
      </div>
    </div>
  )
}
