import { useCallback, useEffect, useState, type RefObject } from "react";

/**
 * Screenshot-friendly map mode: browser fullscreen + hide interactive chrome.
 */
export function useStaticMapMode(
  containerRef: RefObject<HTMLElement | null>
): {
  staticMode: boolean;
  enterStaticMode: () => void;
  exitStaticMode: () => void;
} {
  const [staticMode, setStaticMode] = useState(false);

  const exitStaticMode = useCallback(() => {
    setStaticMode(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {
        /* ignore */
      });
    }
  }, []);

  const enterStaticMode = useCallback(() => {
    setStaticMode(true);
    const el = containerRef.current;
    if (el && typeof el.requestFullscreen === "function") {
      void el.requestFullscreen().catch(() => {
        /* Fullscreen may be blocked; static chrome hide still applies. */
      });
    }
  }, [containerRef]);

  useEffect(() => {
    if (!staticMode) return;

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
  }, [exitStaticMode, staticMode]);

  return { staticMode, enterStaticMode, exitStaticMode };
}
