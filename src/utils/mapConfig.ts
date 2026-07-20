export function getMapId(): string | undefined {
  const id = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim();
  if (!id || id === "your_map_id_here" || id === "DEMO_MAP_ID") {
    return undefined;
  }
  return id;
}

export function hasAdvancedMarkers(): boolean {
  return getMapId() !== undefined;
}
