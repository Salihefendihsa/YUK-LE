import { Link } from 'react-router-dom'
import './AdminPanel.css'

export default function AdminDocumentsPage() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">Belgeler</h1>
      <div className="admin-card">
        <p>Belge değerlendirme işlemleri için bu ekran kullanılır.</p>
        <Link to="/admin/reviews" className="btn btn-danger btn-sm">Belge Kuyruğu'na Git</Link>
      </div>
    </div>
  )
}
