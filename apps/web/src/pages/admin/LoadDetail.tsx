import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cancelAdminLoad, getAdminPayments } from '../../api/admin'
import { getBidsForLoad } from '../../api/bids'
import { getLoad } from '../../api/loads'
import type { Bid, Load } from '../../api/types'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { openConfirm } from '@/components/common/ConfirmModal'
import { toast } from '@/components/common/Toast'
import {
  formatBidStatusLabel,
  formatLoadStatusLabel,
  formatLoadTypeLabel,
  formatPaymentStatusLabel,
  formatVehicleTypeLabel,
} from '../../utils/displayLabels'
import { formatCurrencyTRY } from '../../utils/format'
import { formatDateTime } from '../../utils/formatters'
import { normalizeArray } from '../../utils/format'
import './AdminPanel.css'
import '../../styles/overlays.css'

export default function AdminLoadDetailPage() {
  const { id = '' } = useParams()
  const [load, setLoad] = useState<Load | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [payments, setPayments] = useState<Array<{ id: string; amount: number; status: string; createdAt: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const refresh = useCallback(async () => {
    if (!id) {
      setNotFound(true)
      return
    }
    setError('')
    setNotFound(false)
    const [loadData, bidData, allPayments] = await Promise.all([
      getLoad(id),
      getBidsForLoad(id),
      getAdminPayments(),
    ])
    setLoad(loadData)
    setBids(normalizeArray<Bid>(bidData))
    const payForLoad = allPayments.filter((p) => String(p.loadId) === String(id))
    setPayments(payForLoad)
  }, [id])

  useEffect(() => {
    setLoading(true)
    void refresh()
      .catch((e: unknown) => {
        const err = e as { response?: { status?: number }; uiMessage?: string }
        if (err.response?.status === 404) {
          setNotFound(true)
          return
        }
        setError(err.uiMessage ?? 'İlan detayı yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [refresh])

  const statusLabel = useMemo(() => (load ? formatLoadStatusLabel(load.status) : ''), [load])
  const routeLabel = load ? `${load.fromCity} ${load.fromDistrict} → ${load.toCity} ${load.toDistrict}` : ''
  const suggestedPrice = load?.aiSuggestedPrice ?? load?.price

  async function handleCancel() {
    const ok = await openConfirm({
      title: 'İlanı iptal et',
      description: 'Bu ilan iptal edilecek ve taraflar bilgilendirilecek.',
      variant: 'danger',
      irreversibleHint: true,
      confirmText: 'İlanı iptal et',
    })
    if (!ok || !id) return
    setCancelling(true)
    try {
      await cancelAdminLoad(id)
      toast.warning('İlan iptal edildi.')
      await refresh()
    } catch (e: unknown) {
      toast.error((e as { uiMessage?: string }).uiMessage ?? 'İptal işlemi başarısız.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <PageSkeleton rows={10} variant="card" />
  if (notFound) {
    return (
      <div className="admin-page">
        <PageEmpty
          icon="📦"
          title="İlan bulunamadı"
          description="Bu ilan mevcut değil veya görüntüleme yetkiniz yok."
          actionLabel="İlan listesine dön"
          onAction={() => {
            window.location.href = '/admin/loads'
          }}
        />
      </div>
    )
  }
  if (error) return <PageError message={error} onRetry={() => void refresh()} />
  if (!load) return null

  const canCancel = load.status !== 'Cancelled' && load.status !== 'Delivered'

  return (
    <div className="admin-page">
      <nav className="ad-load-breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/dashboard">Admin</Link>
        {' / '}
        <Link to="/admin/loads">İlanlar</Link>
        {' / '}
        <span>
          {load.fromCity} → {load.toCity}
        </span>
      </nav>

      <div className="item-row" style={{ flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <h1 className="admin-title mono-id" style={{ margin: 0, fontSize: 28 }}>
          {load.fromCity} → {load.toCity}
        </h1>
        <span className="ad-badge-pulse">{statusLabel}</span>
      </div>

      <div className="ad-load-grid">
        <div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>Yük bilgileri</h3>
            <p className="muted">
              Ağırlık: {load.weight.toLocaleString('tr-TR')} kg
              {load.loadType ? ` · Tip: ${formatLoadTypeLabel(load.loadType)}` : ''}
              {load.requiredVehicleType ? ` · Araç: ${formatVehicleTypeLabel(load.requiredVehicleType)}` : ''}
            </p>
            <p className="muted">Güzergah: {routeLabel}</p>
            <p className="muted">
              Yükleme: {formatDateTime(load.pickupDate)} — Teslim: {formatDateTime(load.deliveryDate)}
            </p>
            {load.description ? <p className="muted">{load.description}</p> : null}
          </div>
          <div className="admin-card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Özet</h3>
            <p className="muted">Teklif sayısı: {load.bidCount}</p>
            <p className="muted">Oluşturulma: {formatDateTime(load.createdAt)}</p>
          </div>
        </div>

        <div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>Müşteri</h3>
            <p>
              <Link to={`/admin/customers/${load.ownerId}`} style={{ fontWeight: 800, color: '#fecaca' }}>
                {load.ownerFullName || `Müşteri #${load.ownerId}`}
              </Link>
            </p>
          </div>
          <div className="admin-card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Şoför</h3>
            {load.driverId ? (
              <p>
                <Link to={`/admin/drivers/${load.driverId}`} style={{ fontWeight: 800, color: '#fecaca' }}>
                  Şoför #{load.driverId}
                </Link>
              </p>
            ) : (
              <p className="muted">Henüz atanmadı</p>
            )}
          </div>
          <div className="admin-card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Fiyat</h3>
            <p className="muted" style={{ marginBottom: 4 }}>
              Anlaşılan / ilan fiyatı
            </p>
            <p className="kpi-value" style={{ margin: '0 0 12px', fontSize: 32 }}>
              {formatCurrencyTRY(load.price)}
            </p>
            {suggestedPrice != null && suggestedPrice !== load.price ? (
              <>
                <p className="muted" style={{ marginBottom: 4 }}>
                  Önerilen fiyat
                </p>
                <p className="kpi-value" style={{ margin: 0, fontSize: 22, color: '#94a3b8' }}>
                  {formatCurrencyTRY(suggestedPrice)}
                </p>
              </>
            ) : null}
          </div>
          {payments.length > 0 ? (
            <div className="admin-card" style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Ödeme özeti</h3>
              {payments.map((p) => (
                <p key={p.id} className="muted" style={{ margin: '4px 0' }}>
                  {formatCurrencyTRY(p.amount)} — {formatPaymentStatusLabel(p.status)} ({formatDateTime(p.createdAt)})
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Tüm teklifler</h3>
        <div className="ad-data-table-wrap">
          {bids.length === 0 ? (
            <p className="muted" style={{ padding: 16 }}>
              Bu ilana ait teklif yok.
            </p>
          ) : (
            <table className="ad-data-table">
              <thead>
                <tr>
                  <th>Şoför</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((o) => (
                  <tr key={o.id}>
                    <td>{o.driverFullName || '—'}</td>
                    <td>{formatCurrencyTRY(o.amount)}</td>
                    <td>{formatBidStatusLabel(o.status)}</td>
                    <td>{formatDateTime(o.offerDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {canCancel ? (
        <div style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-danger" disabled={cancelling} onClick={() => void handleCancel()}>
            {cancelling ? 'İptal ediliyor…' : 'İlanı iptal et'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
