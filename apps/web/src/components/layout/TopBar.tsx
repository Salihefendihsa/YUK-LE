import { useAuthStore } from '../../store/auth.store'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getNotifications, getUnreadCount, markNotificationRead, readAllNotifications } from '../../api/notifications'
import './TopBar.css'

interface TopBarProps {
  onMenuToggle: () => void
  pageTitle: string
}

type NotifyRow = { id?: number; title?: string; message?: string; isRead?: boolean }

function notifyCategory(title: string): 'loads' | 'payments' | 'messages' | 'alerts' {
  const t = title.toLowerCase()
  if (t.includes('ödeme') || t.includes('payment') || t.includes('cüzdan')) return 'payments'
  if (t.includes('mesaj') || t.includes('sohbet') || t.includes('chat')) return 'messages'
  if (t.includes('uyarı') || t.includes('şikayet') || t.includes('iptal')) return 'alerts'
  return 'loads'
}

export default function TopBar({ onMenuToggle, pageTitle }: TopBarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotifyRow[]>([])
  const [unread, setUnread] = useState(0)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<'all' | 'loads' | 'payments' | 'messages' | 'alerts'>('all')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Tema tek koyu görünüme sabit — tema değiştirme kaldırıldı.
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const cnt = await getUnreadCount()
        setUnread(cnt.count ?? 0)
        const data = await getNotifications(1, 40)
        const raw = (data.items ?? data.Items ?? []) as NotifyRow[]
        setItems(Array.isArray(raw) ? raw : [])
      } catch {
        // ignore
      }
    }
    void load()
    const timer = setInterval(() => {
      void load()
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Günaydın'
    if (h < 18) return 'İyi günler'
    return 'İyi akşamlar'
  }

  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? 'Kullanıcı'

  const roleBadge =
    user?.role === 'Customer' ? 'Müşteri' : user?.role === 'Driver' ? 'Şoför' : 'Admin'

  const settingsPath =
    user?.role === 'Customer' ? '/customer/settings' : user?.role === 'Driver' ? '/driver/settings' : '/admin/settings'

  const profilePath =
    user?.role === 'Customer' ? '/customer/profile' : user?.role === 'Driver' ? '/driver/profile' : '/admin/dashboard'

  const filteredNotify = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items.filter((n) => {
      const title = String(n.title ?? '')
      const c = notifyCategory(title)
      if (cat !== 'all' && c !== cat) return false
      if (!s) return true
      return title.toLowerCase().includes(s) || String(n.message ?? '').toLowerCase().includes(s)
    })
  }, [items, q, cat])

  function notifyIcon(title: string) {
    const c = notifyCategory(title)
    if (c === 'payments') return '💰'
    if (c === 'messages') return '💬'
    if (c === 'alerts') return '⚠️'
    return '📦'
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={onMenuToggle} aria-label="Menü">
          ☰
        </button>
        <h1 className="topbar-page-title">{pageTitle}</h1>
      </div>

      <div className="topbar-center">
        <label className="topbar-search" aria-label="Ara">
          <span className="topbar-search-icon" aria-hidden>
            🔍
          </span>
          <input type="search" placeholder="Panel içinde ara…" className="topbar-search-input" />
        </label>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" aria-label="Bildirimler" title="Bildirimler" onClick={() => setOpen(true)} style={{ position: 'relative' }}>
          🔔
          {unread > 0 ? (
            <span className="topbar-unread-badge">{unread > 99 ? '99+' : unread}</span>
          ) : null}
        </button>
        <div className="topbar-profile-wrap" ref={profileRef}>
          <button
            type="button"
            className="topbar-avatar"
            aria-expanded={profileOpen}
            aria-haspopup="true"
            onClick={(e) => {
              e.stopPropagation()
              setProfileOpen((v) => !v)
            }}
          >
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </button>
          {profileOpen ? (
            <div className="topbar-profile-menu card" role="menu">
              <div className="topbar-profile-head">
                <div className="topbar-avatar topbar-avatar--lg">{user?.fullName?.[0]?.toUpperCase() ?? 'U'}</div>
                <div>
                  <p className="topbar-profile-name">{user?.fullName ?? 'Kullanıcı'}</p>
                  <span className="topbar-role-badge">{roleBadge}</span>
                </div>
              </div>
              <p className="topbar-profile-greet muted" style={{ fontSize: 13 }}>
                {greeting()}, {firstName}
              </p>
              <Link to={profilePath} className="topbar-menu-link" onClick={() => setProfileOpen(false)}>
                Profil
              </Link>
              <Link to={settingsPath} className="topbar-menu-link" onClick={() => setProfileOpen(false)}>
                Ayarlar
              </Link>
              <button
                type="button"
                className="topbar-menu-link topbar-menu-link--danger"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
                Çıkış
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {open ? (
        <>
          <div className="topbar-notify-backdrop" onClick={() => setOpen(false)} />
          <aside className="topbar-notify-panel notify-drawer">
            <div className="notify-drawer-head">
              <strong>Bildirimler</strong>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  void readAllNotifications()
                  setUnread(0)
                }}
              >
                Tümünü okundu
              </button>
            </div>
            <input
              type="search"
              className="notify-drawer-search"
              placeholder="Bildirimlerde ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="notify-cats" role="tablist">
              {(
                [
                  ['all', 'Tümü'],
                  ['loads', '📦 İlanlar'],
                  ['payments', '💰 Ödemeler'],
                  ['messages', '💬 Mesajlar'],
                  ['alerts', '⚠️ Uyarılar'],
                ] as const
              ).map(([k, lab]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  className={`notify-cat ${cat === k ? 'active' : ''}`}
                  onClick={() => setCat(k)}
                >
                  {lab}
                </button>
              ))}
            </div>
            <div className="notify-list">
              {filteredNotify.length === 0 ? (
                <div className="empty-state">🔔 Sonuç yok</div>
              ) : (
                filteredNotify.map((n) => (
                  <button
                    key={String(n.id)}
                    type="button"
                    className="topbar-notify-item glass-notify"
                    onClick={() => {
                      if (n.id != null) void markNotificationRead(Number(n.id))
                    }}
                  >
                    <span className="topbar-notify-icon" aria-hidden>
                      {notifyIcon(String(n.title ?? ''))}
                    </span>
                    <span>
                      <strong>{String(n.title ?? 'Bildirim')}</strong>
                      <p className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                        {String(n.message ?? '')}
                      </p>
                    </span>
                    {!n.isRead ? <span className="topbar-notify-dot" aria-hidden /> : <span style={{ width: 8 }} />}
                  </button>
                ))
              )}
            </div>
          </aside>
        </>
      ) : null}
    </header>
  )
}
