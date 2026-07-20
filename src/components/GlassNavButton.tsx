interface GlassNavButtonProps {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
}

export function GlassNavButton({ direction, onClick, label }: GlassNavButtonProps) {
  return (
    <button
      type="button"
      className="glass-nav-btn"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
    >
      <span aria-hidden>{direction === "prev" ? "‹" : "›"}</span>
    </button>
  );
}
