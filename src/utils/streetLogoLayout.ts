import type { OverviewPlacement } from "./overviewMarkerLayout";

/** Street logo callouts support side placements (pure horizontal stems). */
export type StreetLogoPlacement = OverviewPlacement | "left" | "right";

export interface StreetLogoLayout {
  placement: StreetLogoPlacement;
  /** Leader length — vertical for above/below, horizontal for left/right. */
  stemHeight: number;
  /** Optional horizontal shift (above/below only — e.g. Everlane left). */
  offsetX: number;
}

export interface StreetLogoLayoutItem {
  id: string;
  position: { lat: number; lng: number };
  width: number;
  height: number;
  /** Hard preference from curated overrides. */
  forcePlacement?: StreetLogoPlacement;
  forceOffsetX?: number;
  forceStemHeight?: number;
}

/** Opt-in packing for dense corridors (e.g. all occupied on Third Street). */
export interface StreetLogoLayoutOptions {
  /** Also try left/right leaders, not just above/below. */
  allowSidePlacement?: boolean;
  /** Fan above/below boxes sideways when a short stem would collide. */
  allowAutoOffsetX?: boolean;
  /** Grow past forceStemHeight rather than accepting overlap. */
  relaxForcedStems?: boolean;
  maxStem?: number;
  /**
   * Restrict the packer to these sides (e.g. left/right on a north–south
   * street so logos sit off the roadway, not along it).
   */
  preferredSides?: StreetLogoPlacement[];
  /** Tight packing for tiny name pills — no logo slack. */
  textOnlyPack?: boolean;
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
  forceStemHeight?: number,
  maxStem = 240
): number[] {
  if (forceStemHeight != null) {
    // Only this length (plus a hair shorter) — do not grow past the override.
    const stems = new Set<number>([
      forceStemHeight,
      Math.max(MIN_STEM, forceStemHeight - 4),
    ]);
    return [...stems].sort((a, b) => a - b);
  }

  const cap = Math.max(MIN_STEM, maxStem);
  const step = Math.max(16, Math.min(28, Math.ceil(boxHeight + BOX_PADDING)));
  const stems = new Set<number>();
  for (let i = 0; i < 7; i++) {
    const stem = MIN_STEM + i * step;
    if (stem > cap) break;
    stems.add(stem);
  }
  for (let s = MIN_STEM; s < Math.min(MIN_STEM + step, cap); s += 8) {
    stems.add(s);
  }
  stems.add(cap);
  return [...stems].sort((a, b) => a - b);
}

