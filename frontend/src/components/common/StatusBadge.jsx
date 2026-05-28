import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Non interactive status badge

export function StatusBadge({
  label,
  color,
  bg,
  icon,
  size = "md",
  className = "",
}) {
  const base =
    "inline-flex items-center rounded-full font-semibold select-none pointer-events-none";

  const sizes = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2",
  };

  const styles = [base, sizes[size], className].filter(Boolean).join(" ");

  return (
    <span className={styles} style={{ background: bg, color }}>
      {icon ? (
        <FontAwesomeIcon icon={icon} className="text-[10px]" />
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: color }}
        />
      )}
      {label}
    </span>
  );
}

export default StatusBadge;