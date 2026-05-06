import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import './AppLayout.css'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="app-main">
        <TopBar onMenuToggle={() => setCollapsed(c => !c)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
