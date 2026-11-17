import type { Tenant } from "../types/tenant";
import {
  COMPACT_LETTERMARK_SIZE,
  COMPACT_LOGO_HEIGHT,
  COMPACT_LOGO_PADDING_X,
  COMPACT_LOGO_PADDING_Y,
  COMPACT_LOGO_WIDTH,
  createLogoMarkerIcon,
  drawLettermark,
  GROUP_CELL_HEIGHT,
  GROUP_CELL_WIDTH,
  LETTERMARK_SIZE,
  MAX_LOGO_HEIGHT,
  MAX_LOGO_WIDTH,
  type LogoMarkerLayoutOptions,
} from "./createLogoMarkerIcon";
import { dedupeTenants } from "./dedupeTenants";
import { getTenantInitial } from "./tenantInitial";
import { loadBrandLogoImage } from "./logoProvider";
import {
  drawCalloutMarker,
  drawImageContained,
  loadLogoImage,
  MARKER_BORDER_RADIUS,
  MARKER_STEM_HEIGHT_CALLOUT,
  roundRect,
} from "./markerCalloutCanvas";

const CELL_GAP = 8;
const COMPACT_CELL_GAP = 5;
const PADDING = 10;
const COMPACT_PADDING = 6;
const CELL_RADIUS = 8;
const MAX_ROWS = 7;
const HEADER_PADDING_X = 14;
const HEADER_PADDING_Y = 12;
const HEADER_LOGO_MAX_WIDTH = 148;
const HEADER_LOGO_MAX_HEIGHT = 40;
const HEADER_DIVIDER_GAP = 8;

export interface GroupedMarkerCenterHeader {
  name: string;
  logoUrl: string;
}

async function loadTenantLogo(tenant: Tenant): Promise<HTMLImageElement | null> {
  return loadBrandLogoImage(tenant.logoDomain, tenant.tenantName);
}

function cellMetrics(compact?: boolean, nameCells = false, scale = 1) {
  const s = scale > 0 ? scale : 1;
  if (compact) {
    return {
      cellW: Math.round(
        ((nameCells ? 64 : COMPACT_LOGO_WIDTH) + COMPACT_LOGO_PADDING_X * 2) * s
      ),
      cellH: Math.round(
        ((nameCells ? 28 : COMPACT_LOGO_HEIGHT) + COMPACT_LOGO_PADDING_Y * 2) * s
      ),
      logoW: Math.round(COMPACT_LOGO_WIDTH * s),
      logoH: Math.round(COMPACT_LOGO_HEIGHT * s),
      letter: Math.round(COMPACT_LETTERMARK_SIZE * s),
      gap: COMPACT_CELL_GAP,
      pad: COMPACT_PADDING,
    };
  }
  return {
    cellW: Math.round(GROUP_CELL_WIDTH * s),
    cellH: Math.round(GROUP_CELL_HEIGHT * s),
    logoW: Math.round(MAX_LOGO_WIDTH * s),
    logoH: Math.round(MAX_LOGO_HEIGHT * s),
    letter: Math.round(LETTERMARK_SIZE * s),
    gap: CELL_GAP,
    pad: PADDING,
  };
}

function gridDimensions(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 };

  const TARGET_ROWS_PER_COL = 1.4;
  let cols = Math.max(1, Math.round(Math.sqrt(count / TARGET_ROWS_PER_COL)));
  let rows = Math.ceil(count / cols);

  if (rows > MAX_ROWS) {
    cols = Math.ceil(count / MAX_ROWS);
    rows = Math.ceil(count / cols);
  }

  return { cols, rows };
}

function wrapNameLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) {
      const rest = words.slice(i).join(" ");
      current = rest;
      break;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines.slice(0, maxLines) : [text.trim()];
}

