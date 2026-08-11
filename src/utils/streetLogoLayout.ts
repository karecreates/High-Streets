import type { OverviewPlacement } from "./overviewMarkerLayout";

export interface StreetLogoLayout {
  placement: OverviewPlacement;
  /** Vertical leader length. */
  stemHeight: number;
  /** Optional horizontal shift (override only — e.g. Everlane left). */
  offsetX: number;
}

export interface StreetLogoLayoutItem {
  id: string;
  position: { lat: number; lng: number };
  width: number;
  height: number;
  /** Hard preference from curated overrides. */
  forcePlacement?: OverviewPlacement;
  forceOffsetX?: number;
  forceStemHeight?: number;
}

interface PixelRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const BOX_PADDING = 8;
const MIN_STEM = 10;
/** Extra slack so real logo canvases (aspect-dependent) still clear. */
const SIZE_SLACK = 6;

/**
 * Stem lengths must jump by ~full box height when stacking on the same side.
 * Tiny increments (16→22) still overlap once logos are full-size.
 * Manual forceStemHeight is a hard cap — never stretch those callouts far away.
 */
function stemCandidatesFor(
  boxHeight: number,
  forceStemHeight?: number
): number[] {
  if (forceStemHeight != null) {
    // Only this length (plus a hair shorter) — do not grow past the override.
    const stems = new Set<number>([
      forceStemHeight,
      Math.max(MIN_STEM, forceStemHeight - 4),
    ]);
    return [...stems].sort((a, b) => a - b);
  }

  const step = Math.max(28, Math.ceil(boxHeight + BOX_PADDING));
  const stems = new Set<number>();
  for (let i = 0; i < 7; i++) {
    stems.add(MIN_STEM + i * step);
  }
  // A few short in-between lengths help when the opposite side is free.
  for (let s = MIN_STEM; s < MIN_STEM + step; s += 12) {
    stems.add(s);
  }
  return [...stems].sort((a, b) => a - b);
}

