import { PDFDocument } from "pdf-lib";

/**
 * Saves the map the broker is looking at — current pan, zoom, and whichever
 * labels are on screen — as a print-resolution PDF. Browser print reflows
 * the map and drops the canvas logos; a screenshot is only screen DPI.
 *
 * The basemap comes from the Static Maps API (same cloud style) at 2×, and
 * the tenant callouts are copied from the live marker images so the PDF
 * matches the scope on screen.
 */

const MAX_STATIC_SIZE = 640;
const STATIC_SCALE = 2;
/** Bottom strip of a static image that holds the Google logo and copyright. */
const LOGO_BAND = 52;
const MAX_OUTPUT_PX = 7200;
const PRINT_DPI = 300;

export interface MapViewportPdfOptions {
  /** Cloud Map ID so the basemap matches the on-screen style. */
  mapId?: string;
  filename: string;
  apiKey: string;
}

function cssToLatLng(
  map: google.maps.Map,
  x: number,
  y: number,
  width: number,
  height: number
): google.maps.LatLng {
  const projection = map.getProjection();
  const center = map.getCenter();
  const zoom = map.getZoom();
  if (!projection || !center || zoom == null) {
    throw new Error("The map is still loading.");
  }
  const centerPt = projection.fromLatLngToPoint(center);
  if (!centerPt) throw new Error("The map is still loading.");
  const scale = 2 ** zoom;
  return projection.fromPointToLatLng(
    new google.maps.Point(
      centerPt.x + (x - width / 2) / scale,
      centerPt.y + (y - height / 2) / scale
    )
  )!;
}

function spans(total: number, tile: number): Array<{ start: number; size: number }> {
  if (total <= tile) return [{ start: 0, size: total }];
  const out: Array<{ start: number; size: number }> = [];
  for (let start = 0; start < total - 0.5; ) {
    const size = Math.min(tile, total - start);
    out.push({ start, size });
    if (start + size >= total - 0.5) break;
    start += size;
  }
  return out;
}

interface TileRequest {
  url: string;
  /** Viewport CSS rect this tile covers. */
  cssX: number;
  cssY: number;
  cssW: number;
  cssH: number;
  /** Drop the logo strip. The bottom-left tile keeps it, as attribution. */
  cropBand: boolean;
  /** Fraction of the image height that covers the viewport cell. */
  keepRatio: number;
}

function buildTiles(
  map: google.maps.Map,
  cssW: number,
  cssH: number,
  options: MapViewportPdfOptions,
  staticZoom: number,
  k: number
): TileRequest[] {
  const contentMax = MAX_STATIC_SIZE - LOGO_BAND;
  const maxCss = Math.max(80, Math.floor(contentMax / k));
  const cols = spans(cssW, maxCss);
  const rows = spans(cssH, maxCss);
  const mapType = map.getMapTypeId();
  const satellite = mapType === "satellite" || mapType === "hybrid";
  const tiles: TileRequest[] = [];

  rows.forEach((row, rowIndex) => {
    cols.forEach((col, colIndex) => {
      const attribution = rowIndex === rows.length - 1 && colIndex === 0;
      const sw = Math.min(MAX_STATIC_SIZE, Math.max(1, Math.round(col.size * k)));
      const contentSh = Math.min(
        MAX_STATIC_SIZE,
        Math.max(1, Math.round(row.size * k))
      );
      const sh = attribution
        ? contentSh
        : Math.min(MAX_STATIC_SIZE, contentSh + LOGO_BAND);
      const bandCss = attribution ? 0 : LOGO_BAND / k;
      const center = cssToLatLng(
        map,
        col.start + col.size / 2,
        row.start + row.size / 2 + bandCss / 2,
        cssW,
        cssH
      );
      const params = new URLSearchParams({
        center: `${center.lat()},${center.lng()}`,
        zoom: String(staticZoom),
        size: `${sw}x${sh}`,
        scale: String(STATIC_SCALE),
        key: options.apiKey,
      });
      if (satellite) {
        params.set("maptype", mapType === "hybrid" ? "hybrid" : "satellite");
      } else if (options.mapId) {
        params.set("map_id", options.mapId);
      }
      tiles.push({
        url: `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`,
        cssX: col.start,
        cssY: row.start,
        cssW: col.size,
        cssH: row.size,
        cropBand: !attribution,
        keepRatio: attribution ? 1 : contentSh / sh,
      });
    });
  });
  return tiles;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The basemap image failed to load."));
    img.src = url;
  });
}

