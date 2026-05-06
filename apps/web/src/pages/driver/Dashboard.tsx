import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDriverDashboard } from '../../api/dashboard'
import { getRecommendedLoads } from '../../api/matching'
import type { DriverDashboard as Stats, MatchedLoad } from '../../api/types'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './Dashboard.css'

export default function DriverDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recommended, setRecommended] = useState<MatchedLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getDriverDashboard(), getRecommendedLoads()])
      .then(([dashboardData, recLoads]) => {
        setStats(dashboardData)
        setRecommended(recLoads)
      })
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Surucu dashboard verileri yuklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Sofor Dashboard</h1>
          <p className="page-sub">Istatistikler ve AI onerilen yukler</p>
        </div>
        <Link to="/driver/loads" className="btn btn-secondary">
          Yuk Panosu
        </Link>
      </div>
      {error ? <PageError message={error} /> : null}

      <div className="stat-grid">
        {[
          { label: 'Aktif Teklif', value: stats?.activeOffersCount ?? 0, icon: '💼', color: 'var(--color-brand)' },
          { label: 'Tamamlanan Sefer', value: stats?.completedLoadsCount ?? 0, icon: '✅', color: 'var(--color-success)' },
          { label: 'Toplam Kazanc', value: `₺${(stats?.totalEarned ?? 0).toLocaleString('tr-TR')}`, icon: '💰', color: 'var(--color-warning)' },
          { label: 'Degerlendirme', value: `⭐ ${stats?.rating?.toFixed(1) ?? '0.0'}`, icon: '⭐', color: 'var(--color-ai)' },
        ].map((s) => (
          <div key={s.label} className="stat-card card">
            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <p className="stat-value">{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>AI Onerilen Yukler</h2>
        </div>
        <div className="driver-loads">
          {recommended.map((row) => (
            <DriverLoadCard key={row.load.id} row={row} />
          ))}
          {recommended.length === 0 ? <p className="page-sub">Uygun AI onerisi bulunamadi.</p> : null}
        </div>
      </div>
    </div>
  )
}

function DriverLoadCard({ row }: { row: MatchedLoad }) {
  const load = row.load

  return (
    <div className="driver-load-card ai-highlighted">
      <Link to={`/driver/loads/${load.id}`} className="ai-badge">
        Detay
      </Link>
      <div className="driver-load-body">
        <div className="ai-badge">
          <span>✨</span> AI Uyum Skoru: %{row.match.matchScore}
        </div>
        <div className="driver-load-route">
          <div className="route-point origin">
            <span className="route-dot origin-dot" />
            <span>{load.fromCity}</span>
          </div>
          <div className="route-line">
            <span className="distance-label">{row.match.priorityTag}</span>
          </div>
          <div className="route-point">
            <span className="route-dot dest-dot" />
            <span>{load.toCity}</span>
          </div>
        </div>
        <div className="driver-load-footer" style={{ marginTop: 10 }}>
          <strong>₺{load.price.toLocaleString('tr-TR')}</strong>
          <span className="page-sub">{row.match.personalizedReason}</span>
        </div>
      </div>
    </div>
  )
}
