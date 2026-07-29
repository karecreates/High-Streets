export const MARKER_SCALE = 2;
export const MARKER_STEM_HEIGHT = 11;
export const MARKER_BORDER_RADIUS = 8;
export const MARKER_BORDER_COLOR = "#FFFFFF";
export const MARKER_BOX_BG = "#FFFFFF";

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
  options: { boxBg?: string; placement?: "above" | "below" } = {}
): google.maps.Icon {
  const boxBg = options.boxBg ?? MARKER_BOX_BG;
  const placement = options.placement ?? "above";
  const width = boxWidth;
  const height = boxHeight + MARKER_STEM_HEIGHT;
  const boxY = placement === "above" ? 0 : MARKER_STEM_HEIGHT;

  const canvas = document.createElement("canvas");
  canvas.width = width * MARKER_SCALE;
  canvas.height = height * MARKER_SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(MARKER_SCALE, MARKER_SCALE);

  ctx.shadowColor = "rgba(26, 35, 50, 0.22)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  roundRect(ctx, 0.5, boxY + 0.5, width - 1, boxHeight - 1, MARKER_BORDER_RADIUS);
  ctx.fillStyle = boxBg;
  ctx.fill();
  ctx.strokeStyle = MARKER_BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  drawContent(ctx, 0, boxY, width, boxHeight);

  const stemFrom = placement === "above" ? boxHeight : MARKER_STEM_HEIGHT;
  const stemTo = placement === "above" ? height : 0;
  ctx.beginPath();
  ctx.moveTo(width / 2, stemFrom);
  ctx.lineTo(width / 2, stemTo);
  ctx.strokeStyle = MARKER_BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.stroke();

  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(width, height),
    // Tip of the stem stays on the true lat/lng for both placements
    anchor: new google.maps.Point(
      width / 2,
      placement === "above" ? height : 0
    ),
  };
}
