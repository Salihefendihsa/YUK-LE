import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import './Sidebar.css'

interface NavItem {
  label: string
  path: string
  icon: string
}

const CUSTOMER_NAV: NavItem[] = [
  { label: 'Dashboard',   path: '/customer/dashboard', icon: '⊞' },
  { label: 'İlanlarım',   path: '/customer/loads',     icon: '📦' },
  { label: 'Teklifler',   path: '/customer/bids',      icon: '💼' },
  { label: 'Canlı Harita',path: '/customer/track',     icon: '🗺️' },
  { label: 'Geçmiş',     path: '/customer/history',   icon: '📋' },
  { label: 'Adreslerim', path: '/customer/addresses', icon: '📍' },
  { label: 'Profil', path: '/customer/profile', icon: '👤' },
]

const DRIVER_NAV: NavItem[] = [
  { label: 'Ana Ekran', path: '/driver/dashboard', icon: '🏠' },
  { label: 'Yük Panosu', path: '/driver/loads', icon: '📦' },
  { label: 'Aktif Seferim', path: '/driver/active-load', icon: '🚛' },
  { label: 'Belgelerim', path: '/driver/documents', icon: '📄' },
  { label: 'Cüzdanım', path: '/driver/wallet', icon: '💰' },
  { label: 'Profilim', path: '/driver/profile', icon: '👤' },
]

const ADMIN_NAV: NavItem[] = [
  { label: '📊 Genel Bakış', path: '/admin/dashboard', icon: '📊' },
  { label: '📄 Belge Kuyruğu', path: '/admin/reviews', icon: '📄' },
  { label: '🚛 Şoförler', path: '/admin/drivers', icon: '🚛' },
  { label: '🏭 Müşteriler', path: '/admin/customers', icon: '🏭' },
  { label: '📦 İlanlar', path: '/admin/loads', icon: '📦' },
  { label: '💬 Sohbetler', path: '/admin/chats', icon: '💬' },
  { label: '💳 Ödemeler', path: '/admin/payments', icon: '💳' },
  { label: '👥 Tüm Kullanıcılar', path: '/admin/users', icon: '👥' },
  { label: '🔧 Sistem Durumu', path: '/admin/system', icon: '🔧' },
  { label: '📋 Loglar', path: '/admin/logs', icon: '📋' },
  { label: '📡 Canlı Takip', path: '/admin/tracking', icon: '📡' },
  { label: '⭐ Puanlar', path: '/admin/ratings', icon: '⭐' },
]

const BOTTOM_NAV: NavItem[] = [
  { label: 'Ayarlar', path: '/admin/settings', icon: '⚙️' },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, mobileOpen, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const navItems =
    user?.role === 'Driver'  ? DRIVER_NAV  :
    user?.role === 'Admin'   ? ADMIN_NAV   :
    CUSTOMER_NAV

  const roleLabel =
    user?.role === 'Customer' ? 'Fabrika' :
    user?.role === 'Driver'   ? 'Şoför'   : 'Admin'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''} ${user?.role === 'Admin' ? 'admin-mode' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 12L12 4L21 12V20H15V15H9V20H3V12Z" fill={user?.role === 'Admin' ? '#EF4444' : 'var(--color-brand)'} />
          </svg>
        </div>
        {!collapsed && <span className="logo-text">YÜK-LE</span>}
        <button className="collapse-btn" onClick={onToggle} aria-label="Menüyü daralt">
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar-divider" />

        <ul>
          {BOTTOM_NAV.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-avatar">
          {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
        </div>
        {!collapsed && (
          <div className="user-info">
            <p className="user-name">{user?.fullName ?? 'Kullanıcı'}</p>
            <span className="badge badge-muted" style={{ fontSize: 10 }}>{roleLabel}</span>
          </div>
        )}
        <button
          className="logout-btn"
          onClick={handleLogout}
          title="Çıkış Yap"
          aria-label="Çıkış Yap"
        >
          ⏻
        </button>
      </div>
    </aside>
  )
}
