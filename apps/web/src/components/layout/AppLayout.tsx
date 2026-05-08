import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Footer from './Footer'
import './AppLayout.css'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(window.innerWidth >= 768 && window.innerWidth <= 1024)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const titleMap: Record<string, string> = {
    '/customer/dashboard': 'Müşteri Paneli | YÜK-LE',
    '/customer/loads': 'İlanlarım | YÜK-LE',
    '/customer/addresses': 'Teslimat Adresleri | YÜK-LE',
    '/driver/dashboard': 'Şoför Paneli | YÜK-LE',
    '/driver/wallet': 'Cüzdanım | YÜK-LE',
    '/admin/dashboard': 'Admin Paneli | YÜK-LE',
    '/admin/tracking': 'Canlı Takip | YÜK-LE',
    '/admin/ratings': 'Puanlama Yönetimi | YÜK-LE',
  }

  useEffect(() => {
    document.title = titleMap[location.pathname] ?? 'YÜK-LE'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'YÜK-LE dijital lojistik platformu ile güvenli yük taşıma, teklif ve takip hizmetleri.')
  }, [location.pathname])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(false)
      } else if (window.innerWidth <= 1024) {
        setCollapsed(true)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onToggle={() => setCollapsed(c => !c)} />
      {mobileOpen ? <div className="mobile-overlay" onClick={() => setMobileOpen(false)} /> : null}
      <div className="app-main">
        <TopBar onMenuToggle={() => (window.innerWidth < 768 ? setMobileOpen((s) => !s) : setCollapsed(c => !c))} />
        <main className="app-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
