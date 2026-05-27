import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCircleCheck,
  faUserShield,
  faUser,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../common/Button";


export function UserActionMenu({ user, isActing, onAction }) {
  if (isActing) {
    return (
      <div className="flex justify-end">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (user.role === "SUPER_ADMIN") {
    return (
      <div className="flex justify-end">
        <span className="text-xs text-slate-300 italic select-none">Protected</span>
      </div>
    );
  }

  const isActive = user.status === "ACTIVE";

  return (
    <div className="flex items-center gap-2 justify-end">
      {/* Toggle account status */}
      <Button
        variant={isActive ? "destructive" : "success"}
        size="sm"
        icon={isActive ? faBan : faCircleCheck}
        label={isActive ? "Disable" : "Enable"}
        onClick={() => onAction(user, isActive ? "disable" : "enable")}
      />

      {/* Promote to Admin */}
      {user.role === "USER" && (
        <Button
          variant="primary"
          size="sm"
          icon={faUserShield}
          label="Promote"
          onClick={() => onAction(user, "promote")}
        />
      )}

      {/* Demote to User */}
      {user.role === "ADMIN" && (
        <Button
          variant="warning"
          size="sm"
          icon={faUser}
          label="Demote"
          onClick={() => onAction(user, "demote")}
        />
      )}
    </div>
  );
}

export default UserActionMenu;
