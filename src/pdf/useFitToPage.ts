import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getPendingAssetCount, subscribePendingAssets } from "../utils/pendingAssetWork";

/** Never shrink past this — smaller type stops reading well in print. */
const MIN_ZOOM = 0.55;
/** Ignore sub-pixel overflow; correcting it only causes jitter. */
const OVERFLOW_TOLERANCE_PX = 2;
const MAX_PASSES = 8;

/**
 * Shrinks a scrolling column until it fits the printed page.
 *
 * `zoom` is used rather than `transform: scale()` because it reflows: the column
 * keeps its width and only type and spacing tighten, so the page reads as a
 * denser version of the app layout instead of a shrunken screenshot. Late
 * content (brand logos) changes the height, so the fit re-runs whenever tracked
 * asset work drains.
 */
export function useFitToPage(active: boolean, selector: string) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [fitted, setFitted] = useState(!active);
  const passesRef = useRef(0);

  const measure = useCallback(() => {
    const element = rootRef.current?.querySelector<HTMLElement>(selector);
    if (!element) {
      window.requestAnimationFrame(measure);
      return;
    }

    const overflow = element.scrollHeight - element.clientHeight;
    if (overflow <= OVERFLOW_TOLERANCE_PX || passesRef.current >= MAX_PASSES) {
      setFitted(true);
      return;
    }

    passesRef.current += 1;
    const style = element.style as CSSStyleDeclaration & { zoom?: string };
    const current = Number(style.zoom || "1");
    const next = Math.max(
      MIN_ZOOM,
      current * (element.clientHeight / element.scrollHeight)
    );
    if (next >= current) {
      setFitted(true);
      return;
    }
    style.zoom = String(next);
    window.requestAnimationFrame(measure);
  }, [selector]);

  const refit = useCallback(() => {
    passesRef.current = 0;
    setFitted(false);
    window.requestAnimationFrame(measure);
  }, [measure]);

  useLayoutEffect(() => {
    if (!active) return;
    const frame = window.requestAnimationFrame(refit);
    return () => window.cancelAnimationFrame(frame);
  }, [active, refit]);

  useEffect(() => {
    if (!active) return;
    let lastPending = getPendingAssetCount();
    return subscribePendingAssets(() => {
      const pending = getPendingAssetCount();
      if (lastPending > 0 && pending === 0) refit();
      lastPending = pending;
    });
  }, [active, refit]);

  return { rootRef, fitted };
}
