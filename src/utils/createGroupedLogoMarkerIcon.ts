import type { Tenant } from "../types/tenant";
import {
  createLogoMarkerIcon,
  drawLettermark,
  GROUP_CELL_HEIGHT,
  GROUP_CELL_WIDTH,
  LETTERMARK_SIZE,
  MAX_LOGO_HEIGHT,
  MAX_LOGO_WIDTH,
} from "./createLogoMarkerIcon";
import { dedupeTenants } from "./dedupeTenants";
import { getTenantInitial } from "./tenantInitial";
import { loadBrandLogoImage } from "./logoProvider";
import {
  drawCalloutMarker,
  drawImageContained,
  roundRect,
} from "./markerCalloutCanvas";

const CELL_GAP = 8;
const PADDING = 10;
const CELL_RADIUS = 8;
const MAX_ROWS = 7;

async function loadTenantLogo(tenant: Tenant): Promise<HTMLImageElement | null> {
  return loadBrandLogoImage(tenant.logoDomain, { size: 160 });
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

/**
 * Grouped marker = grid of tenants at one address. Logos match standalone size;
 * missing logos use the shared beta-blue lettermark.
 */
export async function createGroupedLogoMarkerIcon(
  tenants: Tenant[]
): Promise<google.maps.Icon> {
  const unique = dedupeTenants(tenants);

  if (unique.length === 1) {
    return createLogoMarkerIcon(unique[0]);
  }

  const logos = await Promise.all(unique.map(loadTenantLogo));
  const count = unique.length;

  const { cols, rows } = gridDimensions(count);
  const stepX = GROUP_CELL_WIDTH + CELL_GAP;
  const stepY = GROUP_CELL_HEIGHT + CELL_GAP;

  const boxWidth =
    PADDING * 2 + cols * GROUP_CELL_WIDTH + (cols - 1) * CELL_GAP;
  const boxHeight =
    PADDING * 2 + rows * GROUP_CELL_HEIGHT + (rows - 1) * CELL_GAP;

  return drawCalloutMarker(boxWidth, boxHeight, (ctx) => {
    unique.forEach((tenant, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const itemsInRow = Math.min(cols, count - row * cols);
      const rowOffset = ((cols - itemsInRow) * stepX) / 2;
      const x = PADDING + rowOffset + col * stepX;
      const y = PADDING + row * stepY;
      const img = logos[index];

      if (img) {
        ctx.save();
        roundRect(ctx, x, y, GROUP_CELL_WIDTH, GROUP_CELL_HEIGHT, CELL_RADIUS);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.clip();
        drawImageContained(
          ctx,
          img,
          x + (GROUP_CELL_WIDTH - MAX_LOGO_WIDTH) / 2,
          y + (GROUP_CELL_HEIGHT - MAX_LOGO_HEIGHT) / 2,
          MAX_LOGO_WIDTH,
          MAX_LOGO_HEIGHT
        );
        ctx.restore();
      } else {
        const lx = x + (GROUP_CELL_WIDTH - LETTERMARK_SIZE) / 2;
        const ly = y + (GROUP_CELL_HEIGHT - LETTERMARK_SIZE) / 2;
        drawLettermark(
          ctx,
          lx,
          ly,
          LETTERMARK_SIZE,
          getTenantInitial(tenant.tenantName)
        );
      }
    });
  });
}
