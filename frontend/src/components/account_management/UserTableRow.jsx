import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faShieldHalved,
  faUserShield,
  faUser,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons'
import { faFacebook, faGoogle } from '@fortawesome/free-brands-svg-icons'
import StatusBadge from '../common/StatusBadge'
import UserActionMenu from './UserActionMenu'

/* Config maps */
const roleMeta = {
  SUPER_ADMIN: { label: 'Super Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: faShieldHalved },
  ADMIN:       { label: 'Admin',       color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: faUserShield },
  USER:        { label: 'User',        color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', icon: faUser },
}

const statusMeta = {
  ACTIVE:   { label: 'Active',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  DISABLED: { label: 'Disabled', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

/**
 * Single row inside UserMasterTable.
 */
const UserTableRow = ({ user, isActing, onAction }) => {
  const role = roleMeta[user.role] || roleMeta.USER
  const status = statusMeta[user.status] || statusMeta.ACTIVE

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  return (
    <tr className="border-b border-slate-50 last:border-b-0 transition-colors duration-150 hover:bg-slate-50/60">
      {/* name + provider */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.name}'s avatar`}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 uppercase tracking-wide"
              style={{
                background: `linear-gradient(135deg, ${role.color}30, ${role.color}18)`,
                color: role.color,
              }}
            >
              {initials}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800 leading-tight">
              {user.name}
            </span>
            <span className="flex items-center gap-2.5 text-xs text-slate-400 mt-0.5">
              {user.providers && user.providers.length > 0 ? (
                user.providers.map((p) => {
                  let icon = null;
                  let color = '#94a3b8';
                  if (p === 'facebook') {
                    icon = faFacebook;
                    color = '#1877f2';
                  } else if (p === 'google') {
                    icon = faGoogle;
                    color = '#ea4335';
                  } else if (p === 'email') {
                    icon = faEnvelope;
                    color = '#f59e0b';
                  }
                  return (
                    <span key={p} className="flex items-center gap-1 capitalize">
                      {icon && <FontAwesomeIcon icon={icon} style={{ color }} />}
                      {p}
                    </span>
                  );
                })
              ) : (
                <span className="capitalize">Unknown</span>
              )}
            </span>
          </div>
        </div>
      </td>

      {/* email */}
      <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>

      {/* role badge (using StatusBadge – non-interactive indicator) */}
      <td className="px-6 py-4 text-center">
        <StatusBadge label={role.label} color={role.color} bg={role.bg} icon={role.icon} />
      </td>

      {/* status badge */}
      <td className="px-6 py-4 text-center">
        <StatusBadge label={status.label} color={status.color} bg={status.bg} />
      </td>

      {/* action buttons */}
      <td className="px-6 py-4">
        <UserActionMenu user={user} isActing={isActing} onAction={onAction} />
      </td>
    </tr>
  )
}

export default UserTableRow