function rectFor(
  anchorX: number,
  anchorY: number,
  width: number,
  height: number,
  placement: OverviewPlacement,
  stemHeight: number,
  offsetX: number
): PixelRect {
  const centerX = anchorX + offsetX;
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  if (placement === "above") {
    return {
      left,
      right,
      top: anchorY - stemHeight - height,
      bottom: anchorY - stemHeight,
    };
  }
  return {
    left,
    right,
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

/**
 * Place logo boxes above/below their true lat/lng with vertical stems.
 * Horizontal offset is only used when an item supplies forceOffsetX.
 *
 * Uses world-pixel space (not viewport bounds) so results are stable when
 * panning — only zoom changes the layout scale.
 */
export function resolveStreetLogoLayouts(
  map: google.maps.Map,
  items: StreetLogoLayoutItem[]
): Record<string, StreetLogoLayout> {
  const projection = map.getProjection();
  const zoom = map.getZoom();
  const fallbackStem = MIN_STEM;
  if (!projection || zoom == null) {
    return Object.fromEntries(
      items.map((item) => [
        item.id,
        {
          placement: item.forcePlacement ?? "above",
          stemHeight: item.forceStemHeight ?? fallbackStem,
          offsetX: item.forceOffsetX ?? 0,
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
    return {
      x: point.x * scale,
      y: point.y * scale,
    };
  };

  // Manual overrides claim space first; then walk left→right along the corridor.
  const ordered = [...items].sort((a, b) => {
    const aForced =
      a.forcePlacement || a.forceOffsetX != null || a.forceStemHeight != null
        ? 0
        : 1;
    const bForced =
      b.forcePlacement || b.forceOffsetX != null || b.forceStemHeight != null
        ? 0
        : 1;
    if (aForced !== bForced) return aForced - bForced;
    const pa = toPixel(a.position);
    const pb = toPixel(b.position);
    return pa.x - pb.x || pa.y - pb.y;
  });

  const placed: Array<{
    id: string;
    layout: StreetLogoLayout;
    rect: PixelRect;
    anchorX: number;
  }> = [];

  for (const item of ordered) {
    const anchor = toPixel(item.position);
    const offsetX = item.forceOffsetX ?? 0;
    const width = item.width + SIZE_SLACK;
    const height = item.height + SIZE_SLACK;

    const nearby = placed.filter(
      (p) => Math.abs(p.anchorX - anchor.x) < width * 1.75
    );
    const aboveNearby = nearby.filter((p) => p.layout.placement === "above")
      .length;
    const belowNearby = nearby.filter((p) => p.layout.placement === "below")
      .length;
    const autoPreferred: OverviewPlacement =
      aboveNearby <= belowNearby ? "above" : "below";
    const preferred = item.forcePlacement ?? autoPreferred;
    // Manual placement is hard-locked (no flipping to the other side).
    // Stem-only overrides may still try both sides at the capped length.
    const placementOrder: OverviewPlacement[] = item.forcePlacement
      ? [item.forcePlacement]
      : preferred === "above"
        ? ["above", "below"]
        : ["below", "above"];

    const stemCandidates = stemCandidatesFor(height, item.forceStemHeight);
    const hardStemCap = item.forceStemHeight ?? null;

    let chosen: {
      layout: StreetLogoLayout;
      rect: PixelRect;
      cost: number;
    } | null = null;

    for (const placement of placementOrder) {
      const sidePenalty =
        item.forcePlacement && placement !== item.forcePlacement ? 80 : 0;
      for (const stemHeight of stemCandidates) {
        const rect = rectFor(
          anchor.x,
          anchor.y,
          width,
          height,
          placement,
          stemHeight,
          offsetX
        );
        let hit = false;
        for (const other of placed) {
          if (overlaps(rect, other.rect, BOX_PADDING)) {
            hit = true;
            break;
          }
        }
        const cost =
          (placement === preferred ? 0 : 30) +
          sidePenalty +
          stemHeight * 0.35 +
          Math.abs(offsetX) * 0.1;
        if (!hit) {
          if (!chosen || cost < chosen.cost) {
            chosen = {
              layout: { placement, stemHeight, offsetX },
              rect,
              cost,
            };
          }
          break;
        }
      }
      if (chosen && chosen.cost < 80) break;
    }

    // Last resort for non-overrides: push farther out. Stem overrides stay capped.
    if (!chosen && hardStemCap == null) {
      for (const placement of placementOrder) {
        for (let stemHeight = MIN_STEM; stemHeight <= 240; stemHeight += 8) {
          const rect = rectFor(
            anchor.x,
            anchor.y,
            width,
            height,
            placement,
            stemHeight,
            offsetX
          );
          if (placed.every((other) => !overlaps(rect, other.rect, BOX_PADDING))) {
            chosen = {
              layout: { placement, stemHeight, offsetX },
              rect,
              cost: stemHeight,
            };
            break;
          }
        }
        if (chosen) break;
      }
    }

    // Stem override: always use the short length, pick the clearer side.
    if (!chosen && hardStemCap != null) {
      let best: {
        layout: StreetLogoLayout;
        rect: PixelRect;
        cost: number;
      } | null = null;
      for (const placement of placementOrder) {
        const rect = rectFor(
          anchor.x,
          anchor.y,
          width,
          height,
          placement,
          hardStemCap,
          offsetX
        );
        let overlapCost = 0;
        for (const other of placed) {
          if (overlaps(rect, other.rect, BOX_PADDING)) {
            overlapCost += 1000;
          }
        }
        const cost =
          overlapCost + (placement === preferred ? 0 : 30) + hardStemCap;
        if (!best || cost < best.cost) {
          best = {
            layout: { placement, stemHeight: hardStemCap, offsetX },
            rect,
            cost,
          };
        }
      }
      chosen = best;
    }

    const finalChoice = chosen ?? {
      layout: {
        placement: preferred,
        stemHeight: hardStemCap ?? stemCandidates[0] ?? fallbackStem,
        offsetX,
      },
      rect: rectFor(
        anchor.x,
        anchor.y,
        width,
        height,
        preferred,
        hardStemCap ?? stemCandidates[0] ?? fallbackStem,
        offsetX
      ),
      cost: 0,
    };

    placed.push({
      id: item.id,
      layout: finalChoice.layout,
      rect: finalChoice.rect,
      anchorX: anchor.x,
    });
  }

  return Object.fromEntries(placed.map((entry) => [entry.id, entry.layout]));
}
