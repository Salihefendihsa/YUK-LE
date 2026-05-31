import './AdminPanel.css'

export default function AdminSettingsPage() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">Admin Profil & Ayarlar</h1>
      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Admin Bilgileri</h3>
          <div className="form-grid">
            <input className="form-input" placeholder="Ad Soyad" defaultValue="Admin Kullanıcı" />
            <input className="form-input" placeholder="Email" defaultValue="admin@navlonix.com" />
          </div>
        </div>
        <div className="admin-card">
          <h3>Şifre Değiştir</h3>
          <div className="form-grid">
            <input className="form-input" type="password" placeholder="Mevcut şifre" />
            <input className="form-input" type="password" placeholder="Yeni şifre" />
            <input className="form-input" type="password" placeholder="Yeni şifre tekrar" />
          </div>
        </div>
      </div>
      <div className="admin-card">
        <h3>Bildirim Tercihleri</h3>
        <label className="checkbox-row"><input type="checkbox" defaultChecked /> Yeni belge gelince email</label>
        <label className="checkbox-row"><input type="checkbox" defaultChecked /> Şüpheli aktivite uyarısı</label>
        <label className="checkbox-row"><input type="checkbox" /> Günlük özet raporu</label>
        <p className="muted">2FA: yakında aktif olacak (placeholder).</p>
      </div>
    </div>
  )
}
