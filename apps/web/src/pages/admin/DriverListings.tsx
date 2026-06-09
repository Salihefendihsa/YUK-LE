import { Fragment, useCallback, useEffect, useState } from 'react'

import {
  cancelAdminDriverListing,
  getAdminDriverListingOffers,
  getAdminDriverListings,
  type AdminDriverListingRow,
  type AdminListingOfferRow,
} from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import { toast } from '../../components/common/Toast'
import { formatCurrencyTRY } from '../../utils/format'
import './AdminPanel.css'

const STATUS_SEGMENTS: { value: string; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'Active', label: 'Yayında' },
  { value: 'Matched', label: 'Eşleşti' },
  { value: 'Cancelled', label: 'İptal' },
  { value: 'Expired', label: 'Süresi doldu' },
]

const LISTING_STATUS_LABEL: Record<string, string> = {
  Active: 'Yayında',
  Matched: 'Eşleşti',
  Cancelled: 'İptal edildi',
  Expired: 'Süresi doldu',
}

const OFFER_STATUS_LABEL: Record<string, string> = {
  Pending: 'Beklemede',
  Accepted: 'Kabul edildi',
  Rejected: 'Reddedildi',
  Withdrawn: 'Geri çekildi',
}

function listingStatusClass(status: string): string {
  switch (status) {
    case 'Active':
      return 'badge badge-info'
    case 'Matched':
      return 'badge badge-success'
    default:
      return 'badge badge-muted'
  }
}

function offerStatusClass(status: string): string {
  switch (status) {
    case 'Pending':
      return 'badge badge-warning'
    case 'Accepted':
      return 'badge badge-success'
    case 'Rejected':
      return 'badge badge-error'
    default:
      return 'badge badge-muted'
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('tr-TR')
}

export default function AdminDriverListingsPage() {
  const [rows, setRows] = useState<AdminDriverListingRow[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Genişleyen teklifler
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [offersById, setOffersById] = useState<Record<string, AdminListingOfferRow[]>>({})
  const [offersLoadingId, setOffersLoadingId] = useState<string | null>(null)
  const [offersError, setOffersError] = useState<Record<string, string>>({})

  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const loadData = useCallback(async (st: string) => {
    setError('')
    const data = await getAdminDriverListings(st || undefined)
    setRows(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    setLoading(true)
    loadData(status)
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'İlanlar yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [status, loadData])

  async function fetchOffers(id: string) {
    setOffersLoadingId(id)
    setOffersError((p) => ({ ...p, [id]: '' }))
    try {
      const data = await getAdminDriverListingOffers(id)
      setOffersById((p) => ({ ...p, [id]: Array.isArray(data) ? data : [] }))
    } catch (e) {
      setOffersError((p) => ({
        ...p,
        [id]: (e as { uiMessage?: string }).uiMessage ?? 'Teklifler yüklenemedi.',
      }))
    } finally {
      setOffersLoadingId(null)
    }
  }

  function toggleOffers(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (!offersById[id]) void fetchOffers(id)
  }

  async function handleCancel(id: string) {
    if (!window.confirm('Bu ilanı kaldırmak istediğinize emin misiniz? Bekleyen teklifler reddedilir.'))
      return
    setCancellingId(id)
    try {
      const res = await cancelAdminDriverListing(id)
      // Canlı güncelleme: ilan İptal, yüklü teklifler Reddedildi.
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Cancelled' } : r)))
      setOffersById((prev) =>
        prev[id]
          ? {
              ...prev,
              [id]: prev[id].map((o) => (o.status === 'Pending' ? { ...o, status: 'Rejected' } : o)),
            }
          : prev,
      )
      toast.success(`İlan kaldırıldı, ${res.rejectedOffers} teklif reddedildi.`)
    } catch (e) {
      toast.error((e as { uiMessage?: string }).uiMessage ?? 'İlan kaldırılamadı.')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) return <PageSkeleton rows={8} />

  return (
    <div className="admin-page">
      <h1 className="admin-title">Boş Araç İlanları</h1>
      {error ? <PageError message={error} /> : null}

      <div className="admin-segment" role="tablist" aria-label="Duruma göre filtrele">
        {STATUS_SEGMENTS.map((s) => (
          <button
            key={s.value}
            type="button"
            role="tab"
            aria-selected={status === s.value}
            className={`admin-seg-btn ${status === s.value ? 'active' : ''}`}
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Rota</th>
              <th>Şoför</th>
              <th>Araç</th>
              <th>Müsait</th>
              <th>Durum</th>
              <th>Teklif</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td>
                    {r.originCity} → {r.destinationCity}
                  </td>
                  <td>{r.driverName || '-'}</td>
                  <td>{r.vehicleType}</td>
                  <td>{formatDate(r.availableFrom)}</td>
                  <td>
                    <span className={listingStatusClass(r.status)}>
                      {LISTING_STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td>{r.offerCount}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleOffers(r.id)}>
                      {expandedId === r.id ? 'Teklifleri Gizle' : 'Teklifler'}
                    </button>{' '}
                    {r.status === 'Active' ? (
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={cancellingId === r.id}
                        onClick={() => void handleCancel(r.id)}
                      >
                        {cancellingId === r.id ? 'Kaldırılıyor…' : 'Kaldır'}
                      </button>
                    ) : null}
                  </td>
                </tr>
                {expandedId === r.id ? (
                  <tr>
                    <td colSpan={7}>
                      {offersLoadingId === r.id ? (
                        <span className="muted">Teklifler yükleniyor…</span>
                      ) : offersError[r.id] ? (
                        <span className="muted">{offersError[r.id]}</span>
                      ) : (offersById[r.id] ?? []).length === 0 ? (
                        <span className="muted">Bu ilana henüz teklif gelmedi.</span>
                      ) : (
                        <table className="admin-table" style={{ minWidth: 0 }}>
                          <thead>
                            <tr>
                              <th>Müşteri</th>
                              <th>Yük Rotası</th>
                              <th>Tutar</th>
                              <th>Durum</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(offersById[r.id] ?? []).map((o) => (
                              <tr key={o.id}>
                                <td>{o.customerName || '-'}</td>
                                <td>
                                  {o.fromCity} → {o.toCity}
                                </td>
                                <td>{formatCurrencyTRY(o.amount ?? o.loadPrice)}</td>
                                <td>
                                  <span className={offerStatusClass(o.status)}>
                                    {OFFER_STATUS_LABEL[o.status] ?? o.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? <div className="admin-card empty-state">🚚 İlan bulunamadı.</div> : null}
    </div>
  )
}
