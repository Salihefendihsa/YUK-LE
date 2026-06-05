import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { Logo } from '../brand/Logo'
import './Sidebar.css'

interface NavItem {
  label: string
  path: string
  icon: string
}

const CUSTOMER_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/customer/dashboard', icon: '⊞' },
  { label: 'Analitik', path: '/customer/analytics', icon: '📈' },
  { label: 'İlanlarım', path: '/customer/loads', icon: '📦' },
  { label: 'Teklifler', path: '/customer/bids', icon: '💼' },
  { label: 'Sohbetlerim', path: '/customer/chats', icon: '💬' },
  { label: 'Canlı Harita', path: '/customer/track', icon: '🗺️' },
  { label: 'Geçmiş', path: '/customer/history', icon: '📋' },
  { label: 'Adreslerim', path: '/customer/addresses', icon: '📍' },
  { label: 'Profil', path: '/customer/profile', icon: '👤' },
]

const DRIVER_NAV: NavItem[] = [
  { label: 'Ana Ekran', path: '/driver/dashboard', icon: '🏠' },
  { label: 'Yük Panosu', path: '/driver/loads', icon: '📦' },
  { label: 'Tekliflerim', path: '/driver/bids', icon: '💼' },
  { label: 'Aktif Seferim', path: '/driver/active-load', icon: '🚛' },
  { label: 'Sohbetlerim', path: '/driver/chats', icon: '💬' },
  { label: 'Cüzdanım', path: '/driver/wallet', icon: '💰' },
  { label: 'Belgelerim', path: '/driver/documents', icon: '📄' },
  { label: 'Profilim', path: '/driver/profile', icon: '👤' },
]

const ADMIN_NAV: NavItem[] = [
  { label: '📊 Genel Bakış', path: '/admin/dashboard', icon: '📊' },
  { label: '📄 Belge Kuyruğu', path: '/admin/reviews', icon: '📄' },
  { label: '🚛 Şoförler', path: '/admin/drivers', icon: '🚛' },
  { label: '🏢 Müşteriler', path: '/admin/customers', icon: '🏢' },
  { label: '📦 İlanlar', path: '/admin/loads', icon: '📦' },
  { label: '💬 Tüm Sohbetler', path: '/admin/chats', icon: '💬' },
  { label: '💳 Ödemeler', path: '/admin/payments', icon: '💳' },
  { label: '👥 Tüm Kullanıcılar', path: '/admin/users', icon: '👥' },
  { label: '🔧 Sistem Durumu', path: '/admin/system', icon: '🔧' },
  { label: '📋 Loglar', path: '/admin/logs', icon: '📋' },
  { label: '📡 Canlı Takip', path: '/admin/tracking', icon: '📡' },
  { label: '⭐ Puanlar', path: '/admin/ratings', icon: '⭐' },
]

function settingsPath(role: string | undefined) {
  if (role === 'Customer') return '/customer/settings'
  if (role === 'Driver') return '/driver/settings'
  return '/admin/settings'
}

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
}

export default function Sidebar({ collapsed, mobileOpen }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const navItems =
    user?.role === 'Driver' ? DRIVER_NAV : user?.role === 'Admin' ? ADMIN_NAV : CUSTOMER_NAV

  const roleLabel =
    user?.role === 'Customer' ? 'Müşteri' : user?.role === 'Driver' ? 'Şoför' : 'Yönetici'

  const bottomNav: NavItem[] = [{ label: 'Ayarlar', path: settingsPath(user?.role), icon: '⚙️' }]

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <Logo variant={collapsed ? 'mark' : 'full'} size="sm" theme="dark" />
        {!collapsed ? (
          <span className="logo-panel-tag">
            {user?.role === 'Customer' && 'Müşteri Paneli'}
            {user?.role === 'Driver' && 'Şoför Paneli'}
            {user?.role === 'Admin' && 'Yönetici'}
          </span>
        ) : null}
      </div>

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
          {bottomNav.map((item) => (
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

        {user?.role === 'Customer' && !collapsed ? (
          <div className="sidebar-mobile-promo card">
            <p className="sidebar-mobile-promo-title">📱 Mobil uygulamayı indir</p>
            <p className="muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
              QR ile hızlı erişim
            </p>
            <div className="sidebar-qr-placeholder" aria-hidden>
              ▣▢▣▢
              <br />
              ▢▣▢▣
            </div>
            <div className="sidebar-store-row">
              <span className="store-pill">App Store</span>
              <span className="store-pill">Google Play</span>
            </div>
          </div>
        ) : null}
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">{user?.fullName?.[0]?.toUpperCase() ?? 'U'}</div>
        {!collapsed && (
          <div className="user-info">
            <p className="user-name">{user?.fullName ?? 'Kullanıcı'}</p>
            <span className="badge badge-muted" style={{ fontSize: 10 }}>
              {roleLabel}
            </span>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout} title="Çıkış Yap" aria-label="Çıkış Yap">
          ⏻
        </button>
      </div>
    </aside>
  )
}
