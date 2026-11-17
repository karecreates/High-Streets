import type { PlacerInsightsData, PlacerPolygon } from "./types";
import tradeAreaPolygons from "./goldenTriangleTradeAreaPolygon.json";

/**
 * Placer.ai export — Beverly Hills Golden Triangle
 * (347 North Rodeo Drive, Beverly Hills, CA 90210).
 * Source files live in assets/Golden Triangle Data/.
 * Overview export has no square-footage metric.
 */
export const GOLDEN_TRIANGLE_PLACER: PlacerInsightsData = {
  placeName: "Golden Triangle",
  methodology:
    "Trade area captures 70% of visits within 10 miles. Benchmarked nationwide.",
  reportingPeriod: "Jan 1 – Dec 31, 2025",
  overview: {
    headline: [
      { value: "12.4M", label: "Visits" },
      { value: "3.46M", label: "Unique visitors" },
    ],
    secondary: [
      { value: "3.57", label: "Visits per visitor" },
      { value: "93 min", label: "Avg. dwell time" },
      { value: "+4.9%", label: "Visits YoY" },
      { value: "+8.1%", label: "Visits Yo2Y" },
      { value: "+13.7%", label: "Visits Yo3Y" },
    ],
  },
  demographics: {
    stats: [
      { value: "700,732", label: "Population" },
      { value: "338,175", label: "Households" },
      { value: "1.97", label: "Average Household Size" },
      { value: "40.6", label: "Average age" },
      { value: "13,639", label: "Population per sq mi" },
    ],
    income: {
      average: "$171.1K",
      median: "$107.8K",
      distribution: [
        { label: "<$15K", share: 0.0912 },
        { label: "$15–25K", share: 0.05304 },
        { label: "$25–35K", share: 0.048 },
        { label: "$35–50K", share: 0.06966 },
        { label: "$50–75K", share: 0.1067 },
        { label: "$75–100K", share: 0.10296 },
        { label: "$100–150K", share: 0.16532 },
        { label: "$150–175K", share: 0.0606 },
        { label: "$175–200K", share: 0.05305 },
        { label: "$200–250K", share: 0.13966 },
        { label: "$250–500K", share: 0.05986 },
        { label: ">$500K", share: 0.04994 },
      ],
    },
    workplace: [
      { value: "103,044", label: "Total businesses" },
      { value: "596,466", label: "Total employees" },
    ],
  },
  psychographics: {
    topGroups: [
      {
        code: "A",
        name: "Power Elite",
        population: "167,756",
        percent: 23.8,
        index: 286,
        description:
          "The wealthiest households in the US, living in the most exclusive neighborhoods, and enjoying all that life has to offer",
      },
      {
        code: "G",
        name: "Young City Solos",
        population: "147,443",
        percent: 20.9,
        index: 1216,
        description:
          "Younger and middle-aged singles living active and energetic lifestyles in metropolitan areas.",
      },
      {
        code: "O",
        name: "Singles and Starters",
        population: "87,150",
        percent: 12.3,
        index: 153,
        description:
          "Younger singles starting out in apartments and starter homes across urban and suburban neighborhoods.",
      },
    ],
  },
  tradeArea: {
    polygons: tradeAreaPolygons as PlacerPolygon[],
    site: { lat: 34.06935214693885, lng: -118.40180470244921 },
  },
};
