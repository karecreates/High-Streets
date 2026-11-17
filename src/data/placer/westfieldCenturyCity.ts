import type { PlacerInsightsData, PlacerPolygon } from "./types";
import tradeAreaPolygons from "./westfieldCenturyCityTradeAreaPolygon.json";

/**
 * Placer.ai export — Westfield Century City
 * (10250 Santa Monica Blvd, Los Angeles, CA 90067).
 * Source files live in assets/Westfield Century City Data/.
 */
export const WESTFIELD_CENTURY_CITY_PLACER: PlacerInsightsData = {
  placeName: "Westfield Century City",
  methodology:
    "Trade area captures 70% of visits within 10 miles. Benchmarked nationwide.",
  reportingPeriod: "Jan 1 – Dec 31, 2025",
  overview: {
    headline: [
      { value: "11.7M", label: "Visits" },
      { value: "879K", label: "Size in square feet" },
    ],
    secondary: [
      { value: "2.85M", label: "Unique visitors" },
      { value: "4.09", label: "Visits per visitor" },
      { value: "89 min", label: "Avg. dwell time" },
      { value: "13.27", label: "Visits per sq ft" },
      { value: "+10.0%", label: "Visits YoY" },
    ],
  },
  demographics: {
    stats: [
      { value: "808,110", label: "Population" },
      { value: "381,754", label: "Households" },
      { value: "2.02", label: "Average Household Size" },
      { value: "40.4", label: "Average age" },
      { value: "14,450", label: "Population per sq mi" },
    ],
    income: {
      average: "$171.1K",
      median: "$111.7K",
      distribution: [
        { label: "<$15K", share: 0.08277 },
        { label: "$15–25K", share: 0.04775 },
        { label: "$25–35K", share: 0.04865 },
        { label: "$35–50K", share: 0.06903 },
        { label: "$50–75K", share: 0.10602 },
        { label: "$75–100K", share: 0.10273 },
        { label: "$100–150K", share: 0.16772 },
        { label: "$150–175K", share: 0.06224 },
        { label: "$175–200K", share: 0.05438 },
        { label: "$200–250K", share: 0.14483 },
        { label: "$250–500K", share: 0.06208 },
        { label: ">$500K", share: 0.0518 },
      ],
    },
    workplace: [
      { value: "99,412", label: "Total businesses" },
      { value: "623,939", label: "Total employees" },
    ],
  },
  psychographics: {
    topGroups: [
      {
        code: "A",
        name: "Power Elite",
        population: "174,437",
        percent: 21.4,
        index: 258,
        description:
          "The wealthiest households in the US, living in the most exclusive neighborhoods, and enjoying all that life has to offer",
      },
      {
        code: "G",
        name: "Young City Solos",
        population: "158,198",
        percent: 19.4,
        index: 1130,
        description:
          "Younger and middle-aged singles living active and energetic lifestyles in metropolitan areas.",
      },
      {
        code: "K",
        name: "Significant Singles",
        population: "100,989",
        percent: 12.4,
        index: 308,
        description:
          "Mature singles and divorced people living in midscale urban neighborhoods and apartments.",
      },
    ],
  },
  tradeArea: {
    polygons: tradeAreaPolygons as PlacerPolygon[],
    site: { lat: 34.05876376913148, lng: -118.41905072261834 },
  },
};
