import type { PlacerInsightsData } from "./types";

/**
 * Placer.ai export — Melrose Ave & Melrose Place
 * (Melrose Pl, Los Angeles, CA).
 * Source: assets/Melrose_Data/
 * Audience Profile STI Popstats, true trade area.
 * Overview / psychographics / trade-area polygon are not in this drop.
 */
export const MELROSE_PLACER: PlacerInsightsData = {
  placeName: "Melrose Ave & Melrose Place",
  methodology:
    "Trade area captures 70% of visits within 10 miles. Benchmarked nationwide.",
  reportingPeriod: "Sep 1, 2025 – Aug 31, 2026",
  demographics: {
    stats: [
      { value: "963,835", label: "Population" },
      { value: "454,700", label: "Households" },
      { value: "2.03", label: "Average Household Size" },
      { value: "40.3", label: "Average age" },
      { value: "16,579", label: "Population per sq mi" },
    ],
    income: {
      average: "$152.1K",
      median: "$96.6K",
      distribution: [
        { label: "<$15K", share: 0.09712 },
        { label: "$15–25K", share: 0.05737 },
        { label: "$25–35K", share: 0.05472 },
        { label: "$35–50K", share: 0.0779 },
        { label: "$50–75K", share: 0.11907 },
        { label: "$75–100K", share: 0.10806 },
        { label: "$100–150K", share: 0.16482 },
        { label: "$150–175K", share: 0.05836 },
        { label: "$175–200K", share: 0.04913 },
        { label: "$200–250K", share: 0.1195 },
        { label: "$250–500K", share: 0.05122 },
        { label: ">$500K", share: 0.04274 },
      ],
    },
    workplace: [
      { value: "107,940", label: "Total businesses" },
      { value: "668,124", label: "Total employees" },
    ],
  },
};
