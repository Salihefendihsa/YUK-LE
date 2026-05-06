import { useEffect, useState } from 'react'
import { decideReview, getPendingReviews, type PendingReview } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function fetchQueue() {
    const data = await getPendingReviews()
    setReviews(data)
  }

  useEffect(() => {
    fetchQueue()
      .catch((e: unknown) => setError((e as { uiMessage?: string }).uiMessage ?? 'Inceleme kuyrugu yuklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function decide(userId: number, isApproved: boolean) {
    setMessage('')
    setError('')
    try {
      await decideReview(userId, isApproved, isApproved ? 'Manuel olarak onaylandi.' : 'Manuel olarak reddedildi.')
      setMessage('Karar kaydedildi.')
      await fetchQueue()
    } catch (e: unknown) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Karar kaydedilemedi.')
    }
  }

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="page-wrap">
      <div>
        <h1 className="page-title">Belge Inceleme</h1>
        <p className="page-sub">Bekleyen belgeleri onaylayin veya reddedin</p>
      </div>
      {error ? <PageError message={error} /> : null}
      {message ? <div className="card muted">{message}</div> : null}

      <div className="list-grid">
        {reviews.map((review) => (
          <div key={review.id} className="item-card">
            <div className="item-row">
              <strong>{review.fullName}</strong>
              <span className="muted">{review.email}</span>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              {review.adminReviewNote || 'Not yok'}
            </p>
            <div className="item-row" style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={() => decide(review.id, true)}>
                Onayla
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => decide(review.id, false)}>
                Reddet
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 ? <div className="card muted">Bekleyen inceleme bulunmuyor.</div> : null}
      </div>
    </div>
  )
}
