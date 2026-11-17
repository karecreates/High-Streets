import type { PlacerInsightsData } from "./types";

/**
 * Overview + demographics from the 9/21/2026 Placer.ai quarterly bulk export.
 * Numeric: assets/Placer_Data_Stream_9.21/..._Numeric/metrics/
 * Percentages: assets/Placer_Data_Stream_9.21/..._percentages/metrics/
 * Latest quarter used for every location: Oct 1 – Dec 31, 2025.
 * South Coast Plaza is not in this feed and keeps its existing file.
 */
export const BULK_PLACER_BY_SLUG: Record<string, PlacerInsightsData> = {
  "abbot-kinney": {
    placeName: "Abbot Kinney",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "616K", label: "Visits" },
        { value: "6,700", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "6,276", label: "Median visits per day" },
        { value: "63 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.01", label: "Average Household Size" },
        { value: "67%", label: "Bachelor's Degree or Higher" },
        { value: "28%", label: "Advanced Degree" },
        { value: "94%", label: "High School Graduate or Higher" },
        { value: "$69.3K", label: "Avg. income per person" },
      ],
      income: {
        average: "$200.3K",
        median: "$136.5K",
        distribution: [],
      },
      workplace: [
        { value: "93%", label: "Employed" },
        { value: "7%", label: "Unemployed" },
      ],
    },
  },
  "americana-at-brand": {
    placeName: "Americana at Brand",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "2.2M", label: "Visits" },
        { value: "24,051", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "20,454", label: "Median visits per day" },
        { value: "67 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.55", label: "Average Household Size" },
        { value: "43%", label: "Bachelor's Degree or Higher" },
        { value: "15%", label: "Advanced Degree" },
        { value: "85%", label: "High School Graduate or Higher" },
        { value: "$39.9K", label: "Avg. income per person" },
      ],
      income: {
        average: "$138.3K",
        median: "$96.4K",
        distribution: [],
      },
      workplace: [
        { value: "92%", label: "Employed" },
        { value: "8%", label: "Unemployed" },
      ],
    },
  },
  "brentwood-country-mart": {
    placeName: "Brentwood Country Mart",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "281K", label: "Visits" },
        { value: "3,052", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "2,978", label: "Median visits per day" },
        { value: "40 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.26", label: "Average Household Size" },
        { value: "76%", label: "Bachelor's Degree or Higher" },
        { value: "37%", label: "Advanced Degree" },
        { value: "97%", label: "High School Graduate or Higher" },
        { value: "$112.5K", label: "Avg. income per person" },
      ],
      income: {
        average: "$315.9K",
        median: "$170.0K",
        distribution: [],
      },
      workplace: [
        { value: "93%", label: "Employed" },
        { value: "7%", label: "Unemployed" },
      ],
    },
  },
  "culver-city": {
    placeName: "Culver City",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "1.3M", label: "Visits" },
        { value: "13,631", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "12,939", label: "Median visits per day" },
        { value: "87 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.25", label: "Average Household Size" },
        { value: "59%", label: "Bachelor's Degree or Higher" },
        { value: "25%", label: "Advanced Degree" },
        { value: "90%", label: "High School Graduate or Higher" },
        { value: "$59.2K", label: "Avg. income per person" },
      ],
      income: {
        average: "$174.1K",
        median: "$122.2K",
        distribution: [],
      },
      workplace: [
        { value: "93%", label: "Employed" },
        { value: "7%", label: "Unemployed" },
      ],
    },
  },
  "downtown-la": {
    placeName: "Downtown LA",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "5.8M", label: "Visits" },
        { value: "62,882", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "64,475", label: "Median visits per day" },
        { value: "133 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.54", label: "Average Household Size" },
        { value: "37%", label: "Bachelor's Degree or Higher" },
        { value: "14%", label: "Advanced Degree" },
        { value: "76%", label: "High School Graduate or Higher" },
        { value: "$30.5K", label: "Avg. income per person" },
      ],
      income: {
        average: "$123.8K",
        median: "$82.7K",
        distribution: [],
      },
      workplace: [
        { value: "92%", label: "Employed" },
        { value: "8%", label: "Unemployed" },
      ],
    },
  },
  "downtown-manhattan-beach": {
    placeName: "Manhattan Beach",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "1.3M", label: "Visits" },
        { value: "14,480", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "14,138", label: "Median visits per day" },
        { value: "94 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.46", label: "Average Household Size" },
        { value: "67%", label: "Bachelor's Degree or Higher" },
        { value: "29%", label: "Advanced Degree" },
        { value: "95%", label: "High School Graduate or Higher" },
        { value: "$73.0K", label: "Avg. income per person" },
      ],
      income: {
        average: "$250.1K",
        median: "$168.0K",
        distribution: [],
      },
      workplace: [
        { value: "95%", label: "Employed" },
        { value: "5%", label: "Unemployed" },
      ],
    },
  },
  "golden-triangle": {
    placeName: "Golden Triangle",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "3.1M", label: "Visits" },
        { value: "34,017", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "32,952", label: "Median visits per day" },
        { value: "93 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.19", label: "Average Household Size" },
        { value: "66%", label: "Bachelor's Degree or Higher" },
        { value: "30%", label: "Advanced Degree" },
        { value: "93%", label: "High School Graduate or Higher" },
        { value: "$55.1K", label: "Avg. income per person" },
      ],
      income: {
        average: "$239.7K",
        median: "$136.5K",
        distribution: [],
      },
      workplace: [
        { value: "92%", label: "Employed" },
        { value: "8%", label: "Unemployed" },
      ],
    },
  },
  "la-arts-district": {
    placeName: "LA Arts District",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "958K", label: "Visits" },
        { value: "10,409", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "10,023", label: "Median visits per day" },
        { value: "106 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.56", label: "Average Household Size" },
        { value: "39%", label: "Bachelor's Degree or Higher" },
        { value: "14%", label: "Advanced Degree" },
        { value: "79%", label: "High School Graduate or Higher" },
        { value: "$32.5K", label: "Avg. income per person" },
      ],
      income: {
        average: "$130.4K",
        median: "$89.2K",
        distribution: [],
      },
      workplace: [
        { value: "92%", label: "Employed" },
        { value: "8%", label: "Unemployed" },
      ],
    },
  },
  "la-brea": {
    placeName: "La Brea",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "742K", label: "Visits" },
        { value: "8,070", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "8,219", label: "Median visits per day" },
        { value: "40 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.17", label: "Average Household Size" },
        { value: "53%", label: "Bachelor's Degree or Higher" },
        { value: "19%", label: "Advanced Degree" },
        { value: "87%", label: "High School Graduate or Higher" },
        { value: "$52.4K", label: "Avg. income per person" },
      ],
      income: {
        average: "$159.4K",
        median: "$96.1K",
        distribution: [],
      },
      workplace: [
        { value: "91%", label: "Employed" },
        { value: "9%", label: "Unemployed" },
      ],
    },
  },
  "larchmont": {
    placeName: "Larchmont",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "957K", label: "Visits" },
        { value: "10,401", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "10,327", label: "Median visits per day" },
        { value: "45 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.22", label: "Average Household Size" },
        { value: "53%", label: "Bachelor's Degree or Higher" },
        { value: "19%", label: "Advanced Degree" },
        { value: "88%", label: "High School Graduate or Higher" },
        { value: "$56.8K", label: "Avg. income per person" },
      ],
      income: {
        average: "$186.5K",
        median: "$100.0K",
        distribution: [],
      },
      workplace: [
        { value: "92%", label: "Employed" },
        { value: "8%", label: "Unemployed" },
      ],
    },
  },
  "malibu-country-mart": {
    placeName: "Malibu Country Mart",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "377K", label: "Visits" },
        { value: "4,102", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "3,571", label: "Median visits per day" },
        { value: "47 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.26", label: "Average Household Size" },
        { value: "66%", label: "Bachelor's Degree or Higher" },
        { value: "30%", label: "Advanced Degree" },
        { value: "95%", label: "High School Graduate or Higher" },
        { value: "$44.3K", label: "Avg. income per person" },
      ],
      income: {
        average: "$247.3K",
        median: "$149.9K",
        distribution: [],
      },
      workplace: [
        { value: "93%", label: "Employed" },
        { value: "7%", label: "Unemployed" },
      ],
    },
  },
  "malibu-village": {
    placeName: "Malibu Village",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "210K", label: "Visits" },
        { value: "2,280", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "2,169", label: "Median visits per day" },
        { value: "35 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.28", label: "Average Household Size" },
        { value: "64%", label: "Bachelor's Degree or Higher" },
        { value: "29%", label: "Advanced Degree" },
        { value: "95%", label: "High School Graduate or Higher" },
        { value: "$39.5K", label: "Avg. income per person" },
      ],
      income: {
        average: "$237.5K",
        median: "$144.9K",
        distribution: [],
      },
      workplace: [
        { value: "93%", label: "Employed" },
        { value: "7%", label: "Unemployed" },
      ],
    },
  },
  "manhattan-village": {
    placeName: "Manhattan Village",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "1.9M", label: "Visits" },
        { value: "20,494", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "20,378", label: "Median visits per day" },
        { value: "54 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.61", label: "Average Household Size" },
        { value: "57%", label: "Bachelor's Degree or Higher" },
        { value: "24%", label: "Advanced Degree" },
        { value: "91%", label: "High School Graduate or Higher" },
        { value: "$58.9K", label: "Avg. income per person" },
      ],
      income: {
        average: "$219.4K",
        median: "$150.4K",
        distribution: [],
      },
      workplace: [
        { value: "94%", label: "Employed" },
        { value: "6%", label: "Unemployed" },
      ],
    },
  },
  "melrose": {
    placeName: "Melrose Ave & Melrose Place",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "720K", label: "Visits" },
        { value: "7,821", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "7,536", label: "Median visits per day" },
        { value: "82 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.05", label: "Average Household Size" },
        { value: "61%", label: "Bachelor's Degree or Higher" },
        { value: "24%", label: "Advanced Degree" },
        { value: "92%", label: "High School Graduate or Higher" },
        { value: "$51.6K", label: "Avg. income per person" },
      ],
      income: {
        average: "$200.0K",
        median: "$120.7K",
        distribution: [],
      },
      workplace: [
        { value: "92%", label: "Employed" },
        { value: "8%", label: "Unemployed" },
      ],
    },
  },
  "montana": {
    placeName: "Montana Ave",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "1M", label: "Visits" },
        { value: "10,870", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "10,805", label: "Median visits per day" },
        { value: "67 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.08", label: "Average Household Size" },
        { value: "73%", label: "Bachelor's Degree or Higher" },
        { value: "34%", label: "Advanced Degree" },
        { value: "96%", label: "High School Graduate or Higher" },
        { value: "$100.6K", label: "Avg. income per person" },
      ],
      income: {
        average: "$256.2K",
        median: "$152.5K",
        distribution: [],
      },
      workplace: [
        { value: "93%", label: "Employed" },
        { value: "7%", label: "Unemployed" },
      ],
    },
  },
  "old-town-pasadena": {
    placeName: "Old Town Pasadena",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "2.1M", label: "Visits" },
        { value: "22,336", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "20,301", label: "Median visits per day" },
        { value: "97 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.54", label: "Average Household Size" },
        { value: "51%", label: "Bachelor's Degree or Higher" },
        { value: "22%", label: "Advanced Degree" },
        { value: "88%", label: "High School Graduate or Higher" },
        { value: "$49.8K", label: "Avg. income per person" },
      ],
      income: {
        average: "$169.8K",
        median: "$118.5K",
        distribution: [],
      },
      workplace: [
        { value: "94%", label: "Employed" },
        { value: "6%", label: "Unemployed" },
      ],
    },
  },
  "one-colorado": {
    placeName: "One Colorado",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "2.1M", label: "Visits" },
        { value: "22,336", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "20,301", label: "Median visits per day" },
        { value: "97 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.54", label: "Average Household Size" },
        { value: "51%", label: "Bachelor's Degree or Higher" },
        { value: "22%", label: "Advanced Degree" },
        { value: "88%", label: "High School Graduate or Higher" },
        { value: "$49.8K", label: "Avg. income per person" },
      ],
      income: {
        average: "$169.8K",
        median: "$118.5K",
        distribution: [],
      },
      workplace: [
        { value: "94%", label: "Employed" },
        { value: "6%", label: "Unemployed" },
      ],
    },
  },
  "platform": {
    placeName: "Platform",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "68.1K", label: "Visits" },
        { value: "740", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "741", label: "Median visits per day" },
        { value: "54 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.29", label: "Average Household Size" },
        { value: "58%", label: "Bachelor's Degree or Higher" },
        { value: "25%", label: "Advanced Degree" },
        { value: "90%", label: "High School Graduate or Higher" },
        { value: "$58.5K", label: "Avg. income per person" },
      ],
      income: {
        average: "$186.6K",
        median: "$125.3K",
        distribution: [],
      },
      workplace: [
        { value: "93%", label: "Employed" },
        { value: "7%", label: "Unemployed" },
      ],
    },
  },
  "robertson": {
    placeName: "Robertson",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "310K", label: "Visits" },
        { value: "3,369", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "3,390", label: "Median visits per day" },
        { value: "46 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.10", label: "Average Household Size" },
        { value: "60%", label: "Bachelor's Degree or Higher" },
        { value: "25%", label: "Advanced Degree" },
        { value: "92%", label: "High School Graduate or Higher" },
        { value: "$63.2K", label: "Avg. income per person" },
      ],
      income: {
        average: "$195.4K",
        median: "$118.4K",
        distribution: [],
      },
      workplace: [
        { value: "92%", label: "Employed" },
        { value: "8%", label: "Unemployed" },
      ],
    },
  },
  "santa-monica-place": {
    placeName: "Santa Monica Place",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "2.4M", label: "Visits" },
        { value: "25,910", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "24,825", label: "Median visits per day" },
        { value: "90 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.10", label: "Average Household Size" },
        { value: "63%", label: "Bachelor's Degree or Higher" },
        { value: "26%", label: "Advanced Degree" },
        { value: "92%", label: "High School Graduate or Higher" },
        { value: "$42.7K", label: "Avg. income per person" },
      ],
      income: {
        average: "$194.9K",
        median: "$123.5K",
        distribution: [],
      },
      workplace: [
        { value: "93%", label: "Employed" },
        { value: "7%", label: "Unemployed" },
      ],
    },
  },
  "silver-lake": {
    placeName: "Silverlake",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "1.1M", label: "Visits" },
        { value: "12,390", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "11,845", label: "Median visits per day" },
        { value: "80 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.19", label: "Average Household Size" },
        { value: "52%", label: "Bachelor's Degree or Higher" },
        { value: "18%", label: "Advanced Degree" },
        { value: "86%", label: "High School Graduate or Higher" },
        { value: "$43.0K", label: "Avg. income per person" },
      ],
      income: {
        average: "$149.8K",
        median: "$100.7K",
        distribution: [],
      },
      workplace: [
        { value: "91%", label: "Employed" },
        { value: "9%", label: "Unemployed" },
      ],
    },
  },
  "sportsmen-lodge": {
    placeName: "Sportsmen's Lodge",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "450K", label: "Visits" },
        { value: "4,895", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "4,826", label: "Median visits per day" },
        { value: "55 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.25", label: "Average Household Size" },
        { value: "59%", label: "Bachelor's Degree or Higher" },
        { value: "23%", label: "Advanced Degree" },
        { value: "94%", label: "High School Graduate or Higher" },
        { value: "$69.9K", label: "Avg. income per person" },
      ],
      income: {
        average: "$207.1K",
        median: "$127.1K",
        distribution: [],
      },
      workplace: [
        { value: "91%", label: "Employed" },
        { value: "9%", label: "Unemployed" },
      ],
    },
  },
  "studio-city": {
    placeName: "Studio City",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "3.1M", label: "Visits" },
        { value: "34,163", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "34,209", label: "Median visits per day" },
        { value: "67 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.22", label: "Average Household Size" },
        { value: "57%", label: "Bachelor's Degree or Higher" },
        { value: "21%", label: "Advanced Degree" },
        { value: "93%", label: "High School Graduate or Higher" },
        { value: "$67.2K", label: "Avg. income per person" },
      ],
      income: {
        average: "$199.4K",
        median: "$125.2K",
        distribution: [],
      },
      workplace: [
        { value: "91%", label: "Employed" },
        { value: "9%", label: "Unemployed" },
      ],
    },
  },
  "sunset-strip": {
    placeName: "Sunset Strip",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "651K", label: "Visits" },
        { value: "7,077", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "6,806", label: "Median visits per day" },
        { value: "83 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "1.99", label: "Average Household Size" },
        { value: "61%", label: "Bachelor's Degree or Higher" },
        { value: "24%", label: "Advanced Degree" },
        { value: "92%", label: "High School Graduate or Higher" },
        { value: "$53.3K", label: "Avg. income per person" },
      ],
      income: {
        average: "$195.4K",
        median: "$118.9K",
        distribution: [],
      },
      workplace: [
        { value: "92%", label: "Employed" },
        { value: "8%", label: "Unemployed" },
      ],
    },
  },
  "the-grove": {
    placeName: "The Grove",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "2.6M", label: "Visits" },
        { value: "28,226", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "23,369", label: "Median visits per day" },
        { value: "82 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.33", label: "Average Household Size" },
        { value: "48%", label: "Bachelor's Degree or Higher" },
        { value: "17%", label: "Advanced Degree" },
        { value: "85%", label: "High School Graduate or Higher" },
        { value: "$29.4K", label: "Avg. income per person" },
      ],
      income: {
        average: "$155.1K",
        median: "$100.9K",
        distribution: [],
      },
      workplace: [
        { value: "92%", label: "Employed" },
        { value: "8%", label: "Unemployed" },
      ],
    },
  },
  "the-paseo": {
    placeName: "The Paseo",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "2.1M", label: "Visits" },
        { value: "22,336", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "20,301", label: "Median visits per day" },
        { value: "97 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.54", label: "Average Household Size" },
        { value: "51%", label: "Bachelor's Degree or Higher" },
        { value: "22%", label: "Advanced Degree" },
        { value: "88%", label: "High School Graduate or Higher" },
        { value: "$49.8K", label: "Avg. income per person" },
      ],
      income: {
        average: "$169.8K",
        median: "$118.5K",
        distribution: [],
      },
      workplace: [
        { value: "94%", label: "Employed" },
        { value: "6%", label: "Unemployed" },
      ],
    },
  },
  "the-point": {
    placeName: "The Point",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "498K", label: "Visits" },
        { value: "5,415", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "4,947", label: "Median visits per day" },
        { value: "53 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.53", label: "Average Household Size" },
        { value: "57%", label: "Bachelor's Degree or Higher" },
        { value: "23%", label: "Advanced Degree" },
        { value: "91%", label: "High School Graduate or Higher" },
        { value: "$20.1K", label: "Avg. income per person" },
      ],
      income: {
        average: "$209.1K",
        median: "$147.4K",
        distribution: [],
      },
      workplace: [
        { value: "94%", label: "Employed" },
        { value: "6%", label: "Unemployed" },
      ],
    },
  },
  "third-street-promenade": {
    placeName: "Third Street Promenade",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "2.4M", label: "Visits" },
        { value: "25,910", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "24,825", label: "Median visits per day" },
        { value: "90 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.10", label: "Average Household Size" },
        { value: "63%", label: "Bachelor's Degree or Higher" },
        { value: "26%", label: "Advanced Degree" },
        { value: "92%", label: "High School Graduate or Higher" },
        { value: "$42.7K", label: "Avg. income per person" },
      ],
      income: {
        average: "$194.9K",
        median: "$123.5K",
        distribution: [],
      },
      workplace: [
        { value: "93%", label: "Employed" },
        { value: "7%", label: "Unemployed" },
      ],
    },
  },
  "westfield-century-city": {
    placeName: "Westfield Century City",
    methodology:
      "Visitor-captured audience from Placer.ai PopStats and Census. Quarterly visit metrics.",
    reportingPeriod: "Oct 1 – Dec 31, 2025",
    overview: {
      headline: [
        { value: "3M", label: "Visits" },
        { value: "32,413", label: "Avg. visits per day" },
      ],
      secondary: [
        { value: "32,473", label: "Median visits per day" },
        { value: "89 min", label: "Avg. dwell time" },
      ],
    },
    demographics: {
      stats: [
        { value: "2.14", label: "Average Household Size" },
        { value: "65%", label: "Bachelor's Degree or Higher" },
        { value: "29%", label: "Advanced Degree" },
        { value: "93%", label: "High School Graduate or Higher" },
        { value: "$32.5K", label: "Avg. income per person" },
      ],
      income: {
        average: "$210.4K",
        median: "$128.0K",
        distribution: [],
      },
      workplace: [
        { value: "92%", label: "Employed" },
        { value: "8%", label: "Unemployed" },
      ],
    },
  },
};
