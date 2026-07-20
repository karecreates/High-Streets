import { useEffect, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export interface UseCountUpOptions {
  duration?: number;
  delay?: number;
  enabled?: boolean;
}

export function useCountUp(
  target: number,
  { duration = 1400, delay = 0, enabled = true }: UseCountUpOptions = {}
): number {
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    setValue(0);
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
      setValue(target * easeOutCubic(progress));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, delay, enabled]);

  return value;
}
