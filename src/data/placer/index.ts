import { ABBOT_KINNEY_PLACER } from "./abbotKinney";
import { BULK_PLACER_BY_SLUG } from "./bulkQuarterly";
import { GOLDEN_TRIANGLE_PLACER } from "./goldenTriangle";
import { MALIBU_COUNTRY_MART_PLACER } from "./malibuCountryMart";
import { MELROSE_PLACER } from "./melrose";
import { OLD_TOWN_PASADENA_PLACER } from "./oldTownPasadena";
import { ONE_COLORADO_PLACER } from "./oneColorado";
import { SOUTH_COAST_PLAZA_PLACER } from "./southCoastPlaza";
import { THE_GROVE_PLACER } from "./theGrove";
import { THE_PASEO_PLACER } from "./thePaseo";
import { THIRD_STREET_PLACER } from "./thirdStreetPromenade";
import { WESTFIELD_CENTURY_CITY_PLACER } from "./westfieldCenturyCity";
import type { PlacerInsightsData } from "./types";

const PLACER_BY_SLUG: Record<string, PlacerInsightsData> = {
  "third-street-promenade": THIRD_STREET_PLACER,
  "abbot-kinney": ABBOT_KINNEY_PLACER,
  "the-grove": THE_GROVE_PLACER,
  "westfield-century-city": WESTFIELD_CENTURY_CITY_PLACER,
  "golden-triangle": GOLDEN_TRIANGLE_PLACER,
  "malibu-country-mart": MALIBU_COUNTRY_MART_PLACER,
  melrose: MELROSE_PLACER,
  "old-town-pasadena": OLD_TOWN_PASADENA_PLACER,
  "one-colorado": ONE_COLORADO_PLACER,
  "the-paseo": THE_PASEO_PLACER,
  "south-coast-plaza": SOUTH_COAST_PLAZA_PLACER,
};

export function getPlacerInsights(
  slug: string | undefined
): PlacerInsightsData | null {
  if (!slug) return null;
  const existing = PLACER_BY_SLUG[slug];
  const bulk = BULK_PLACER_BY_SLUG[slug];
  if (!existing && !bulk) return null;
  if (!bulk) return existing ?? null;
  if (!existing) return bulk;
  return {
    ...existing,
    placeName: existing.placeName,
    methodology: bulk.methodology,
    reportingPeriod: bulk.reportingPeriod,
    overview: bulk.overview,
    demographics: bulk.demographics,
  };
}

export type { PlacerInsightsData } from "./types";
export { ABBOT_KINNEY_PLACER } from "./abbotKinney";
export { GOLDEN_TRIANGLE_PLACER } from "./goldenTriangle";
export { MALIBU_COUNTRY_MART_PLACER } from "./malibuCountryMart";
export { MELROSE_PLACER } from "./melrose";
export { OLD_TOWN_PASADENA_PLACER } from "./oldTownPasadena";
export { ONE_COLORADO_PLACER } from "./oneColorado";
export { SOUTH_COAST_PLAZA_PLACER } from "./southCoastPlaza";
export { THE_GROVE_PLACER } from "./theGrove";
export { THE_PASEO_PLACER } from "./thePaseo";
export { THIRD_STREET_PLACER } from "./thirdStreetPromenade";
export { WESTFIELD_CENTURY_CITY_PLACER } from "./westfieldCenturyCity";
