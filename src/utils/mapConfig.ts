export function getMapId(): string | undefined {
  const id = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim();
  if (!id || id === "your_map_id_here" || id === "DEMO_MAP_ID") {
    return undefined;
  }
  return id;
}

/**
 * Cloud-styled Map ID for interactive maps (master, street/district, centers).
 * Uses Google Cloud Map styling (zoom-level label visibility) instead of JSON styles.
 */
export const MASTER_MAP_CLOUD_STYLE_ID = "9fffb48969185cc812d69245";

export function getMasterMapId(): string {
  const fromEnv = import.meta.env.VITE_GOOGLE_MAPS_MASTER_MAP_ID?.trim();
  if (fromEnv && fromEnv !== "your_map_id_here") return fromEnv;
  return MASTER_MAP_CLOUD_STYLE_ID;
}

export function hasAdvancedMarkers(): boolean {
  return getMapId() !== undefined;
}
