import type { ShoppingCenter } from "../data/shoppingCenters";
import type { DashboardMapLocation } from "./dashboardMapLocations";
import {
  buildOverviewLayoutItems,
  type OverviewLayoutItem,
} from "./overviewMarkerLayout";

/** Orthogonal tails only — never diagonal or L-shaped. */
export type DashboardStemPlacement = "above" | "below" | "left" | "right";

export interface DashboardMarkerLayout {
  placement: DashboardStemPlacement;
  stemHeight: number;
}

export interface DashboardLayoutItem extends OverviewLayoutItem {
  forcePlacement?: DashboardStemPlacement;
  forceStemHeight?: number;
}

/** Hard locks from the overview map — do not auto-flip these. */
const LAYOUT_OVERRIDES: Record<
  string,
  { placement?: DashboardStemPlacement; stemHeight?: number }
> = {
  "center:the-paseo": { placement: "right", stemHeight: 28 },
  "corridor:third-street-promenade": { placement: "left", stemHeight: 32 },
  "corridor:studio-city": { stemHeight: 14 },
  "corridor:larchmont": { stemHeight: 14 },
  "corridor:la-brea": { placement: "below", stemHeight: 22 },
  "center:manhattan-village": { placement: "right", stemHeight: 28 },
  "center:sportsmen-lodge": { placement: "left", stemHeight: 28 },
  "center:santa-monica-place": { placement: "right", stemHeight: 28 },
  "center:platform": { placement: "right", stemHeight: 28 },
};

interface PixelRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const BOX_PADDING = 12;
const SIZE_SLACK = 14;
const MIN_STEM = 18;
const CLUSTER_RADIUS = 130;
const STEM_CANDIDATES = [18, 28, 42, 58, 78, 104, 136, 176];

function rectFor(
  anchorX: number,
  anchorY: number,
  width: number,
  height: number,
  placement: DashboardStemPlacement,
  stemHeight: number
): PixelRect {
  if (placement === "left") {
    return {
      left: anchorX - stemHeight - width,
      right: anchorX - stemHeight,
      top: anchorY - height / 2,
      bottom: anchorY + height / 2,
    };
  }
  if (placement === "right") {
    return {
      left: anchorX + stemHeight,
      right: anchorX + stemHeight + width,
      top: anchorY - height / 2,
      bottom: anchorY + height / 2,
    };
  }
  if (placement === "above") {
    return {
      left: anchorX - width / 2,
      right: anchorX + width / 2,
      top: anchorY - stemHeight - height,
      bottom: anchorY - stemHeight,
    };
  }
  return {
    left: anchorX - width / 2,
    right: anchorX + width / 2,
    top: anchorY + stemHeight,
    bottom: anchorY + stemHeight + height,
  };
}

function overlaps(a: PixelRect, b: PixelRect, padding: number): boolean {
  return !(
    a.right + padding <= b.left ||
    a.left - padding >= b.right ||
    a.bottom + padding <= b.top ||
    a.top - padding >= b.bottom
  );
}

function coversPoint(
  rect: PixelRect,
  x: number,
  y: number,
  padding: number
): boolean {
  return (
    x >= rect.left - padding &&
    x <= rect.right + padding &&
    y >= rect.top - padding &&
    y <= rect.bottom + padding
  );
}

function placementOrder(
  preferred: "above" | "below"
): DashboardStemPlacement[] {
  return preferred === "below"
    ? ["below", "above", "right", "left"]
    : ["above", "below", "right", "left"];
}

export function buildDashboardLayoutItems(
  corridors: DashboardMapLocation[],
  centers: ShoppingCenter[]
): DashboardLayoutItem[] {
  return buildOverviewLayoutItems(corridors, centers).map((item) => {
    const override = LAYOUT_OVERRIDES[item.id];
    return {
      ...item,
      // Real logo canvases run larger than the compact estimate.
      width: item.width + (item.kind === "center" ? 16 : 8),
      height: item.height + (item.kind === "center" ? 12 : 4),
      forcePlacement: override?.placement,
      forceStemHeight: override?.stemHeight,
    };
  });
}

/**
 * Place each label on a straight up / down / left / right tail from its
 * true lat/lng. Computed once at the current zoom so labels do not reshuffle.
 */
