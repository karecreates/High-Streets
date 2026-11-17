import { useEffect, useState } from "react";
import { getPendingAssetCount } from "../utils/pendingAssetWork";

/**
 * The exporter waits on these attributes rather than a fixed delay.
 * `data-pdf-ready` means the page is safe to capture; `data-pdf-error` means it
 * failed and the booklet must not be assembled from it.
 */
const READY_ATTR = "data-pdf-ready";
const ERROR_ATTR = "data-pdf-error";
const GATES_ATTR = "data-pdf-waiting";

/** Consecutive quiet polls required before declaring the page settled. */
const STABLE_POLLS = 4;
const POLL_INTERVAL_MS = 150;
/** Frames to let layout/paint flush after the last asset lands. */
const SETTLE_FRAMES = 2;
/** Brandfetch / map tiles can hang in headless Chrome — never block the export. */
const MAX_SETTLE_MS = 12_000;

function imageCount(doc: Document): number {
  return doc.images.length;
}

function allImagesSettled(doc: Document): boolean {
  for (const img of Array.from(doc.images)) {
    // A broken image also counts as settled — the error path reports it.
    if (!img.complete) return false;
  }
  return true;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

/**
 * Publishes which page-specific gates are still closed, so a stalled export can
 * say what it was waiting for instead of just timing out.
 */
export function reportPlaybookGates(gates: Record<string, boolean>): void {
  const closed = Object.entries(gates)
    .filter(([, open]) => !open)
    .map(([name]) => name);
  if (closed.length === 0) {
    document.documentElement.removeAttribute(GATES_ATTR);
    return;
  }
  document.documentElement.setAttribute(GATES_ATTR, closed.join(","));
}

export function markPlaybookError(message: string): void {
  document.documentElement.removeAttribute(READY_ATTR);
  document.documentElement.setAttribute(ERROR_ATTR, message);
}

/**
 * Publishes `data-pdf-ready="true"` once the page is visually final.
 *
 * `contentReady` is the page-specific gate (hero image decoded, map idle, …).
 * On top of that this waits for web fonts, for every `<img>` to settle, and for
 * all tracked async asset work to drain — with a quiet period, because logo
 * lookups arrive in waves and each wave can add new images and reflow markers.
 */
export function usePlaybookReady(
  contentReady: boolean,
  error?: string | null
): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (error) {
      markPlaybookError(error);
      setReady(false);
    }
  }, [error]);

  useEffect(() => {
    document.documentElement.removeAttribute(READY_ATTR);
    setReady(false);
    return () => {
      document.documentElement.removeAttribute(READY_ATTR);
    };
  }, []);

  useEffect(() => {
    if (!contentReady || error) return;

    let cancelled = false;
    let timer: number | undefined;
    let capTimer: number | undefined;
    let finished = false;
    let stablePolls = 0;
    let lastCount = -1;

    const finish = async () => {
      if (finished || cancelled) return;
      finished = true;
      for (let i = 0; i < SETTLE_FRAMES; i += 1) {
        if (cancelled) return;
        await nextFrame();
      }
      if (cancelled) return;
      document.documentElement.removeAttribute(GATES_ATTR);
      document.documentElement.setAttribute(READY_ATTR, "true");
      setReady(true);
    };

    const poll = () => {
      if (cancelled || finished) return;

      const count = imageCount(document);
      const settled =
        allImagesSettled(document) && getPendingAssetCount() === 0;

      if (settled && count === lastCount) {
        stablePolls += 1;
      } else {
        stablePolls = 0;
      }
      lastCount = count;

      if (stablePolls >= STABLE_POLLS) {
        void finish();
        return;
      }
      timer = window.setTimeout(poll, POLL_INTERVAL_MS);
    };

    void (async () => {
      try {
        await document.fonts.ready;
      } catch {
        /* Font loading API unavailable — fall through to the image checks. */
      }
      if (cancelled) return;
      poll();
    })();

    capTimer = window.setTimeout(() => {
      void finish();
    }, MAX_SETTLE_MS);

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      if (capTimer !== undefined) window.clearTimeout(capTimer);
    };
  }, [contentReady, error]);

  return ready;
}
