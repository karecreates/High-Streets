/**
 * Counts in-flight async asset work (brand logo lookups, marker icon rasters).
 *
 * Logos resolve outside the DOM — they are fetched, fingerprinted on a canvas
 * and painted into Google Maps marker icons — so `document.images` alone cannot
 * tell the booklet exporter whether a page has finished rendering. Anything that
 * loads an asset registers here, and the exporter waits for the count to reach
 * zero before capturing the page.
 */

let pending = 0;
const listeners = new Set<() => void>();

function notify(): void {
  // Mirrored on window so an export run can report what a stalled page is
  // still waiting on.
  (window as unknown as { __PENDING_ASSETS__?: number }).__PENDING_ASSETS__ =
    pending;
  for (const listener of listeners) listener();
}

/** Registers one unit of work. Call the returned function exactly once. */
export function beginPendingAsset(): () => void {
  pending += 1;
  notify();

  let settled = false;
  return () => {
    if (settled) return;
    settled = true;
    pending = Math.max(0, pending - 1);
    notify();
  };
}

/** Tracks a promise as pending asset work, preserving its result. */
export function trackPendingAsset<T>(work: Promise<T>): Promise<T> {
  const finish = beginPendingAsset();
  return work.then(
    (value) => {
      finish();
      return value;
    },
    (error) => {
      finish();
      throw error;
    }
  );
}

export function getPendingAssetCount(): number {
  return pending;
}

export function subscribePendingAssets(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
