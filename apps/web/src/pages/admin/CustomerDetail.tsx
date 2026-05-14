import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageSkeleton } from '../../components/common/PageStates'
import { openConfirm } from '@/components/common/ConfirmModal'
import { toast } from '@/components/common/Toast'
import './AdminPanel.css'
import '../../styles/overlays.css'

type TabId = 'overview' | 'listings' | 'payments' | 'notes'

type NoteRow = { id: string; admin: string; text: string; at: string }

const MOCK = {
  company: 'Atlas Lojistik A.Ş.',
  taxNo: '1234567890',
  totalLoads: 184,
  spend: 2_450_000,
  completed: 162,
}

function maskTax(t: string) {
  if (t.length < 6) return '***'
  return `${t.slice(0, 2)}******${t.slice(-2)}`
}

const MOCK_LISTINGS = [
  { id: '5012', title: 'İstanbul → Edirne', date: '2026-05-08', status: 'Yayında' },
  { id: '4988', title: 'Ankara → Samsun', date: '2026-04-22', status: 'Tamamlandı' },
]

const MOCK_PAYMENTS = [
  { id: 'P-221', amount: '₺12.400', date: '2026-05-01', method: 'Kredi kartı' },
  { id: 'P-198', amount: '₺8.900', date: '2026-04-12', method: 'Havale' },
]

const NOTE_SEED: NoteRow[] = [{ id: '1', admin: 'Sistem', text: 'Kurumsal doğrulama tamam.', at: '2026-03-02 09:00' }]

export default function AdminCustomerDetailPage() {
  const { id } = useParams()
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<TabId>('overview')
  const [notes, setNotes] = useState<NoteRow[]>(NOTE_SEED)
  const [newNote, setNewNote] = useState('')
  const CURRENT_ADMIN = 'Sen'

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 400)
    return () => window.clearTimeout(t)
  }, [id])

  const taxMasked = useMemo(() => maskTax(MOCK.taxNo), [])

  if (!ready) return <PageSkeleton rows={9} variant="card" />

  return (
    <div className="admin-page">
      <div className="ad-hero">
        <div className="ad-hero-avatar" aria-hidden>
          {MOCK.company[0]}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="ad-hero-name">{MOCK.company}</h1>
          <p className="muted" style={{ marginBottom: 8 }}>
            Müşteri #{id}
          </p>
          <p className="muted" style={{ fontSize: 14 }}>
            Vergi no: {taxMasked}
          </p>
          <div style={{ marginTop: 12 }}>
            <span className="ad-badge-pulse">Kurumsal Üye</span>
          </div>
          <div className="ad-stat-row">
            <span className="ad-stat-pill">📦 {MOCK.totalLoads} Toplam İlan</span>
            <span className="ad-stat-pill">✅ {MOCK.completed} Tamamlanan</span>
            <span className="ad-stat-pill">💰 ₺{MOCK.spend.toLocaleString('tr-TR')} Harcama</span>
          </div>
        </div>
      </div>

      <div className="ad-detail-layout">
        <div>
          <div className="ad-tab-bar" role="tablist">
            {(
              [
                ['overview', '📊 Genel Bakış'],
                ['listings', '📦 İlan Geçmişi'],
                ['payments', '💰 Ödeme Geçmişi'],
                ['notes', '⚠️ Notlar'],
              ] as const
            ).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={`ad-tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'overview' ? (
            <>
              <div className="ad-kpi-grid-4">
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Bu Ay İlan</div>
                  <div className="kpi-value">9</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Bu Ay Harcama</div>
                  <div className="kpi-value">₺186.000</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Tamamlama</div>
                  <div className="kpi-value success">%91</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">İptal</div>
                  <div className="kpi-value danger">%2</div>
                </div>
              </div>
              <div className="admin-card">
                <h3 style={{ marginTop: 0 }}>En yoğun güzergahlar</h3>
                <p className="muted">İstanbul–Ankara, Bursa–İzmir, Mersin–Gaziantep</p>
              </div>
              <div className="admin-card">
                <h3 style={{ marginTop: 0 }}>Memnuniyet</h3>
                <div className="ad-mini-chart">Örnek trend — canlı veri yakında</div>
              </div>
            </>
          ) : null}

          {tab === 'listings' ? (
            <div className="ad-data-table-wrap">
              <table className="ad-data-table">
                  <thead>
                    <tr>
                      <th>İlan ID</th>
                      <th>Başlık</th>
                      <th>Tarih</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_LISTINGS.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link className="mono-id" to={`/admin/loads/${r.id}`}>
                            #{r.id}
                          </Link>
                        </td>
                        <td>{r.title}</td>
                        <td>{r.date}</td>
                        <td>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          ) : null}

          {tab === 'payments' ? (
            <div className="ad-data-table-wrap">
              <table className="ad-data-table">
                <thead>
                  <tr>
                    <th>Ödeme</th>
                    <th>Tutar</th>
                    <th>Tarih</th>
                    <th>Yöntem</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PAYMENTS.map((p) => (
                    <tr key={p.id}>
                      <td className="mono-id">{p.id}</td>
                      <td>{p.amount}</td>
                      <td>{p.date}</td>
                      <td>{p.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'notes' ? (
            <div className="admin-card">
              <label className="form-group">
                <span className="form-label">Yeni not</span>
                <textarea className="form-input" rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)} />
              </label>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => {
                  const t = newNote.trim()
                  if (!t) {
                    toast.error('Not boş olamaz.')
                    return
                  }
                  setNotes((p) => [{ id: String(Date.now()), admin: CURRENT_ADMIN, text: t, at: new Date().toLocaleString('tr-TR') }, ...p])
                  setNewNote('')
                  toast.success('Not kaydedildi.')
                }}
              >
                Notu Kaydet
              </button>
              <h3 style={{ marginTop: 20 }}>Geçmiş</h3>
              {notes.map((n) => (
                <div key={n.id} className="admin-card" style={{ marginBottom: 10, padding: 12 }}>
                  <div className="item-row">
                    <span className="muted" style={{ fontSize: 12 }}>
                      {n.at} — {n.admin}
                    </span>
                    {n.admin === CURRENT_ADMIN ? (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          void openConfirm({ title: 'Notu sil?', variant: 'danger', confirmText: 'Sil' }).then((ok) => {
                            if (!ok) return
                            setNotes((p) => p.filter((x) => x.id !== n.id))
                            toast.warning('Not silindi.')
                          })
                        }
                      >
                        Sil
                      </button>
                    ) : null}
                  </div>
                  <p style={{ margin: '8px 0 0' }}>{n.text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="ad-sidebar">
          <strong>Hızlı aksiyonlar</strong>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => toast.info('Mesaj (örnek).')}>
            📧 Mesaj Gönder
          </button>
          <button type="button" className="btn btn-warning btn-sm" onClick={() => toast.warning('Uyarı (örnek).')}>
            ⚠️ Uyarı Gönder
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() =>
              void openConfirm({
                title: 'Hesabı kapat',
                irreversibleHint: true,
                requireTypeText: 'SİL',
                variant: 'danger',
              }).then((ok) => {
                if (!ok) return
                toast.error('İstek kaydedildi (örnek).')
              })
            }
          >
            🚫 Hesabı Kapat
          </button>
        </aside>
      </div>
    </div>
  )
}
