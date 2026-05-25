import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageSkeleton } from '../../components/common/PageStates'
import { openConfirm } from '@/components/common/ConfirmModal'
import { toast } from '@/components/common/Toast'
import './AdminPanel.css'
import '../../styles/overlays.css'

type Row = {
  id: string
  at: string
  fromName: string
  toName: string
  fromInitial: string
  toInitial: string
  stars: number
  comment: string
  loadId: string
}

const MOCK: Row[] = [
  {
    id: 'r1',
    at: '2026-05-12',
    fromName: 'Atlas Lojistik',
    toName: 'Ahmet Yılmaz',
    fromInitial: 'A',
    toInitial: 'A',
    stars: 5,
    comment: 'Zamanında teslim, iletişim mükemmeldi. Teşekkürler.',
    loadId: '9021',
  },
  {
    id: 'r2',
    at: '2026-05-08',
    fromName: 'Hızlı Yük',
    toName: 'Mehmet Kaya',
    fromInitial: 'H',
    toInitial: 'M',
    stars: 2,
    comment: 'Gecikme yaşandı, bilgilendirme yetersizdi.',
    loadId: '8890',
  },
  {
    id: 'r3',
    at: '2026-04-28',
    fromName: 'Selin Demir',
    toName: 'Ali T.',
    fromInitial: 'S',
    toInitial: 'A',
    stars: 4,
    comment: 'Genel olarak memnun kaldık.',
    loadId: '8701',
  },
]

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} yıldız`} style={{ letterSpacing: 2, color: '#fbbf24' }}>
      {'★'.repeat(n)}
      <span style={{ color: 'rgba(148,163,184,0.5)' }}>{'★'.repeat(5 - n)}</span>
    </span>
  )
}

export default function AdminRatingsPage() {
  const [ready, setReady] = useState(false)
  const [minStar, setMinStar] = useState(1)
  const [maxStar, setMaxStar] = useState(5)
  const [role, setRole] = useState<'all' | 'from' | 'to'>('all')
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<Row | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 360)
    return () => window.clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    return MOCK.filter((r) => {
      if (r.stars < minStar || r.stars > maxStar) return false
      if (role === 'from' && r.stars < 4) return false
      if (role === 'to' && r.stars > 3) return false
      if (q.trim()) {
        const qq = q.trim().toLowerCase()
        const comment = String(r.comment ?? '')
        const fromName = String(r.fromName ?? '')
        const toName = String(r.toName ?? '')
        if (!comment.toLowerCase().includes(qq) && !fromName.toLowerCase().includes(qq) && !toName.toLowerCase().includes(qq)) {
          return false
        }
      }
      return true
    })
  }, [minStar, maxStar, q, role])

  const avg = useMemo(() => {
    if (!filtered.length) return 0
    return filtered.reduce((a, b) => a + b.stars, 0) / filtered.length
  }, [filtered])

  const lowCount = useMemo(() => MOCK.filter((r) => r.stars <= 2).length, [])

  if (!ready) return <PageSkeleton rows={8} variant="table" />

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Puanlama Yönetimi</h1>
          <p className="admin-sub">Yorum denetimi ve raporlama (örnek veri).</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="admin-card">
          <div className="kpi-label">Toplam Puanlama</div>
          <div className="kpi-value">{MOCK.length}</div>
        </div>
        <div className="admin-card">
          <div className="kpi-label">Ortalama Puan</div>
          <div className="kpi-value">
            ⭐ {avg.toFixed(1)}
          </div>
        </div>
        <div className="admin-card">
          <div className="kpi-label">Bu Ay Verilen</div>
          <div className="kpi-value">2</div>
        </div>
        <div className="admin-card ratings-kpi-pulse">
          <div className="kpi-label">Düşük Puan (≤2)</div>
          <div className="kpi-value danger">{lowCount}</div>
        </div>
      </div>

      <div className="ratings-toolbar">
        <label className="muted" style={{ fontSize: 13 }}>
          Min puan
          <select className="form-input" style={{ marginTop: 4, maxWidth: 120 }} value={minStar} onChange={(e) => setMinStar(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="muted" style={{ fontSize: 13 }}>
          Max puan
          <select className="form-input" style={{ marginTop: 4, maxWidth: 120 }} value={maxStar} onChange={(e) => setMaxStar(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="muted" style={{ fontSize: 13 }}>
          Tarih (örnek)
          <input className="form-input" type="date" style={{ marginTop: 4 }} />
        </label>
        <label className="muted" style={{ fontSize: 13 }}>
          Veren / Alan
          <select className="form-input" style={{ marginTop: 4, minWidth: 160 }} value={role} onChange={(e) => setRole(e.target.value as 'all' | 'from' | 'to')}>
            <option value="all">Tümü</option>
            <option value="from">Veren odaklı</option>
            <option value="to">Alan odaklı</option>
          </select>
        </label>
        <label className="muted" style={{ fontSize: 13, flex: 1, minWidth: 200 }}>
          Arama
          <input className="form-input" style={{ marginTop: 4 }} placeholder="İsim veya yorum…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="ad-data-table-wrap">
        <table className="ad-data-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Veren</th>
              <th>Alan</th>
              <th>Puan</th>
              <th>Yorum</th>
              <th>Yük</th>
              <th>Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const commentText = String(r.comment ?? '')
              const short = commentText.length > 48 ? `${commentText.slice(0, 48)}…` : commentText
              return (
                <tr key={r.id}>
                  <td>{r.at}</td>
                  <td>
                    <div className="item-row" style={{ gap: 8 }}>
                      <span className="ad-hero-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                        {r.fromInitial}
                      </span>
                      <span>{r.fromName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="item-row" style={{ gap: 8 }}>
                      <span className="ad-hero-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                        {r.toInitial}
                      </span>
                      <span>{r.toName}</span>
                    </div>
                  </td>
                  <td>
                    <Stars n={r.stars} />
                  </td>
                  <td>
                    <span>{short}</span>{' '}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetail(r)}>
                      Devamını Oku
                    </button>
                  </td>
                  <td>
                    <Link className="mono-id" to={`/admin/loads/${r.loadId}`}>
                      #{r.loadId}
                    </Link>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        void openConfirm({ title: 'Yorumu sil?', variant: 'danger', confirmText: 'Sil' }).then((ok) => {
                          if (!ok) return
                          toast.warning('Yorum silindi (örnek).')
                        })
                      }
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
              <strong>Veren:</strong> {detail.fromName}
            </p>
            <p>
              <strong>Alan:</strong> {detail.toName}
            </p>
            <p>
              <strong>Yük:</strong>{' '}
              <Link to={`/admin/loads/${detail.loadId}`} className="mono-id">
                #{detail.loadId}
              </Link>
            </p>
            <p style={{ lineHeight: 1.6 }}>{detail.comment}</p>
            <div className="item-row" style={{ marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
              <button type="button" className="btn btn-warning btn-sm" onClick={() => toast.warning('Uygunsuz olarak işaretlendi (örnek).')}>
                Uygunsuz İşaretle
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() =>
                  void openConfirm({ title: 'Yorumu kalıcı sil?', variant: 'danger', irreversibleHint: true, confirmText: 'Sil' }).then((ok) => {
                    if (!ok) return
                    toast.success('Yorum silindi (örnek).')
                    setDetail(null)
                  })
                }
              >
                Yorumu Sil
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
