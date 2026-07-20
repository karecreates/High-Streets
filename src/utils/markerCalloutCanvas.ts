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

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Logo failed to load"));
    img.src = url;
  });
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
  ) => void
): google.maps.Icon {
  const width = boxWidth;
  const height = boxHeight + MARKER_STEM_HEIGHT;

  const canvas = document.createElement("canvas");
  canvas.width = width * MARKER_SCALE;
  canvas.height = height * MARKER_SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(MARKER_SCALE, MARKER_SCALE);

  ctx.shadowColor = "rgba(26, 35, 50, 0.22)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  roundRect(ctx, 0.5, 0.5, width - 1, boxHeight - 1, MARKER_BORDER_RADIUS);
  ctx.fillStyle = MARKER_BOX_BG;
  ctx.fill();
  ctx.strokeStyle = MARKER_BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  drawContent(ctx, 0, 0, width, boxHeight);

  ctx.beginPath();
  ctx.moveTo(width / 2, boxHeight);
  ctx.lineTo(width / 2, height);
  ctx.strokeStyle = MARKER_BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.stroke();

  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height),
  };
}
