import type { PlacerInsightsData } from "./types";

/**
 * Placer.ai export — One Colorado
 * (Hugus Alley, Pasadena, CA).
 * Source: assets/One_Colorado_Data/
 * Audience Profile STI Popstats, true trade area.
 * Overview / psychographics / trade-area polygon are not in this drop.
 */
export const ONE_COLORADO_PLACER: PlacerInsightsData = {
  placeName: "One Colorado",
  methodology:
    "Trade area captures 70% of visits within 10 miles. Benchmarked nationwide.",
  reportingPeriod: "Jan 1 – Dec 31, 2025",
  demographics: {
    stats: [
      { value: "657,404", label: "Population" },
      { value: "254,949", label: "Households" },
      { value: "2.52", label: "Average Household Size" },
      { value: "42.5", label: "Average age" },
      { value: "8,721", label: "Population per sq mi" },
    ],
    income: {
      average: "$154.0K",
      median: "$108.1K",
      distribution: [
        { label: "<$15K", share: 0.07594 },
        { label: "$15–25K", share: 0.04639 },
        { label: "$25–35K", share: 0.04805 },
        { label: "$35–50K", share: 0.06586 },
        { label: "$50–75K", share: 0.11867 },
        { label: "$75–100K", share: 0.11373 },
        { label: "$100–150K", share: 0.17542 },
        { label: "$150–175K", share: 0.06888 },
        { label: "$175–200K", share: 0.0615 },
        { label: "$200–250K", share: 0.12635 },
        { label: "$250–500K", share: 0.05413 },
        { label: ">$500K", share: 0.04507 },
      ],
    },
    workplace: [
      { value: "44,949", label: "Total businesses" },
      { value: "295,736", label: "Total employees" },
    ],
  },
};
