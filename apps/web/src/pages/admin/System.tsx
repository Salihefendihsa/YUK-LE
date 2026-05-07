import { useEffect, useState } from 'react'
import { getAdminSystemStatus } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function AdminSystemPage() {
  const [status, setStatus] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminSystemStatus()
      .then(setStatus)
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Sistem durumu alınamadı.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={4} />

  return (
    <div className="page-wrap">
      <h1 className="page-title">Sistem Durumu</h1>
      {error ? <PageError message={error} /> : null}
      <div className="card">
        <p>API: {String(status.api ?? '-')}</p>
        <p>Veritabanı: {String(status.db ?? '-')}</p>
        <p>Background Worker (U-ETDS Pending): {String((status.workers as { uetdsPending?: number } | undefined)?.uetdsPending ?? 0)}</p>
      </div>
    </div>
  )
}
