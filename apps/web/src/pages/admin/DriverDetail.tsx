import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageSkeleton } from '../../components/common/PageStates'
import { openConfirm } from '@/components/common/ConfirmModal'
import { toast } from '@/components/common/Toast'
import './AdminPanel.css'
import '../../styles/overlays.css'

type TabId = 'overview' | 'trips' | 'finance' | 'docs' | 'notes'

type NoteRow = { id: string; admin: string; text: string; at: string }

const MOCK_DRIVER = {
  fullName: 'Ahmet Yılmaz',
  phone: '+90 532 111 22 33',
  email: 'ahmet.ornek@mail.com',
  approvalStatus: 'Onaylı',
  rating: 4.8,
  trips: 247,
  earnings: 125_000,
  joined: '2024-08-15',
}

function maskPhone(p: string) {
  const d = p.replace(/\D/g, '')
  if (d.length < 4) return p
  return `*** *** ** ${d.slice(-2)}`
}

function maskEmail(e: string) {
  const [u, dom] = e.split('@')
  if (!dom) return '***@***'
  return `${u.slice(0, 2)}***@${dom}`
}

const MOCK_TRIPS = [
  { id: 'YL-9021', route: 'İstanbul → Ankara', date: '2026-05-02', duration: '6s 20dk', pay: '₺8.400', status: 'Tamamlandı', score: 5 },
  { id: 'YL-8890', route: 'Bursa → İzmir', date: '2026-04-18', duration: '5s 10dk', pay: '₺7.200', status: 'Tamamlandı', score: 4 },
  { id: 'YL-8701', route: 'Ankara → Kayseri', date: '2026-04-01', duration: '4s 45dk', pay: '₺5.100', status: 'İptal', score: null },
]

const MOCK_NOTES_SEED: NoteRow[] = [
  { id: '1', admin: 'Sistem', text: 'İlk kayıt kontrolü tamamlandı.', at: '2026-04-10 11:20' },
]

