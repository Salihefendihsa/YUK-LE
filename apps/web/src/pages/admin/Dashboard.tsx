import { useEffect, useMemo, useState } from 'react'
import { getAdminDashboard } from '../../api/admin'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const load = () => getAdminDashboard()
      .then((dashboard) => setStats((dashboard as unknown) as Record<string, unknown>))
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Admin verileri yüklenemedi.'))
      .finally(() => setLoading(false))
    load()
    const timer = setInterval(() => { setNow(Date.now()); void load() }, 30000)
    return () => clearInterval(timer)
  }, [])

  const bars = useMemo(() => [35, 45, 50, 42, 58, 61, 49], [now])

  if (loading) return <PageSkeleton rows={5} variant="card" />

  const kpis = [
    { label: 'Toplam Kullanıcı', value: Number(stats.totalUsers ?? 0) },
    { label: 'Aktif İlan Sayısı', value: Number(stats.activeLoadCount ?? 0), badge: 'Bugün oluşturulan' },
    { label: 'Bekleyen Belge Onayı', value: Number(stats.pendingReviewCount ?? 0), badge: 'Kritik', danger: true },
    { label: 'Toplam İşlem Hacmi', value: `₺${Number(stats.totalTransactionVolume ?? 0).toFixed(2)}` },
  ]
  const kpis2 = [
    { label: 'Bugün Tamamlanan Sefer', value: Number(stats.deliveredTodayCount ?? 0) },
    { label: 'Aktif Sefer', value: Number(stats.onWayCount ?? 0) },
    { label: 'Bu Ay Komisyon Geliri', value: `₺${Number(stats.monthlyCommission ?? 0).toFixed(2)}` },
    { label: 'Ortalama Teslimat Süresi', value: `${Number(stats.avgDeliveryHours ?? 0).toFixed(1)} saat` },
  ]
  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Admin Paneli</h1>
          <p className="admin-sub">Canlı operasyon merkezi, otomatik 30 saniyede bir yenilenir.</p>
        </div>
        <a href="/admin/reviews" className="btn btn-danger">Belge Kuyruğunu Aç</a>
      </div>
      {error ? <PageError message={error} /> : null}

      <div className="kpi-grid">
        {kpis.map((s) => (
          <div key={s.label} className="admin-card">
            <div className="item-row">
              <span className="kpi-label">{s.label}</span>
              {s.badge ? <span className="admin-badge">{s.badge}</span> : null}
            </div>
            <div className={`kpi-value ${s.danger ? 'danger' : ''}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="kpi-grid">
        {kpis2.map((s) => (
          <div key={s.label} className="admin-card">
            <div className="kpi-label">{s.label}</div>
            <div className="kpi-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Son 7 Günlük İlan Grafiği</h3>
          <div className="admin-chart">
            {bars.map((h, i) => <div key={i} className="admin-bar" style={{ height: `${h * 2}px` }} />)}
          </div>
        </div>
        <div className="admin-card">
          <h3>Rol Dağılımı & Güzergahlar</h3>
          <p className="muted">Müşteri: {Number(stats.customerCount ?? 0)} | Şoför: {Number(stats.driverCount ?? 0)}</p>
          <p className="muted" style={{ marginTop: 8 }}>İzmir → İstanbul: 42</p>
          <p className="muted">Ankara → Bursa: 31</p>
          <p className="muted">Mersin → Konya: 27</p>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Canlı Aktivite Akışı</h3>
          {((stats.recentActions as Array<Record<string, unknown>> | undefined) ?? []).slice(0, 20).map((a) => (
            <div key={String(a.id)} className="item-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
              <span className="mono muted">{new Date(String(a.timestampUtc)).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>{String(a.note ?? a.action ?? 'Aksiyon')}</span>
            </div>
          ))}
          {(((stats.recentActions as Array<Record<string, unknown>> | undefined) ?? []).length === 0) ? (
            <PageEmpty icon="🛰️" title="Aktivite bulunamadı" description="Yeni aktiviteler burada canlı akışta görünecek." actionLabel="Yenile" onAction={() => window.location.reload()} />
          ) : null}
        </div>
        <div className="admin-card">
          <h3>Bekleyen Uyarılar</h3>
          <p className="danger">🟨 Onay bekleyen belgeler: {Number(stats.pendingReviewCount ?? 0)}</p>
          <p className="danger">🟧 24 saattir teklif almayan ilanlar: {Number(stats.idleLoadsCount ?? 0)}</p>
          <p className="danger">🟥 Şikayetler: {Number(stats.complaintCount ?? 0)}</p>
          <p className="danger">🟥 Başarısız ödemeler: {Number(stats.failedPaymentCount ?? 0)}</p>
        </div>
      </div>
    </div>
  )
}
