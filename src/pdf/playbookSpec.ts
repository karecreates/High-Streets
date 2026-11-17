import {
  getCorridorBySlug,
  getCorridorDetail,
  HIGH_STREET_CORRIDORS,
} from "../data/highStreets";
import { getShoppingCenter } from "../data/shoppingCenters";

export type PlaybookLocationType = "high-street" | "shopping-center";

export type PlaybookPageKind =
  | "master-map"
  | "gallery"
  | "overview"
  | "location-map";

/**
 * Vector pages are printed by Chromium so text/SVG stay selectable and sharp.
 * Raster pages hold a Google Maps canvas, which Chromium's PDF pipeline drops,
 * so those are captured as high-DPI screenshots instead.
 */
export type PlaybookRenderMode = "vector" | "raster";

export interface PlaybookLocation {
  slug: string;
  name: string;
  city: string;
  type: PlaybookLocationType;
}

export interface PlaybookPage {
  index: number;
  kind: PlaybookPageKind;
  renderMode: PlaybookRenderMode;
  /** Absent on the master map page. */
  slug?: string;
  locationType?: PlaybookLocationType;
  /** Human-readable label for progress output and QA filenames. */
  label: string;
}

/** Tabloid landscape 17 × 11in at 96 CSS dpi. */
export const PAGE_WIDTH_PX = 1632;
export const PAGE_HEIGHT_PX = 1056;

function locationTypeFor(slug: string): PlaybookLocationType | null {
  const corridor = getCorridorBySlug(slug);
  if (!corridor?.active) return null;

  /*
   * `category` drives routing: shopping centers own a directory dataset and
   * render the tenant-logo popup, high streets plot tenants on the map.
   */
  if (corridor.category === "shopping-centers" && getShoppingCenter(slug)) {
    return "shopping-center";
  }
  if (corridor.category === "high-streets") return "high-street";
  return null;
}

/** Every location that can produce a full three-page booklet section. */
export function getExportableLocations(): PlaybookLocation[] {
  const locations: PlaybookLocation[] = [];

  for (const corridor of HIGH_STREET_CORRIDORS) {
    if (!corridor.active) continue;
    if (!corridor.heroImage) continue;
    if (!getCorridorDetail(corridor.slug)) continue;

    const type = locationTypeFor(corridor.slug);
    if (!type) continue;

    locations.push({
      slug: corridor.slug,
      name: corridor.name,
      city: corridor.city,
      type,
    });
  }

  return locations;
}

export function getExportableLocation(
  slug: string
): PlaybookLocation | undefined {
  return getExportableLocations().find((location) => location.slug === slug);
}

/** Drops unknown slugs and restores the canonical dashboard ordering. */
export function normalizeSelection(slugs: string[]): PlaybookLocation[] {
  const wanted = new Set(slugs);
  return getExportableLocations().filter((location) =>
    wanted.has(location.slug)
  );
}

export function parseSelectionParam(param: string | null): string[] {
  if (!param) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of param.split(",")) {
    const slug = raw.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

export function serializeSelection(slugs: string[]): string {
  return slugs.join(",");
}

/**
 * Booklet structure: one regional master map (every high street and center),
 * then gallery → overview → static map for every selected location, in
 * dashboard order.
 */
export function buildPlaybookPages(slugs: string[]): PlaybookPage[] {
  const locations = normalizeSelection(slugs);
  if (!locations.length) return [];

  const pages: PlaybookPage[] = [
    {
      index: 0,
      kind: "master-map",
      renderMode: "raster",
      label: "Master Map",
    },
  ];

  for (const location of locations) {
    pages.push({
      index: pages.length,
      kind: "gallery",
      renderMode: "vector",
      slug: location.slug,
      locationType: location.type,
      label: `${location.name} — Gallery`,
    });
    pages.push({
      index: pages.length,
      kind: "overview",
      renderMode: "vector",
      slug: location.slug,
      locationType: location.type,
      label: `${location.name} — Overview`,
    });
    pages.push({
      index: pages.length,
      kind: "location-map",
      renderMode: "raster",
      slug: location.slug,
      locationType: location.type,
      label: `${location.name} — Map`,
    });
  }

  return pages;
}
