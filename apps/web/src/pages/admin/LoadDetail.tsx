import { useParams } from 'react-router-dom'
import './AdminPanel.css'

export default function AdminLoadDetailPage() {
  const { id } = useParams()
  return (
    <div className="admin-page">
      <h1 className="admin-title">İlan Detayı #{id}</h1>
      <div className="admin-card"><h3>Yük Bilgileri</h3><p className="muted">Tüm ilan bilgileri burada gösterilecek.</p></div>
      <div className="admin-grid-2">
        <div className="admin-card"><h3>Harita Placeholder</h3><div className="empty-state">🗺️ Güzergah haritası yakında aktif olacak.</div></div>
        <div className="admin-card"><h3>Durum Timeline</h3><p>Oluşturuldu → Teklif Alındı → Atandı → Yolda → Teslim</p></div>
      </div>
      <div className="admin-card"><h3>Teklifler</h3><div className="empty-state">⭐ Teklif listesi burada gösterilecek.</div></div>
      <div className="admin-card"><h3>Ödeme Kaydı</h3><div className="empty-state">💳 İlgili ödeme kaydı burada gösterilecek.</div></div>
    </div>
  )
}
