import { useAuthStore } from '../../store/auth.store'
import './TopBar.css'

interface TopBarProps {
  onMenuToggle: () => void
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { user } = useAuthStore()

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
          {greeting()}, <strong>{user?.fullName?.split(' ')[0] ?? 'Kullanıcı'}</strong>
        </p>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" aria-label="Bildirimler" title="Bildirimler">
          🔔
        </button>
        <div className="topbar-avatar">
          {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  )
}
