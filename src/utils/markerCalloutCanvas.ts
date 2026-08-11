export const MARKER_SCALE = 2;
export const MARKER_STEM_HEIGHT = 11;
/** Longer leader for dense street corridors (major-tenant deconflict). */
export const MARKER_STEM_HEIGHT_CALLOUT = 18;
export const MARKER_BORDER_RADIUS = 8;
export const MARKER_BORDER_COLOR = "#FFFFFF";
export const MARKER_BOX_BG = "#FFFFFF";
export const MARKER_STEM_COLOR = "#3E6F7E";

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
    placement?: "above" | "below";
    /** Shift the logo/label box horizontally; geographic anchor stays on lat/lng. */
    offsetX?: number;
    /** Leader line from pin to box. Default false. */
    showStem?: boolean;
    /** Override stem length (px). */
    stemHeight?: number;
  } = {}
): google.maps.Icon {
  const boxBg = options.boxBg ?? MARKER_BOX_BG;
  const placement = options.placement ?? "above";
  const offsetX = options.offsetX ?? 0;
  const showStem = options.showStem ?? false;
  const stemHeight = showStem
    ? (options.stemHeight ?? MARKER_STEM_HEIGHT)
    : MARKER_GAP_NO_STEM;
  const width = boxWidth + Math.abs(offsetX);
  const height = boxHeight + stemHeight;
  const boxY = placement === "above" ? 0 : stemHeight;
  const boxX = offsetX >= 0 ? offsetX : 0;
  const anchorX = offsetX >= 0 ? boxWidth / 2 : boxWidth / 2 - offsetX;

  const canvas = document.createElement("canvas");
  canvas.width = width * MARKER_SCALE;
  canvas.height = height * MARKER_SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(MARKER_SCALE, MARKER_SCALE);

  // Stem under the box so the leader reads clearly on light basemaps.
  // With offsetX=0 this is a clean vertical line (preferred for street logos).
  if (showStem) {
    const tipY = placement === "above" ? height : 0;
    const boxEdgeY = placement === "above" ? boxY + boxHeight : boxY;
    const attachX =
      offsetX === 0
        ? anchorX
        : Math.max(boxX + 6, Math.min(boxX + boxWidth - 6, anchorX));

    ctx.beginPath();
    ctx.moveTo(anchorX, tipY);
    ctx.lineTo(attachX, boxEdgeY);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(anchorX, tipY);
    ctx.lineTo(attachX, boxEdgeY);
    ctx.strokeStyle = MARKER_STEM_COLOR;
    ctx.lineWidth = 1.25;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(anchorX, tipY, 2.25, 0, Math.PI * 2);
    ctx.fillStyle = MARKER_STEM_COLOR;
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.shadowColor = "rgba(26, 35, 50, 0.22)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

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
  ctx.strokeStyle = MARKER_BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  drawContent(ctx, boxX, boxY, boxWidth, boxHeight);

  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(width, height),
    // Geographic point stays on the true lat/lng for both placements
    anchor: new google.maps.Point(
      anchorX,
      placement === "above" ? height : 0
    ),
  };
}
