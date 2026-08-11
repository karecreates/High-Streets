/** Placer.ai trade-area insights shown on dedicated corridor pages. */

export interface PlacerStat {
  value: string;
  label: string;
  /** Secondary context line under the label. */
  hint?: string;
}

export interface PlacerIncomeBucket {
  /** e.g. "75K–100K" */
  label: string;
  /** Share of households, 0–1. */
  share: number;
}

export interface PlacerPsychographicGroup {
  /** Mosaic letter, e.g. "A" */
  code: string;
  name: string;
  population: string;
  /** Share of trade-area population, 0–100. */
  percent: number;
  /** Index vs. nationwide benchmark (100 = average). */
  index: number;
  description: string;
}

export interface PlacerPolygon {
  outer: Array<{ lat: number; lng: number }>;
  inners: Array<Array<{ lat: number; lng: number }>>;
}

export interface PlacerInsightsData {
  /** e.g. "Third Street Promenade" */
  placeName: string;
  /** Trade-area definition + reporting window, shown as the data's fine print. */
  methodology: string;
  reportingPeriod: string;
  overview: {
    headline: PlacerStat[];
    secondary: PlacerStat[];
  };
  demographics: {
    stats: PlacerStat[];
    income: {
      average: string;
      median: string;
      distribution: PlacerIncomeBucket[];
    };
    workplace: PlacerStat[];
  };
  psychographics: {
    topGroups: PlacerPsychographicGroup[];
  };
  tradeArea: {
    polygons: PlacerPolygon[];
    /** Marker anchor for the property itself. */
    site: { lat: number; lng: number };
  };
}
