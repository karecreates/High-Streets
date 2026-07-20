type Position = [number, number];

function asRing(ring: GeoJSON.Position[]): Position[] {
  return ring.map((point) => [point[0], point[1]] as Position);
}

function ringCentroid(ring: Position[]): Position {
  if (!ring.length) return [0, 0];
  if (ring.length < 4) return ring[0];

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }

  area *= 0.5;
  if (Math.abs(area) < 1e-12) {
    const lng = ring.reduce((sum, [x]) => sum + x, 0) / ring.length;
    const lat = ring.reduce((sum, [, y]) => sum + y, 0) / ring.length;
    return [lng, lat];
  }

  return [cx / (6 * area), cy / (6 * area)];
}

function ringArea(ring: Position[]): number {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area * 0.5);
}

/** Centroid of a GeoJSON Polygon or MultiPolygon (uses the largest ring). */
export function polygonCentroid(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): Position {
  if (geometry.type === "Polygon") {
    return ringCentroid(asRing(geometry.coordinates[0]));
  }

  let bestRing = asRing(geometry.coordinates[0]?.[0] ?? []);
  let bestArea = ringArea(bestRing);

  for (const polygon of geometry.coordinates) {
    const ring = asRing(polygon[0]);
    const area = ringArea(ring);
    if (area > bestArea) {
      bestArea = area;
      bestRing = ring;
    }
  }

  return ringCentroid(bestRing);
}
