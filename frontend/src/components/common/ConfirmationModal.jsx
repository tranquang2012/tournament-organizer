import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faCircleInfo,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";

export function ConfirmationModal({
  open = false,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "",
  intent = "danger",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
}) {
  /* dismiss on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const intents = {
    danger: {
      icon: faTriangleExclamation,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      confirmVariant: "destructive",
    },
    warning: {
      icon: faTriangleExclamation,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      confirmVariant: "warning",
    },
    info: {
      icon: faCircleInfo,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      confirmVariant: "primary",
    },
  };

  const cfg = intents[intent] || intents.danger;

  const iconStyles = [
    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
    cfg.iconBg,
  ].join(" ");

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={
            "bg-white rounded-2xl shadow-2xl w-full max-w-[calc(100vw-2rem)] sm:max-w-[420px] mx-4 " +
            "pointer-events-auto animate-[modalIn_0.2s_ease-out]"
          }
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="flex items-start gap-4 p-6 pb-0">
            <div className={iconStyles}>
              <FontAwesomeIcon
                icon={cfg.icon}
                className={"text-lg " + cfg.iconColor}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-800 m-0 leading-snug">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-slate-500 mt-1.5 m-0 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className={
                "w-8 h-8 rounded-lg flex items-center justify-center " +
                "text-slate-400 hover:text-slate-600 hover:bg-slate-100 " +
                "border-none bg-transparent cursor-pointer transition-colors shrink-0"
              }
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-6">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              label={cancelLabel}
            />
            <Button
              variant={cfg.confirmVariant}
              onClick={onConfirm}
              loading={loading}
              label={confirmLabel}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfirmationModal;
