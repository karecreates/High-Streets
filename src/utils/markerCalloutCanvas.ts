export const MARKER_SCALE = 2;
export const MARKER_STEM_HEIGHT = 11;
/** Longer leader for dense street corridors (major-tenant deconflict). */
export const MARKER_STEM_HEIGHT_CALLOUT = 18;
export const MARKER_BORDER_RADIUS = 8;
export const MARKER_BORDER_COLOR = "#FFFFFF";
export const MARKER_BOX_BG = "#FFFFFF";
export const MARKER_STEM_COLOR = "#3E6F7E";
/** Illustrator drop shadow: Multiply, 25% black, 7 / 7, blur 5. */
const LOGO_SHADOW_COLOR = "rgba(0, 0, 0, 0.25)";
const LOGO_SHADOW_BLUR = 5;
const LOGO_SHADOW_OFFSET_X = 7;
const LOGO_SHADOW_OFFSET_Y = 7;
const LOGO_SHADOW_PAD_LEFT = LOGO_SHADOW_BLUR;
const LOGO_SHADOW_PAD_TOP = LOGO_SHADOW_BLUR;
const LOGO_SHADOW_PAD_RIGHT = LOGO_SHADOW_OFFSET_X + LOGO_SHADOW_BLUR;
const LOGO_SHADOW_PAD_BOTTOM = LOGO_SHADOW_OFFSET_Y + LOGO_SHADOW_BLUR;

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Scale an image to fit inside maxW×maxH without cropping or stretching. */
export function fitContained(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  const w = Math.max(1, srcW);
  const h = Math.max(1, srcH);
  const scale = Math.min(maxW / w, maxH / h);
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

/** Draw image centered inside a box, preserving aspect ratio. */
export function drawImageContained(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  srcW?: number,
  srcH?: number
) {
  const naturalW =
    srcW ??
    (img instanceof HTMLImageElement
      ? img.naturalWidth
      : (img as HTMLCanvasElement).width);
  const naturalH =
    srcH ??
    (img instanceof HTMLImageElement
      ? img.naturalHeight
      : (img as HTMLCanvasElement).height);
  const { width, height } = fitContained(naturalW, naturalH, boxW, boxH);
  const x = boxX + (boxW - width) / 2;
  const y = boxY + (boxH - height) / 2;
  ctx.drawImage(img, x, y, width, height);
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Logo failed to load"));
    img.src = url;
  });
}

