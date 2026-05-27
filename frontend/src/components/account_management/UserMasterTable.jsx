import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faUsersGear } from '@fortawesome/free-solid-svg-icons'
import UserTableRow from './UserTableRow'

/* The main users table including header, loading state, empty state,
 * and rows delegated to <UserTableRow>.
 */
const UserMasterTable = ({ users, loading, actionLoading, onAction }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg" />
          <span className="text-sm">Loading users…</span>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <FontAwesomeIcon icon={faUsersGear} className="text-3xl mb-3 opacity-40" />
          <span className="text-sm">No users match your filters</span>
        </div>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">
                User
              </th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">
                Email
              </th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4 text-center">
                Role
              </th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4 text-center">
                Status
              </th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                isActing={actionLoading === user.id}
                onAction={onAction}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default UserMasterTable
