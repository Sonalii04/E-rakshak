import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import { classNames } from '../utils/formatters'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0B1120]">
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-primary-900/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-full w-64">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className={classNames('flex min-h-screen flex-col transition-all duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="page-transition flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
