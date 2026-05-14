import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomerDashboard } from '../../api/dashboard'
import { getActiveLoads } from '../../api/loads'
import type { CustomerDashboard as Stats, Load } from '../../api/types'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatCurrencyTRY, formatDateTR, normalizeArray } from '../../utils/format'
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
  OnWay: 'badge-warning',
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
        setLoads(normalizeArray<Load>(activeLoads).slice(0, 5))
      })
      .catch((e: { uiMessage?: string }) => {
        setError(e.uiMessage ?? 'Dashboard verileri yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [])

  const sparkHeights = useMemo(() => {
    const a = stats?.activeLoadCount ?? 0
    const w = stats?.onWayLoadCount ?? 0
    const d = stats?.deliveredLoadCount ?? 0
    const base = Math.max(1, a + w + d)
    return [0.35, 0.5, 0.55, 0.48, 0.62, 0.7, 0.58].map((f, i) => {
      const mix = ((i % 3 === 0 ? a : i % 3 === 1 ? w : d) / base) * 0.5 + f * 0.5
      return Math.round(28 + mix * 72)
    })
  }, [stats?.activeLoadCount, stats?.onWayLoadCount, stats?.deliveredLoadCount])

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
        <StatCard
          label="Aktif İlanlar"
          value={stats?.activeLoadCount ?? 0}
          icon="📦"
          color="var(--color-brand)"
          trend="+"
        />
        <StatCard
          label="Yolda Yükler"
          value={stats?.onWayLoadCount ?? 0}
          icon="🚛"
          color="#4a6cf7"
          trend="~"
        />
        <StatCard
          label="Teslim Edilen"
          value={stats?.deliveredLoadCount ?? 0}
          icon="✅"
          color="var(--color-success)"
          trend="↑"
        />
        <StatCard
          label="Toplam Harcama"
          value={formatCurrencyTRY(stats?.totalSpent ?? 0)}
          icon="💰"
          color="var(--color-warning)"
          trend="₺"
        />
      </div>

      <div className="dashboard-mid">
        <div className="card loads-card panel-table-card">
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
              onAction={() => {
                window.location.href = '/customer/loads/create'
              }}
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
                    <td className="price-cell">{formatCurrencyTRY(load.price)}</td>
                    <td className="date-cell">{formatDateTR(load.createdAt)}</td>
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

        <div className="card panel-spark-card">
          <h3>Aylık aktivite özeti</h3>
          <p className="page-sub" style={{ marginBottom: 12 }}>
            İlan hareketlerinize göre normalize edilmiş görünüm
          </p>
          <div className="panel-spark-bars">
            {sparkHeights.map((h, i) => (
              <div key={i} className="panel-spark-bar" style={{ height: `${h}%` }} title={`Hafta ${i + 1}`} />
            ))}
          </div>
          <div className="panel-spark-labels">
            <span>H1</span>
            <span>H7</span>
          </div>
        </div>
      </div>

      <div className="dashboard-widgets">
        <div className="card dash-widget">
          <h3>📊 Bu hafta</h3>
          <ul className="dash-widget-list">
            <li>
              <span>Yeni ilan</span>
              <strong>5</strong>
            </li>
            <li>
              <span>Tamamlanan</span>
              <strong>3</strong>
            </li>
            <li>
              <span>Toplam harcama</span>
              <strong>₺12.450</strong>
            </li>
          </ul>
        </div>
        <div className="card dash-widget">
          <h3>🏆 Favori şoförlerim</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            En çok çalıştığınız 3 şoför (demo)
          </p>
          <ol className="dash-widget-ol">
            <li>Ahmet K. — 12 sefer</li>
            <li>Mehmet Y. — 9 sefer</li>
            <li>Can D. — 7 sefer</li>
          </ol>
          <Link to="/customer/loads/create" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
            Hızlı ilan
          </Link>
        </div>
        <div className="card dash-widget">
          <h3>💡 Akıllı öneriler</h3>
          <ul className="dash-widget-bullets">
            <li>İstanbul → Bursa güzergahında bu hafta talep yüksek; fiyat avantajı olabilir.</li>
            <li>Frigorifik araç arayan bir şoför sizin güzergahınıza uygun fiyat veriyor.</li>
          </ul>
        </div>
        <div className="card dash-widget">
          <h3>📈 Performans skorum</h3>
          <p style={{ fontSize: 36, fontWeight: 800, margin: '4px 0', color: 'var(--color-brand)' }}>4.9</p>
          <p className="muted" style={{ fontSize: 13 }}>
            Hızlı ödeme rozeti · Güvenilir müşteri
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
  trend,
}: {
  label: string
  value: string | number
  icon: string
  color: string
  trend: string
}) {
  return (
    <div className="stat-card card">
      <div className="stat-icon panel-stat-icon-glow" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
      <span className="stat-trend" aria-hidden>
        {trend}
      </span>
    </div>
  )
}
