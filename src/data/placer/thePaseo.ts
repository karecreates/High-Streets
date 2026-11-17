import type { PlacerInsightsData } from "./types";

/**
 * Placer.ai export — The Paseo
 * (E Colorado Blvd, Pasadena, CA).
 * Source: assets/The_Paseo_Data/
 * Audience Profile STI Popstats, true trade area.
 * Overview / psychographics / trade-area polygon are not in this drop.
 */
export const THE_PASEO_PLACER: PlacerInsightsData = {
  placeName: "The Paseo",
  methodology:
    "Trade area captures 70% of visits within 10 miles. Benchmarked nationwide.",
  reportingPeriod: "Jan 1 – Dec 31, 2025",
  demographics: {
    stats: [
      { value: "575,873", label: "Population" },
      { value: "227,686", label: "Households" },
      { value: "2.49", label: "Average Household Size" },
      { value: "42.4", label: "Average age" },
      { value: "9,404", label: "Population per sq mi" },
    ],
    income: {
      average: "$145.3K",
      median: "$105.0K",
      distribution: [
        { label: "<$15K", share: 0.08233 },
        { label: "$15–25K", share: 0.05078 },
        { label: "$25–35K", share: 0.04885 },
        { label: "$35–50K", share: 0.06493 },
        { label: "$50–75K", share: 0.1196 },
        { label: "$75–100K", share: 0.11357 },
        { label: "$100–150K", share: 0.17975 },
        { label: "$150–175K", share: 0.06788 },
        { label: "$175–200K", share: 0.05996 },
        { label: "$200–250K", share: 0.11894 },
        { label: "$250–500K", share: 0.05099 },
        { label: ">$500K", share: 0.04241 },
      ],
    },
    workplace: [
      { value: "40,421", label: "Total businesses" },
      { value: "263,468", label: "Total employees" },
    ],
  },
};
