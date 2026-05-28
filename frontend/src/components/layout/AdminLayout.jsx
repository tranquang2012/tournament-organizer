import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className={`flex-1 p-8 bg-[#f5f7fa] min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          collapsed ? 'ml-[72px]' : 'ml-[260px]'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
