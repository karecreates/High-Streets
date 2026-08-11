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
  placement?: "above" | "below";
  /** Shift the logo box horizontally; geographic anchor stays on lat/lng. */
  offsetX?: number;
  /** Draw a leader from the true lat/lng to the logo box. */
  showStem?: boolean;
  /** Vertical leader length (px). When set with showStem, overrides default. */
  stemHeight?: number;
  /** Use compact logo sizing (dense major-tenant corridors). */
  compact?: boolean;
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

function logoDims(compact?: boolean) {
  if (compact) {
    return {
      maxW: COMPACT_LOGO_WIDTH,
      maxH: COMPACT_LOGO_HEIGHT,
      padX: COMPACT_LOGO_PADDING_X,
      padY: COMPACT_LOGO_PADDING_Y,
      letter: COMPACT_LETTERMARK_SIZE,
    };
  }
  return {
    maxW: MAX_LOGO_WIDTH,
    maxH: MAX_LOGO_HEIGHT,
    padX: LOGO_PADDING_X,
    padY: LOGO_PADDING_Y,
    letter: LETTERMARK_SIZE,
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

function createLettermarkFallback(
  tenantName: string,
  layout?: LogoMarkerLayoutOptions
): google.maps.Icon {
  const dims = logoDims(layout?.compact);
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
  const dims = logoDims(layout?.compact);
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
  // Cascade: BF dark logo → BF dark icon → logo.dev → plain-text lettermark.
  const img = await loadBrandLogoImage(tenant.logoDomain);
  if (!img) return createLettermarkFallback(tenant.tenantName, layout);
  return createFromLogoImage(img, layout);
}

/** Conservative screen-space size for collision layout (logo box only). */
export function estimateLogoMarkerSize(options?: {
  compact?: boolean;
}): { width: number; height: number } {
  const dims = logoDims(options?.compact);
  return {
    width: dims.maxW + dims.padX * 2,
    height: dims.maxH + dims.padY * 2,
  };
}
