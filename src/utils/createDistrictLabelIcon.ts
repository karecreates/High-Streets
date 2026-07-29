import type { DashboardDistrictTier } from "../data/dashboardDistrictLabels";

const BETA_BLUE = "#3E6F7E";
const TEXT_STROKE = "#f5f5f5";
const SCALE = 2;

const TIER_PRESETS: Record<
  DashboardDistrictTier,
  { font: string; fontSize: number; strokeWidth: number }
> = {
  primary: {
    font: '700 24px "proxima-nova", system-ui, sans-serif',
    fontSize: 24,
    strokeWidth: 5,
  },
  secondary: {
    font: '600 18px "proxima-nova", system-ui, sans-serif',
    fontSize: 18,
    strokeWidth: 4,
  },
  tertiary: {
    font: '600 15px "proxima-nova", system-ui, sans-serif',
    fontSize: 15,
    strokeWidth: 3.5,
  },
};

export function createDistrictLabelIcon(
  name: string,
  tier: DashboardDistrictTier = "tertiary"
): google.maps.Icon {
  const preset = TIER_PRESETS[tier];
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = preset.font;
  const textWidth = Math.ceil(measure.measureText(name).width);
  const width = textWidth + 6;
  const height = preset.fontSize + 8;

  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  ctx.font = preset.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = preset.strokeWidth;
  ctx.strokeStyle = TEXT_STROKE;
  ctx.strokeText(name, width / 2, height / 2);
  ctx.fillStyle = BETA_BLUE;
  ctx.fillText(name, width / 2, height / 2);

  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height / 2),
  };
}
