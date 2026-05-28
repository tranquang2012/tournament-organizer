import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
export function NotificationToast({
  toast,
  onDismiss,
  duration = 3000,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, duration, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === "error";

  const types = {
    icon: isError ? faCircleExclamation : faCircleCheck,
    iconColor: isError ? "text-red-500" : "text-emerald-500",
    bg: isError ? "#fef2f2" : "#f0fdf4",
    color: isError ? "#991b1b" : "#166534",
    border: isError ? "#fca5a5" : "#86efac",
  };

  const wrapperStyles = [
    "fixed top-6 right-6 z-[300]",
    "flex items-center gap-3 pl-4 pr-3 py-3",
    "rounded-xl text-sm font-medium shadow-lg border",
    "transition-all duration-200",
    visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6",
  ].join(" ");

  const dismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={wrapperStyles}
      style={{
        background: types.bg,
        color: types.color,
        borderColor: types.border,
      }}
    >
      <FontAwesomeIcon icon={types.icon} className={types.iconColor} />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className={
          "w-6 h-6 rounded-md flex items-center justify-center " +
          "text-current opacity-50 hover:opacity-100 " +
          "border-none bg-transparent cursor-pointer transition-opacity"
        }
      >
        <FontAwesomeIcon icon={faXmark} className="text-xs" />
      </button>
    </div>
  );
}

export default NotificationToast;
