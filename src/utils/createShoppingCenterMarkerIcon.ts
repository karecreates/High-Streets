import { drawCalloutMarker, loadLogoImage } from "./markerCalloutCanvas";

const DEFAULT_LOGO_TARGET_WIDTH = 120;
const COMPACT_LOGO_TARGET_WIDTH = 52;
const PADDING_X = 14;
const PADDING_Y = 20;
const COMPACT_PADDING_X = 8;
const COMPACT_PADDING_Y = 10;
const LIGHT_MARKER_BOX_BG = "#e8ecef";

export type ShoppingCenterLogoPlacement = "above" | "below";

/** Fractional insets (0–1) cropped from the source logo before sizing the box. */
export interface ShoppingCenterLogoCrop {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface ShoppingCenterMarkerOptions {
  /** Light grey box — helps white logos read on the map. */
  lightBox?: boolean;
  /** Explicit callout background color (wins over lightBox). */
  boxBg?: string;
  /** Smaller pin for overview / master map. */
  compact?: boolean;
  /** Override logo target width in CSS pixels. */
  logoWidth?: number;
  /**
   * Where the logo box sits relative to the true lat/lng anchor.
   * Plot coordinate stays fixed — only the callout direction changes.
   */
  placement?: ShoppingCenterLogoPlacement;
  /** Crop empty artboard margins so the callout can be a tighter rectangle. */
  logoCrop?: ShoppingCenterLogoCrop;
}

function resolveCropSource(
  img: HTMLImageElement,
  crop: ShoppingCenterLogoCrop | undefined
) {
  const top = Math.max(0, Math.min(0.45, crop?.top ?? 0));
  const bottom = Math.max(0, Math.min(0.45, crop?.bottom ?? 0));
  const left = Math.max(0, Math.min(0.45, crop?.left ?? 0));
  const right = Math.max(0, Math.min(0.45, crop?.right ?? 0));
  const sx = Math.round(img.naturalWidth * left);
  const sy = Math.round(img.naturalHeight * top);
  const sw = Math.max(1, Math.round(img.naturalWidth * (1 - left - right)));
  const sh = Math.max(1, Math.round(img.naturalHeight * (1 - top - bottom)));
  return { sx, sy, sw, sh };
}

function getMarkerDimensions(
  srcWidth: number,
  srcHeight: number,
  logoTargetWidth: number,
  paddingX: number,
  paddingY: number
) {
  const aspect = srcWidth / srcHeight;
  const logoWidth = logoTargetWidth;
  const logoHeight = logoWidth / aspect;

  return {
    boxWidth: logoWidth + paddingX * 2,
    boxHeight: logoHeight + paddingY * 2,
    logoWidth,
    logoHeight,
  };
}

export async function createShoppingCenterMarkerIcon(
  logoUrl: string,
  options: ShoppingCenterMarkerOptions = {}
): Promise<google.maps.Icon> {
  const compact = Boolean(options.compact);
  const logoTargetWidth =
    options.logoWidth ??
    (compact ? COMPACT_LOGO_TARGET_WIDTH : DEFAULT_LOGO_TARGET_WIDTH);
  const paddingX = compact ? COMPACT_PADDING_X : PADDING_X;
  const paddingY = compact ? COMPACT_PADDING_Y : PADDING_Y;
  const placement = options.placement ?? "above";
  const markerOptions = {
    boxBg: options.boxBg ?? (options.lightBox ? LIGHT_MARKER_BOX_BG : undefined),
    placement,
  };

  try {
    const img = await loadLogoImage(logoUrl);
    const source = resolveCropSource(img, options.logoCrop);
    const dims = getMarkerDimensions(
      source.sw,
      source.sh,
      logoTargetWidth,
      paddingX,
      paddingY
    );
    return drawCalloutMarker(
      dims.boxWidth,
      dims.boxHeight,
      (ctx, _x, boxY) => {
        const x = (dims.boxWidth - dims.logoWidth) / 2;
        const y = boxY + (dims.boxHeight - dims.logoHeight) / 2;
        ctx.drawImage(
          img,
          source.sx,
          source.sy,
          source.sw,
          source.sh,
          x,
          y,
          dims.logoWidth,
          dims.logoHeight
        );
      },
      markerOptions
    );
  } catch {
    const boxWidth = logoTargetWidth + paddingX * 2;
    const boxHeight = compact ? 36 : 48;
    return drawCalloutMarker(
      boxWidth,
      boxHeight,
      (ctx, _x, boxY, width) => {
        ctx.fillStyle = "#3E6F7E";
        ctx.font = compact
          ? '600 14px "proxima-nova", system-ui, sans-serif'
          : '600 22px "proxima-nova", system-ui, sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("MCM", width / 2, boxY + boxHeight / 2);
      },
      markerOptions
    );
  }
}
