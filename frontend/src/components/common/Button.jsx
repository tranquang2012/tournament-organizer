import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

export function Button({
  children,
  icon,
  iconRight,
  label,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  onClick,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-xl border " +
    "cursor-pointer transition-all duration-200 whitespace-nowrap select-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-[#123836] text-white border-transparent " +
      "hover:bg-[#1a4f4c] active:bg-[#0e2c2a] shadow-sm " +
      "focus-visible:ring-[#123836]",

    secondary:
      "bg-white text-slate-700 border-slate-200 " +
      "hover:bg-slate-50 active:bg-slate-100 shadow-sm " +
      "focus-visible:ring-slate-300",

    destructive:
      "bg-red-600 text-white border-transparent " +
      "hover:bg-red-700 active:bg-red-800 shadow-sm " +
      "focus-visible:ring-red-500",

    warning:
      "bg-amber-500 text-white border-transparent " +
      "hover:bg-amber-600 active:bg-amber-700 shadow-sm " +
      "focus-visible:ring-amber-400",

    success:
      "bg-emerald-600 text-white border-transparent " +
      "hover:bg-emerald-700 active:bg-emerald-800 shadow-sm " +
      "focus-visible:ring-emerald-500",

    ghost:
      "bg-transparent text-slate-600 border-transparent " +
      "hover:bg-slate-100 active:bg-slate-200 " +
      "focus-visible:ring-slate-300",

    link:
      "bg-transparent text-[#123836] border-transparent shadow-none p-0 " +
      "underline-offset-4 hover:underline " +
      "focus-visible:ring-[#123836]",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-11 px-5 text-base gap-2",
    icon: "h-10 w-10",
  };

  const styles = [
    base,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "sm" ? "text-[11px] w-3.5" : "text-sm w-4";

  return (
    <button
      type={type}
      className={styles}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={label}
      {...props}
    >
      {loading ? (
        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
      ) : icon ? (
        <FontAwesomeIcon icon={icon} className={iconSize + " shrink-0"} />
      ) : null}

      {label || children}

      {iconRight && !loading && (
        <FontAwesomeIcon icon={iconRight} className={iconSize + " shrink-0"} />
      )}
    </button>
  );
}

export default Button;
