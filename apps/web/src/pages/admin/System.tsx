import { useEffect, useState } from 'react'
import { getAdminSystemStatus } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import {
  formatExternalEnvironmentLabel,
  formatExternalFrameworkLabel,
  formatExternalStatusMessage,
} from '../../utils/apiErrors'
import { formatSystemServiceLabel } from '../../utils/displayLabels'
import './AdminPanel.css'

export default function AdminSystemPage() {
  const [status, setStatus] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = () =>
      getAdminSystemStatus()
        .then(setStatus)
        .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Sistem durumu alınamadı.'))
        .finally(() => setLoading(false))
    load()
    const timer = setInterval(() => {
      void load()
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  if (loading) return <PageSkeleton rows={4} />

  const workers = status.workers as { uetdsPending?: number } | undefined
  const external = status.external as Record<string, unknown> | undefined

  return (
    <div className="admin-page">
      <h1 className="admin-title">Sistem Durumu</h1>
      {error ? <PageError message={error} /> : null}

      <div className="kpi-grid">
        <div className="admin-card">
          <h3>API Servisi</h3>
          <p>Durum: {formatSystemServiceLabel(status.api)}</p>
        </div>
        <div className="admin-card">
          <h3>Veritabanı</h3>
          <p>Durum: {formatSystemServiceLabel(status.db)}</p>
        </div>
        <div className="admin-card">
          <h3>Önbellek</h3>
          <p>Durum: Devre dışı</p>
          <p className="muted">Canlı ortamda etkin olacak.</p>
        </div>
      </div>

      <div className="admin-card">
        <h3>Arka plan görevleri</h3>
        <p>Yakıt fiyatı görevi: Son çalışma 10 dk önce</p>
        <p>U-ETDS görevi: Kuyruk {String(workers?.uetdsPending ?? 0)}</p>
        <p>Belge temizleme: Son çalışma 1 saat önce</p>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Ek sistem metrikleri bu sürümde gösterilmez.
        </p>
      </div>

      {external ? (
        <div className="admin-card">
          <h3>Sunucu durumu</h3>
          <p>{formatExternalStatusMessage(String(external.message ?? ''))}</p>
          <p className="muted">Ortam: {formatExternalEnvironmentLabel(String(external.environment ?? ''))}</p>
          <p className="muted">Sunucu: {formatExternalFrameworkLabel(String(external.framework ?? ''))}</p>
        </div>
      ) : null}
    </div>
  )
}
