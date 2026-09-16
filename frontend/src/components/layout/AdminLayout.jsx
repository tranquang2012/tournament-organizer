import { useState } from 'react'
import { useSmartHeader } from '../../hooks/useSmartHeader'
import { Outlet } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from './AdminSidebar'
import AdminAIChatbot from '../admin_dashboard/AdminAIChatbot'

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const headerHidden = useSmartHeader({ enabled: !mobileOpen })

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-h-screen md:ml-0">
        <div className="md:hidden h-16 shrink-0" aria-hidden="true" />
        <header className={`md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-[#123836] text-white shadow-md transition-[translate] duration-300 ease-out ${headerHidden ? '-translate-y-full pointer-events-none' : ''}`}>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 border-none cursor-pointer text-white"
          >
            <FontAwesomeIcon icon={faBars} className="text-xl" />
          </button>
          <span className="font-bold text-sm tracking-[2px] uppercase">Netcompany</span>
        </header>
        <main
          className={`flex-1 p-4 md:p-8 bg-[#f5f7fa] min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            collapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'
          }`}
        >
          <Outlet />
        </main>
      </div>
      <AdminAIChatbot />
    </div>
  )
}

export default AdminLayout
