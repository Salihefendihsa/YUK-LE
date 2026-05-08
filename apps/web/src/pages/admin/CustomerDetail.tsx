import { useParams } from 'react-router-dom'
import './AdminPanel.css'

export default function AdminCustomerDetailPage() {
  const { id } = useParams()
  return (
    <div className="admin-page">
      <h1 className="admin-title">Müşteri Detayı #{id}</h1>
      <div className="admin-card"><h3>Genel Bakış</h3><p>Toplam ilan: 0</p><p>Tamamlanan sefer: 0</p><p>Toplam harcama: ₺0</p></div>
      <div className="admin-card"><h3>İlan Geçmişi</h3><div className="empty-state">📦 İlan listesi burada yer alacak.</div></div>
      <div className="admin-card"><h3>Ödeme Geçmişi</h3><div className="empty-state">💰 Ödemeler burada yer alacak.</div></div>
      <div className="admin-card"><h3>Sohbet Geçmişi</h3><div className="empty-state">💬 Konuşmalar burada yer alacak.</div></div>
      <div className="admin-card"><h3>Şikayetler & Notlar</h3><div className="empty-state">⚠️ Şikayetler burada yer alacak.</div></div>
    </div>
  )
}
