import { getCorridorBySlug } from "../data/highStreets";

/** Dedicated corridor info page (`/street/:slug` or `/center/:slug`). */
export function corridorInfoPath(slug: string): string {
  const corridor = getCorridorBySlug(slug);
  if (corridor?.category === "shopping-centers") {
    return `/center/${slug}`;
  }
  return `/street/${slug}`;
}

/** Full-screen interactive map for a corridor. */
export function corridorMapPath(slug: string): string {
  const corridor = getCorridorBySlug(slug);
  if (corridor?.category === "shopping-centers") {
    return `/center/${slug}/map`;
  }
  return `/street/${slug}/map`;
}
