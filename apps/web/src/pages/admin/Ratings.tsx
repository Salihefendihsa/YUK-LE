import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteRating, getAllRatings, type AdminRatingRow } from '../../api/admin'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { openConfirm } from '@/components/common/ConfirmModal'
import { toast } from '@/components/common/Toast'
import { formatDateTime } from '../../utils/formatters'
import { safeInitial } from '../../utils/pii'
import './AdminPanel.css'
import '../../styles/overlays.css'

type Row = AdminRatingRow & {
  fromInitial: string
  toInitial: string
  at: string
}

function Stars({ n }: { n: number }) {
  const safe = Math.min(5, Math.max(0, Math.round(n)))
  return (
    <span aria-label={`${safe} yıldız`} style={{ letterSpacing: 2, color: '#fbbf24' }}>
      {'★'.repeat(safe)}
      <span style={{ color: 'rgba(148,163,184,0.5)' }}>{'★'.repeat(5 - safe)}</span>
    </span>
  )
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return !Number.isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function toDisplayRow(r: AdminRatingRow): Row {
  return {
    ...r,
    fromInitial: safeInitial(r.givenByName),
    toInitial: safeInitial(r.givenToName),
    at: formatDateTime(r.createdAt),
  }
}

export default function AdminRatingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [minStar, setMinStar] = useState(1)
  const [maxStar, setMaxStar] = useState(5)
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadAll = useCallback(async () => {
    setError('')
    const data = await getAllRatings()
    setRows(data.map(toDisplayRow))
  }, [])

  useEffect(() => {
    void loadAll()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Puanlamalar yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [loadAll])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (r.score < minStar || r.score > maxStar) return false
      if (q.trim()) {
        const qq = q.trim().toLowerCase()
        const comment = String(r.comment ?? '')
        const fromName = String(r.givenByName ?? '')
        const toName = String(r.givenToName ?? '')
        if (
          !comment.toLowerCase().includes(qq) &&
          !fromName.toLowerCase().includes(qq) &&
          !toName.toLowerCase().includes(qq)
        ) {
          return false
        }
      }
      return true
    })
  }, [rows, minStar, maxStar, q])

  const avg = useMemo(() => {
    if (!filtered.length) return 0
    return filtered.reduce((a, b) => a + b.score, 0) / filtered.length
  }, [filtered])

  const lowCount = useMemo(() => rows.filter((r) => r.score <= 2).length, [rows])
  const monthCount = useMemo(() => rows.filter((r) => isThisMonth(r.createdAt)).length, [rows])

  async function handleDelete(row: Row) {
    const ok = await openConfirm({ title: 'Yorumu sil?', variant: 'danger', confirmText: 'Sil' })
    if (!ok) return
    setDeleting(true)
    try {
      await deleteRating(row.id)
      toast.success('Yorum silindi.')
      setDetail(null)
      await loadAll()
    } catch (e: unknown) {
      toast.error((e as { uiMessage?: string }).uiMessage ?? 'Silme işlemi başarısız.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <PageSkeleton rows={8} variant="table" />

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Puanlama Yönetimi</h1>
          <p className="admin-sub">Yorum denetimi ve raporlama.</p>
        </div>
      </div>

      {error ? <PageError message={error} onRetry={() => void loadAll()} /> : null}

      <div className="kpi-grid">
        <div className="admin-card">
          <div className="kpi-label">Toplam puanlama</div>
          <div className="kpi-value">{rows.length}</div>
        </div>
        <div className="admin-card">
          <div className="kpi-label">Ortalama puan</div>
          <div className="kpi-value">⭐ {rows.length ? avg.toFixed(1) : '—'}</div>
        </div>
        <div className="admin-card">
          <div className="kpi-label">Bu ay verilen</div>
          <div className="kpi-value">{monthCount}</div>
        </div>
        <div className="admin-card ratings-kpi-pulse">
          <div className="kpi-label">Düşük puan (≤2)</div>
          <div className="kpi-value danger">{lowCount}</div>
        </div>
      </div>

      <div className="ratings-toolbar">
        <label className="muted" style={{ fontSize: 13 }}>
          Min puan
          <select
            className="form-input"
            style={{ marginTop: 4, maxWidth: 120 }}
            value={minStar}
            onChange={(e) => setMinStar(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="muted" style={{ fontSize: 13 }}>
          Max puan
          <select
            className="form-input"
            style={{ marginTop: 4, maxWidth: 120 }}
            value={maxStar}
            onChange={(e) => setMaxStar(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="muted" style={{ fontSize: 13, flex: 1, minWidth: 200 }}>
          Arama
          <input
            className="form-input"
            style={{ marginTop: 4 }}
            placeholder="İsim veya yorum…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>

      {filtered.length === 0 && !error ? (
        <PageEmpty
          icon="⭐"
          title="Puanlama bulunamadı"
          description="Henüz kayıtlı değerlendirme yok veya filtrelere uygun sonuç çıkmadı."
          actionLabel="Filtreleri temizle"
          onAction={() => {
            setMinStar(1)
            setMaxStar(5)
            setQ('')
          }}
        />
      ) : (
        <div className="ad-data-table-wrap">
          <table className="ad-data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Veren</th>
                <th>Alan</th>
                <th>Puan</th>
                <th>Yorum</th>
                <th>İlan</th>
                <th>Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const commentText = String(r.comment ?? '')
                const short = commentText.length > 48 ? `${commentText.slice(0, 48)}…` : commentText || '—'
                return (
                  <tr key={r.id}>
                    <td>{r.at}</td>
                    <td>
                      <div className="item-row" style={{ gap: 8 }}>
                        <span className="ad-hero-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                          {r.fromInitial}
                        </span>
                        <span>{r.givenByName || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="item-row" style={{ gap: 8 }}>
                        <span className="ad-hero-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                          {r.toInitial}
                        </span>
                        <span>{r.givenToName || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <Stars n={r.score} />
                    </td>
                    <td>
                      <span>{short}</span>{' '}
                      {commentText ? (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetail(r)}>
                          Devamını oku
                        </button>
                      ) : null}
                    </td>
                    <td>
                      <Link className="mono-id" to={`/admin/loads/${r.loadId}`}>
                        {String(r.loadId).slice(0, 8)}…
                      </Link>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={deleting}
                        onClick={() => void handleDelete(r)}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {detail ? (
        <div className="ratings-comment-modal" role="dialog" aria-modal>
          <div className="ratings-comment-card glass-card">
            <div className="item-row" style={{ marginBottom: 12 }}>
              <h2 className="admin-title" style={{ margin: 0, fontSize: 20 }}>
                Yorum detayı
              </h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>
                Kapat
              </button>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              {detail.at}
            </p>
            <p>
              <strong>Veren:</strong> {detail.givenByName || '—'}
            </p>
            <p>
              <strong>Alan:</strong> {detail.givenToName || '—'}
            </p>
            <p>
              <strong>İlan:</strong>{' '}
              <Link to={`/admin/loads/${detail.loadId}`} className="mono-id">
                {String(detail.loadId).slice(0, 8)}…
              </Link>
            </p>
            <p style={{ lineHeight: 1.6 }}>{String(detail.comment ?? '') || '—'}</p>
            <div className="item-row" style={{ marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={deleting}
                onClick={() => void handleDelete(detail)}
              >
                Yorumu sil
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
