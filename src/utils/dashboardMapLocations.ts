import { getCorridorDetail } from "../data/corridorDetails";
import {
  HIGH_STREET_CORRIDORS,
  type CorridorCategory,
  type HighStreetCorridor,
} from "../data/highStreets";

export interface DashboardMapLocation {
  slug: string;
  name: string;
  /** Shorter label for the overview map pill (falls back to name). */
  label: string;
  category: CorridorCategory;
  position: { lat: number; lng: number };
  detailPath: string;
  /** Box above (default) or below the map anchor — avoids overlapping nearby pins. */
  labelPlacement?: "above" | "below";
}

interface DashboardLabelOverride {
  labelPlacement?: "above" | "below";
  /** Optional shorter display name for dense overview map. */
  label?: string;
}

/**
 * Placement only — no pixel offsets.
 * Pixel offsets look like labels "drift" when zooming because screen pixels
 * don't scale with geographic distance. Labels stay locked to lat/lng.
 */
const LABEL_OVERRIDES: Record<string, DashboardLabelOverride> = {
  // Malibu pair (nearly collocated)
  "malibu-country-mart": { labelPlacement: "above", label: "Malibu Country Mart" },
  "malibu-village": { labelPlacement: "below", label: "Malibu Village" },

  // Santa Monica / Brentwood cluster
  "brentwood-country-mart": { labelPlacement: "above", label: "Brentwood Mart" },
  montana: { labelPlacement: "below", label: "Montana Ave" },
  "third-street-promenade": { labelPlacement: "above", label: "3rd St Promenade" },
  "santa-monica-place": { labelPlacement: "below", label: "Santa Monica Place" },
  "abbot-kinney": { labelPlacement: "above" },

  // Westside / Culver
  "westfield-century-city": { labelPlacement: "above", label: "Century City" },
  platform: { labelPlacement: "below" },
  "culver-city": { labelPlacement: "above" },

  // WeHo / Mid-City
  "sunset-strip": { labelPlacement: "above" },
  robertson: { labelPlacement: "below" },
  melrose: { labelPlacement: "above" },
  "la-brea": { labelPlacement: "below" },
  "studio-city": { labelPlacement: "above", label: "Studio City" },
  "sportsmen-lodge": { labelPlacement: "below", label: "Sportsmen's Lodge" },

  // Central / East — Old Town below so it clears One Colorado / The Paseo logos
  larchmont: { labelPlacement: "above" },
  silverlake: { labelPlacement: "below" },
  "americana-at-brand": { labelPlacement: "above", label: "Americana" },
  "old-town-pasadena": { labelPlacement: "below", label: "Old Town Pasadena" },
  "the-paseo": { labelPlacement: "below", label: "The Paseo" },
  "one-colorado": { labelPlacement: "above", label: "One Colorado" },

  // South Bay
  "the-point": { labelPlacement: "above" },
  "manhattan-village": {
    labelPlacement: "below",
    label: "Manhattan Village",
  },
  "downtown-manhattan-beach": {
    labelPlacement: "above",
    label: "Manhattan Beach",
  },
};

function corridorDetailPath(corridor: HighStreetCorridor): string {
  return corridor.category === "shopping-centers"
    ? `/center/${corridor.slug}`
    : `/street/${corridor.slug}`;
}

/** Active corridors with dedicated pages — excludes greyed-out sidebar items. */
export function getActiveDashboardMapLocations(): DashboardMapLocation[] {
  return HIGH_STREET_CORRIDORS.filter(
    (corridor) => corridor.active && getCorridorDetail(corridor.slug)
  ).map((corridor) => {
    const detail = getCorridorDetail(corridor.slug)!;
    const override = LABEL_OVERRIDES[corridor.slug];
    return {
      slug: corridor.slug,
      name: corridor.name,
      label: override?.label ?? corridor.name,
      category: corridor.category,
      position: detail.mapCenter,
      detailPath: corridorDetailPath(corridor),
      labelPlacement: override?.labelPlacement ?? "above",
    };
  });
}

export function getDashboardMapBounds(
  locations: DashboardMapLocation[]
): google.maps.LatLngBounds {
  const bounds = new google.maps.LatLngBounds();
  for (const location of locations) {
    bounds.extend(location.position);
  }
  return bounds;
}
