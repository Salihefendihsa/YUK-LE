import { useEffect, useState } from 'react'
import { getAdminLogs } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'

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

  if (loading) return <PageSkeleton rows={8} />

  return (
    <div className="admin-page">
      <h1 className="admin-title">Sistem Logları</h1>
      {error ? <PageError message={error} /> : null}
      <div className="admin-filters">
        <input className="form-input" type="date" />
        <input className="form-input" type="date" />
        <select className="form-input"><option>Tümü</option><option>Onay</option><option>Red</option><option>İptal</option><option>Askıya Al</option></select>
        <input className="form-input" placeholder="Admin adı" />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Zaman</th><th>Admin</th><th>İşlem</th><th>Hedef</th><th>Detay</th><th>IP</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={String(log.id)}>
                <td>{new Date(String(log.timestampUtc)).toLocaleString('tr-TR')}</td>
                <td>#{String(log.adminId)}</td>
                <td>{String(log.action)}</td>
                <td>{String(log.targetUserId)}</td>
                <td>{String(log.note ?? '')}</td>
                <td className="mono">127.0.0.1</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {logs.length === 0 ? <div className="admin-card empty-state">📋 Log kaydı bulunamadı.</div> : null}
    </div>
  )
}
