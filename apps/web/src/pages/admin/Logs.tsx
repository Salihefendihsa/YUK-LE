import { useEffect, useState } from 'react'
import { getAdminLogs } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Array<Record<string, string | number>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminLogs()
      .then(setLogs)
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Loglar yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="page-wrap">
      <h1 className="page-title">Sistem Logları</h1>
      {error ? <PageError message={error} /> : null}
      <div className="list-grid">
        {logs.map((log) => (
          <div key={String(log.id)} className="item-card">
            <strong>{String(log.action)}</strong>
            <p className="muted">Admin: {String(log.adminId)} | Hedef: {String(log.targetUserId)}</p>
            <p className="muted">{String(log.note ?? '')}</p>
            <p className="muted">{String(log.timestampUtc)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
