import type { Tenant } from "../types/tenant";
import { getLogoDevImageUrl } from "./logoDev";
import {
  drawCalloutMarker,
  loadImage,
} from "./markerCalloutCanvas";

const BOX_SIZE = 43;
const LOGO_SIZE = 29;
const NAME_COLOR = "#3E6F7E";
const NAME_FONT = '600 12px "proxima-nova", system-ui, sans-serif';
const NAME_PADDING_X = 10;
const MAX_NAME_WIDTH = 154;

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (
    truncated.length > 1 &&
    ctx.measureText(`${truncated}…`).width > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

function createNameFallback(tenantName: string): google.maps.Icon {
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = NAME_FONT;
  const label = truncateText(
    measure,
    tenantName.trim() || "Tenant",
    MAX_NAME_WIDTH
  );
  const textWidth = measure.measureText(label).width;
  const boxWidth = Math.min(
    MAX_NAME_WIDTH + NAME_PADDING_X * 2,
    Math.max(BOX_SIZE, Math.ceil(textWidth + NAME_PADDING_X * 2))
  );

  return drawCalloutMarker(boxWidth, BOX_SIZE, (ctx, _x, _y, width) => {
    ctx.fillStyle = NAME_COLOR;
    ctx.font = NAME_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, width / 2, BOX_SIZE / 2);
  });
}

function createFromLogoImage(img: HTMLImageElement): google.maps.Icon {
  return drawCalloutMarker(BOX_SIZE, BOX_SIZE, (ctx) => {
    const x = (BOX_SIZE - LOGO_SIZE) / 2;
    const y = (BOX_SIZE - LOGO_SIZE) / 2;
    ctx.drawImage(img, x, y, LOGO_SIZE, LOGO_SIZE);
  });
}

export async function createLogoMarkerIcon(
  tenant: Tenant
): Promise<google.maps.Icon> {
  // Only tenants with a verified brand domain show a logo image; everyone else
  // renders their name as text (no fuzzy / wrong / placeholder logos).
  const logoUrl = getLogoDevImageUrl(tenant.logoDomain);

  if (!logoUrl) {
    return createNameFallback(tenant.tenantName);
  }

  try {
    const img = await loadImage(logoUrl);
    return createFromLogoImage(img);
  } catch {
    return createNameFallback(tenant.tenantName);
  }
}
