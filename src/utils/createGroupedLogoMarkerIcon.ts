import type { Tenant } from "../types/tenant";
import { createLogoMarkerIcon } from "./createLogoMarkerIcon";
import { dedupeTenants } from "./dedupeTenants";
import { getLogoDevImageUrl } from "./logoDev";
import { drawCalloutMarker, loadImage, roundRect } from "./markerCalloutCanvas";

const CELL_SIZE = 30;
const CELL_GAP = 6;
const PADDING = 10;
const CELL_RADIUS = 6;
const MAX_ROWS = 7;
const INITIAL_BG = "#EDF1F2";
const INITIAL_COLOR = "#3E6F7E";
const INITIAL_FONT = '700 15px "proxima-nova", system-ui, sans-serif';

async function loadTenantLogo(tenant: Tenant): Promise<HTMLImageElement | null> {
  // Only load a logo when a verified brand domain resolved for this tenant.
  const logoUrl = getLogoDevImageUrl(tenant.logoDomain);
  if (!logoUrl) return null;
  try {
    return await loadImage(logoUrl);
  } catch {
    return null;
  }
}

function initialFor(tenant: Tenant): string {
  const name = tenant.tenantName.trim();
  return (name[0] || "?").toUpperCase();
}

/**
 * Pick a balanced grid for `count` cells. We aim for a slightly portrait block
 * (rows ≈ 1.4 × columns) so small groups don't render as a single tall column,
 * then clamp to a maximum of 7 rows and add columns as needed for large groups
 * (e.g. 6 → 2×3, 15 → 3×5, 35 → 5×7).
 */
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
 * Grouped marker = a compact grid of the tenants at one address. Each cell shows
 * the tenant's verified logo when available, otherwise just the first letter of
 * its name (the full name is revealed in the info-window popup on click). The
 * grid fills to a maximum of 7 rows and adds columns as needed, so a busy
 * address (e.g. 35 tenants) reads as a clean 7×5 block instead of a long list.
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
  const step = CELL_SIZE + CELL_GAP;

  const boxWidth = PADDING * 2 + cols * CELL_SIZE + (cols - 1) * CELL_GAP;
  const boxHeight = PADDING * 2 + rows * CELL_SIZE + (rows - 1) * CELL_GAP;

  return drawCalloutMarker(boxWidth, boxHeight, (ctx) => {
    unique.forEach((tenant, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      // Center a partial final row so leftover cells look intentional.
      const itemsInRow = Math.min(cols, count - row * cols);
      const rowOffset = ((cols - itemsInRow) * step) / 2;
      const x = PADDING + rowOffset + col * step;
      const y = PADDING + row * step;
      const img = logos[index];

      if (img) {
        ctx.save();
        roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, CELL_RADIUS);
        ctx.clip();
        ctx.drawImage(img, x, y, CELL_SIZE, CELL_SIZE);
        ctx.restore();
      } else {
        roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, CELL_RADIUS);
        ctx.fillStyle = INITIAL_BG;
        ctx.fill();

        ctx.fillStyle = INITIAL_COLOR;
        ctx.font = INITIAL_FONT;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(initialFor(tenant), x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 1);
      }
    });
  });
}
