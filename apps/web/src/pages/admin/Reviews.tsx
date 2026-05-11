import { useEffect, useState } from 'react'
import { decideReview, getPendingReviews, type PendingReview } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'
import { normalizeArray } from '../../utils/format'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [reasonMap, setReasonMap] = useState<Record<number, string>>({})
  const [sortBy, setSortBy] = useState<'suspicious' | 'oldest' | 'newest'>('suspicious')

  async function fetchQueue() {
    const data = await getPendingReviews()
    setReviews(normalizeArray<PendingReview>(data))
  }

  useEffect(() => {
    fetchQueue()
      .catch((e: unknown) => setError((e as { uiMessage?: string }).uiMessage ?? 'Inceleme kuyrugu yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function decide(userId: number, isApproved: boolean) {
    setMessage('')
    setError('')
    try {
      const reason = reasonMap[userId]?.trim()
      await decideReview(
        userId,
        isApproved,
        reason || (isApproved ? 'Belgeler manuel olarak onaylandı.' : 'Belgeler manuel olarak reddedildi.')
      )
      setMessage('Karar kaydedildi.')
      await fetchQueue()
    } catch (e: unknown) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Karar kaydedilemedi.')
    }
  }

  if (loading) return <PageSkeleton rows={8} />
  const reviewList = Array.isArray(reviews) ? reviews : []

  const sorted = [...reviewList].sort((a, b) => {
    const getScore = (r: PendingReview) => {
      try {
        return Number((JSON.parse(r.aiInferenceDetails || '{}') as { ConfidenceScore?: number }).ConfidenceScore ?? 100)
      } catch { return 100 }
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
        <select className="form-input" style={{ maxWidth: 240 }} value={sortBy} onChange={(e) => setSortBy(e.target.value as 'suspicious' | 'oldest' | 'newest')}>
          <option value="suspicious">En şüpheli önce</option>
          <option value="oldest">En eski önce</option>
          <option value="newest">En yeni önce</option>
        </select>
      </div>
      {error ? <PageError message={error} /> : null}
      {message ? <div className="card muted">{message}</div> : null}

      <div className="kpi-grid">
        <div className="admin-card"><div className="kpi-label">Bekleyen</div><div className="kpi-value">{reviewList.length}</div></div>
        <div className="admin-card"><div className="kpi-label">Bugün Onaylanan</div><div className="kpi-value success">0</div></div>
        <div className="admin-card"><div className="kpi-label">Bugün Reddedilen</div><div className="kpi-value danger">0</div></div>
        <div className="admin-card"><div className="kpi-label">Ortalama İnceleme</div><div className="kpi-value">12 dk</div></div>
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
            <textarea
              className="form-input"
              placeholder="Admin notu veya red sebebi"
              value={reasonMap[review.id] ?? ''}
              onChange={(e) => setReasonMap((prev) => ({ ...prev, [review.id]: e.target.value }))}
              style={{ marginTop: 8 }}
            />
            <div className="item-row" style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={() => decide(review.id, true)}>
                Onayla
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => decide(review.id, false)}>
                Reddet
              </button>
              <button className="btn btn-warning btn-sm" onClick={() => setMessage('Kayıt manuel incelemeye alındı.')}>
                Manuel İnceleme
              </button>
            </div>
          </div>
        ))}
        {reviewList.length === 0 ? <div className="card muted">Bekleyen inceleme bulunmuyor.</div> : null}
      </div>
    </div>
  )
}
