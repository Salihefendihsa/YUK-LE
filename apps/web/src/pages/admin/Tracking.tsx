import { useEffect, useState } from 'react'
import { PageEmpty, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'

export default function AdminTrackingPage() {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])
  if (loading) return <PageSkeleton rows={5} variant="card" />
  return (
    <div className="admin-page">
      <h1 className="admin-title">Canlı Şoför Konum Takibi</h1>
      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Harita</h3>
          <PageEmpty icon="🗺️" title="Canlı konum akışı bekleniyor" description="Aktif sefer başladığında şoförler bu harita üzerinde izlenecek." actionLabel="Yenile" onAction={() => window.location.reload()} />
        </div>
        <div className="admin-card">
          <h3>Aktif Seferler</h3>
          <PageEmpty icon="📡" title="Aktif sefer bulunamadı" description="Şu an takip edilecek bir şoför yok." actionLabel="Yenile" onAction={() => window.location.reload()} />
        </div>
      </div>
    </div>
  )
}
