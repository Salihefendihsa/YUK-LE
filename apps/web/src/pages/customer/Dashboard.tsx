import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomerDashboard } from '../../api/dashboard'
import { getActiveLoads, getCustomerLoadHistory } from '../../api/loads'
import { getUserRatings } from '../../api/ratings'
import { useAuthStore } from '../../store/auth.store'
import type { CustomerDashboard as Stats, Load } from '../../api/types'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatCurrencyTRY, formatDateTR, normalizeArray } from '../../utils/format'
import { formatLoadStatusLabel, getLoadStatusBadgeClass } from '../../utils/displayLabels'
import './Dashboard.css'

type WeekStats = { newLoads: number; completed: number; spend: number }
type MonthDatum = { label: string; value: number }
type TopDriver = { name: string; trips: number }
type RatingSummary = { average: number; count: number }

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

/** Bu hafta = son 7 gün (rolling). Yeni ilan: ilan listesi createdAt; tamamlanan/harcama: HISTORY deliveryDate (mobil ile aynı kaynak). */
function computeWeekStats(
  loads: Load[],
  historyItems: { deliveryDate?: string | null; price: number }[],
): WeekStats {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  // Yeni ilan: aktif/tüm ilan listesinden createdAt son 7 gün.
  let newLoads = 0
  for (const l of loads) {
    const created = Date.parse(l.createdAt)
    if (!Number.isNaN(created) && created >= weekAgo) newLoads += 1
  }
  // Tamamlanan + harcama: HISTORY (yalnız Delivered) deliveryDate son 7 gün.
  // Aktif liste teslimleri taşımayabilir; bu yüzden history kullanılır.
  let completed = 0
  let spend = 0
  for (const h of historyItems) {
    if (!h.deliveryDate) continue
    const delivered = Date.parse(h.deliveryDate)
    if (!Number.isNaN(delivered) && delivered >= weekAgo) {
      completed += 1
      spend += h.price ?? 0
    }
  }
  return { newLoads, completed, spend }
}

/** Son 6 ay, teslim edilen ilan SAYISI. Bucket = deliveryDate. (mobil ile aynı) */
function computeMonthlyActivity(rows: { deliveryDate?: string | null }[]): MonthDatum[] {
  const now = new Date()
  const buckets = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS_TR[d.getMonth()], value: 0 }
  })
  const indexByKey = new Map(buckets.map((b, i) => [b.key, i]))
  for (const r of rows) {
    if (!r.deliveryDate) continue
    const d = new Date(r.deliveryDate)
    if (Number.isNaN(d.getTime())) continue
    const idx = indexByKey.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (idx !== undefined) buckets[idx].value += 1
  }
  return buckets.map((b) => ({ label: b.label, value: b.value }))
}

/** Sık çalışılan şoförler: history (Delivered) satırlarını driverName'e göre grupla, ilk 3. (mobil ile aynı) */
function computeTopDrivers(rows: { driverName?: string | null }[]): TopDriver[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const name = r.driverName?.trim()
    if (!name) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, trips]) => ({ name, trips }))
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 3)
}

export default function CustomerDashboard() {
  const userId = useAuthStore((s) => s.user?.userId)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loads, setLoads] = useState<Load[]>([])
  const [weekStats, setWeekStats] = useState<WeekStats>({ newLoads: 0, completed: 0, spend: 0 })
  const [monthly, setMonthly] = useState<MonthDatum[]>([])
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([])
  const [rating, setRating] = useState<RatingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getCustomerDashboard(),
      getActiveLoads(),
      getCustomerLoadHistory(1, 100),
      userId ? getUserRatings(userId) : Promise.resolve(null),
    ])
      .then(([dashboardData, activeLoads, history, ratingData]) => {
        setStats(dashboardData)
        const list = normalizeArray<Load>(activeLoads)
        setLoads(list.slice(0, 5))
        const historyItems = history?.items ?? []
        setWeekStats(computeWeekStats(list, historyItems))
        setMonthly(computeMonthlyActivity(historyItems))
        setTopDrivers(computeTopDrivers(historyItems))
        const r = ratingData as { average?: number; count?: number } | null
        setRating(r ? { average: Number(r.average ?? 0), count: Number(r.count ?? 0) } : null)
      })
      .catch((e: { uiMessage?: string }) => {
        setError(e.uiMessage ?? 'Dashboard verileri yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [userId])

  const maxMonthly = Math.max(1, ...monthly.map((m) => m.value))
  const hasMonthly = monthly.some((m) => m.value > 0)

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
                      <span className={getLoadStatusBadgeClass(load.status)}>
                        {formatLoadStatusLabel(load.status)}
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
          <h3>Aylık aktivite</h3>
          <p className="page-sub" style={{ marginBottom: 12 }}>
            Son 6 ayda teslim edilen ilan sayısı
          </p>
          {hasMonthly ? (
            <>
              <div className="panel-spark-bars">
                {monthly.map((m, i) => (
                  <div
                    key={i}
                    className="panel-spark-bar"
                    style={{ height: `${m.value === 0 ? 6 : Math.round(20 + (m.value / maxMonthly) * 80)}%` }}
                    title={`${m.label}: ${m.value} teslim`}
                  />
                ))}
              </div>
              <div className="panel-spark-labels">
                {monthly.map((m, i) => (
                  <span key={i}>{m.label}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>
              Yeterli geçmiş yok
            </p>
          )}
        </div>
      </div>

      <div className="dashboard-widgets">
        <div className="card dash-widget">
          <h3>📊 Bu hafta</h3>
          <ul className="dash-widget-list">
            <li>
              <span>Yeni ilan</span>
              <strong>{weekStats.newLoads}</strong>
            </li>
            <li>
              <span>Tamamlanan</span>
              <strong>{weekStats.completed}</strong>
            </li>
            <li>
              <span>Toplam harcama</span>
              <strong>{formatCurrencyTRY(weekStats.spend)}</strong>
            </li>
          </ul>
        </div>
        <div className="card dash-widget">
          <h3>🏆 Favori şoförlerim</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            En çok çalıştığınız 3 şoför
          </p>
          {topDrivers.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              Henüz şoförle çalışmadın
            </p>
          ) : (
            <ol className="dash-widget-ol">
              {topDrivers.map((d) => (
                <li key={d.name}>
                  {d.name} — {d.trips} sefer
                </li>
              ))}
            </ol>
          )}
          <Link to="/customer/loads/create" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
            Hızlı ilan
          </Link>
        </div>
        <div className="card dash-widget">
          <h3>💡 Akıllı öneriler</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                marginRight: 8,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--color-brand)',
              }}
            >
              Yakında
            </span>
            Yapay zekâ destekli rota ve fiyat önerileri yakında.
          </p>
        </div>
        <div className="card dash-widget">
          <h3>📈 Performans skorum</h3>
          {rating && rating.count > 0 ? (
            <>
              <p style={{ fontSize: 36, fontWeight: 800, margin: '4px 0', color: 'var(--color-brand)' }}>
                {rating.average.toFixed(1)}
              </p>
              <p className="muted" style={{ fontSize: 13 }}>
                {rating.count} değerlendirme
              </p>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              Henüz değerlendirme yok
            </p>
          )}
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
    <div className="stat-card kpi-card card">
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
