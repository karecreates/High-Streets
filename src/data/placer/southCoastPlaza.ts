import type { PlacerInsightsData, PlacerPolygon } from "./types";
import tradeAreaPolygons from "./southCoastPlazaTradeAreaPolygon.json";

/**
 * Placer.ai export — South Coast Plaza
 * (3333 Bristol St, Costa Mesa, CA 92626).
 * Source files live in assets/South Coast Plaza Data/.
 *
 * Demographics: Census 2024 (ACS) for population / households / age / density;
 * STI Popstats for income distribution. Workplace from Placer Workplace panel.
 */
export const SOUTH_COAST_PLAZA_PLACER: PlacerInsightsData = {
  placeName: "South Coast Plaza",
  methodology:
    "Trade area captures 70% of visits within 10 miles. Benchmarked nationwide.",
  reportingPeriod: "Jan 1 – Dec 31, 2025",
  overview: {
    headline: [
      { value: "14.2M", label: "Visits" },
      { value: "5.1M", label: "Size in square feet" },
    ],
    secondary: [
      { value: "3.78M", label: "Unique visitors" },
      { value: "3.75", label: "Visits per visitor" },
      { value: "75 min", label: "Avg. dwell time" },
      { value: "2.77", label: "Visits per sq ft" },
      { value: "+0.9%", label: "Visits YoY" },
    ],
  },
  demographics: {
    stats: [
      { value: "1,049,910", label: "Population" },
      { value: "348,095", label: "Households" },
      { value: "3.02", label: "Average Household Size" },
      { value: "36.2", label: "Median age" },
      { value: "8,623", label: "Population per sq mi" },
    ],
    income: {
      average: "$170.8K",
      median: "$128.1K",
      distribution: [
        { label: "<$15K", share: 0.05958 },
        { label: "$15–25K", share: 0.03342 },
        { label: "$25–35K", share: 0.03283 },
        { label: "$35–50K", share: 0.05764 },
        { label: "$50–75K", share: 0.10129 },
        { label: "$75–100K", share: 0.10301 },
        { label: "$100–150K", share: 0.19033 },
        { label: "$150–175K", share: 0.08117 },
        { label: "$175–200K", share: 0.07028 },
        { label: "$200–250K", share: 0.15144 },
        { label: "$250–500K", share: 0.0649 },
        { label: ">$500K", share: 0.05412 },
      ],
    },
    workplace: [
      { value: "47,098", label: "Total businesses" },
      { value: "520,148", label: "Total employees" },
    ],
  },
  psychographics: {
    topGroups: [
      {
        code: "B",
        name: "Flourishing Families",
        population: "283,335",
        percent: 27.0,
        index: 351,
        description:
          "Affluent families and couples in upscale suburban neighborhoods with strong purchasing power.",
      },
      {
        code: "I",
        name: "Family Union",
        population: "163,597",
        percent: 15.6,
        index: 182,
        description:
          "Middle-class multi-generational and family households with established community roots.",
      },
      {
        code: "C",
        name: "Booming with Confidence",
        population: "129,485",
        percent: 12.3,
        index: 126,
        description:
          "Prosperous empty-nesters and midlife couples enjoying comfortable suburban lifestyles.",
      },
    ],
  },
  tradeArea: {
    polygons: tradeAreaPolygons as PlacerPolygon[],
    site: { lat: 33.69113613390609, lng: -117.88898025852322 },
  },
};
