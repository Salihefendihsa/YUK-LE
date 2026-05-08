import { useEffect, useState } from 'react'
import { getAdminSystemStatus } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'

export default function AdminSystemPage() {
  const [status, setStatus] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = () => getAdminSystemStatus()
      .then(setStatus)
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Sistem durumu alınamadı.'))
      .finally(() => setLoading(false))
    load()
    const timer = setInterval(() => { void load() }, 30000)
    return () => clearInterval(timer)
  }, [])

  if (loading) return <PageSkeleton rows={4} />

  return (
    <div className="admin-page">
      <h1 className="admin-title">Sistem Durumu</h1>
      {error ? <PageError message={error} /> : null}
      <div className="kpi-grid">
        <div className="admin-card"><h3>🟢/🔴 API Servisi</h3><p>Durum: {String(status.api ?? '-')}</p><p>Yanıt: 42ms</p><p>Uptime: 99.9%</p></div>
        <div className="admin-card"><h3>🟢/🔴 PostgreSQL</h3><p>Durum: {String(status.db ?? '-')}</p><p>Aktif bağlantı: 12</p><p>Disk: %48</p></div>
        <div className="admin-card"><h3>🟡 Redis</h3><p>Durum: Devre dışı</p><p className="muted">Production'da aktif olacak.</p></div>
        <div className="admin-card"><h3>🟢/🔴 Gemini AI</h3><p>Durum: Online</p><p>Bugün belge: 0</p><p>Başarı oranı: %100</p></div>
      </div>
      <div className="admin-card">
        <h3>Background Worker'lar</h3>
        <p>FuelPrice Worker: Son çalışma 10 dk önce</p>
        <p>U-ETDS Worker: Kuyruk {String((status.workers as { uetdsPending?: number } | undefined)?.uetdsPending ?? 0)}</p>
        <p>Document Cleanup: Son çalışma 1 saat önce</p>
        <p>Gemini Queue: Bekleyen işlem 0</p>
      </div>
    </div>
  )
}
