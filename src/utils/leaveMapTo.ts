/**
 * Leave a Google Maps view with a full document navigation.
 *
 * Client-side React Router transitions from map pages are unreliable:
 * the Maps JS SDK can leave the previous canvas mounted (URL updates,
 * UI does not). A full load always tears the map down.
 *
 * Requires SPA fallback (Vite dev / vercel.json rewrites) so deep links
 * like `/street/abbot-kinney` serve index.html instead of 404.
 */
export function leaveMapTo(path: string): void {
  const target = path.startsWith("/") ? path : `/${path}`;
  if (window.location.pathname === target) {
    window.location.reload();
    return;
  }
  window.location.assign(target);
}