function drawNameCell(
  ctx: CanvasRenderingContext2D,
  tenantName: string,
  x: number,
  y: number,
  cellW: number,
  cellH: number
) {
  const pad = 4;
  const maxWidth = cellW - pad * 2;
  let fontSize = cellH >= 36 ? 10 : 8;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#1A2332";

  let lines: string[] = [];
  for (let size = fontSize; size >= 7; size -= 1) {
    ctx.font = `600 ${size}px "proxima-nova", system-ui, sans-serif`;
    const maxLines = size <= 8 ? 3 : 2;
    lines = wrapNameLines(ctx, tenantName, maxWidth, maxLines);
    const used = lines.join(" ");
    const words = tenantName.trim().split(/\s+/);
    if (used.split(/\s+/).length >= words.length || size === 7) {
      fontSize = size;
      break;
    }
  }

  const lineHeight = fontSize + 2;
  const block = lines.length * lineHeight;
  const startY = y + (cellH - block) / 2 + lineHeight / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, x + cellW / 2, startY + index * lineHeight);
  });
}

function drawTenantCell(
  ctx: CanvasRenderingContext2D,
  tenant: Tenant,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  m: ReturnType<typeof cellMetrics>,
  preferNameFallback = false
) {
  ctx.save();
  roundRect(ctx, x, y, m.cellW, m.cellH, CELL_RADIUS);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.clip();

  if (img) {
    drawImageContained(
      ctx,
      img,
      x + (m.cellW - m.logoW) / 2,
      y + (m.cellH - m.logoH) / 2,
      m.logoW,
      m.logoH
    );
    ctx.restore();
    return;
  }

  if (preferNameFallback) {
    drawNameCell(ctx, tenant.tenantName, x, y, m.cellW, m.cellH);
    ctx.restore();
    return;
  }

  const lx = x + (m.cellW - m.letter) / 2;
  const ly = y + (m.cellH - m.letter) / 2;
  drawLettermark(
    ctx,
    lx,
    ly,
    m.letter,
    getTenantInitial(tenant.tenantName)
  );
  ctx.restore();
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

/**
 * Grouped marker = grid of tenants at one address. Logos match standalone size;
 * missing logos use a full-name cell when preferNameFallback is set.
 * Optional center header (FIGat7th / L.A. Live) sits above the tenant grid.
 */
export async function createGroupedLogoMarkerIcon(
  tenants: Tenant[],
  centerHeader?: GroupedMarkerCenterHeader | null,
  layout?: LogoMarkerLayoutOptions
): Promise<google.maps.Icon> {
  const unique = dedupeTenants(tenants);

  if (unique.length === 1 && !centerHeader) {
    return createLogoMarkerIcon(unique[0], layout);
  }

  if (unique.length === 0 && centerHeader) {
    // Fall back to the standalone shopping-center pin look via its logo URL.
    try {
      const img = await loadLogoImage(centerHeader.logoUrl);
      return drawCalloutMarker(
        HEADER_LOGO_MAX_WIDTH + HEADER_PADDING_X * 2,
        HEADER_LOGO_MAX_HEIGHT + HEADER_PADDING_Y * 2,
        (ctx, boxX, boxY, width, height) => {
          drawImageContained(
            ctx,
            img,
            boxX + HEADER_PADDING_X,
            boxY + HEADER_PADDING_Y,
            width - HEADER_PADDING_X * 2,
            height - HEADER_PADDING_Y * 2
          );
        },
        calloutOptions(layout)
      );
    } catch {
      return createLogoMarkerIcon(
        {
          id: "center-header",
          tenantName: centerHeader.name,
          address: centerHeader.name,
          suite: "",
          highStreet: "",
          costarUrl: "",
          domain: "",
          faviconUrl: "",
          unitStatus: "Occupied",
          logoDomain: undefined,
          hasLogo: false,
          lat: null,
          lng: null,
        },
        layout
      );
    }
  }

  const [logos, headerLogo] = await Promise.all([
    Promise.all(unique.map(loadTenantLogo)),
    centerHeader
      ? loadLogoImage(centerHeader.logoUrl).catch(() => null)
      : Promise.resolve(null),
  ]);
  const count = unique.length;
  const compact = layout?.compact;
  const nameCells = Boolean(layout?.preferNameFallback);
  const m = cellMetrics(compact, nameCells, layout?.scale);

  const { cols, rows } = gridDimensions(Math.max(count, 1));
  const stepX = m.cellW + m.gap;
  const stepY = m.cellH + m.gap;

  const gridWidth =
    m.pad * 2 +
    Math.max(cols, 1) * m.cellW +
    Math.max(cols - 1, 0) * m.gap;
  const gridHeight =
    count === 0
      ? 0
      : m.pad * 2 + rows * m.cellH + Math.max(rows - 1, 0) * m.gap;

  const headerBandHeight = centerHeader
    ? HEADER_PADDING_Y * 2 + HEADER_LOGO_MAX_HEIGHT + HEADER_DIVIDER_GAP
    : 0;
  const boxWidth = Math.max(
    gridWidth,
    centerHeader ? HEADER_LOGO_MAX_WIDTH + HEADER_PADDING_X * 2 : 0
  );
  const boxHeight = headerBandHeight + gridHeight;

  return drawCalloutMarker(
    boxWidth,
    boxHeight,
    (ctx, boxX, boxY) => {
      let contentTop = boxY;

      if (centerHeader) {
        const headerHeight = HEADER_PADDING_Y * 2 + HEADER_LOGO_MAX_HEIGHT;
        ctx.save();
        roundRect(
          ctx,
          boxX + 0.5,
          boxY + 0.5,
          boxWidth - 1,
          boxHeight - 1,
          MARKER_BORDER_RADIUS
        );
        ctx.clip();
        ctx.fillStyle = "#F7F9FA";
        ctx.fillRect(boxX, contentTop, boxWidth, headerHeight);
        ctx.restore();

        if (headerLogo) {
          drawImageContained(
            ctx,
            headerLogo,
            boxX + HEADER_PADDING_X,
            contentTop + HEADER_PADDING_Y,
            boxWidth - HEADER_PADDING_X * 2,
            HEADER_LOGO_MAX_HEIGHT
          );
        } else {
          ctx.fillStyle = "#3E6F7E";
          ctx.font = '700 16px "proxima-nova", system-ui, sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            centerHeader.name,
            boxX + boxWidth / 2,
            contentTop + headerHeight / 2
          );
        }

        contentTop += headerHeight;
        ctx.strokeStyle = "#E2E8EB";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(boxX + m.pad, contentTop + HEADER_DIVIDER_GAP / 2);
        ctx.lineTo(
          boxX + boxWidth - m.pad,
          contentTop + HEADER_DIVIDER_GAP / 2
        );
        ctx.stroke();
        contentTop += HEADER_DIVIDER_GAP;
      }

      unique.forEach((tenant, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const itemsInRow = Math.min(cols, count - row * cols);
        const rowOffset = ((cols - itemsInRow) * stepX) / 2;
        const x = boxX + m.pad + rowOffset + col * stepX;
        const y = contentTop + m.pad + row * stepY;
        drawTenantCell(
          ctx,
          tenant,
          logos[index],
          x,
          y,
          m,
          nameCells
        );
      });
    },
    calloutOptions(layout)
  );
}

/** Screen-space estimate for collision layout of a tenant group pin (box only). */
export function estimateGroupedLogoMarkerSize(
  tenantCount: number,
  options?: {
    hasCenterHeader?: boolean;
    compact?: boolean;
    nameCells?: boolean;
    scale?: number;
  }
): { width: number; height: number } {
  const count = Math.max(tenantCount, 1);
  const m = cellMetrics(options?.compact, options?.nameCells, options?.scale);
  const { cols, rows } = gridDimensions(count);
  const gridWidth =
    m.pad * 2 + cols * m.cellW + Math.max(cols - 1, 0) * m.gap;
  const gridHeight =
    m.pad * 2 + rows * m.cellH + Math.max(rows - 1, 0) * m.gap;
  const hasCenterHeader = options?.hasCenterHeader ?? false;
  const headerBandHeight = hasCenterHeader
    ? HEADER_PADDING_Y * 2 + HEADER_LOGO_MAX_HEIGHT + HEADER_DIVIDER_GAP
    : 0;
  return {
    width: Math.max(
      gridWidth,
      hasCenterHeader ? HEADER_LOGO_MAX_WIDTH + HEADER_PADDING_X * 2 : 0
    ),
    height: headerBandHeight + gridHeight,
  };
}
