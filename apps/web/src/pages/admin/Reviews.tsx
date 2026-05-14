import { useEffect, useState } from 'react'
import { decideReview, getPendingReviews, type PendingReview } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import { toast } from '@/components/common/Toast'
import { ReviewsDetailModal } from './ReviewsDetailModal'
import './AdminPanel.css'
import '../../styles/overlays.css'
import { normalizeArray } from '../../utils/format'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [sortBy, setSortBy] = useState<'suspicious' | 'oldest' | 'newest'>('suspicious')
  const [selected, setSelected] = useState<PendingReview | null>(null)

  async function fetchQueue() {
    const data = await getPendingReviews()
    setReviews(normalizeArray<PendingReview>(data))
  }

  useEffect(() => {
    fetchQueue()
      .catch((e: unknown) => setError((e as { uiMessage?: string }).uiMessage ?? 'Inceleme kuyrugu yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function decide(userId: number, isApproved: boolean, reason: string) {
    setMessage('')
    setError('')
    try {
      await decideReview(
        userId,
        isApproved,
        reason || (isApproved ? 'Belgeler manuel olarak onaylandı.' : 'Belgeler manuel olarak reddedildi.')
      )
      toast.success('Karar kaydedildi.')
      setMessage('Karar kaydedildi.')
      await fetchQueue()
      setSelected(null)
    } catch (e: unknown) {
      const msg = (e as { uiMessage?: string }).uiMessage ?? 'Karar kaydedilemedi.'
      setError(msg)
      toast.error(msg)
    }
  }

  if (loading) return <PageSkeleton rows={8} />
  const reviewList = Array.isArray(reviews) ? reviews : []

  const sorted = [...reviewList].sort((a, b) => {
    const getScore = (r: PendingReview) => {
      try {
        return Number((JSON.parse(r.aiInferenceDetails || '{}') as { ConfidenceScore?: number }).ConfidenceScore ?? 100)
      } catch {
        return 100
      }
    }
    if (sortBy === 'suspicious') return getScore(a) - getScore(b)
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Belge İnceleme</h1>
          <p className="admin-sub">AI skoruna göre sıralı manuel karar ekranı.</p>
        </div>
        <select
          className="form-input"
          style={{ maxWidth: 240 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'suspicious' | 'oldest' | 'newest')}
        >
          <option value="suspicious">En şüpheli önce</option>
          <option value="oldest">En eski önce</option>
          <option value="newest">En yeni önce</option>
        </select>
      </div>
      {error ? <PageError message={error} /> : null}
      {message ? (
        <div className="admin-card muted" style={{ padding: 12 }}>
          {message}
        </div>
      ) : null}

      <div className="kpi-grid">
        <div className="admin-card">
          <div className="kpi-label">Bekleyen</div>
          <div className="kpi-value">{reviewList.length}</div>
        </div>
        <div className="admin-card">
          <div className="kpi-label">Bugün Onaylanan</div>
          <div className="kpi-value success">0</div>
        </div>
        <div className="admin-card">
          <div className="kpi-label">Bugün Reddedilen</div>
          <div className="kpi-value danger">0</div>
        </div>
        <div className="admin-card">
          <div className="kpi-label">Ortalama İnceleme</div>
          <div className="kpi-value">12 dk</div>
        </div>
      </div>

      <div className="kpi-grid">
        {sorted.map((review) => (
          <div key={review.id} className="admin-card">
            <div className="item-row">
              <strong>{review.fullName}</strong>
              <span className="muted">{review.phone}</span>
            </div>
            <p className="muted">
              AI Güven Skoru:{' '}
              {(() => {
                if (!review.aiInferenceDetails) return 'N/A'
                try {
                  const parsed = JSON.parse(review.aiInferenceDetails) as { ConfidenceScore?: number }
                  return parsed.ConfidenceScore ?? 'N/A'
                } catch {
                  return 'N/A'
                }
              })()}
            </p>
            <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setSelected(review)}>
              Detaylı İncele
            </button>
          </div>
        ))}
        {reviewList.length === 0 ? <div className="admin-card muted">Bekleyen inceleme bulunmuyor.</div> : null}
      </div>

      {selected ? (
        <ReviewsDetailModal
          review={selected}
          onClose={() => setSelected(null)}
          onApprove={(reason) => decide(selected.id, true, reason)}
          onReject={(reason) => decide(selected.id, false, reason)}
          onManual={() => {
            setMessage('Kayıt manuel incelemeye alındı.')
            toast.warning('Kayıt manuel incelemeye alındı. 24 saat içinde karar verilecek.')
          }}
        />
      ) : null}
    </div>
  )
}
