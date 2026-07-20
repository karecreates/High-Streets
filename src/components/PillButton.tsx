import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface PillButtonProps {
  to?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: "primary" | "outline";
  className?: string;
}

export function PillButton({
  to,
  onClick,
  children,
  variant = "primary",
  className = "",
}: PillButtonProps) {
  const cls = `pill-btn pill-btn--${variant} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
