import type { PlacerInsightsData, PlacerPolygon } from "./types";
import tradeAreaPolygons from "./abbotKinneyTradeAreaPolygon.json";

/**
 * Placer.ai export — Abbot Kinney
 * (1305 Abbot Kinney Boulevard, Venice, CA 90291).
 * Source CSVs live in assets/PLACER DATA/.
 */
export const ABBOT_KINNEY_PLACER: PlacerInsightsData = {
  placeName: "Abbot Kinney",
  methodology:
    "Trade area captures 70% of visits within 10 miles. Benchmarked nationwide.",
  reportingPeriod: "Jan 1 – Dec 31, 2025",
  overview: {
    headline: [
      { value: "2.7M", label: "Visits" },
      { value: "1.15M", label: "Unique visitors" },
    ],
    secondary: [
      { value: "2.39", label: "Visits per visitor" },
      { value: "81 min", label: "Avg. dwell time" },
      { value: "+7.5%", label: "Visits YoY" },
      { value: "+8.1%", label: "Visits Yo2Y" },
      { value: "+9.6%", label: "Visits Yo3Y" },
    ],
  },
  demographics: {
    // From abbot_kinney_demographics.csv (70% of visits within 10mi).
    // Population / households / age / density counts are not in this export.
    stats: [
      { value: "1.99", label: "Average Household Size" },
      { value: "65.5%", label: "Bachelor's Degree or Higher" },
      { value: "26.1%", label: "Advanced Degree" },
      { value: "$946K", label: "Median house value" },
      { value: "$66.3K", label: "Avg. income per person" },
    ],
    income: {
      average: "$132.0K",
      median: "$90.6K",
      distribution: [
        { label: "<$10K", share: 0.05625 },
        { label: "$10–15K", share: 0.04263 },
        { label: "$15–20K", share: 0.02831 },
        { label: "$20–25K", share: 0.03189 },
        { label: "$25–30K", share: 0.02955 },
        { label: "$30–35K", share: 0.03404 },
        { label: "$35–40K", share: 0.02547 },
        { label: "$40–45K", share: 0.02809 },
        { label: "$45–50K", share: 0.02119 },
        { label: "$50–60K", share: 0.05158 },
        { label: "$60–75K", share: 0.07824 },
        { label: "$75–100K", share: 0.11681 },
        { label: "$100–125K", share: 0.10458 },
        { label: "$125–150K", share: 0.06801 },
        { label: "$150–200K", share: 0.10078 },
        { label: ">$200K", share: 0.18257 },
      ],
    },
    workplace: [
      { value: "6.3%", label: "Unemployment" },
      { value: "10.4%", label: "Worked at home" },
    ],
  },
  psychographics: {
    // Segment rows aggregated to Mosaic group; population counts not in export.
    topGroups: [
      {
        code: "G",
        name: "Young City Solos",
        population: "—",
        percent: 27.1,
        index: 1533,
        description:
          "Younger and middle-aged singles living active and energetic lifestyles in metropolitan areas.",
      },
      {
        code: "A",
        name: "Power Elite",
        population: "—",
        percent: 23.8,
        index: 918,
        description:
          "The wealthiest households in the US, living in the most exclusive neighborhoods, and enjoying all that life has to offer",
      },
      {
        code: "C",
        name: "Booming with Confidence",
        population: "—",
        percent: 13.4,
        index: 258,
        description:
          "Prosperous, established couples in their peak earning years living in suburban homes.",
      },
    ],
  },
  tradeArea: {
    polygons: tradeAreaPolygons as PlacerPolygon[],
    site: { lat: 33.9909036, lng: -118.4679279 },
  },
};
