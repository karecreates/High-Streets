import { ABBOT_KINNEY_PLACER } from "./abbotKinney";
import { THIRD_STREET_PLACER } from "./thirdStreetPromenade";
import type { PlacerInsightsData } from "./types";

const PLACER_BY_SLUG: Record<string, PlacerInsightsData> = {
  "third-street-promenade": THIRD_STREET_PLACER,
  "abbot-kinney": ABBOT_KINNEY_PLACER,
};

export function getPlacerInsights(
  slug: string | undefined
): PlacerInsightsData | null {
  if (!slug) return null;
  return PLACER_BY_SLUG[slug] ?? null;
}

export type { PlacerInsightsData } from "./types";
export { ABBOT_KINNEY_PLACER } from "./abbotKinney";
export { THIRD_STREET_PLACER } from "./thirdStreetPromenade";
