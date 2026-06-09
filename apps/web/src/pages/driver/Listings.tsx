import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  acceptOffer,
  cancelDriverListing,
  getMyDriverListings,
  getOffersForListing,
  rejectOffer,
  type DriverListing,
  type ListingOffer,
} from '../../api/driverListings'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { toast } from '../../components/common/Toast'
import '../shared/Page.css'

const OFFER_STATUS_LABEL: Record<string, string> = {
  Pending: 'Beklemede',
  Accepted: 'Kabul edildi',
  Rejected: 'Reddedildi',
  Withdrawn: 'Geri çekildi',
}

function offerStatusBadgeClass(status: string): string {
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

const STATUS_LABEL: Record<string, string> = {
  Active: 'Yayında',
  Matched: 'Eşleşti',
  Cancelled: 'İptal edildi',
  Expired: 'Süresi doldu',
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Active':
      return 'badge badge-info'
    case 'Matched':
      return 'badge badge-success'
    default:
      return 'badge badge-muted'
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('tr-TR')
}

export default function DriverListingsPage() {
  const navigate = useNavigate()
  const [listings, setListings] = useState<DriverListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // ── Gelen teklifler ──
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [offersByListing, setOffersByListing] = useState<Record<string, ListingOffer[]>>({})
  const [offersLoadingId, setOffersLoadingId] = useState<string | null>(null)
  const [offersError, setOffersError] = useState<Record<string, string>>({})
  const [actingOfferId, setActingOfferId] = useState<string | null>(null)

  async function fetchOffers(listingId: string) {
    setOffersLoadingId(listingId)
    setOffersError((prev) => ({ ...prev, [listingId]: '' }))
    try {
      const data = await getOffersForListing(listingId)
      setOffersByListing((prev) => ({ ...prev, [listingId]: Array.isArray(data) ? data : [] }))
    } catch (e) {
      setOffersError((prev) => ({
        ...prev,
        [listingId]: (e as { uiMessage?: string }).uiMessage ?? 'Teklifler yüklenemedi.',
      }))
    } finally {
      setOffersLoadingId(null)
    }
  }

  function toggleOffers(listingId: string) {
    if (expandedId === listingId) {
      setExpandedId(null)
      return
    }
    setExpandedId(listingId)
    if (!offersByListing[listingId]) void fetchOffers(listingId)
  }

  async function handleAccept(listingId: string, offer: ListingOffer) {
    if (
      !window.confirm(
        'Bu teklifi kabul etmek istediğinize emin misiniz? Yük size atanacak ve ilan eşleşecek.',
      )
    )
      return
    setActingOfferId(offer.id)
    try {
      const res = await acceptOffer(offer.id)
      // Canlı güncelleme: kabul edilen Accepted, diğer Pending'ler Rejected.
      setOffersByListing((prev) => ({
        ...prev,
        [listingId]: (prev[listingId] ?? []).map((o) =>
          o.id === offer.id
            ? { ...o, status: 'Accepted' }
            : o.status === 'Pending'
              ? { ...o, status: 'Rejected' }
              : o,
        ),
      }))
      // İlan Eşleşti.
      setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, status: 'Matched' } : l)))
      toast.success(res.message || 'Teklif kabul edildi.')
    } catch (e) {
      toast.error((e as { uiMessage?: string }).uiMessage ?? 'Teklif kabul edilemedi.')
    } finally {
      setActingOfferId(null)
    }
  }

  async function handleReject(listingId: string, offer: ListingOffer) {
    if (!window.confirm('Bu teklifi reddetmek istediğinize emin misiniz?')) return
    setActingOfferId(offer.id)
    try {
      const res = await rejectOffer(offer.id)
      setOffersByListing((prev) => ({
        ...prev,
        [listingId]: (prev[listingId] ?? []).map((o) =>
          o.id === offer.id ? { ...o, status: 'Rejected' } : o,
        ),
      }))
      toast.success(res.message || 'Teklif reddedildi.')
    } catch (e) {
      toast.error((e as { uiMessage?: string }).uiMessage ?? 'Teklif reddedilemedi.')
    } finally {
      setActingOfferId(null)
    }
  }

  useEffect(() => {
    getMyDriverListings()
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch((e: { uiMessage?: string }) => {
        setError(e.uiMessage ?? 'İlanlarınız yüklenemedi.')
        setListings([])
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel(id: string) {
    if (!window.confirm('Bu ilanı iptal etmek istediğinize emin misiniz?')) return
    setCancellingId(id)
    try {
      await cancelDriverListing(id)
      // Canlı güncelleme: kartı yeniden çekmeden durumu yerinde güncelle.
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'Cancelled' } : l)))
      toast.success('İlan iptal edildi.')
    } catch (e) {
      toast.error((e as { uiMessage?: string }).uiMessage ?? 'İlan iptal edilemedi.')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) return <PageSkeleton rows={6} variant="card" />

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Boş Araç İlanlarım</h1>
          <p className="page-sub">Yayınladığınız güzergâh ve müsaitlik ilanları</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/driver/listings/create')}>
          + Yeni İlan
        </button>
      </div>

      {error ? <PageError message={error} /> : null}

      <div className="loads-grid-responsive">
        {listings.map((l) => (
          <div key={l.id} className="item-card">
            <div className="item-row">
              <strong>
                {l.originCity} → {l.destinationCity}
              </strong>
              <span className={statusBadgeClass(l.status)}>{STATUS_LABEL[l.status] ?? l.status}</span>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {l.originDistrict} / {l.destinationDistrict}
            </div>
            <div className="item-row" style={{ marginTop: 8 }}>
              <span className="muted">{l.vehicleType}</span>
              <span className="muted">Müsait: {formatDate(l.availableFrom)}</span>
            </div>
            {l.capacityNote ? (
              <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                {l.capacityNote}
              </div>
            ) : null}
            <div className="item-row" style={{ marginTop: 12, gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => toggleOffers(l.id)}>
                {expandedId === l.id ? 'Teklifleri Gizle' : 'Gelen Teklifler'}
              </button>
              {l.status === 'Active' ? (
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={cancellingId === l.id}
                  onClick={() => handleCancel(l.id)}
                >
                  {cancellingId === l.id ? 'İptal ediliyor...' : 'İlanı İptal Et'}
                </button>
              ) : null}
            </div>

            {expandedId === l.id ? (
              <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                {offersLoadingId === l.id ? (
                  <p className="muted" style={{ fontSize: 13 }}>
                    Teklifler yükleniyor…
                  </p>
                ) : offersError[l.id] ? (
                  <p className="muted" style={{ fontSize: 13 }}>
                    {offersError[l.id]}
                  </p>
                ) : (offersByListing[l.id] ?? []).length === 0 ? (
                  <p className="muted" style={{ fontSize: 13 }}>
                    Bu ilana henüz teklif gelmedi.
                  </p>
                ) : (
                  (offersByListing[l.id] ?? []).map((o) => (
                    <div key={o.id} className="item-card" style={{ padding: 12 }}>
                      <div className="item-row">
                        <strong>
                          {o.fromCity} → {o.toCity}
                        </strong>
                        <span className={offerStatusBadgeClass(o.status)}>
                          {OFFER_STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </div>
                      <div className="item-row" style={{ marginTop: 6 }}>
                        <span className="muted" style={{ fontSize: 13 }}>
                          {o.customerName || 'Müşteri'}
                        </span>
                        <strong>
                          ₺{(o.amount ?? o.loadPrice).toLocaleString('tr-TR')}
                          {o.amount == null ? ' (liste fiyatı)' : ''}
                        </strong>
                      </div>
                      {o.note ? (
                        <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                          {o.note}
                        </div>
                      ) : null}
                      {o.status === 'Pending' && l.status === 'Active' ? (
                        <div className="item-row" style={{ marginTop: 10, gap: 8 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={actingOfferId === o.id}
                            onClick={() => void handleReject(l.id, o)}
                          >
                            Reddet
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actingOfferId === o.id}
                            onClick={() => void handleAccept(l.id, o)}
                          >
                            {actingOfferId === o.id ? 'İşleniyor…' : 'Kabul Et'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ))}

        {listings.length === 0 ? (
          <PageEmpty
            icon="🚚"
            title="Henüz ilanınız yok"
            description="Boş aracınız için güzergâh ve müsaitlik ilanı yayınlayın."
            actionLabel="Boş Araç İlanı Ver"
            onAction={() => navigate('/driver/listings/create')}
          />
        ) : null}
      </div>
    </div>
  )
}
