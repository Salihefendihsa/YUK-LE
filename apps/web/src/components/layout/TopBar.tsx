import { useAuthStore } from '../../store/auth.store'
import { useEffect, useState } from 'react'
import { getNotifications, getUnreadCount, markNotificationRead, readAllNotifications } from '../../api/notifications'
import './TopBar.css'

interface TopBarProps {
  onMenuToggle: () => void
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const cnt = await getUnreadCount()
        setUnread(cnt.count ?? 0)
        const data = await getNotifications(1, 20)
        setItems((data.items ?? data.Items ?? []) as Array<Record<string, unknown>>)
      } catch {
        // ignore
      }
    }
    void load()
    const timer = setInterval(() => { void load() }, 10000)
    return () => clearInterval(timer)
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Günaydın'
    if (h < 18) return 'İyi günler'
    return 'İyi akşamlar'
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={onMenuToggle} aria-label="Menü">
          ☰
        </button>
        <p className="topbar-greeting">
          {greeting()}, <strong>{user?.fullName ?? 'Kullanıcı'}</strong>
        </p>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" aria-label="Bildirimler" title="Bildirimler" onClick={() => setOpen(true)} style={{ position: 'relative' }}>
          🔔
          {unread > 0 ? <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 999 }}>{unread > 99 ? '99+' : unread}</span> : null}
        </button>
        <div className="topbar-avatar">
          {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>
      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 299 }} />
          <aside style={{ position: 'fixed', top: 0, right: 0, width: 380, height: '100vh', background: '#111318', borderLeft: '1px solid #272D3A', zIndex: 300, padding: 14, overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Bildirimler</strong>
              <button className="btn btn-ghost btn-sm" onClick={() => void readAllNotifications()}>Tümünü Okundu İşaretle</button>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {items.length === 0 ? <div className="empty-state">🔔 Henüz bildiriminiz yok</div> : items.map((n) => (
                <button
                  key={String(n.id)}
                  className="admin-card"
                  onClick={() => void markNotificationRead(Number(n.id))}
                  style={{ textAlign: 'left' }}
                >
                  <strong>{String(n.title ?? 'Bildirim')}</strong>
                  <p className="muted">{String(n.message ?? '')}</p>
                </button>
              ))}
            </div>
          </aside>
        </>
      ) : null}
    </header>
  )
}
