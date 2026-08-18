export function IconButton({
  onClick,
  title,
  children,
  danger = false,
  primary = false,
  className = "",
  size = "md",
  disabled = false,
}) {
  const sizeClasses = {
    sm: "p-1 text-xs",
    md: "p-1.5 text-sm",
    lg: "p-2 text-base",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`icon-btn ${danger ? "danger" : ""} ${primary ? "primary" : ""} ${sizeClasses[size] || sizeClasses.md} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {children}
    </button>
  );
}
