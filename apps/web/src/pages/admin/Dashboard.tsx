import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminDashboard } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './Dashboard.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminDashboard()
      .then((dashboard) => setStats((dashboard as unknown) as Record<string, unknown>))
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
          { label: 'Toplam Kullanıcı', value: Number(stats.totalUsers ?? 0), icon: '👥', color: 'var(--color-brand)' },
          { label: 'Aktif İlanlar', value: Number(stats.activeLoadCount ?? 0), icon: '📦', color: 'var(--color-info)' },
          { label: 'Bekleyen Belge Onayı', value: Number(stats.pendingReviewCount ?? 0), icon: '📄', color: 'var(--color-danger)' },
          { label: 'Toplam İşlem Hacmi', value: `${Number(stats.totalTransactionVolume ?? 0).toFixed(2)} ₺`, icon: '💳', color: 'var(--color-success)' },
        ].map((s) => (
          <div key={s.label} className="stat-card card">
            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <p className="stat-value">{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Sistem Durumu</h3>
        <p>API: {String((stats.systemStatus as Record<string, string> | undefined)?.api ?? '-')}</p>
        <p>DB: {String((stats.systemStatus as Record<string, string> | undefined)?.db ?? '-')}</p>
        <p>Redis: {String((stats.systemStatus as Record<string, string> | undefined)?.redis ?? '-')}</p>
      </div>
    </div>
  )
}
