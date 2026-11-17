import { useCallback, useEffect, useState, type RefObject } from "react";

export interface StaticMapModeOptions {
  /**
   * Booklet export: pin static mode on without requesting fullscreen. Headless
   * Chromium rejects requestFullscreen, and the resulting fullscreenchange
   * would immediately flip static mode back off.
   */
  forceStatic?: boolean;
}

/**
 * Screenshot-friendly map mode: browser fullscreen + hide interactive chrome.
 */
export function useStaticMapMode(
  containerRef: RefObject<HTMLElement | null>,
  options: StaticMapModeOptions = {}
): {
  staticMode: boolean;
  enterStaticMode: () => void;
  exitStaticMode: () => void;
} {
  const { forceStatic = false } = options;
  const [staticMode, setStaticMode] = useState(forceStatic);

  const exitStaticMode = useCallback(() => {
    if (forceStatic) return;
    setStaticMode(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {
        /* ignore */
      });
    }
  }, [forceStatic]);

  const enterStaticMode = useCallback(() => {
    setStaticMode(true);
    if (forceStatic) return;
    const el = containerRef.current;
    if (el && typeof el.requestFullscreen === "function") {
      void el.requestFullscreen().catch(() => {
        /* Fullscreen may be blocked; static chrome hide still applies. */
      });
    }
  }, [containerRef, forceStatic]);

  useEffect(() => {
    if (!staticMode || forceStatic) return;

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setStaticMode(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        exitStaticMode();
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [exitStaticMode, forceStatic, staticMode]);

  return { staticMode, enterStaticMode, exitStaticMode };
}
