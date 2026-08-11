const BETA_BLUE = "#3E6F7E";
const WHITE = "#FFFFFF";
const MIN_BOX_WIDTH = 48;
const SCALE = 2;
const SHADOW_PAD = 8;
const SHADOW_COLOR = "rgba(0, 0, 0, 0.52)";
const SHADOW_BLUR = 12;
const SHADOW_OFFSET_Y = 4;

export type CalloutPlacement = "above" | "below";
export type CalloutSize = "compact" | "default" | "large";
/** default = beta-blue fill / white text; inverse = white fill / beta-blue text */
export type CalloutVariant = "default" | "inverse";

export interface CalloutIconOptions {
  placement?: CalloutPlacement;
  size?: CalloutSize;
  variant?: CalloutVariant;
  /** Horizontal shift of the label box from the anchor (px). Positive = right. */
  offsetX?: number;
  /** Gap between the anchor point and the label box (px). No connector line is drawn. */
  offsetY?: number;
  /** When false, render a pill label only (used on the dashboard overview map). */
  showStem?: boolean;
  /** Draw a small anchor dot at the geographic point (dashboard overview). */
  showAnchorDot?: boolean;
}

const SIZE_PRESETS = {
  compact: {
    font: '600 11px "proxima-nova", system-ui, sans-serif',
    fontSize: 11,
    paddingX: 9,
    paddingY: 5,
    stemHeight: 10,
    maxBoxWidth: 148,
    borderRadius: 14,
  },
  default: {
    font: '600 12px "proxima-nova", system-ui, sans-serif',
    fontSize: 12,
    paddingX: 12,
    paddingY: 7,
    stemHeight: 18,
    maxBoxWidth: 200,
    borderRadius: 20,
  },
  large: {
    font: '700 15px "proxima-nova", system-ui, sans-serif',
    fontSize: 15,
    paddingX: 16,
    paddingY: 10,
    stemHeight: 22,
    maxBoxWidth: 260,
    borderRadius: 22,
  },
} as const;

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

function applyDropShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = SHADOW_COLOR;
  ctx.shadowBlur = SHADOW_BLUR;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = SHADOW_OFFSET_Y;
}

function clearDropShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

export function createCalloutIcon(
  tenantName: string,
  options: CalloutIconOptions = {}
): google.maps.Icon {
  const placement = options.placement ?? "above";
  const offsetX = options.offsetX ?? 0;
  const showStem = options.showStem ?? true;
  const showAnchorDot = options.showAnchorDot ?? false;
  const inverse = (options.variant ?? "default") === "inverse";
  const boxFill = inverse ? WHITE : BETA_BLUE;
  const boxStroke = inverse ? BETA_BLUE : WHITE;
  const textColor = inverse ? BETA_BLUE : WHITE;
  const stemColor = inverse ? BETA_BLUE : WHITE;
  const preset = SIZE_PRESETS[options.size ?? "default"];
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = preset.font;
  const label = truncateText(
    measure,
    tenantName,
    preset.maxBoxWidth - preset.paddingX * 2
  );
  const textWidth = measure.measureText(label).width;
  const boxWidth = Math.min(
    preset.maxBoxWidth,
    Math.max(MIN_BOX_WIDTH, Math.ceil(textWidth + preset.paddingX * 2))
  );
  const boxHeight = preset.fontSize + preset.paddingY * 2;
  const anchorDotRadius = showAnchorDot ? 3.5 : 0;
  const defaultGap = showStem ? 0 : showAnchorDot ? 6 : 4;
  const gap = Math.max(0, options.offsetY ?? defaultGap);
  const stemHeight = showStem
    ? preset.stemHeight + gap
    : gap + (showAnchorDot ? anchorDotRadius : 0);

  const boxCenterX = SHADOW_PAD + boxWidth / 2 + Math.max(0, offsetX);
  const anchorX = boxCenterX - offsetX;
  const left = Math.min(anchorX, boxCenterX - boxWidth / 2) - SHADOW_PAD;
  const right = Math.max(anchorX, boxCenterX + boxWidth / 2) + SHADOW_PAD;
  const width = Math.ceil(right - left);
  const height = boxHeight + stemHeight + SHADOW_PAD * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.translate(-left, SHADOW_PAD);

  const boxLeft = boxCenterX - boxWidth / 2;
  const boxTop = placement === "above" ? 0 : stemHeight;
  const stemStartY = placement === "above" ? boxHeight : 0;
  const stemEndY = placement === "above" ? boxHeight + stemHeight : stemHeight;

  const tipY = placement === "above" ? stemEndY : stemStartY;

  if (showStem) {
    applyDropShadow(ctx);
    ctx.beginPath();
    ctx.moveTo(anchorX, stemStartY);
    ctx.lineTo(anchorX, stemEndY);
    ctx.strokeStyle = stemColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  applyDropShadow(ctx);
  roundRect(ctx, boxLeft + 0.5, boxTop + 0.5, boxWidth - 1, boxHeight - 1, preset.borderRadius);
  ctx.fillStyle = boxFill;
  ctx.fill();
  clearDropShadow(ctx);

  roundRect(ctx, boxLeft + 0.5, boxTop + 0.5, boxWidth - 1, boxHeight - 1, preset.borderRadius);
  ctx.strokeStyle = boxStroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (showStem) {
    ctx.beginPath();
    ctx.moveTo(anchorX, stemStartY);
    ctx.lineTo(anchorX, stemEndY);
    ctx.strokeStyle = stemColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  if (showAnchorDot) {
    ctx.beginPath();
    ctx.arc(anchorX, tipY, anchorDotRadius, 0, Math.PI * 2);
    ctx.fillStyle = BETA_BLUE;
    ctx.fill();
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.fillStyle = textColor;
  ctx.font = preset.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, boxCenterX, boxTop + boxHeight / 2);

  const anchorY = placement === "above" ? stemEndY + SHADOW_PAD : SHADOW_PAD;

  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(anchorX - left, anchorY),
  };
}
