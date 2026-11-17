const BETA_BLUE = "#3E6F7E";
const WHITE = "#FFFFFF";
const MIN_BOX_WIDTH = 48;
const SCALE = 2;
const SHADOW_PAD = 8;
const SHADOW_COLOR = "rgba(0, 0, 0, 0.52)";
const SHADOW_BLUR = 12;
const SHADOW_OFFSET_Y = 4;

export type CalloutPlacement = "above" | "below" | "left" | "right" | "center";
export type CalloutSize = "tiny" | "compact" | "default" | "large";
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
  /** Leader length (px). Vertical for above/below; horizontal for left/right. */
  stemHeight?: number;
  /** Leader stroke. Dashboard uses beta blue. */
  stemColor?: string;
  /** White halo behind the leader so it reads on the map. */
  stemHalo?: boolean;
  /** When false, grow the box to the full tenant name instead of ellipsizing. */
  truncate?: boolean;
}

const SIZE_PRESETS = {
  tiny: {
    font: '700 11px "proxima-nova", system-ui, sans-serif',
    fontSize: 11,
    paddingX: 7,
    paddingY: 4,
    stemHeight: 10,
    maxBoxWidth: 168,
    borderRadius: 6,
  },
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

function applyDropShadow(ctx: CanvasRenderingContext2D, compact = false) {
  ctx.shadowColor = compact ? "rgba(0, 0, 0, 0.28)" : SHADOW_COLOR;
  ctx.shadowBlur = compact ? 3 : SHADOW_BLUR;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = compact ? 1 : SHADOW_OFFSET_Y;
}

function clearDropShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function drawLeader(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  halo: boolean
) {
  if (halo) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 3;
    ctx.lineCap = "butt";
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = halo ? 1.5 : 2.25;
  ctx.lineCap = "butt";
  ctx.stroke();
}

function lineHeightFor(size: CalloutSize, fontSize: number): number {
  return fontSize + (size === "tiny" ? 2 : 3);
}

function measureCalloutLines(
  tenantName: string,
  size: CalloutSize,
  options?: { truncate?: boolean }
): { lines: string[]; boxWidth: number; boxHeight: number } {
  const preset = SIZE_PRESETS[size];
  const measure = document.createElement("canvas").getContext("2d");
  if (measure) measure.font = preset.font;
  const maxLabelWidth =
    options?.truncate === false ? 360 : preset.maxBoxWidth - preset.paddingX * 2;
  const rawLines = tenantName
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const lines = rawLines.map((line) => {
    if (options?.truncate === false || !measure) return line;
    return truncateText(measure, line, maxLabelWidth);
  });
  const textWidth = Math.max(
    0,
    ...lines.map((line) =>
      measure
        ? measure.measureText(line).width
        : line.length * preset.fontSize * 0.58
    )
  );
  const minBox = size === "tiny" ? 28 : MIN_BOX_WIDTH;
  const maxBox = options?.truncate === false ? 380 : preset.maxBoxWidth;
  const lineHeight = lineHeightFor(size, preset.fontSize);
  return {
    lines,
    boxWidth: Math.min(
      maxBox,
      Math.max(minBox, Math.ceil(textWidth + preset.paddingX * 2))
    ),
    boxHeight: lines.length * lineHeight + preset.paddingY * 2,
  };
}

function fillCalloutLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  boxLeft: number,
  boxTop: number,
  boxWidth: number,
  boxHeight: number,
  size: CalloutSize,
  fontSize: number
) {
  const lineHeight = lineHeightFor(size, fontSize);
  const blockHeight = lines.length * lineHeight;
  const startY = boxTop + (boxHeight - blockHeight) / 2 + lineHeight / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, boxLeft + boxWidth / 2, startY + index * lineHeight);
  });
}

/** Screen-space box size (no stem) so the street packer matches the canvas. */
export function estimateCalloutBoxSize(
  tenantName: string,
  size: CalloutSize = "tiny",
  options?: { truncate?: boolean }
): { width: number; height: number } {
  const measured = measureCalloutLines(tenantName, size, options);
  return { width: measured.boxWidth, height: measured.boxHeight };
}

