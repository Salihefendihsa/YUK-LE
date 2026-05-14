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
    '/customer/dashboard': 'Genel Bakış | YÜK-LE',
    '/customer/loads': 'İlanlarım | YÜK-LE',
    '/customer/loads/create': 'Yeni İlan | YÜK-LE',
    '/customer/addresses': 'Belgelerim | YÜK-LE',
    '/customer/wallet': 'Cüzdan | YÜK-LE',
    '/customer/history': 'Geçmiş | YÜK-LE',
    '/customer/profile': 'Profil | YÜK-LE',
    '/customer/chats': 'Sohbetlerim | YÜK-LE',
    '/customer/settings': 'Ayarlar | YÜK-LE',
    '/customer/analytics': 'Analitik | YÜK-LE',
    '/customer/bids': 'Teklifler | YÜK-LE',
    '/customer/track': 'Canlı Harita | YÜK-LE',
    '/driver/dashboard': 'Genel Bakış | YÜK-LE',
    '/driver/wallet': 'Cüzdan | YÜK-LE',
    '/driver/history': 'Geçmiş | YÜK-LE',
    '/driver/profile': 'Profil | YÜK-LE',
    '/driver/chats': 'Sohbetlerim | YÜK-LE',
    '/driver/settings': 'Ayarlar | YÜK-LE',
    '/admin/dashboard': 'Admin Paneli | YÜK-LE',
    '/admin/tracking': 'Canlı Takip | YÜK-LE',
    '/admin/ratings': 'Puanlama Yönetimi | YÜK-LE',
    '/admin/chats': 'Tüm Sohbetler | YÜK-LE',
    '/admin/settings': 'Ayarlar | YÜK-LE',
  }

  const pageTitle = useMemo(() => {
    const full = titleMap[location.pathname]
    if (!full) {
      const seg = location.pathname.split('/').filter(Boolean).pop()
      return seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : 'Panel'
    }
    return full.split('|')[0]?.trim() ?? 'Panel'
  }, [location.pathname])

  useEffect(() => {
    document.title = titleMap[location.pathname] ?? 'YÜK-LE'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'YÜK-LE dijital lojistik platformu ile güvenli yük taşıma, teklif ve takip hizmetleri.')
  }, [location.pathname])

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
      <span className="shell-orb shell-orb--1" aria-hidden />
      <span className="shell-orb shell-orb--2" aria-hidden />
      <span className="shell-orb shell-orb--3" aria-hidden />
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
