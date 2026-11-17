import type { Tenant } from "../types/tenant";
import { getTenantInitial } from "./tenantInitial";
import { loadBrandLogoImage } from "./logoProvider";
import {
  drawCalloutMarker,
  fitContained,
  MARKER_STEM_HEIGHT_CALLOUT,
  roundRect,
} from "./markerCalloutCanvas";

/** Max logo footprint — shared by standalone + grouped cells. */
export const MAX_LOGO_WIDTH = 68;
export const MAX_LOGO_HEIGHT = 40;
export const LOGO_PADDING_X = 10;
export const LOGO_PADDING_Y = 9;

/** Slightly smaller pins for dense major-tenant corridors. */
export const COMPACT_LOGO_WIDTH = 44;
export const COMPACT_LOGO_HEIGHT = 26;
export const COMPACT_LOGO_PADDING_X = 6;
export const COMPACT_LOGO_PADDING_Y = 5;
export const COMPACT_LETTERMARK_SIZE = 24;

/**
 * Lettermark tile — beta blue everywhere (map pins, groups, directories).
 * Soft blue fill + beta-blue letter + rounded corners.
 */
export const LETTERMARK_SIZE = 40;
export const LETTERMARK_BG = "#E8F0F2";
export const LETTERMARK_COLOR = "#3E6F7E";
export const LETTERMARK_FONT =
  '700 18px "proxima-nova", system-ui, sans-serif';
export const LETTERMARK_RADIUS = 8;

/** Cell size in grouped grids ≈ standalone logo box. */
export const GROUP_CELL_WIDTH = MAX_LOGO_WIDTH + LOGO_PADDING_X;
export const GROUP_CELL_HEIGHT = MAX_LOGO_HEIGHT + LOGO_PADDING_Y;

export interface LogoMarkerLayoutOptions {
  placement?: "above" | "below" | "left" | "right";
  /** Shift the logo box horizontally; geographic anchor stays on lat/lng. */
  offsetX?: number;
  /** Draw a leader from the true lat/lng to the logo box. */
  showStem?: boolean;
  /** Leader length (px). Vertical for above/below; horizontal for left/right. */
  stemHeight?: number;
  /** Use compact logo sizing (dense major-tenant corridors). */
  compact?: boolean;
  /** Shrink/grow the logo box (1 = default). */
  scale?: number;
  /** When no logo loads, draw the full tenant name instead of a lettermark. */
  preferNameFallback?: boolean;
  /** Tiny beta-blue name boxes — no logos. */
  textOnly?: boolean;
}

export function drawLettermark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  letter: string
): void {
  roundRect(ctx, x, y, size, size, LETTERMARK_RADIUS);
  ctx.fillStyle = LETTERMARK_BG;
  ctx.fill();

  ctx.fillStyle = LETTERMARK_COLOR;
  ctx.font =
    size <= COMPACT_LETTERMARK_SIZE
      ? '700 14px "proxima-nova", system-ui, sans-serif'
      : LETTERMARK_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, x + size / 2, y + size / 2 + 1);
}

function logoDims(compact?: boolean, scale = 1) {
  const s = scale > 0 ? scale : 1;
  if (compact) {
    return {
      maxW: Math.max(16, Math.round(COMPACT_LOGO_WIDTH * s)),
      maxH: Math.max(12, Math.round(COMPACT_LOGO_HEIGHT * s)),
      padX: COMPACT_LOGO_PADDING_X,
      padY: COMPACT_LOGO_PADDING_Y,
      letter: Math.max(14, Math.round(COMPACT_LETTERMARK_SIZE * s)),
    };
  }
  return {
    maxW: Math.max(16, Math.round(MAX_LOGO_WIDTH * s)),
    maxH: Math.max(12, Math.round(MAX_LOGO_HEIGHT * s)),
    padX: LOGO_PADDING_X,
    padY: LOGO_PADDING_Y,
    letter: Math.max(16, Math.round(LETTERMARK_SIZE * s)),
  };
}

function calloutOptions(layout?: LogoMarkerLayoutOptions) {
  return {
    placement: layout?.placement,
    offsetX: layout?.offsetX ?? 0,
    showStem: layout?.showStem,
    stemHeight: layout?.showStem
      ? (layout.stemHeight ?? MARKER_STEM_HEIGHT_CALLOUT)
      : undefined,
  };
}

