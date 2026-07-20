import { drawCalloutMarker, loadImage } from "./markerCalloutCanvas";

const LOGO_TARGET_WIDTH = 120;
const PADDING_X = 14;
const PADDING_Y = 20;

function getMarkerDimensions(img: HTMLImageElement) {
  const aspect = img.naturalWidth / img.naturalHeight;
  const logoWidth = LOGO_TARGET_WIDTH;
  const logoHeight = logoWidth / aspect;

  return {
    boxWidth: logoWidth + PADDING_X * 2,
    boxHeight: logoHeight + PADDING_Y * 2,
    logoWidth,
    logoHeight,
  };
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dims: ReturnType<typeof getMarkerDimensions>
) {
  const x = (dims.boxWidth - dims.logoWidth) / 2;
  const y = (dims.boxHeight - dims.logoHeight) / 2;
  ctx.drawImage(img, x, y, dims.logoWidth, dims.logoHeight);
}

export async function createShoppingCenterMarkerIcon(
  logoUrl: string
): Promise<google.maps.Icon> {
  try {
    const img = await loadImage(logoUrl);
    const dims = getMarkerDimensions(img);
    return drawCalloutMarker(dims.boxWidth, dims.boxHeight, (ctx) => {
      drawLogo(ctx, img, dims);
    });
  } catch {
    const boxWidth = LOGO_TARGET_WIDTH + PADDING_X * 2;
    const boxHeight = 48;
    return drawCalloutMarker(boxWidth, boxHeight, (ctx, _x, _y, width) => {
      ctx.fillStyle = "#3E6F7E";
      ctx.font = '600 22px "proxima-nova", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("MCM", width / 2, boxHeight / 2);
    });
  }
}
