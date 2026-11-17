import type { PlacerInsightsData } from "./types";

/**
 * Placer.ai export — Old Town Pasadena
 * (S. Raymond Ave., Pasadena, CA).
 * Source: assets/Old_Town_Pasadena_Data/
 * Audience Profile STI Popstats, true trade area.
 * Overview / psychographics / trade-area polygon are not in this drop.
 */
export const OLD_TOWN_PASADENA_PLACER: PlacerInsightsData = {
  placeName: "Old Town Pasadena",
  methodology:
    "Trade area captures 70% of visits within 10 miles. Benchmarked nationwide.",
  reportingPeriod: "Jan 1 – Dec 31, 2025",
  demographics: {
    stats: [
      { value: "697,672", label: "Population" },
      { value: "272,797", label: "Households" },
      { value: "2.50", label: "Average Household Size" },
      { value: "42.5", label: "Average age" },
      { value: "9,023", label: "Population per sq mi" },
    ],
    income: {
      average: "$148.7K",
      median: "$105.9K",
      distribution: [
        { label: "<$15K", share: 0.08343 },
        { label: "$15–25K", share: 0.04986 },
        { label: "$25–35K", share: 0.04995 },
        { label: "$35–50K", share: 0.06697 },
        { label: "$50–75K", share: 0.11637 },
        { label: "$75–100K", share: 0.11059 },
        { label: "$100–150K", share: 0.17663 },
        { label: "$150–175K", share: 0.06838 },
        { label: "$175–200K", share: 0.06053 },
        { label: "$200–250K", share: 0.12172 },
        { label: "$250–500K", share: 0.05215 },
        { label: ">$500K", share: 0.04342 },
      ],
    },
    workplace: [
      { value: "52,803", label: "Total businesses" },
      { value: "345,942", label: "Total employees" },
    ],
  },
};
