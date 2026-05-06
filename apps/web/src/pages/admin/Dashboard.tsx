import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/dashboard'
import { getPendingReviews } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './Dashboard.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getDashboard(), getPendingReviews()])
      .then(([dashboard, pending]) => {
        setStats((dashboard as unknown) as Record<string, number>)
        setPendingCount(pending.length)
      })
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Admin verileri yuklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={5} />

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-sub">Sistem durum ozeti</p>
        </div>
        <Link to="/admin/reviews" className="btn btn-primary">Belge Inceleme</Link>
      </div>
      {error ? <PageError message={error} /> : null}

      <div className="stat-grid">
        {[
          { label: 'Aktif Ilanlar', value: stats.activeLoadCount ?? 0, icon: '📦', color: 'var(--color-brand)' },
          { label: 'Yolda', value: stats.onWayLoadCount ?? 0, icon: '🚛', color: 'var(--color-info)' },
          { label: 'Teslim', value: stats.deliveredLoadCount ?? 0, icon: '✅', color: 'var(--color-success)' },
          { label: 'Bekleyen Belgeler', value: pendingCount, icon: '📄', color: 'var(--color-warning)' },
        ].map((s) => (
          <div key={s.label} className="stat-card card">
            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <p className="stat-value">{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