const SVG_URL_RE = /\.svg(\?|#|$)/i;
/** Rasterize vector logos large enough for crisp compact map pins. */
const SVG_RASTER_MIN_WIDTH = 512;

function parseSvgSize(svgText: string): { width: number; height: number } {
  const viewBox = svgText.match(/viewBox=["']([\d.\s+-]+)["']/i)?.[1];
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }
  const width = Number(svgText.match(/\bwidth=["']([\d.]+)/i)?.[1]);
  const height = Number(svgText.match(/\bheight=["']([\d.]+)/i)?.[1]);
  if (width > 0 && height > 0) return { width, height };
  return { width: 1, height: 1 };
}

/**
 * Ensure SVG logos have usable intrinsic pixels before canvas drawImage.
 * Missing width/height (common Illustrator export) rasterizes tiny → blurry pins.
 */
export async function loadLogoImage(url: string): Promise<HTMLImageElement> {
  const img = await loadImage(url);
  if (!SVG_URL_RE.test(url)) return img;

  try {
    const response = await fetch(url);
    if (!response.ok) return img;
    let svgText = await response.text();
    if (!svgText.includes("<svg")) return img;

    const { width: vbW, height: vbH } = parseSvgSize(svgText);
    const scale = Math.max(1, SVG_RASTER_MIN_WIDTH / vbW);
    const outW = Math.round(vbW * scale);
    const outH = Math.round(vbH * scale);

    svgText = svgText
      .replace(/\s(width|height)=["'][^"']*["']/gi, "")
      .replace(/<svg\b/i, `<svg width="${outW}" height="${outH}"`);

    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await loadImage(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return img;
  }
}

/** Gap between callout box and lat/lng when no stem is drawn. */
const MARKER_GAP_NO_STEM = 6;

export function drawCalloutMarker(
  boxWidth: number,
  boxHeight: number,
  drawContent: (
    ctx: CanvasRenderingContext2D,
    boxX: number,
    boxY: number,
    width: number,
    height: number
  ) => void,
  options: {
    boxBg?: string;
    placement?: "above" | "below" | "left" | "right" | "center";
    /** Shift the logo/label box horizontally; geographic anchor stays on lat/lng. */
    offsetX?: number;
    /** Leader line from pin to box. Default false. */
    showStem?: boolean;
    /** Override stem length (px). Vertical for above/below; horizontal for left/right. */
    stemHeight?: number;
    /** Small tip at the geographic point. Default true when a stem is drawn. */
    showAnchorDot?: boolean;
    /** White halo behind the leader. Default true. */
    stemHalo?: boolean;
  } = {}
): google.maps.Icon {
  const boxBg = options.boxBg ?? MARKER_BOX_BG;
  const placement = options.placement ?? "above";
  const offsetX = options.offsetX ?? 0;
  const showStem = options.showStem ?? false;
  const showAnchorDot = options.showAnchorDot ?? showStem;
  const stemHalo = options.stemHalo ?? true;
  const centered = placement === "center";
  const stemLen = centered
    ? 0
    : showStem
      ? (options.stemHeight ?? MARKER_STEM_HEIGHT)
      : MARKER_GAP_NO_STEM;

  const isSide = placement === "left" || placement === "right";
  const width = centered
    ? boxWidth
    : isSide
      ? boxWidth + stemLen
      : boxWidth + Math.abs(offsetX);
  const height = centered ? boxHeight : isSide ? boxHeight : boxHeight + stemLen;

  let boxX: number;
  let boxY: number;
  let anchorX: number;
  let anchorY: number;

  if (placement === "center") {
    boxX = 0;
    boxY = 0;
    anchorX = width / 2;
    anchorY = height / 2;
  } else if (placement === "left") {
    boxX = 0;
    boxY = 0;
    anchorX = width;
    anchorY = height / 2;
  } else if (placement === "right") {
    boxX = stemLen;
    boxY = 0;
    anchorX = 0;
    anchorY = height / 2;
  } else {
    boxY = placement === "above" ? 0 : stemLen;
    boxX = offsetX >= 0 ? offsetX : 0;
    anchorX = offsetX >= 0 ? boxWidth / 2 : boxWidth / 2 - offsetX;
    anchorY = placement === "above" ? height : 0;
  }

  const canvasW = width + LOGO_SHADOW_PAD_LEFT + LOGO_SHADOW_PAD_RIGHT;
  const canvasH = height + LOGO_SHADOW_PAD_TOP + LOGO_SHADOW_PAD_BOTTOM;
  const canvas = document.createElement("canvas");
  canvas.width = canvasW * MARKER_SCALE;
  canvas.height = canvasH * MARKER_SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(MARKER_SCALE, MARKER_SCALE);
  ctx.translate(LOGO_SHADOW_PAD_LEFT, LOGO_SHADOW_PAD_TOP);

  // Stem: vertical (above/below) or horizontal (left/right) — never diagonal/L.
  if (showStem) {
    let tipX = anchorX;
    let tipY = anchorY;
    let attachX = tipX;
    let attachY = tipY;

    if (placement === "left") {
      tipX = anchorX;
      tipY = anchorY;
      attachX = boxX + boxWidth;
      attachY = tipY;
    } else if (placement === "right") {
      tipX = anchorX;
      tipY = anchorY;
      attachX = boxX;
      attachY = tipY;
    } else {
      tipY = placement === "above" ? height : 0;
      tipX = anchorX;
      const boxEdgeY = placement === "above" ? boxY + boxHeight : boxY;
      attachX =
        offsetX === 0
          ? tipX
          : Math.max(boxX + 6, Math.min(boxX + boxWidth - 6, tipX));
      attachY = boxEdgeY;
    }

    if (stemHalo) {
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(attachX, attachY);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.lineCap = "butt";
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(attachX, attachY);
    ctx.strokeStyle = MARKER_STEM_COLOR;
    ctx.lineWidth = stemHalo ? 1.25 : 2.25;
    ctx.lineCap = "butt";
    ctx.stroke();

    if (showAnchorDot) {
      ctx.beginPath();
      ctx.arc(tipX, tipY, 2.25, 0, Math.PI * 2);
      ctx.fillStyle = MARKER_STEM_COLOR;
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.shadowColor = LOGO_SHADOW_COLOR;
  ctx.shadowBlur = LOGO_SHADOW_BLUR;
  ctx.shadowOffsetX = LOGO_SHADOW_OFFSET_X;
  ctx.shadowOffsetY = LOGO_SHADOW_OFFSET_Y;

  roundRect(
    ctx,
    boxX + 0.5,
    boxY + 0.5,
    boxWidth - 1,
    boxHeight - 1,
    MARKER_BORDER_RADIUS
  );
  ctx.fillStyle = boxBg;
  ctx.fill();

  // Shadow stays on the filled card only. Stroking while a 7px offset is
  // still on paints the top/left outline's shadow inside the white fill.
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fill();
  ctx.strokeStyle = MARKER_BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.stroke();

  drawContent(ctx, boxX, boxY, boxWidth, boxHeight);

  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(canvasW, canvasH),
    // Geographic point stays on the true lat/lng for all placements
    anchor: new google.maps.Point(
      anchorX + LOGO_SHADOW_PAD_LEFT,
      anchorY + LOGO_SHADOW_PAD_TOP
    ),
  };
}
