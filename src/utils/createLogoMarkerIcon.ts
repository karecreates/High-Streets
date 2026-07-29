import type { Tenant } from "../types/tenant";
import { getTenantInitial } from "./tenantInitial";
import { loadBrandLogoImage } from "./logoProvider";
import {
  drawCalloutMarker,
  fitContained,
  roundRect,
} from "./markerCalloutCanvas";

/** Max logo footprint — shared by standalone + grouped cells. */
export const MAX_LOGO_WIDTH = 68;
export const MAX_LOGO_HEIGHT = 40;
export const LOGO_PADDING_X = 10;
export const LOGO_PADDING_Y = 9;

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
  ctx.font = LETTERMARK_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, x + size / 2, y + size / 2 + 1);
}

function createLettermarkFallback(tenantName: string): google.maps.Icon {
  const letter = getTenantInitial(tenantName);
  const box = LETTERMARK_SIZE + LOGO_PADDING_Y;
  const pad = (box - LETTERMARK_SIZE) / 2;

  return drawCalloutMarker(box, box, (ctx, _x, boxY) => {
    drawLettermark(ctx, pad, boxY + pad, LETTERMARK_SIZE, letter);
  });
}

function createFromLogoImage(img: HTMLImageElement): google.maps.Icon {
  const { width: logoWidth, height: logoHeight } = fitContained(
    img.naturalWidth,
    img.naturalHeight,
    MAX_LOGO_WIDTH,
    MAX_LOGO_HEIGHT
  );
  const boxWidth = logoWidth + LOGO_PADDING_X * 2;
  const boxHeight = logoHeight + LOGO_PADDING_Y * 2;

  return drawCalloutMarker(boxWidth, boxHeight, (ctx, _x, boxY) => {
    const x = (boxWidth - logoWidth) / 2;
    const y = boxY + (boxHeight - logoHeight) / 2;
    ctx.drawImage(img, x, y, logoWidth, logoHeight);
  });
}

export async function createLogoMarkerIcon(
  tenant: Tenant
): Promise<google.maps.Icon> {
  // Cascade: BF dark logo → BF dark icon → logo.dev → plain-text lettermark.
  const img = await loadBrandLogoImage(tenant.logoDomain, { size: 160 });
  if (!img) return createLettermarkFallback(tenant.tenantName);
  return createFromLogoImage(img);
}
