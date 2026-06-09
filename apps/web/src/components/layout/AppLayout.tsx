import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import ErrorBoundary from '../ErrorBoundary'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Footer from './Footer'
import CommandPalette from './CommandPalette'
import KeyboardShortcutsModal from './KeyboardShortcutsModal'
import FloatingSupportChat from './FloatingSupportChat'
import { useAuthStore } from '../../store/auth.store'
import './AppLayout.css'
import '../../styles/app-shell-theme.css'

const SIDEBAR_COLLAPSED_KEY = 'yukle-sidebar-collapsed'

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export default function AppLayout() {
  const { user } = useAuthStore()
  const appRole = user?.role === 'Customer' ? 'customer' : user?.role === 'Driver' ? 'driver' : 'admin'
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    if (window.innerWidth < 768) return false
    return readSidebarCollapsed()
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const titleMap: Record<string, string> = {
    '/customer/dashboard': 'Genel Bakış | Navlonix',
    '/customer/loads': 'İlanlarım | Navlonix',
    '/customer/loads/create': 'Yeni İlan | Navlonix',
    '/customer/addresses': 'Belgelerim | Navlonix',
    '/customer/wallet': 'Cüzdan | Navlonix',
    '/customer/history': 'Geçmiş | Navlonix',
    '/customer/profile': 'Profil | Navlonix',
    '/customer/chats': 'Sohbetlerim | Navlonix',
    '/customer/support': 'Taleplerim | Navlonix',
    '/customer/settings': 'Ayarlar | Navlonix',
    '/customer/analytics': 'Analitik | Navlonix',
    '/customer/bids': 'Teklifler | Navlonix',
    '/customer/listing-offers': 'Boş Araç Tekliflerim | Navlonix',
    '/customer/track': 'Canlı Takip | Navlonix',
    '/driver/dashboard': 'Genel Bakış | Navlonix',
    '/driver/loads': 'Yükler | Navlonix',
    '/driver/bids': 'Teklifler | Navlonix',
    '/driver/active-load': 'Aktif Sefer | Navlonix',
    '/driver/documents': 'Belgelerim | Navlonix',
    '/driver/track': 'Canlı Takip | Navlonix',
    '/driver/wallet': 'Cüzdan | Navlonix',
    '/driver/history': 'Geçmiş | Navlonix',
    '/driver/profile': 'Profil | Navlonix',
    '/driver/chats': 'Sohbetlerim | Navlonix',
    '/driver/support': 'Taleplerim | Navlonix',
    '/driver/settings': 'Ayarlar | Navlonix',
    '/admin/dashboard': 'Admin Paneli | Navlonix',
    '/admin/drivers': 'Şoförler | Navlonix',
    '/admin/customers': 'Müşteriler | Navlonix',
    '/admin/loads': 'İlanlar | Navlonix',
    '/admin/driver-listings': 'Boş Araç İlanları | Navlonix',
    '/admin/users': 'Kullanıcılar | Navlonix',
    '/admin/payments': 'Ödemeler | Navlonix',
    '/admin/tracking': 'Canlı Takip | Navlonix',
    '/admin/ratings': 'Puanlama Yönetimi | Navlonix',
    '/admin/chats': 'Tüm Sohbetler | Navlonix',
    '/admin/support': 'Destek Talepleri | Navlonix',
    '/admin/settings': 'Ayarlar | Navlonix',
  }

  const pageTitle = useMemo(() => {
    const full = titleMap[location.pathname]
    if (full) return full.split('|')[0]?.trim() ?? 'Panel'

    const segs = location.pathname.split('/').filter(Boolean)
    const last = segs[segs.length - 1] ?? ''
    // Ham GUID'i başlık olarak gösterme (ör. /customer/loads/56d2d8c0-...)
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last)
    if (isGuid) {
      if (location.pathname.includes('/loads/')) return 'Yük Detayı'
      return 'Detay'
    }
    return last ? last.charAt(0).toUpperCase() + last.slice(1) : 'Panel'
  }, [location.pathname])

  useEffect(() => {
    document.title = `${pageTitle} | Navlonix`
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'Navlonix dijital lojistik platformu ile güvenli yük taşıma, teklif ve takip hizmetleri.')
  }, [location.pathname, pageTitle])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShortcutsOpen(true)
      }
      if (e.key === 'Escape') setShortcutsOpen(false)
      const role = user?.role
      if (role === 'Customer') {
        if (e.key === 'n' || e.key === 'N') navigate('/customer/loads/create')
        if (e.key === 'i' || e.key === 'I') navigate('/customer/loads')
        if (e.key === 'c' || e.key === 'C') navigate('/customer/profile')
      }
      if (role === 'Driver') {
        if (e.key === 'n' || e.key === 'N') navigate('/driver/loads')
        if (e.key === 'i' || e.key === 'I') navigate('/driver/loads')
        if (e.key === 'c' || e.key === 'C') navigate('/driver/wallet')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, user?.role])

  const onMenuToggle = () => {
    if (window.innerWidth < 768) {
      setMobileOpen((s) => !s)
      return
    }
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`} data-app-role={appRole}>
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} />
      {mobileOpen ? <div className="mobile-overlay" onClick={() => setMobileOpen(false)} /> : null}
      <div className="app-main">
        <TopBar onMenuToggle={onMenuToggle} pageTitle={pageTitle} />
        <main className="app-content">
          <ErrorBoundary>
            <div className="app-outlet-wrap" key={location.pathname}>
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
      <CommandPalette />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <FloatingSupportChat />
    </div>
  )
}
