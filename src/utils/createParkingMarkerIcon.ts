import { MARKER_SCALE, roundRect } from "./markerCalloutCanvas";

const WIDTH = 22;
const HEIGHT = 16;
const RADIUS = 4;
const FILL = "#1A73E8";

let iconCache: google.maps.Icon | null = null;
let iconPromise: Promise<google.maps.Icon> | null = null;

/** Small blue rounded rectangle with a white "P" for LADOT metered parking. */
export async function createParkingMarkerIcon(): Promise<google.maps.Icon> {
  if (iconCache) return iconCache;

  if (!iconPromise) {
    iconPromise = (async () => {
      const canvas = document.createElement("canvas");
      canvas.width = WIDTH * MARKER_SCALE;
      canvas.height = HEIGHT * MARKER_SCALE;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(MARKER_SCALE, MARKER_SCALE);

      ctx.fillStyle = FILL;
      roundRect(ctx, 0, 0, WIDTH, HEIGHT, RADIUS);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", WIDTH / 2, HEIGHT / 2 + 0.5);

      iconCache = {
        url: canvas.toDataURL(),
        scaledSize: new google.maps.Size(WIDTH, HEIGHT),
        anchor: new google.maps.Point(WIDTH / 2, HEIGHT / 2),
      };
      return iconCache;
    })();
  }

  return iconPromise;
}