export function resolveDashboardMarkerLayouts(
  map: google.maps.Map,
  items: DashboardLayoutItem[]
): Record<string, DashboardMarkerLayout> {
  const projection = map.getProjection();
  const zoom = map.getZoom();
  if (!projection || zoom == null) {
    return Object.fromEntries(
      items.map((item) => [
        item.id,
        {
          placement: item.forcePlacement ?? item.preferredPlacement,
          stemHeight: item.forceStemHeight ?? MIN_STEM,
        },
      ])
    );
  }

  const scale = 2 ** zoom;
  const toPixel = (latLng: google.maps.LatLngLiteral) => {
    const point = projection.fromLatLngToPoint(
      new google.maps.LatLng(latLng.lat, latLng.lng)
    );
    if (!point) return { x: 0, y: 0 };
    return { x: point.x * scale, y: point.y * scale };
  };

  const ordered = [...items].sort((a, b) => {
    const aForced = a.forcePlacement || a.forceStemHeight != null ? 0 : 1;
    const bForced = b.forcePlacement || b.forceStemHeight != null ? 0 : 1;
    if (aForced !== bForced) return aForced - bForced;
    const pa = toPixel(a.position);
    const pb = toPixel(b.position);
    return pa.x - pb.x || pa.y - pb.y;
  });

  const placed: Array<{
    id: string;
    layout: DashboardMarkerLayout;
    rect: PixelRect;
    anchorX: number;
    anchorY: number;
  }> = [];

  for (const item of ordered) {
    const anchor = toPixel(item.position);
    const width = item.width + SIZE_SLACK;
    const height = item.height + SIZE_SLACK;
    const nearbyUsed = new Set(
      placed
        .filter((other) => {
          const dx = other.anchorX - anchor.x;
          const dy = other.anchorY - anchor.y;
          return Math.hypot(dx, dy) < CLUSTER_RADIUS;
        })
        .map((other) => other.layout.placement)
    );
    const order: DashboardStemPlacement[] = item.forcePlacement
      ? [item.forcePlacement]
      : [
          ...placementOrder(item.preferredPlacement).filter(
            (placement) => !nearbyUsed.has(placement)
          ),
          ...placementOrder(item.preferredPlacement).filter((placement) =>
            nearbyUsed.has(placement)
          ),
        ];
    const stemCandidates =
      item.forceStemHeight != null
        ? [item.forceStemHeight]
        : STEM_CANDIDATES;

    let chosen: {
      layout: DashboardMarkerLayout;
      rect: PixelRect;
      cost: number;
    } | null = null;

    const collides = (rect: PixelRect) => {
      for (const other of placed) {
        if (overlaps(rect, other.rect, BOX_PADDING)) return true;
        if (coversPoint(rect, other.anchorX, other.anchorY, 4)) return true;
      }
      return false;
    };

    for (const placement of order) {
      for (const stemHeight of stemCandidates) {
        const rect = rectFor(
          anchor.x,
          anchor.y,
          width,
          height,
          placement,
          stemHeight
        );
        if (collides(rect)) continue;
        const cost =
          (placement === item.preferredPlacement ? 0 : 28) +
          (placement === "left" || placement === "right" ? 18 : 0) +
          stemHeight * 0.4;
        if (!chosen || cost < chosen.cost) {
          chosen = {
            layout: { placement, stemHeight },
            rect,
            cost,
          };
        }
        break;
      }
      if (chosen && chosen.cost < 40) break;
    }

    if (!chosen && item.forceStemHeight == null && item.forcePlacement == null) {
      for (const placement of order) {
        for (let stemHeight = MIN_STEM; stemHeight <= 220; stemHeight += 10) {
          const rect = rectFor(
            anchor.x,
            anchor.y,
            width,
            height,
            placement,
            stemHeight
          );
          if (collides(rect)) continue;
          chosen = {
            layout: { placement, stemHeight },
            rect,
            cost: stemHeight,
          };
          break;
        }
        if (chosen) break;
      }
    }

    const fallbackPlacement = item.forcePlacement ?? item.preferredPlacement;
    const fallbackStem = item.forceStemHeight ?? MIN_STEM;
    const fallback = chosen ?? {
      layout: {
        placement: fallbackPlacement,
        stemHeight: fallbackStem,
      },
      rect: rectFor(
        anchor.x,
        anchor.y,
        width,
        height,
        fallbackPlacement,
        fallbackStem
      ),
      cost: 0,
    };

    placed.push({
      id: item.id,
      layout: fallback.layout,
      rect: fallback.rect,
      anchorX: anchor.x,
      anchorY: anchor.y,
    });
  }

  return Object.fromEntries(placed.map((entry) => [entry.id, entry.layout]));
}
