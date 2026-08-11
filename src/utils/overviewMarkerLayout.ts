import type { DashboardMapLocation } from "./dashboardMapLocations";
import type { ShoppingCenter } from "../data/shoppingCenters";

export type OverviewPlacement = "above" | "below";

export interface OverviewMarkerLayout {
  placement: OverviewPlacement;
  offsetX: number;
}

export interface OverviewLayoutItem {
  id: string;
  kind: "corridor" | "center";
  position: { lat: number; lng: number };
  width: number;
  height: number;
  preferredPlacement: OverviewPlacement;
}

interface PixelRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const GAP_FROM_ANCHOR = 8;
const PADDING = 5;
const OFFSET_CANDIDATES = [0, 36, -36, 64, -64, 96, -96, 128, -128];

/** Dense street corridors need wider horizontal fans for logo callouts. */
export const STREET_LOGO_OFFSET_CANDIDATES: number[] = (() => {
  const offsets = [0];
  for (let step = 1; step <= 18; step++) {
    const px = step * 20;
    offsets.push(px, -px);
  }
  return offsets;
})();

export interface ResolveMarkerLayoutOptions {
  offsetCandidates?: number[];
  /** Extra gap between boxes when testing overlap (px). */
  padding?: number;
  gapFromAnchor?: number;
}

function estimateCorridorWidth(label: string): number {
  // Compact callout: ~6.2px/char + padding, capped like createCalloutIcon.
  return Math.min(148, Math.max(52, Math.ceil(label.length * 6.2 + 22)));
}

function estimateCenterSize(center: ShoppingCenter): { width: number; height: number } {
  const logoWidth = center.masterMapLogoWidth ?? 52;
  return {
    width: logoWidth + 16,
    // Compact logo box + small gap (no stem/leader line).
    height: Math.round(logoWidth * 0.55) + 20 + 6,
  };
}

export function buildOverviewLayoutItems(
  corridors: DashboardMapLocation[],
  centers: ShoppingCenter[]
): OverviewLayoutItem[] {
  const corridorItems: OverviewLayoutItem[] = corridors.map((location) => ({
    id: `corridor:${location.slug}`,
    kind: "corridor",
    position: location.position,
    width: estimateCorridorWidth(location.label),
    height: 26,
    preferredPlacement: location.labelPlacement ?? "above",
  }));

  const centerItems: OverviewLayoutItem[] = centers.map((center) => {
    const size = estimateCenterSize(center);
    return {
      id: `center:${center.slug}`,
      kind: "center",
      position: center.mapCenter,
      width: size.width,
      height: size.height,
      preferredPlacement: center.masterMapLogoPlacement ?? "above",
    };
  });

  return [...corridorItems, ...centerItems];
}

function rectFor(
  anchorX: number,
  anchorY: number,
  width: number,
  height: number,
  placement: OverviewPlacement,
  offsetX: number,
  gapFromAnchor: number
): PixelRect {
  const centerX = anchorX + offsetX;
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  if (placement === "above") {
    return {
      left,
      right,
      top: anchorY - gapFromAnchor - height,
      bottom: anchorY - gapFromAnchor,
    };
  }
  return {
    left,
    right,
    top: anchorY + gapFromAnchor,
    bottom: anchorY + gapFromAnchor + height,
  };
}

function overlapArea(a: PixelRect, b: PixelRect, padding: number): number {
  const w =
    Math.min(a.right, b.right) - Math.max(a.left, b.left) + padding * 2;
  const h =
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) + padding * 2;
  if (w <= 0 || h <= 0) return 0;
  return w * h;
}

/**
 * Keep every marker lat/lng fixed; only choose above/below + horizontal offset
 * so label/logo boxes don't stack on the overview map at the current zoom.
 */
export function resolveOverviewMarkerLayouts(
  map: google.maps.Map,
  items: OverviewLayoutItem[],
  options?: ResolveMarkerLayoutOptions
): Record<string, OverviewMarkerLayout> {
  const offsetCandidates = options?.offsetCandidates ?? OFFSET_CANDIDATES;
  const padding = options?.padding ?? PADDING;
  const gapFromAnchor = options?.gapFromAnchor ?? GAP_FROM_ANCHOR;
  const projection = map.getProjection();
  const bounds = map.getBounds();
  const zoom = map.getZoom();
  if (!projection || !bounds || zoom == null) {
    return Object.fromEntries(
      items.map((item) => [
        item.id,
        { placement: item.preferredPlacement, offsetX: 0 },
      ])
    );
  }

  const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
  const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
  const scale = 2 ** zoom;
  if (!topRight || !bottomLeft) {
    return Object.fromEntries(
      items.map((item) => [
        item.id,
        { placement: item.preferredPlacement, offsetX: 0 },
      ])
    );
  }

  const worldPoint = (latLng: google.maps.LatLngLiteral) =>
    projection.fromLatLngToPoint(new google.maps.LatLng(latLng.lat, latLng.lng));

  const toPixel = (latLng: google.maps.LatLngLiteral) => {
    const point = worldPoint(latLng);
    if (!point) return { x: 0, y: 0 };
    return {
      x: (point.x - bottomLeft.x) * scale,
      y: (point.y - topRight.y) * scale,
    };
  };

  // Place denser/central items later so edge labels claim space first.
  const ordered = [...items].sort((a, b) => {
    const pa = toPixel(a.position);
    const pb = toPixel(b.position);
    return pa.x - pb.x || pa.y - pb.y;
  });

  const placed: Array<{
    id: string;
    layout: OverviewMarkerLayout;
    rect: PixelRect;
  }> = [];

  for (const item of ordered) {
    const anchor = toPixel(item.position);
    const placementOrder: OverviewPlacement[] =
      item.preferredPlacement === "above"
        ? ["above", "below"]
        : ["below", "above"];

    let best:
      | { layout: OverviewMarkerLayout; rect: PixelRect; cost: number }
      | null = null;

    for (const placement of placementOrder) {
      for (const offsetX of offsetCandidates) {
        const rect = rectFor(
          anchor.x,
          anchor.y,
          item.width,
          item.height,
          placement,
          offsetX,
          gapFromAnchor
        );
        let cost = 0;
        let hit = false;
        for (const other of placed) {
          const area = overlapArea(rect, other.rect, padding);
          if (area > 0) {
            hit = true;
            cost += area;
          }
        }
        // Prefer preferred placement and smaller offsets when tied.
        cost +=
          (placement === item.preferredPlacement ? 0 : 40) + Math.abs(offsetX) * 0.15;

        if (!hit) {
          best = { layout: { placement, offsetX }, rect, cost };
          break;
        }
        if (!best || cost < best.cost) {
          best = { layout: { placement, offsetX }, rect, cost };
        }
      }
      // Zero-overlap solutions have cost < 40 (placement/offset penalties only).
      if (best && best.cost < 40) break;
    }

    const chosen = best ?? {
      layout: { placement: item.preferredPlacement, offsetX: 0 },
      rect: rectFor(
        anchor.x,
        anchor.y,
        item.width,
        item.height,
        item.preferredPlacement,
        0,
        gapFromAnchor
      ),
      cost: 0,
    };

    placed.push({
      id: item.id,
      layout: chosen.layout,
      rect: chosen.rect,
    });
  }

  return Object.fromEntries(
    placed.map((entry) => [entry.id, entry.layout])
  );
}
