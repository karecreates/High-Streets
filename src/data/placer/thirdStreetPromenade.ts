import type { PlacerInsightsData, PlacerPolygon } from "./types";
import tradeAreaPolygons from "./thirdStreetTradeAreaPolygon.json";

/**
 * Placer.ai export — Third Street Promenade
 * (1202 3rd Street Promenade, Santa Monica, CA 90401).
 * Source CSVs live in assets/PLACER DATA/.
 */
export const THIRD_STREET_PLACER: PlacerInsightsData = {
  placeName: "Third Street Promenade",
  methodology: "Trade area captures 70% of visits within 10 miles. Benchmarked nationwide.",
  reportingPeriod: "Jan 1 – Dec 31, 2025",
  overview: {
    headline: [
      { value: "7.0M", label: "Visits" },
      { value: "1.63M", label: "Size in square feet" },
    ],
    secondary: [
      { value: "2.2M", label: "Unique visitors" },
      { value: "3.12", label: "Visits per visitor" },
      { value: "64 min", label: "Avg. dwell time" },
      { value: "4.28", label: "Visits per sq ft" },
      { value: "-0.5%", label: "Visits YoY" },
    ],
  },
  demographics: {
    stats: [
      { value: "350,139", label: "Population" },
      { value: "164,123", label: "Households" },
      { value: "1.98", label: "Average Household Size" },
      { value: "40.4", label: "Average age" },
      { value: "14,107", label: "Population per sq mi" },
    ],
    income: {
      average: "$188.8K",
      median: "$129.6K",
      distribution: [
        { label: "<$10K", share: 0.0671 },
        { label: "$10–15K", share: 0.0298 },
        { label: "$15–20K", share: 0.0263 },
        { label: "$20–25K", share: 0.0244 },
        { label: "$25–30K", share: 0.0243 },
        { label: "$30–35K", share: 0.0193 },
        { label: "$35–40K", share: 0.0216 },
        { label: "$40–45K", share: 0.024 },
        { label: "$45–50K", share: 0.0198 },
        { label: "$50–60K", share: 0.0376 },
        { label: "$60–75K", share: 0.063 },
        { label: "$75–100K", share: 0.1015 },
        { label: "$100–125K", share: 0.0921 },
        { label: "$125–150K", share: 0.0743 },
        { label: "$150–200K", share: 0.1078 },
        { label: ">$200K", share: 0.267 },
      ],
    },
    workplace: [
      { value: "36,196", label: "Total businesses" },
      { value: "235,673", label: "Total employees" },
    ],
  },
  psychographics: {
    topGroups: [
      {
        code: "A",
        name: "Power Elite",
        population: "88,360",
        percent: 24.5,
        index: 296,
        description:
          "The wealthiest households in the US, living in the most exclusive neighborhoods, and enjoying all that life has to offer",
      },
      {
        code: "G",
        name: "Young City Solos",
        population: "71,306",
        percent: 19.8,
        index: 1152,
        description:
          "Younger and middle-aged singles living active and energetic lifestyles in metropolitan areas.",
      },
      {
        code: "C",
        name: "Booming with Confidence",
        population: "44,935",
        percent: 12.5,
        index: 128,
        description:
          "Prosperous, established couples in their peak earning years living in suburban homes.",
      },
    ],
  },
  tradeArea: {
    polygons: tradeAreaPolygons as PlacerPolygon[],
    site: { lat: 34.01579, lng: -118.49641 },
  },
};

