import type { PlacerInsightsData, PlacerPolygon } from "./types";
import tradeAreaPolygons from "./theGroveTradeAreaPolygon.json";

/**
 * Placer.ai export — The Grove
 * (189 The Grove Dr, Los Angeles, CA 90036).
 * Source files live in assets/The Grove Data/.
 */
export const THE_GROVE_PLACER: PlacerInsightsData = {
  placeName: "The Grove",
  methodology:
    "Trade area captures 70% of visits within 10 miles. Benchmarked nationwide.",
  reportingPeriod: "Jan 1 – Dec 31, 2025",
  overview: {
    headline: [
      { value: "8.5M", label: "Visits" },
      { value: "600K", label: "Size in square feet" },
    ],
    secondary: [
      { value: "3.78M", label: "Unique visitors" },
      { value: "2.24", label: "Visits per visitor" },
      { value: "82 min", label: "Avg. dwell time" },
      { value: "14.11", label: "Visits per sq ft" },
      { value: "+4.1%", label: "Visits YoY" },
    ],
  },
  demographics: {
    stats: [
      { value: "1,083,528", label: "Population" },
      { value: "475,648", label: "Households" },
      { value: "2.18", label: "Average Household Size" },
      { value: "39.7", label: "Average age" },
      { value: "19,855", label: "Population per sq mi" },
    ],
    income: {
      average: "$130.5K",
      median: "$85.5K",
      distribution: [
        { label: "<$15K", share: 0.10511 },
        { label: "$15–25K", share: 0.06573 },
        { label: "$25–35K", share: 0.06084 },
        { label: "$35–50K", share: 0.08868 },
        { label: "$50–75K", share: 0.13169 },
        { label: "$75–100K", share: 0.11293 },
        { label: "$100–150K", share: 0.16139 },
        { label: "$150–175K", share: 0.0553 },
        { label: "$175–200K", share: 0.04507 },
        { label: "$200–250K", share: 0.097 },
        { label: "$250–500K", share: 0.04157 },
        { label: ">$500K", share: 0.03469 },
      ],
    },
    workplace: [
      { value: "106,130", label: "Total businesses" },
      { value: "675,799", label: "Total employees" },
    ],
  },
  psychographics: {
    topGroups: [
      {
        code: "P",
        name: "Cultural Connections",
        population: "174,199",
        percent: 16.3,
        index: 471,
        description:
          "Diverse midscale urban households with strong community ties and multicultural lifestyles.",
      },
      {
        code: "K",
        name: "Significant Singles",
        population: "166,549",
        percent: 15.5,
        index: 385,
        description:
          "Mature singles and divorced people living in midscale urban neighborhoods and apartments.",
      },
      {
        code: "G",
        name: "Young City Solos",
        population: "159,627",
        percent: 14.9,
        index: 867,
        description:
          "Younger and middle-aged singles living active and energetic lifestyles in metropolitan areas.",
      },
    ],
  },
  tradeArea: {
    polygons: tradeAreaPolygons as PlacerPolygon[],
    site: { lat: 34.07198357761211, lng: -118.35748715851972 },
  },
};