export default function AdminDriverDetailPage() {
  const { id } = useParams()
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<TabId>('overview')
  const [isActive, setIsActive] = useState(true)
  const [tripStatus, setTripStatus] = useState<string>('Tümü')
  const [notes, setNotes] = useState<NoteRow[]>(MOCK_NOTES_SEED)
  const [newNote, setNewNote] = useState('')
  const CURRENT_ADMIN = 'Sen'

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 420)
    return () => window.clearTimeout(t)
  }, [id])

  const filteredTrips = useMemo(() => {
    if (tripStatus === 'Tümü') return MOCK_TRIPS
    return MOCK_TRIPS.filter((r) => r.status === tripStatus)
  }, [tripStatus])

  if (!ready) return <PageSkeleton rows={10} variant="card" />

  return (
    <div className="admin-page">
      <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
        Örnek veri — canlı API bağlantısı sonraki sürümde
      </p>
      <div className="ad-hero">
        <div className="ad-hero-avatar" aria-hidden>
          {MOCK_DRIVER.fullName[0]}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="ad-hero-name">{MOCK_DRIVER.fullName}</h1>
          <p className="muted" style={{ marginBottom: 8 }}>
            Şoför #{id}
          </p>
          <p className="muted" style={{ fontSize: 14 }}>
            {maskPhone(MOCK_DRIVER.phone)} · {maskEmail(MOCK_DRIVER.email)}
          </p>
          <div style={{ marginTop: 12 }}>
            <span className="ad-badge-pulse">{MOCK_DRIVER.approvalStatus}</span>
          </div>
          <div className="ad-stat-row">
            <span className="ad-stat-pill">⭐ {MOCK_DRIVER.rating} Puan</span>
            <span className="ad-stat-pill">🚛 {MOCK_DRIVER.trips} Sefer</span>
            <span className="ad-stat-pill">💰 ₺{MOCK_DRIVER.earnings.toLocaleString('tr-TR')} Toplam Kazanç</span>
            <span className="ad-stat-pill">📅 Üyelik: {MOCK_DRIVER.joined}</span>
          </div>
        </div>
      </div>

      <div className="ad-detail-layout">
        <div>
          <div className="ad-tab-bar" role="tablist">
            {(
              [
                ['overview', '📊 Genel Bakış'],
                ['trips', '📦 Sefer Geçmişi'],
                ['finance', '💰 Finansal'],
                ['docs', '📄 Belgeler'],
                ['notes', '⚠️ Notlar'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                className={`ad-tab${tab === k ? ' active' : ''}`}
                onClick={() => setTab(k)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'overview' ? (
            <>
              <div className="ad-kpi-grid-4">
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Bu Ay Sefer</div>
                  <div className="kpi-value">18</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Bu Ay Kazanç</div>
                  <div className="kpi-value">₺42.300</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Tamamlama Oranı</div>
                  <div className="kpi-value success">%94</div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">İptal Oranı</div>
                  <div className="kpi-value danger">%3</div>
                </div>
              </div>
              <div className="admin-card" style={{ marginBottom: 14 }}>
                <h3 style={{ marginTop: 0 }}>En çok gittiği şehirler</h3>
                <ol className="muted" style={{ lineHeight: 1.8 }}>
                  <li>İstanbul — 62 sefer</li>
                  <li>Ankara — 41 sefer</li>
                  <li>İzmir — 28 sefer</li>
                  <li>Bursa — 19 sefer</li>
                  <li>Kocaeli — 14 sefer</li>
                </ol>
              </div>
              <div className="admin-card" style={{ marginBottom: 14 }}>
                <h3 style={{ marginTop: 0 }}>En çok çalıştığı müşteriler</h3>
                <p className="muted">Lojistik A.Ş., Taşımacık Ltd., Hızlı Yük A.Ş.</p>
              </div>
              <div className="admin-grid-2">
                <div className="admin-card">
                  <h3 style={{ marginTop: 0 }}>Ortalama teslim süresi</h3>
                  <p className="kpi-value" style={{ margin: 0 }}>
                    5s 32dk
                  </p>
                </div>
                <div className="admin-card">
                  <h3 style={{ marginTop: 0 }}>Memnuniyet trendi</h3>
                  <div className="ad-mini-chart">Örnek grafik alanı — canlı veri yakında</div>
                </div>
              </div>
            </>
          ) : null}

          {tab === 'trips' ? (
            <div className="admin-card">
              <div className="item-row" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <label className="muted" style={{ fontSize: 13 }}>
                  Tarih (örnek)
                  <input className="form-input" type="date" style={{ marginTop: 4, maxWidth: 180 }} />
                </label>
                <label className="muted" style={{ fontSize: 13 }}>
                  Durum
                  <select className="form-input" style={{ marginTop: 4, maxWidth: 200 }} value={tripStatus} onChange={(e) => setTripStatus(e.target.value)}>
                    <option>Tümü</option>
                    <option>Tamamlandı</option>
                    <option>İptal</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ alignSelf: 'flex-end' }}
                  onClick={() => toast.success('CSV indirme başlatıldı (örnek).')}
                >
                  CSV İndir
                </button>
              </div>
              <div className="ad-data-table-wrap">
                <table className="ad-data-table">
                  <thead>
                    <tr>
                      <th>Yük ID</th>
                      <th>Güzergah</th>
                      <th>Tarih</th>
                      <th>Süre</th>
                      <th>Kazanç</th>
                      <th>Durum</th>
                      <th>Müşteri puanı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrips.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link className="mono-id" to={`/admin/loads/${r.id.replace('YL-', '')}`}>
                            {r.id}
                          </Link>
                        </td>
                        <td>{r.route}</td>
                        <td>{r.date}</td>
                        <td>{r.duration}</td>
                        <td>{r.pay}</td>
                        <td>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              background: r.status === 'İptal' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.18)',
                              color: r.status === 'İptal' ? '#fecaca' : '#bbf7d0',
                              border: `1px solid ${r.status === 'İptal' ? 'rgba(248,113,113,0.4)' : 'rgba(74,222,128,0.35)'}`,
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td>{r.score ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="ad-paginator muted">
                  <span>Sayfa 1 / 1</span>
                  <div className="item-row">
                    <button type="button" className="btn btn-ghost btn-sm" disabled>
                      Önceki
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" disabled>
                      Sonraki
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'finance' ? (
            <div className="admin-card">
              <div className="ad-kpi-grid-4" style={{ marginBottom: 16 }}>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Toplam Kazanç</div>
                  <div className="kpi-value" style={{ background: 'linear-gradient(90deg,#fecaca,#f59e0b)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                    ₺125.000
                  </div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Cüzdan Bakiye</div>
                  <div className="kpi-value" style={{ color: '#fb923c' }}>
                    ₺3.200
                  </div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Bekleyen Bakiye</div>
                  <div className="kpi-value" style={{ color: '#fbbf24' }}>
                    ₺1.450
                  </div>
                </div>
                <div className="ad-glass-kpi">
                  <div className="kpi-label">Stopaj (örnek)</div>
                  <div className="kpi-value">%3</div>
                </div>
              </div>
              <h3 style={{ marginTop: 0 }}>Aylık kazanç</h3>
              <div className="ad-mini-chart" style={{ marginBottom: 16 }}>
                Örnek çubuk grafik — entegrasyon sonrası doldurulacak
              </div>
              <div className="admin-grid-2">
                <div className="admin-card">
                  <h4 style={{ marginTop: 0 }}>Vergi durumu</h4>
                  <p className="muted">Kurumsal</p>
                  <p className="muted">Vergi no: 12******01</p>
                  <p className="muted">Stopaj oranı: %3</p>
                </div>
                <div className="admin-card">
                  <h4 style={{ marginTop: 0 }}>IBAN</h4>
                  <p className="mono-id muted">TR12 **** **** **** **34 56</p>
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'docs' ? (
            <div className="ad-doc-grid">
              {[
                { t: 'Sürücü belgesi', s: 'Aktif', sc: 88 },
                { t: 'Src belgesi', s: 'Beklemede', sc: 71 },
                { t: 'Psikoteknik', s: 'Reddedildi', sc: 42 },
              ].map((d) => (
                <div key={d.t} className="ad-doc-card">
                  <strong>{d.t}</strong>
                  <span className="ad-stat-pill">{d.s}</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    Son güncelleme: 2026-05-01
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    Belge güven skoru: %{d.sc}
                  </span>
                  <div className="ad-doc-thumb">📄</div>
                  <div className="item-row" style={{ marginTop: 4 }}>
                    <button type="button" className="btn btn-primary btn-sm">
                      Detayı Gör
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => toast.info('Belge önizleme (örnek).')}>
                      İçeriği Görüntüle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === 'notes' ? (
            <div className="admin-card">
              <label className="form-group">
                <span className="form-label">Yeni not</span>
                <textarea className="form-input" rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Admin notu yazın…" />
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
                  setNotes((prev) => [
                    { id: String(Date.now()), admin: CURRENT_ADMIN, text: t, at: new Date().toLocaleString('tr-TR') },
                    ...prev,
                  ])
                  setNewNote('')
                  toast.success('Not kaydedildi.')
                }}
              >
                Notu Kaydet
              </button>
              <h3 style={{ marginTop: 24 }}>Geçmiş notlar</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {notes.map((n) => (
                  <li key={n.id} className="admin-card" style={{ marginBottom: 10, padding: 12 }}>
                    <div className="item-row">
                      <span className="muted" style={{ fontSize: 12 }}>
                        {n.at} — {n.admin}
                      </span>
                      {n.admin === CURRENT_ADMIN ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            void openConfirm({
                              title: 'Notu sil?',
                              description: 'Bu not kalıcı olarak listeden kaldırılır (örnek).',
                              variant: 'danger',
                              confirmText: 'Sil',
                            }).then((ok) => {
                              if (!ok) return
                              setNotes((p) => p.filter((x) => x.id !== n.id))
                              toast.warning('Not silindi.')
                            })
                          }}
                        >
                          Sil
                        </button>
                      ) : null}
                    </div>
                    <p style={{ margin: '8px 0 0' }}>{n.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="ad-sidebar">
          <strong>Hızlı aksiyonlar</strong>
          <button
            type="button"
            className={isActive ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
            onClick={() =>
              void openConfirm({
                title: isActive ? 'Hesabı askıya al?' : 'Hesabı aktifleştir?',
                description: isActive ? 'Şoför geçici olarak sisteme erişemez.' : 'Şoför yeniden erişim kazanır.',
                variant: isActive ? 'danger' : 'primary',
                confirmText: 'Devam Et',
              }).then((ok) => {
                if (!ok) return
                setIsActive(!isActive)
                toast.success(isActive ? 'Hesap askıya alındı.' : 'Hesap aktifleştirildi.')
              })
            }
          >
            {isActive ? '🔴 Askıya Al' : '🟢 Hesabı Aktif Et'}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => toast.info('Mesaj gönderimi (örnek).')}>
            📧 Mesaj Gönder
          </button>
          <button type="button" className="btn btn-warning btn-sm" onClick={() => toast.warning('Uyarı gönderildi (örnek).')}>
            ⚠️ Uyarı Gönder
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() =>
              void openConfirm({
                title: 'Hesabı sil',
                description: 'Bu işlem geri alınamaz.',
                variant: 'danger',
                irreversibleHint: true,
                requireTypeText: 'SİL',
                confirmText: 'Hesabı Sil',
              }).then((ok) => {
                if (!ok) return
                toast.error('Silme isteği kaydedildi (örnek).')
              })
            }
          >
            🚫 Hesabı Sil
          </button>
        </aside>
      </div>
    </div>
  )
}