function rectFor(
  anchorX: number,
  anchorY: number,
  width: number,
  height: number,
  placement: StreetLogoPlacement,
  stemHeight: number,
  offsetX: number
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

function stemRectFor(
  x: number,
  y: number,
  placement: StreetLogoPlacement,
  stemHeight: number
): PixelRect {
  if (placement === "left") {
    return { left: x - stemHeight, right: x, top: y - 3, bottom: y + 3 };
  }
  if (placement === "right") {
    return { left: x, right: x + stemHeight, top: y - 3, bottom: y + 3 };
  }
  if (placement === "above") {
    return { left: x - 3, right: x + 3, top: y - stemHeight, bottom: y };
  }
  return { left: x - 3, right: x + 3, top: y, bottom: y + stemHeight };
}

function anchorRect(x: number, y: number): PixelRect {
  return { left: x - 5, right: x + 5, top: y - 5, bottom: y + 5 };
}

/**
 * All-tenants packer: cardinal 90° stems only. Pick the shortest clear
 * leader so boxes never cover each other, each other's stems, or pins.
 */
export function packStreetLogoLayouts(
  items: Array<StreetLogoLayoutItem & { x: number; y: number }>,
  options: StreetLogoLayoutOptions = {}
): Record<string, StreetLogoLayout> {
  const padding = BOX_PADDING + 8;
  const sizeSlack = SIZE_SLACK + 14;
  const maxStem = Math.max(options.maxStem ?? 220, 640);
  const ordered = [...items].sort((a, b) => a.x - b.x || a.y - b.y);

  const placed: Array<{
    id: string;
    layout: StreetLogoLayout;
    rect: PixelRect;
    stem: PixelRect;
  }> = [];

  const blocked = (
    rect: PixelRect,
    stem: PixelRect,
    selfId: string
  ): boolean => {
    for (const other of placed) {
      if (overlaps(rect, other.rect, padding)) return true;
      if (overlaps(rect, other.stem, 3)) return true;
      if (overlaps(stem, other.rect, 3)) return true;
    }
    for (const other of items) {
      if (other.id === selfId) continue;
      if (overlaps(rect, anchorRect(other.x, other.y), 2)) return true;
    }
    return false;
  };

  for (let index = 0; index < ordered.length; index++) {
    const item = ordered[index];
    const width = item.width + sizeSlack;
    const height = item.height + sizeSlack;
    const sides: StreetLogoPlacement[] = options.allowSidePlacement
      ? ["above", "below", "left", "right"]
      : index % 2 === 0
        ? ["above", "below"]
        : ["below", "above"];

    let chosen: {
      layout: StreetLogoLayout;
      rect: PixelRect;
      stem: PixelRect;
    } | null = null;

    for (const placement of sides) {
      for (let stemHeight = MIN_STEM; stemHeight <= maxStem; stemHeight += 6) {
        const rect = rectFor(
          item.x,
          item.y,
          width,
          height,
          placement,
          stemHeight,
          0
        );
        const stem = stemRectFor(item.x, item.y, placement, stemHeight);
        if (blocked(rect, stem, item.id)) continue;
        if (!chosen || stemHeight < chosen.layout.stemHeight) {
          chosen = {
            layout: { placement, stemHeight, offsetX: 0 },
            rect,
            stem,
          };
        }
        break;
      }
    }

    if (!chosen) {
      const placement = sides[0];
      const stemHeight = maxStem;
      chosen = {
        layout: { placement, stemHeight, offsetX: 0 },
        rect: rectFor(item.x, item.y, width, height, placement, stemHeight, 0),
        stem: stemRectFor(item.x, item.y, placement, stemHeight),
      };
    }

    placed.push({
      id: item.id,
      layout: chosen.layout,
      rect: chosen.rect,
      stem: chosen.stem,
    });
  }

  return Object.fromEntries(placed.map((entry) => [entry.id, entry.layout]));
}

function overlapArea(a: PixelRect, b: PixelRect, padding: number): number {
  const left = Math.max(a.left - padding, b.left);
  const right = Math.min(a.right + padding, b.right);
  const top = Math.max(a.top - padding, b.top);
  const bottom = Math.min(a.bottom + padding, b.bottom);
  if (right <= left || bottom <= top) return 0;
  return (right - left) * (bottom - top);
}

/**
 * Pack tiny text pills around a north–south corridor. Uses 90° stems only,
 * prefers the side of the street the storefront is on, and scores leftover
 * collisions so labels never all collapse onto one stem length.
 */
export function packTextOnlyStreetLayouts(
  items: Array<StreetLogoLayoutItem & { x: number; y: number }>,
  options: StreetLogoLayoutOptions = {}
): Record<string, StreetLogoLayout> {
  const padding = 2;
  const maxStem = options.maxStem ?? 132;
  const ordered = [...items].sort((a, b) => {
    const aForced = a.forcePlacement ? 0 : 1;
    const bForced = b.forcePlacement ? 0 : 1;
    if (aForced !== bForced) return aForced - bForced;
    return a.y - b.y || a.x - b.x;
  });
  const medianX =
    ordered.length === 0
      ? 0
      : [...ordered].sort((a, b) => a.x - b.x)[Math.floor(ordered.length / 2)]
          .x;
  const medianY =
    ordered.length === 0
      ? 0
      : [...ordered].sort((a, b) => a.y - b.y)[Math.floor(ordered.length / 2)]
          .y;

  /** Side order: vertical-first fans labels into the empty blocks above and
   *  below a diagonal corridor (preferredSides: ["above", "below"]), while
   *  the default horizontal-first suits north–south streets. */
  const verticalMode =
    options.preferredSides?.[0] === "above" ||
    options.preferredSides?.[0] === "below";
  const sideOrderFor = (x: number, y: number): StreetLogoPlacement[] => {
    if (verticalMode) {
      return y <= medianY
        ? ["above", "below", "left", "right"]
        : ["below", "above", "left", "right"];
    }
    return x <= medianX
      ? ["left", "right", "above", "below"]
      : ["right", "left", "above", "below"];
  };

  /** In vertical mode, long horizontal leaders slice through text at the
   *  same height — keep side stems short and let labels fan vertically. */
  const stemCapFor = (placement: StreetLogoPlacement, cap: number): number =>
    verticalMode && (placement === "left" || placement === "right")
      ? Math.min(cap, 72)
      : cap;

  const placed: Array<{
    id: string;
    layout: StreetLogoLayout;
    rect: PixelRect;
    stem: PixelRect;
  }> = [];

  const collisionScore = (rect: PixelRect, stem: PixelRect): number => {
    let score = 0;
    for (const other of placed) {
      score += overlapArea(rect, other.rect, padding) * 4;
      score += overlapArea(rect, other.stem, 1) * 2;
      score += overlapArea(stem, other.rect, 1) * 2;
    }
    for (const other of items) {
      score += overlapArea(rect, anchorRect(other.x, other.y), 1);
    }
    return score;
  };

  const blocked = (
    rect: PixelRect,
    stem: PixelRect,
    selfId: string
  ): boolean => {
    for (const other of placed) {
      if (overlaps(rect, other.rect, padding)) return true;
      if (overlaps(rect, other.stem, 1)) return true;
      if (overlaps(stem, other.rect, 1)) return true;
    }
    for (const other of items) {
      if (other.id === selfId) continue;
      if (overlaps(rect, anchorRect(other.x, other.y), 1)) return true;
    }
    return false;
  };

  for (const item of ordered) {
    const width = item.width + 1;
    const height = item.height + 1;
    const sides: StreetLogoPlacement[] = item.forcePlacement
      ? [item.forcePlacement]
      : sideOrderFor(item.x, item.y);
    const startStem = item.forceStemHeight ?? 5;
    const itemMaxStem =
      item.forceStemHeight != null ? item.forceStemHeight : maxStem;
    const offsets = [0, -14, 14, -28, 28, -42, 42].filter(
      (offset) => Math.abs(offset) <= Math.max(8, width / 2)
    );

    let chosen: {
      layout: StreetLogoLayout;
      rect: PixelRect;
      stem: PixelRect;
    } | null = null;
    let fallback: {
      layout: StreetLogoLayout;
      rect: PixelRect;
      stem: PixelRect;
      score: number;
    } | null = null;

    for (const placement of sides) {
      const useOffsets = placement === "above" || placement === "below";
      const placementMaxStem = stemCapFor(placement, itemMaxStem);
      for (const offsetX of useOffsets ? offsets : [0]) {
        for (
          let stemHeight = startStem;
          stemHeight <= placementMaxStem;
          stemHeight += 3
        ) {
          const rect = rectFor(
            item.x,
            item.y,
            width,
            height,
            placement,
            stemHeight,
            offsetX
          );
          const stem = stemRectFor(item.x, item.y, placement, stemHeight);
          const score = collisionScore(rect, stem);
          if (
            !fallback ||
            score < fallback.score ||
            (score === fallback.score &&
              stemHeight < fallback.layout.stemHeight)
          ) {
            fallback = {
              layout: { placement, stemHeight, offsetX },
              rect,
              stem,
              score,
            };
          }
          if (blocked(rect, stem, item.id)) continue;
          if (!chosen || stemHeight < chosen.layout.stemHeight) {
            chosen = {
              layout: { placement, stemHeight, offsetX },
              rect,
              stem,
            };
          }
          break;
        }
        if (chosen) break;
      }
      if (chosen) break;
    }

    const pick = chosen ?? fallback;
    if (!pick) continue;
    placed.push({
      id: item.id,
      layout: pick.layout,
      rect: pick.rect,
      stem: pick.stem,
    });
  }

  // Repair pass: fallback picks may hide a name (box over box) or slice one
  // (leader through a box). Re-seat only those offenders into the nearest
  // clear spot — fully clear if possible, otherwise at least box-clear.
  // Cleanly placed labels never move, so this cannot cascade. Placements are
  // kept within the corridor's anchor band so labels don't drift under the
  // floating controls above the map.
  const itemById = new Map(items.map((item) => [item.id, item]));
  const anchorMinY = Math.min(...items.map((i) => i.y));
  const anchorMaxY = Math.max(...items.map((i) => i.y));
  const anchorMinX = Math.min(...items.map((i) => i.x));
  const anchorMaxX = Math.max(...items.map((i) => i.x));
  const bandTop = anchorMinY - 36;
  const bandBottom = anchorMaxY + 170;
  const bandLeft = anchorMinX - 110;
  const bandRight = anchorMaxX + 110;

  // Only corridors using vertical-first fanning (Abbot Kinney) opt into the
  // repair pass; Third Street's approved column layout stays byte-identical.
  const repairPasses = options.preferredSides?.length ? 2 : 0;

  // Two passes: moves in the first pass can introduce fresh crossings that
  // the second pass then cleans up.
  for (let repairPass = 0; repairPass < repairPasses; repairPass++) {
  for (const entry of placed) {
    const offends = placed.some(
      (other) =>
        other !== entry &&
        (overlaps(entry.rect, other.rect, padding) ||
          overlaps(entry.stem, other.rect, 0))
    );
    if (!offends) continue;
    const item = itemById.get(entry.id);
    if (!item) continue;
    const width = item.width + 1;
    const height = item.height + 1;
    const sides = sideOrderFor(item.x, item.y);
    const offsets = [0, -14, 14, -28, 28, -42, 42].filter(
      (offset) => Math.abs(offset) <= Math.max(8, width / 2)
    );

    type Candidate = {
      layout: StreetLogoLayout;
      rect: PixelRect;
      stem: PixelRect;
      crossings: number;
    };
    let best: Candidate | null = null;

    for (const placement of sides) {
      const useOffsets = placement === "above" || placement === "below";
      const placementMaxStem = stemCapFor(placement, maxStem);
      for (const offsetX of useOffsets ? offsets : [0]) {
        for (
          let stemHeight = 5;
          stemHeight <= placementMaxStem;
          stemHeight += 3
        ) {
          const rect = rectFor(
            item.x,
            item.y,
            width,
            height,
            placement,
            stemHeight,
            offsetX
          );
          if (rect.top < bandTop || rect.bottom > bandBottom) continue;
          if (rect.left < bandLeft || rect.right > bandRight) continue;
          const stem = stemRectFor(item.x, item.y, placement, stemHeight);

          let rectClear = true;
          let crossings = 0;
          for (const other of placed) {
            if (other === entry) continue;
            if (overlaps(rect, other.rect, padding)) {
              rectClear = false;
              break;
            }
            if (overlaps(stem, other.rect, 0)) crossings++;
            if (overlaps(rect, other.stem, 0)) crossings++;
          }
          if (rectClear) {
            for (const other of items) {
              if (other.id === entry.id) continue;
              if (overlaps(rect, anchorRect(other.x, other.y), 1)) {
                rectClear = false;
                break;
              }
            }
          }
          if (!rectClear) continue;
          if (
            !best ||
            crossings < best.crossings ||
            (crossings === best.crossings &&
              stemHeight < best.layout.stemHeight)
          ) {
            best = {
              layout: { placement, stemHeight, offsetX },
              rect,
              stem,
              crossings,
            };
          }
          // A perfectly clear short placement cannot be beaten.
          if (crossings === 0 && stemHeight <= 8) break;
        }
        if (best && best.crossings === 0 && best.layout.stemHeight <= 8) {
          break;
        }
      }
      if (best && best.crossings === 0) break;
    }

    if (best) {
      entry.layout = best.layout;
      entry.rect = best.rect;
      entry.stem = best.stem;
    }
  }
  }

  return Object.fromEntries(placed.map((entry) => [entry.id, entry.layout]));
}

/**
 * Place logo boxes above/below their true lat/lng with vertical stems.
 * Horizontal offset is only used when an item supplies forceOffsetX
 * (Abbot Kinney / Third Street curated tweaks) — never auto-applied.
 *
 * Uses world-pixel space (not viewport bounds) so results are stable when
 * panning — only zoom changes the layout scale.
 */
export function resolveStreetLogoLayouts(
  map: google.maps.Map,
  items: StreetLogoLayoutItem[],
  options?: StreetLogoLayoutOptions
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

  if (options?.textOnlyPack) {
    return packTextOnlyStreetLayouts(
      items.map((item) => {
        const pixel = toPixel(item.position);
        return { ...item, x: pixel.x, y: pixel.y };
      }),
      options
    );
  }

  if (
    options?.allowSidePlacement ||
    options?.allowAutoOffsetX ||
    options?.relaxForcedStems
  ) {
    return packStreetLogoLayouts(
      items.map((item) => {
        const pixel = toPixel(item.position);
        return { ...item, x: pixel.x, y: pixel.y };
      }),
      options
    );
  }

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
    anchorY: number;
  }> = [];
  const maxStem = options?.maxStem ?? 240;
  const preferredSides = options?.preferredSides;

  for (const item of ordered) {
    const anchor = toPixel(item.position);
    const offsetX = item.forceOffsetX ?? 0;
    const width = item.width + SIZE_SLACK;
    const height = item.height + SIZE_SLACK;

    const nearby = placed.filter((p) => {
      const dx = Math.abs(p.anchorX - anchor.x);
      const dy = Math.abs(p.anchorY - anchor.y);
      return dx < width * 2.1 && dy < height * 2.4;
    });
    const countOn = (side: StreetLogoPlacement) =>
      nearby.filter((p) => p.layout.placement === side).length;

    let autoPreferred: StreetLogoPlacement;
    let placementOrder: StreetLogoPlacement[];
    if (item.forcePlacement) {
      autoPreferred = item.forcePlacement;
      placementOrder = [item.forcePlacement];
    } else if (preferredSides?.length) {
      const first = preferredSides.reduce((best, side) =>
        countOn(side) < countOn(best) ? side : best
      );
      autoPreferred = first;
      placementOrder = [
        first,
        ...preferredSides.filter((side) => side !== first),
      ];
    } else {
      autoPreferred = countOn("above") <= countOn("below") ? "above" : "below";
      placementOrder =
        autoPreferred === "above" ? ["above", "below"] : ["below", "above"];
    }
    const preferred = autoPreferred;

    const stemCandidates = stemCandidatesFor(
      height,
      item.forceStemHeight,
      maxStem
    );
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

    // Last resort for non-overrides: push farther out, but never past maxStem.
    if (!chosen && hardStemCap == null) {
      for (const placement of placementOrder) {
        for (let stemHeight = MIN_STEM; stemHeight <= maxStem; stemHeight += 8) {
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
      anchorY: anchor.y,
    });
  }

  return Object.fromEntries(placed.map((entry) => [entry.id, entry.layout]));
}
