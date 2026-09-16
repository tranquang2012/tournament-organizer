import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsersGear,
  faSearch,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons'
import { getUsers, disableUserAccount, enableUserAccount, promoteUserToAdmin, demoteAdminToUser } from '../../services/AdminService'
import UserMasterTable from '../../components/account_management/UserMasterTable'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import NotificationToast from '../../components/common/NotificationToast'

/*confirmation dialog config per action type*/
const confirmConfig = {
  disable: {
    title: 'Disable this account?',
    description: (name) =>
      `${name} will no longer be able to log in or access the platform. You can re-enable the account at any time.`,
    intent: 'danger',
    confirmLabel: 'Disable Account',
  },
  enable: {
    title: 'Enable this account?',
    description: (name) =>
      `${name} will regain access to the platform immediately.`,
    intent: 'info',
    confirmLabel: 'Enable Account',
  },
  promote: {
    title: 'Promote to Admin?',
    description: (name) =>
      `${name} will gain admin privileges, including the ability to manage tournaments and disable user accounts.`,
    intent: 'warning',
    confirmLabel: 'Promote to Admin',
  },
  demote: {
    title: 'Demote to User?',
    description: (name) =>
      `${name} will lose all admin privileges and return to a standard user role.`,
    intent: 'danger',
    confirmLabel: 'Demote to User',
  },
}

const UserManagementPage = () => {
  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)

  /* confirmation modal state */
  const [modal, setModal] = useState({ open: false, user: null, action: null })
  const [modalLoading, setModalLoading] = useState(false)

  /* fetch */
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data.users)
      setTotalCount(data.totalCount)
    } catch {
      showToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  /* toast */
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  /* open confirmation */
  const handleAction = (user, actionType) => {
    setModal({ open: true, user, action: actionType })
  }

  /* execute confirmed action */
  const handleConfirm = async () => {
    const { user, action } = modal
    if (!user || !action) return

    setModalLoading(true)
    setActionLoading(user.id)

    try {
      switch (action) {
        case 'disable':
          await disableUserAccount(user.id)
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, status: 'DISABLED' } : u)),
          )
          showToast(`${user.name} has been disabled`)
          break

        case 'enable':
          await enableUserAccount(user.id)
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, status: 'ACTIVE' } : u)),
          )
          showToast(`${user.name} has been enabled`)
          break

        case 'promote':
          await promoteUserToAdmin(user.id)
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, role: 'ADMIN' } : u)),
          )
          showToast(`${user.name} promoted to Admin`)
          break

        case 'demote':
          await demoteAdminToUser(user.id)
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, role: 'USER' } : u)),
          )
          showToast(`${user.name} demoted to User`)
          break

        default:
          break
      }
    } catch {
      showToast('Action failed', 'error')
    } finally {
      setActionLoading(null)
      setModalLoading(false)
      setModal({ open: false, user: null, action: null })
    }
  }

  /* filtered list */
  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  /* modal props from config */
  const modalCfg = modal.action ? confirmConfig[modal.action] : {}

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Toast */}
      <NotificationToast toast={toast} onDismiss={() => setToast(null)} />

      {/* Confirmation modal */}
      <ConfirmationModal
        open={modal.open}
        onClose={() => setModal({ open: false, user: null, action: null })}
        onConfirm={handleConfirm}
        title={modalCfg.title}
        description={modal.user ? modalCfg.description?.(modal.user.name) : ''}
        intent={modalCfg.intent}
        confirmLabel={modalCfg.confirmLabel}
        loading={modalLoading}
      />

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#123836] flex items-center justify-center">
            <FontAwesomeIcon icon={faUsersGear} className="text-white text-base" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 m-0 leading-tight">
              Accounts Management
            </h1>
            <p className="text-sm text-slate-400 mt-0.5 m-0">
              Manage user accounts, roles, and access permissions
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative w-full md:flex-1 md:min-w-[240px] md:max-w-[400px]">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#123836] focus:ring-2 focus:ring-[rgba(18,56,54,0.12)]"
          />
        </div>

        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 cursor-pointer outline-none transition-all duration-200 focus:border-[#123836] focus:ring-2 focus:ring-[rgba(18,56,54,0.12)]"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"
          />
        </div>

        <span className="ml-auto text-sm text-slate-400 font-medium">
          {filtered.length} of {totalCount} users
        </span>
      </div>

      {/* Table */}
      <UserMasterTable
        users={filtered}
        loading={loading}
        actionLoading={actionLoading}
        onAction={handleAction}
      />
    </div>
  )
}

export default UserManagementPage