export function createCalloutIcon(
  tenantName: string,
  options: CalloutIconOptions = {}
): google.maps.Icon {
  const placement = options.placement ?? "above";
  const offsetX = options.offsetX ?? 0;
  const showStem = options.showStem ?? true;
  const showAnchorDot = options.showAnchorDot ?? false;
  const centered = placement === "center";
  const isSide = placement === "left" || placement === "right";
  const inverse = (options.variant ?? "default") === "inverse";
  const boxFill = inverse ? WHITE : BETA_BLUE;
  const boxStroke = inverse ? BETA_BLUE : WHITE;
  const textColor = inverse ? BETA_BLUE : WHITE;
  const stemColor = options.stemColor ?? (inverse ? BETA_BLUE : WHITE);
  const stemHalo = options.stemHalo ?? false;
  const size = options.size ?? "default";
  const preset = SIZE_PRESETS[size];
  const { lines, boxWidth, boxHeight } = measureCalloutLines(tenantName, size, {
    truncate: options.truncate,
  });
  const isTiny = size === "tiny";
  const shadowPad = isTiny ? 4 : SHADOW_PAD;
  if (centered) {
    const width = boxWidth + shadowPad * 2;
    const height = boxHeight + shadowPad * 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * SCALE;
    canvas.height = height * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(SCALE, SCALE);

    applyDropShadow(ctx, isTiny);
    roundRect(
      ctx,
      shadowPad + 0.5,
      shadowPad + 0.5,
      boxWidth - 1,
      boxHeight - 1,
      preset.borderRadius
    );
    ctx.fillStyle = boxFill;
    ctx.fill();
    clearDropShadow(ctx);

    roundRect(
      ctx,
      shadowPad + 0.5,
      shadowPad + 0.5,
      boxWidth - 1,
      boxHeight - 1,
      preset.borderRadius
    );
    ctx.strokeStyle = boxStroke;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = preset.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fillCalloutLines(
      ctx,
      lines,
      shadowPad,
      shadowPad,
      boxWidth,
      boxHeight,
      size,
      preset.fontSize
    );

    return {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(width, height),
      anchor: new google.maps.Point(shadowPad + boxWidth / 2, shadowPad + boxHeight / 2),
    };
  }

  const anchorDotRadius = showAnchorDot ? 3.5 : 0;
  const defaultGap = showStem ? 0 : showAnchorDot ? 6 : 4;
  const gap = Math.max(0, options.offsetY ?? defaultGap);
  const stemHeight = showStem
    ? (options.stemHeight ?? preset.stemHeight + gap)
    : gap + (showAnchorDot ? anchorDotRadius : 0);

  if (isSide) {
    const width = boxWidth + stemHeight + shadowPad * 2;
    const height = boxHeight + shadowPad * 2;
    const boxLeft = placement === "left" ? shadowPad : shadowPad + stemHeight;
    const boxTop = shadowPad;
    const anchorX =
      placement === "left"
        ? shadowPad + boxWidth + stemHeight
        : shadowPad;
    const attachX =
      placement === "left" ? shadowPad + boxWidth : shadowPad + stemHeight;
    const midY = shadowPad + boxHeight / 2;

    const canvas = document.createElement("canvas");
    canvas.width = width * SCALE;
    canvas.height = height * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(SCALE, SCALE);

    if (showStem) {
      drawLeader(ctx, attachX, midY, anchorX, midY, stemColor, stemHalo);
    }

    applyDropShadow(ctx, isTiny);
    roundRect(
      ctx,
      boxLeft + 0.5,
      boxTop + 0.5,
      boxWidth - 1,
      boxHeight - 1,
      preset.borderRadius
    );
    ctx.fillStyle = boxFill;
    ctx.fill();
    clearDropShadow(ctx);

    roundRect(
      ctx,
      boxLeft + 0.5,
      boxTop + 0.5,
      boxWidth - 1,
      boxHeight - 1,
      preset.borderRadius
    );
    ctx.strokeStyle = boxStroke;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (showStem) {
      drawLeader(ctx, attachX, midY, anchorX, midY, stemColor, stemHalo);
    }

    ctx.fillStyle = textColor;
    ctx.font = preset.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fillCalloutLines(
      ctx,
      lines,
      boxLeft,
      boxTop,
      boxWidth,
      boxHeight,
      size,
      preset.fontSize
    );

    return {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(width, height),
      anchor: new google.maps.Point(anchorX, midY),
    };
  }

  const boxCenterX = shadowPad + boxWidth / 2 + Math.max(0, offsetX);
  const anchorX = boxCenterX - offsetX;
  const left = Math.min(anchorX, boxCenterX - boxWidth / 2) - shadowPad;
  const right = Math.max(anchorX, boxCenterX + boxWidth / 2) + shadowPad;
  const width = Math.ceil(right - left);
  const height = boxHeight + stemHeight + shadowPad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.translate(-left, shadowPad);

  const boxLeft = boxCenterX - boxWidth / 2;
  const boxTop = placement === "above" ? 0 : stemHeight;
  const stemStartY = placement === "above" ? boxHeight : 0;
  const stemEndY = placement === "above" ? boxHeight + stemHeight : stemHeight;

  const tipY = placement === "above" ? stemEndY : stemStartY;

  if (showStem) {
    drawLeader(ctx, anchorX, stemStartY, anchorX, stemEndY, stemColor, stemHalo);
  }

  applyDropShadow(ctx, isTiny);
  roundRect(ctx, boxLeft + 0.5, boxTop + 0.5, boxWidth - 1, boxHeight - 1, preset.borderRadius);
  ctx.fillStyle = boxFill;
  ctx.fill();
  clearDropShadow(ctx);

  roundRect(ctx, boxLeft + 0.5, boxTop + 0.5, boxWidth - 1, boxHeight - 1, preset.borderRadius);
  ctx.strokeStyle = boxStroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (showStem) {
    drawLeader(ctx, anchorX, stemStartY, anchorX, stemEndY, stemColor, stemHalo);
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
  fillCalloutLines(
    ctx,
    lines,
    boxLeft,
    boxTop,
    boxWidth,
    boxHeight,
    size,
    preset.fontSize
  );

  const anchorY = placement === "above" ? stemEndY + shadowPad : shadowPad;

  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(anchorX - left, anchorY),
  };
}
