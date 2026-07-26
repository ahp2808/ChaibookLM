export function IconButton({ onClick, title, children, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`icon-btn ${danger ? "danger" : ""} inline-flex items-center justify-center rounded-md p-1.5`}
    >
      {children}
    </button>
  );
}
