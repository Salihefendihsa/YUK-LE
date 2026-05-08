import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomerDashboard } from '../../api/dashboard'
import { getActiveLoads } from '../../api/loads'
import type { CustomerDashboard as Stats, Load } from '../../api/types'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import './Dashboard.css'

const STATUS_LABEL: Record<string, string> = {
  Active: 'Aktif',
  Assigned: 'Atandı',
  OnWay: 'Yolda',
  Delivered: 'Teslim',
  Cancelled: 'İptal',
}

const STATUS_CLASS: Record<string, string> = {
  Active: 'badge-success',
  Assigned: 'badge-info',
  OnWay: 'badge-info',
  Delivered: 'badge-muted',
  Cancelled: 'badge-error',
}

export default function CustomerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getCustomerDashboard(), getActiveLoads()])
      .then(([dashboardData, activeLoads]) => {
        setStats(dashboardData)
        setLoads(activeLoads.slice(0, 5))
      })
      .catch((e: { uiMessage?: string }) => {
        setError(e.uiMessage ?? 'Dashboard verileri yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <PageSkeleton rows={6} variant="table" />
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Müşteri Paneli</h1>
          <p className="page-sub">Canlı istatistikler ve son ilanlar</p>
        </div>
        <Link to="/customer/loads/create" className="btn btn-primary">
          + İlan Oluştur
        </Link>
      </div>

      {error ? <PageError message={error} /> : null}

      <div className="stat-grid">
        <StatCard label="Aktif İlanlar" value={stats?.activeLoadCount ?? 0} icon="📦" color="var(--color-brand)" />
        <StatCard label="Yolda Yükler" value={stats?.onWayLoadCount ?? 0} icon="🚛" color="var(--color-info)" />
        <StatCard label="Teslim Edilen" value={stats?.deliveredLoadCount ?? 0} icon="✅" color="var(--color-success)" />
        <StatCard
          label="Toplam Harcama"
          value={`₺${(stats?.totalSpent ?? 0).toLocaleString('tr-TR')}`}
          icon="💰"
          color="var(--color-warning)"
        />
      </div>

      <div className="card loads-card">
        <div className="card-header">
          <h2>Son İlanlar</h2>
          <Link to="/customer/loads" className="view-all">
            Tümünü Gör
          </Link>
        </div>

        {loads.length === 0 ? (
          <PageEmpty
            icon="📭"
            title="Aktif ilan bulunamadı"
            description="Yeni bir ilan oluşturduğunuzda burada listelenecek."
            actionLabel="İlan Oluştur"
            onAction={() => { window.location.href = '/customer/loads/create' }}
          />
        ) : (
          <table className="loads-table">
            <thead>
              <tr>
                <th>Güzergah</th>
                <th>Durum</th>
                <th>Fiyat</th>
                <th>Tarih</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loads.map((load) => (
                <tr key={load.id}>
                  <td className="route-cell">
                    <span className="city">{load.fromCity}</span>
                    <span className="arrow">→</span>
                    <span className="city">{load.toCity}</span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[load.status] ?? 'badge-muted'}`}>
                      {STATUS_LABEL[load.status] ?? load.status}
                    </span>
                  </td>
                  <td className="price-cell">₺{load.price.toLocaleString('tr-TR')}</td>
                  <td className="date-cell">{new Date(load.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <Link to={`/customer/loads/${load.id}`} className="btn btn-ghost btn-sm">
                      Detay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="stat-card card">
      <div className="stat-icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  )
}
