import type { PlacerInsightsData } from "./types";

/**
 * Placer.ai export — Malibu Country Mart
 * (Cross Creek Rd, Malibu, CA).
 * Source: assets/Malibu_Country_Mart_Data/
 * Audience Profile STI Popstats, true trade area.
 * Overview / psychographics / trade-area polygon are not in this drop.
 */
export const MALIBU_COUNTRY_MART_PLACER: PlacerInsightsData = {
  placeName: "Malibu Country Mart",
  methodology:
    "Trade area captures 70% of visits within 10 miles. Benchmarked nationwide.",
  reportingPeriod: "Jan 1 – Dec 31, 2025",
  demographics: {
    stats: [
      { value: "20,780", label: "Population" },
      { value: "7,550", label: "Households" },
      { value: "2.43", label: "Average Household Size" },
      { value: "42.3", label: "Average age" },
      { value: "873", label: "Population per sq mi" },
    ],
    income: {
      average: "$274.0K",
      median: "$158.2K",
      distribution: [
        { label: "<$15K", share: 0.0853 },
        { label: "$15–25K", share: 0.02927 },
        { label: "$25–35K", share: 0.03563 },
        { label: "$35–50K", share: 0.03179 },
        { label: "$50–75K", share: 0.06424 },
        { label: "$75–100K", share: 0.06848 },
        { label: "$100–150K", share: 0.16199 },
        { label: "$150–175K", share: 0.07073 },
        { label: "$175–200K", share: 0.05748 },
        { label: "$200–250K", share: 0.22146 },
        { label: "$250–500K", share: 0.0951 },
        { label: ">$500K", share: 0.07854 },
      ],
    },
    workplace: [
      { value: "1,907", label: "Total businesses" },
      { value: "11,471", label: "Total employees" },
    ],
  },
};
