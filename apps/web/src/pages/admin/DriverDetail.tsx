import { useParams } from 'react-router-dom'
import './AdminPanel.css'

export default function AdminDriverDetailPage() {
  const { id } = useParams()

  return (
    <div className="admin-page">
      <h1 className="admin-title">Şoför Detayı #{id}</h1>
      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Genel Bakış</h3>
          <p>Toplam sefer: 0</p>
          <p>Toplam taşınan yük: 0 ton</p>
          <p>Toplam kazanç: ₺0</p>
          <p>Ortalama teslim süresi: 0 saat</p>
        </div>
        <div className="admin-card">
          <h3>Admin İşlem Paneli</h3>
          <button className="btn btn-primary btn-sm">Aktif / Askıya Al</button>{' '}
          <button className="btn btn-danger btn-sm">Hesabı Sil</button>
          <textarea className="form-input" style={{ marginTop: 10 }} placeholder="Admin notu ekle" />
        </div>
      </div>
      <div className="admin-card"><h3>Sefer Geçmişi</h3><div className="empty-state">📦 Sefer verisi burada listelenecek.</div></div>
      <div className="admin-card"><h3>Finansal</h3><div className="empty-state">💰 Ödeme geçmişi burada listelenecek.</div></div>
      <div className="admin-card"><h3>Belgeler</h3><div className="empty-state">📄 Belge analiz ve geçmiş burada gösterilecek.</div></div>
      <div className="admin-card"><h3>Sohbet Geçmişi</h3><div className="empty-state">💬 Konuşmalar burada listelenecek.</div></div>
      <div className="admin-card"><h3>Uyarılar & Şikayetler</h3><div className="empty-state">⚠️ Şikayet ve admin notları burada gösterilecek.</div></div>
    </div>
  )
}