async function loadStaticMap(url: string): Promise<HTMLImageElement> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("The basemap service rejected the print request.");
  }
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("The basemap service rejected the print request.");
  }
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await loadImage(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function markerImages(
  mapDiv: HTMLElement
): Promise<HTMLImageElement[]> {
  const origin = mapDiv.getBoundingClientRect();
  const imgs = [...mapDiv.querySelectorAll("img")].filter((img) => {
    const src = img.currentSrc || img.src;
    if (!src.startsWith("data:image/") && !src.startsWith("blob:")) return false;
    const box = img.getBoundingClientRect();
    if (box.width < 12 || box.height < 12) return false;
    return !(
      box.right < origin.left ||
      box.left > origin.right ||
      box.bottom < origin.top ||
      box.top > origin.bottom
    );
  });
  await Promise.all(imgs.map((img) => img.decode().catch(() => undefined)));
  return imgs;
}

export async function downloadMapViewportPdf(
  map: google.maps.Map,
  options: MapViewportPdfOptions
): Promise<void> {
  if (!options.apiKey) {
    throw new Error("The map key is missing, so the PDF can't be built.");
  }
  const zoom = map.getZoom();
  const div = map.getDiv() as HTMLElement;
  const rect = div.getBoundingClientRect();
  if (zoom == null || rect.width < 40 || rect.height < 40) {
    throw new Error("The map is still loading.");
  }
  const heading = map.getHeading() ?? 0;
  const tilt = map.getTilt() ?? 0;
  if (Math.abs(heading) > 1 || tilt > 1) {
    throw new Error("Set the map flat and north-up, then print again.");
  }

  let staticZoom = Math.max(1, Math.min(21, Math.ceil(zoom)));
  let k = 2 ** (staticZoom - zoom);
  if (
    rect.width * k * STATIC_SCALE > MAX_OUTPUT_PX ||
    rect.height * k * STATIC_SCALE > MAX_OUTPUT_PX
  ) {
    staticZoom = Math.max(1, Math.min(21, Math.floor(zoom)));
    k = 2 ** (staticZoom - zoom);
  }
  const pixelsPerCss = k * STATIC_SCALE;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.width * pixelsPerCss));
  canvas.height = Math.max(1, Math.round(rect.height * pixelsPerCss));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't start the PDF capture.");
  ctx.fillStyle = "#f3f1ec";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const tiles = buildTiles(
    map,
    rect.width,
    rect.height,
    options,
    staticZoom,
    k
  );
  const images = await Promise.all(tiles.map((tile) => loadStaticMap(tile.url)));

  // Attribution tile last, so its Google logo stays in the corner.
  const order = tiles
    .map((tile, index) => ({ tile, img: images[index] }))
    .sort((a, b) => Number(b.tile.cropBand) - Number(a.tile.cropBand));

  for (const { tile, img } of order) {
    const destX = Math.round(tile.cssX * pixelsPerCss);
    const destY = Math.round(tile.cssY * pixelsPerCss);
    const destW = Math.round((tile.cssX + tile.cssW) * pixelsPerCss) - destX;
    const destH = Math.round((tile.cssY + tile.cssH) * pixelsPerCss) - destY;
    const srcH = Math.max(1, Math.round(img.naturalHeight * tile.keepRatio));
    ctx.drawImage(
      img,
      0,
      0,
      img.naturalWidth,
      srcH,
      destX,
      destY,
      destW,
      destH
    );
  }

  const origin = rect;
  for (const img of await markerImages(div)) {
    const box = img.getBoundingClientRect();
    ctx.drawImage(
      img,
      (box.left - origin.left) * pixelsPerCss,
      (box.top - origin.top) * pixelsPerCss,
      box.width * pixelsPerCss,
      box.height * pixelsPerCss
    );
  }

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Couldn't render the map image."));
    }, "image/png");
  });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([
    (canvas.width / PRINT_DPI) * 72,
    (canvas.height / PRINT_DPI) * 72,
  ]);
  const embedded = await pdf.embedPng(await pngBlob.arrayBuffer());
  page.drawImage(embedded, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });
  const bytes = await pdf.save();
  const file = new Blob([bytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = options.filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
