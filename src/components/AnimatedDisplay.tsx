import { useMemo } from "react";
import { useCountUp } from "../hooks/useCountUp";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { parseDisplayValue } from "../utils/parseDisplayValue";

interface AnimatedDisplayProps {
  value: string;
  duration?: number;
  delay?: number;
  className?: string;
}

export function AnimatedDisplay({
  value,
  duration = 1400,
  delay = 0,
  className,
}: AnimatedDisplayProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const parsed = useMemo(() => parseDisplayValue(value), [value]);
  const instant =
    prefersReducedMotion ||
    (typeof document !== "undefined" &&
      (document.documentElement.classList.contains("playbook-mode") ||
        new URLSearchParams(window.location.search).get("mode") === "pdf"));

  const target = parsed.type === "number" ? parsed.target : 0;
  const current = useCountUp(target, {
    duration,
    delay,
    enabled: parsed.type === "number" && !instant,
  });

  if (parsed.type === "text") {
    return <span className={className}>{parsed.value}</span>;
  }

  const display = `${parsed.prefix}${parsed.format(current)}${parsed.suffix}`;

  return <span className={className}>{display}</span>;
}
