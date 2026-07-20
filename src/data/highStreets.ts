import heroAbbotKinney from "@assets/abbot_kinney.webp";
import heroLaBrea from "@assets/La Brea Photos/La_Brea_Landing_Cover.jpg";
import heroLarchmont from "@assets/Larchmont Photos/Larchmont_Landing_Cover.png";
import heroMelrose from "@assets/Melrose Photos/melrose_hero.jpg";
import heroSilverlake from "@assets/Silverlake Photos/silverlake_hero.jpg";
import heroMalibuCountryMart from "@assets/Malibu Country Mart/malibu_country_mart_cover.jpg";
import heroMalibuVillage from "@assets/Malibu Village Photos/malibu_village_cover.jpg";
import heroSantaMonicaPlace from "@assets/Santa Monica Place Photos/santa_monica_cover.jpg";
import heroManhattanBeach from "@assets/Manhattan Beach Photos/manhattan_cover.jpg";
import heroCulverCity from "@assets/Culver City Photos/culver_cover.jpg";
import heroMontana from "@assets/Montana Photos/montana_cover.jpg";
import heroRobertson from "@assets/Robertson Photos/robertson_cover.jpg";
import heroSunsetStrip from "@assets/Sunset Strip Photos/sunset_strip_cover.jpg";

export type CorridorCategory =
  | "high-streets"
  | "shopping-districts"
  | "shopping-centers";

export interface HighStreetCorridor {
  slug: string;
  name: string;
  city: string;
  category: CorridorCategory;
  /** Matches `highStreet` in tenants.json — omitted when no data uploaded yet */
  dataKey?: string;
  heroImage?: string;
  /** CSS object-position for the hero crop (defaults to center). */
  heroObjectPosition?: string;
  active: boolean;
}

export const CATEGORY_LABELS: Record<CorridorCategory, string> = {
  "high-streets": "HIGH STREETS",
  "shopping-districts": "SHOPPING DISTRICTS",
  "shopping-centers": "SHOPPING CENTERS",
};

export const CATEGORY_ORDER: CorridorCategory[] = [
  "high-streets",
  "shopping-districts",
  "shopping-centers",
];

/** Sidebar list — add heroImage + active when ready for each corridor */
export const HIGH_STREET_CORRIDORS: HighStreetCorridor[] = [
  // ——— HIGH STREETS ———
  {
    slug: "abbot-kinney",
    name: "Abbot Kinney",
    city: "Venice, CA",
    category: "high-streets",
    dataKey: "Street - Abbot Kinney",
    heroImage: heroAbbotKinney,
    active: true,
  },
  {
    slug: "la-brea",
    name: "La Brea",
    city: "Los Angeles, CA",
    category: "high-streets",
    dataKey: "Street - La Brea",
    heroImage: heroLaBrea,
    active: true,
  },
  {
    slug: "larchmont",
    name: "Larchmont",
    city: "Los Angeles, CA",
    category: "high-streets",
    dataKey: "Street - Larchmont",
    heroImage: heroLarchmont,
    active: true,
  },
  {
    slug: "melrose",
    name: "Melrose",
    city: "Los Angeles, CA",
    category: "high-streets",
    dataKey: "Street - Melrose",
    heroImage: heroMelrose,
    active: true,
  },
  {
    slug: "montana",
    name: "Montana Ave",
    city: "Santa Monica, CA",
    category: "high-streets",
    dataKey: "Street - Montana",
    heroImage: heroMontana,
    active: true,
  },
  {
    slug: "robertson",
    name: "Robertson",
    city: "Los Angeles, CA",
    category: "high-streets",
    dataKey: "Street - Robertson",
    heroImage: heroRobertson,
    active: true,
  },
  {
    slug: "silver-lake",
    name: "Silverlake",
    city: "Los Angeles, CA",
    category: "high-streets",
    dataKey: "Street - Silver Lake",
    heroImage: heroSilverlake,
    active: true,
  },

  // ——— SHOPPING DISTRICTS ———
  {
    slug: "culver-city",
    name: "Culver City",
    city: "Culver City, CA",
    category: "shopping-districts",
    dataKey: "Street - Culver City",
    heroImage: heroCulverCity,
    active: true,
  },
  {
    slug: "downtown-manhattan-beach",
    name: "Downtown Manhattan Beach",
    city: "Manhattan Beach, CA",
    category: "shopping-districts",
    dataKey: "Street - Manhattan Beach",
    heroImage: heroManhattanBeach,
    active: true,
  },
  { slug: "downtown-la", name: "Downtown LA", city: "Los Angeles, CA", category: "shopping-districts", active: false },
  { slug: "old-town-pasadena", name: "Studio City", city: "Pasadena, CA", category: "shopping-districts", active: false },
  {
    slug: "sunset-strip",
    name: "Sunset Strip",
    city: "West Hollywood, CA",
    category: "shopping-districts",
    dataKey: "Street - Sunset Blvd",
    heroImage: heroSunsetStrip,
    active: true,
  },

  // ——— SHOPPING CENTERS (data coming later) ———
  { slug: "the-grove", name: "The Grove", city: "Los Angeles, CA", category: "shopping-centers", active: false },
  { slug: "westfield-century-city", name: "Westfield Century City", city: "Los Angeles, CA", category: "shopping-centers", active: false },
  { slug: "brentwood-country-mart", name: "Brentwood Country Mart", city: "Los Angeles, CA", category: "shopping-centers", active: false },
  { slug: "the-point", name: "The Point", city: "El Segundo, CA", category: "shopping-centers", active: false },
  {
    slug: "malibu-country-mart",
    name: "Malibu Country Mart",
    city: "Malibu, CA",
    category: "shopping-centers",
    heroImage: heroMalibuCountryMart,
    active: true,
  },
  {
    slug: "malibu-village",
    name: "Malibu Village",
    city: "Malibu, CA",
    category: "shopping-centers",
    heroImage: heroMalibuVillage,
    active: true,
  },
  {
    slug: "santa-monica-place",
    name: "Santa Monica Place",
    city: "Santa Monica, CA",
    category: "shopping-centers",
    heroImage: heroSantaMonicaPlace,
    active: true,
  },
  { slug: "palisades-village", name: "Sportsmen's Lodge", city: "Pacific Palisades, CA", category: "shopping-centers", active: false },
  { slug: "platform", name: "The Platform", city: "Culver City, CA", category: "shopping-centers", active: false },
];

/** Hero carousel — all high street corridors */
export const HERO_SLIDES = HIGH_STREET_CORRIDORS.filter(
  (c) => c.category === "high-streets"
);

export function getCorridorBySlug(slug: string): HighStreetCorridor | undefined {
  return HIGH_STREET_CORRIDORS.find((c) => c.slug === slug);
}

export { getCorridorDetail, ABBOT_KINNEY_DETAIL } from "./corridorDetails";
