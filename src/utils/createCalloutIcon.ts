const CALLOUT_BG = "#3E6F7E";
const CALLOUT_BORDER = "#FFFFFF";
const FONT = '600 12px "proxima-nova", system-ui, sans-serif';
const PADDING_X = 12;
const PADDING_Y = 7;
const STEM_HEIGHT = 18;
const BORDER_RADIUS = 20;
const MAX_BOX_WIDTH = 200;
const MIN_BOX_WIDTH = 48;
const SCALE = 2;

function roundRect(
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

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

export function createCalloutIcon(tenantName: string): google.maps.Icon {
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = FONT;
  const label = truncateText(measure, tenantName, MAX_BOX_WIDTH - PADDING_X * 2);
  const textWidth = measure.measureText(label).width;
  const boxWidth = Math.min(
    MAX_BOX_WIDTH,
    Math.max(MIN_BOX_WIDTH, Math.ceil(textWidth + PADDING_X * 2))
  );
  const boxHeight = 12 + PADDING_Y * 2;
  const width = boxWidth;
  const height = boxHeight + STEM_HEIGHT;

  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  roundRect(ctx, 0.5, 0.5, boxWidth - 1, boxHeight - 1, BORDER_RADIUS);
  ctx.fillStyle = CALLOUT_BG;
  ctx.fill();
  ctx.strokeStyle = CALLOUT_BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = CALLOUT_BORDER;
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, boxWidth / 2, boxHeight / 2);

  ctx.beginPath();
  ctx.moveTo(boxWidth / 2, boxHeight);
  ctx.lineTo(boxWidth / 2, height);
  ctx.strokeStyle = CALLOUT_BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height),
  };
}
