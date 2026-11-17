import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

interface ScoreRingProps {
  label: string;
  value: number;
  variant?: "teal" | "slate";
  duration?: number;
  delay?: number;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function isPdfCapture(): boolean {
  if (typeof document === "undefined") return false;
  if (document.documentElement.classList.contains("playbook-mode")) return true;
  try {
    return new URLSearchParams(window.location.search).get("mode") === "pdf";
  } catch {
    return false;
  }
}

export function ScoreRing({
  label,
  value,
  variant = "teal",
  duration = 1200,
  delay = 0,
}: ScoreRingProps) {
  const prefersReducedMotion = usePrefersReducedMotion() || isPdfCapture();
  /** Slightly tighter ring stroke leaves more clear space for the centered label. */
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  const [displayValue, setDisplayValue] = useState(prefersReducedMotion ? value : 0);
  const [strokeOffset, setStrokeOffset] = useState(
    prefersReducedMotion ? circumference - (value / 100) * circumference : circumference
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      setStrokeOffset(circumference - (value / 100) * circumference);
      return;
    }

    setDisplayValue(0);
    setStrokeOffset(circumference);
    let start: number | null = null;
    let frame = 0;

    const tick = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start - delay;

      if (elapsed < 0) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = Math.round(eased * value);

      setDisplayValue(current);
      setStrokeOffset(circumference - (current / 100) * circumference);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, delay, circumference, prefersReducedMotion]);

  return (
    <div
      className={`score-ring score-ring--${variant}`}
      style={{ ["--score" as string]: displayValue }}
    >
      <svg
        className="score-ring__svg"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle
          className="score-ring__track"
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#e8ecef"
          strokeWidth="6"
        />
        <circle
          className="score-ring__progress"
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={variant === "teal" ? "#3e6f7e" : "#8fa3ad"}
          strokeWidth="6"
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeOffset,
          }}
        />
      </svg>
      <div className="score-ring__content">
        <span className="score-ring__value">{displayValue}%</span>
        <span className="score-ring__label">{label}</span>
      </div>
    </div>
  );
}
