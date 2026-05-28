import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGrip,
  faTrophy,
  faUsersGear,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'

const navItems = [
  {
    label: 'Dashboard',
    icon: faGrip,
    path: '/admin/dashboard',
  },
  {
    label: 'Tournaments',
    icon: faTrophy,
    children: [
      { label: 'Setup new Tournament', path: '/admin/tournaments/create' },
      { label: 'Tournaments List', path: '/admin/tournaments/list' },
    ],
  },
  {
    label: 'Accounts Management',
    icon: faUsersGear,
    path: '/admin/accounts',
  },
]

const AdminSidebar = ({ collapsed, setCollapsed }) => {
  const [openMenus, setOpenMenus] = useState({ Tournaments: true })
  const location = useLocation()

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isChildActive = (children) =>
    children?.some((child) => location.pathname.startsWith(child.path))

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-[#123836] border-r border-white/6 font-['Inter',_'Segoe_UI',_system-ui,_sans-serif] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Brand*/}
      <div className="px-5 pt-7 pb-5 flex items-center justify-center border-b border-white/6 min-h-[77px]">
        <span
          className={`font-bold text-white uppercase whitespace-nowrap transition-all duration-300 ${
            collapsed ? 'text-xl tracking-[1px]' : 'text-xl tracking-[3px]'
          }`}
        >
          {collapsed ? 'NC' : 'NETCOMPANY'}
        </span>
      </div>

      {/* ADMIN CONTROL label */}
      <div
        className={`pt-5 pb-2 text-[11px] font-semibold tracking-[1.5px] text-[#94b8b8] uppercase whitespace-nowrap min-h-[35px] flex items-center ${
          collapsed ? 'justify-center px-0' : 'px-6'
        }`}
      >
        {collapsed ? <span>•••</span> : <span>ADMIN CONTROL</span>}
      </div>

      {/* Navigation */}
      <nav className={`flex flex-col gap-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
        {navItems.map((item) => {
          const hasChildren = !!item.children

          if (!hasChildren) {
            return (
              <NavLink
                key={item.label}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-300 no-underline whitespace-nowrap ${
                    collapsed ? 'justify-center p-3 gap-0' : 'gap-3.5 px-3.5 py-3'
                  } ${
                    isActive
                      ? 'bg-[rgba(45,212,168,0.14)] text-[#2dd4a8]'
                      : 'text-[#e0f0f0] hover:bg-[rgba(45,212,168,0.08)] hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={item.icon} className="w-[18px] h-[18px] shrink-0 text-base text-center" />
                {!collapsed && <span className="flex-1 overflow-hidden text-ellipsis">{item.label}</span>}
              </NavLink>
            )
          }

          /* Dropdown parent */
          const isOpen = openMenus[item.label]
          const childActive = isChildActive(item.children)

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleMenu(item.label)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center w-full rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-300 border-none bg-transparent text-left whitespace-nowrap ${
                  collapsed ? 'justify-center p-3 gap-0' : 'gap-3.5 px-3.5 py-3'
                } ${
                  childActive
                    ? 'bg-[rgba(45,212,168,0.14)] text-[#2dd4a8]'
                    : 'text-[#e0f0f0] hover:bg-[rgba(45,212,168,0.08)] hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="w-[18px] h-[18px] shrink-0 text-base text-center" />
                {!collapsed && (
                  <>
                    <span className="flex-1 overflow-hidden text-ellipsis">{item.label}</span>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`text-xs ml-auto opacity-60 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </>
                )}
              </button>

              {!collapsed && isOpen && (
                <div className="pl-[22px] ml-6 border-l-[1.5px] border-white/6 flex flex-col animate-[slideDown_0.2s_ease-out]">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.label}
                      to={child.path}
                      className={({ isActive }) =>
                        `block px-3.5 py-2.5 rounded-lg text-[13px] no-underline transition-all duration-300 whitespace-nowrap ${
                          isActive
                            ? 'text-[#2dd4a8] bg-[rgba(45,212,168,0.14)]'
                            : 'text-[#94b8b8] hover:bg-[rgba(45,212,168,0.08)] hover:text-[#e0f0f0]'
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Collapse toggle */}
      <div className={`flex flex-col gap-0.5 mb-2 ${collapsed ? 'px-2' : 'px-3'}`}>
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex items-center w-full rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-300 border-none bg-transparent text-left whitespace-nowrap ${
            collapsed ? 'justify-center p-3 gap-0' : 'gap-3.5 px-3.5 py-3'
          } text-[#e0f0f0] hover:bg-[rgba(45,212,168,0.08)] hover:text-white`}
        >
          <FontAwesomeIcon 
            icon={collapsed ? faChevronRight : faChevronLeft} 
            className="w-[18px] h-[18px] shrink-0 text-base text-center"
          />
          {!collapsed && <span className="flex-1 overflow-hidden text-ellipsis">Collapse</span>}
        </button>
      </div>

      {/* Admin profile */}
      <div
        className={`flex items-center gap-3 border-t border-white/6 whitespace-nowrap mb-2 ${
          collapsed ? 'justify-center px-2 py-4 mx-1' : 'px-[18px] py-4 mx-3'
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#6366f1] text-white flex items-center justify-center text-[13px] font-bold shrink-0 tracking-[0.5px]">
          NC
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-semibold text-[#e0f0f0] overflow-hidden text-ellipsis">
              NetCompany Admin
            </span>
            <span className="text-[11px] text-[#94b8b8] mt-px">Super Admin</span>
          </div>
        )}
      </div>
    </aside>
  )
}

export default AdminSidebar
