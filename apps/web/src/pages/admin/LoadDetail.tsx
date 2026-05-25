import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageSkeleton } from '../../components/common/PageStates'
import { openConfirm } from '@/components/common/ConfirmModal'
import { toast } from '@/components/common/Toast'
import './AdminPanel.css'
import '../../styles/overlays.css'

const MOCK_OFFERS = [
  { id: 1, driver: 'Mehmet K.', amount: '₺9.200', status: 'Bekliyor' },
  { id: 2, driver: 'Ali T.', amount: '₺8.750', status: 'Reddedildi' },
]

export default function AdminLoadDetailPage() {
  const { id } = useParams()
  const [ready, setReady] = useState(false)
  const [adminNote, setAdminNote] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 380)
    return () => window.clearTimeout(t)
  }, [id])

  if (!ready) return <PageSkeleton rows={10} variant="card" />

  return (
    <div className="admin-page">
      <nav className="ad-load-breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/dashboard">Admin</Link>
        {' / '}
        <Link to="/admin/loads">İlanlar</Link>
        {' / '}
        <span className="mono-id">#{id}</span>
      </nav>

      <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
        Örnek veri — canlı API bağlantısı sonraki sürümde
      </p>
      <div className="item-row" style={{ flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <h1 className="admin-title mono-id" style={{ margin: 0, fontSize: 28 }}>
          Yük #{id}
        </h1>
        <span className="ad-badge-pulse">Atandı</span>
      </div>

      <div className="ad-load-grid">
        <div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>Yük bilgileri</h3>
            <p className="muted">Ağırlık: 24 ton · Tip: Paletli kuru yük</p>
            <p className="muted">Yükleme: İstanbul Pendik · Boşaltma: Ankara Ostim</p>
            <p className="muted">Zaman penceresi: 2026-05-16 — 2026-05-18</p>
          </div>
          <div className="admin-card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Güzergah haritası</h3>
            <div className="empty-state" style={{ minHeight: 200 }}>
              🗺️ Harita yer tutucu — entegrasyon sonrası aktif olacak
            </div>
          </div>
          <div className="admin-card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Yük özellikleri</h3>
            <div className="ad-data-table-wrap">
              <table className="ad-data-table">
                <thead>
                  <tr>
                    <th>Özellik</th>
                    <th>Değer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ADR</td>
                    <td>Hayır</td>
                  </tr>
                  <tr>
                    <td>Liftli</td>
                    <td>Evet</td>
                  </tr>
                  <tr>
                    <td>Frigo</td>
                    <td>Hayır</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="admin-card">
            <h3 style={{ marginTop: 0 }}>Müşteri</h3>
            <p>
              <Link to="/admin/customers/12" style={{ fontWeight: 800, color: '#fecaca' }}>
                Atlas Lojistik A.Ş.
              </Link>
            </p>
            <p className="muted">İletişim maskeli — detay müşteri kartında</p>
          </div>
          <div className="admin-card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Şoför</h3>
            <p>
              <Link to="/admin/drivers/44" style={{ fontWeight: 800, color: '#fecaca' }}>
                Ahmet Yılmaz
              </Link>
            </p>
            <p className="muted">Atama onaylı</p>
          </div>
          <div className="admin-card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Fiyat</h3>
            <p className="muted" style={{ marginBottom: 4 }}>
              Anlaşılan fiyat
            </p>
            <p className="kpi-value" style={{ margin: '0 0 12px', fontSize: 32 }}>
              ₺8.900
            </p>
            <p className="muted" style={{ marginBottom: 4 }}>
              Önerilen fiyat
            </p>
            <p className="kpi-value" style={{ margin: 0, fontSize: 22, color: '#94a3b8' }}>
              ₺8.400
            </p>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Tüm teklifler</h3>
        <div className="ad-data-table-wrap">
          <table className="ad-data-table">
            <thead>
              <tr>
                <th>Şoför</th>
                <th>Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_OFFERS.map((o) => (
                <tr key={o.id}>
                  <td>{o.driver}</td>
                  <td>{o.amount}</td>
                  <td>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Durum zaman çizelgesi</h3>
        <ol style={{ margin: 0, paddingLeft: 18, color: 'rgba(226,232,240,0.9)' }}>
          <li>Oluşturuldu — 2026-05-10 09:12</li>
          <li>Teklifler alındı — 2026-05-10 14:00</li>
          <li>Şoför atandı — 2026-05-11 08:30</li>
          <li>Yolda — 2026-05-12 06:00</li>
        </ol>
      </div>

      <div className="admin-card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Admin notları</h3>
        <textarea className="form-input" rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="İlan ile ilgili not…" />
        <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => toast.success('Not kaydedildi (örnek).')}>
          Notu Kaydet
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() =>
            void openConfirm({
              title: 'İlanı iptal et',
              description: 'Bu ilan iptal edilecek ve taraflar bilgilendirilecek (örnek).',
              variant: 'danger',
              irreversibleHint: true,
              confirmText: 'İlanı İptal Et',
            }).then((ok) => {
              if (!ok) return
              toast.warning('İlan iptal akışı tetiklendi (örnek).')
            })
          }
        >
          İlanı İptal Et
        </button>
      </div>
    </div>
  )
}