function nameCalloutMetrics(tenantName: string, compact?: boolean) {
  const fontSize = compact ? 11 : 12;
  const padX = compact ? 8 : 11;
  const padY = compact ? 5 : 7;
  const label = tenantName.trim();
  const charW = fontSize * 0.62;
  const width = Math.max(48, Math.ceil(label.length * charW + padX * 2));
  const height = fontSize + padY * 2;
  return { label, fontSize, padX, padY, width, height };
}

/** Screen-space size for a full-name callout (no truncation). */
export function estimateNameCalloutSize(
  tenantName: string,
  compact?: boolean
): { width: number; height: number } {
  const metrics = nameCalloutMetrics(tenantName, compact);
  return { width: metrics.width, height: metrics.height };
}

function createNameCalloutIcon(
  tenantName: string,
  layout?: LogoMarkerLayoutOptions
): google.maps.Icon {
  const compact = layout?.compact;
  const { label, fontSize, padX, padY } = nameCalloutMetrics(tenantName, compact);
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `600 ${fontSize}px "proxima-nova", system-ui, sans-serif`;
  const textWidth = measure.measureText(label).width;
  const boxWidth = Math.max(48, Math.ceil(textWidth + padX * 2));
  const boxHeight = fontSize + padY * 2;

  return drawCalloutMarker(
    boxWidth,
    boxHeight,
    (ctx, boxX, boxY) => {
      ctx.fillStyle = "#1A2332";
      ctx.font = `600 ${fontSize}px "proxima-nova", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, boxX + boxWidth / 2, boxY + boxHeight / 2 + 0.5);
    },
    calloutOptions(layout)
  );
}

function createLettermarkFallback(
  tenantName: string,
  layout?: LogoMarkerLayoutOptions
): google.maps.Icon {
  if (layout?.preferNameFallback) {
    return createNameCalloutIcon(tenantName, layout);
  }
  const dims = logoDims(layout?.compact, layout?.scale);
  const letter = getTenantInitial(tenantName);
  const box = dims.letter + dims.padY;
  const pad = (box - dims.letter) / 2;

  return drawCalloutMarker(
    box,
    box,
    (ctx, boxX, boxY) => {
      drawLettermark(ctx, boxX + pad, boxY + pad, dims.letter, letter);
    },
    calloutOptions(layout)
  );
}

function createFromLogoImage(
  img: HTMLImageElement,
  layout?: LogoMarkerLayoutOptions
): google.maps.Icon {
  const dims = logoDims(layout?.compact, layout?.scale);
  const { width: logoWidth, height: logoHeight } = fitContained(
    img.naturalWidth,
    img.naturalHeight,
    dims.maxW,
    dims.maxH
  );
  const boxWidth = logoWidth + dims.padX * 2;
  const boxHeight = logoHeight + dims.padY * 2;

  return drawCalloutMarker(
    boxWidth,
    boxHeight,
    (ctx, boxX, boxY) => {
      const x = boxX + (boxWidth - logoWidth) / 2;
      const y = boxY + (boxHeight - logoHeight) / 2;
      ctx.drawImage(img, x, y, logoWidth, logoHeight);
    },
    calloutOptions(layout)
  );
}

export async function createLogoMarkerIcon(
  tenant: Tenant,
  layout?: LogoMarkerLayoutOptions
): Promise<google.maps.Icon> {
  // Cascade: Brandfetch dark logo → icon → Logo.dev → local library → lettermark.
  const img = await loadBrandLogoImage(tenant.logoDomain, tenant.tenantName);
  if (!img) return createLettermarkFallback(tenant.tenantName, layout);
  return createFromLogoImage(img, layout);
}

/** Conservative screen-space size for collision layout (logo box only). */
export function estimateLogoMarkerSize(options?: {
  compact?: boolean;
  scale?: number;
}): { width: number; height: number } {
  const dims = logoDims(options?.compact, options?.scale ?? 1);
  return {
    width: dims.maxW + dims.padX * 2,
    height: dims.maxH + dims.padY * 2,
  };
}
