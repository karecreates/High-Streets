import betaMarkerSvg from "@assets/beta_markerr.svg";
import { MARKER_SCALE } from "./markerCalloutCanvas";

const BASE_SIZE = 26;
/** 1.5× compact marker size */
export const VACANCY_PIN_SIZE = Math.round(BASE_SIZE * 1.5);
const SHADOW_PAD = 5;

let iconCache: google.maps.Icon | null = null;
let iconPromise: Promise<google.maps.Icon> | null = null;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Vacancy marker failed to load"));
    img.src = url;
  });
}

/** Vacancy pin at exact lat/lng (tip anchored on the coordinate). */
export async function createVacancyPinIcon(): Promise<google.maps.Icon> {
  if (iconCache) return iconCache;

  if (!iconPromise) {
    iconPromise = (async () => {
      const img = await loadImage(betaMarkerSvg);
      const size = VACANCY_PIN_SIZE;
      const pad = SHADOW_PAD;
      const width = size + pad * 2;
      const height = size + pad * 2;

      const canvas = document.createElement("canvas");
      canvas.width = width * MARKER_SCALE;
      canvas.height = height * MARKER_SCALE;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(MARKER_SCALE, MARKER_SCALE);

      ctx.shadowColor = "rgba(26, 35, 50, 0.24)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;
      ctx.drawImage(img, pad, pad, size, size);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      iconCache = {
        url: canvas.toDataURL(),
        scaledSize: new google.maps.Size(width, height),
        anchor: new google.maps.Point(width / 2, pad + size),
      };
      return iconCache;
    })();
  }

  return iconPromise;
}

export { betaMarkerSvg };
