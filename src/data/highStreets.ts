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
import heroBrentwoodCountryMart from "@assets/Brentwood_Countrymart/Brentwood_Cover.jpg";
import heroThePoint from "@assets/The Point Photos/The_Point_Cover.jpg";
import heroPlatform from "@assets/The Platform Photos/The_Platform_Cover.jpg";
import heroWestfieldCenturyCity from "@assets/Westfield Century City Photos/Westfield_Century_City_Cover.jpg";
import heroThirdStreetPromenade from "@assets/Third Street Promenade Photos/Third_Street_Promenade_Cover.jpg";
import heroOldTownPasadena from "@assets/Old Town Pasadena Photos/Old_Town_Pasadena_Cover.jpg";
import heroAmericanaAtBrand from "@assets/Americana at Brand Photos/Americana_at_Brand_Cover.jpg";
import heroTheGrove from "@assets/The Grove Photos/The_Grove_Cover.jpg";
import heroThePaseo from "@assets/The Paseo Photos/The_Paseo_Cover.jpg";
import heroStudioCity from "@assets/Studio City Photos/Studio_Cover.jpg";
import heroSportsmenLodge from "@assets/Sportsmens Lodge Photos/Sportsmens_Lodge_Cover.jpg";
import heroOneColorado from "@assets/One Colorado Photos/One_Colorado_Cover.jpg";
import heroManhattanVillage from "@assets/Manhattan Village Photos/Manhattan_Village_Cover.jpg";
import heroLaArtsDistrict from "@assets/La Arts District Photos/LA_Arts_Cover_New.avif";
import heroGoldenTriangle from "@assets/Golden Traingle Photos/golden_triangle_cover.jpg";
import heroDowntownLa from "@assets/Downtown LA Photos/downtown_cover.jpeg";

export type CorridorCategory = "high-streets" | "shopping-centers";

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
  /** Sidebar group when it differs from `category` (which drives routing). */
  sidebarGroup?: CorridorCategory;
  /** Sidebar nesting depth under the preceding corridor. */
  sidebarIndent?: 1 | 2;
  active: boolean;
}

/** Sidebar group for a corridor — falls back to its routing category. */
export function getSidebarGroup(corridor: HighStreetCorridor): CorridorCategory {
  return corridor.sidebarGroup ?? corridor.category;
}

export const CATEGORY_LABELS: Record<CorridorCategory, string> = {
  "high-streets": "HIGH STREETS",
  "shopping-centers": "SHOPPING CENTERS",
};

export const CATEGORY_ORDER: CorridorCategory[] = [
  "high-streets",
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
  {
    slug: "third-street-promenade",
    name: "Third Street Promenade",
    city: "Santa Monica, CA",
    category: "high-streets",
    dataKey: "Street - Third Street Promenade",
    heroImage: heroThirdStreetPromenade,
    active: true,
  },
  {
    slug: "studio-city",
    name: "Studio City",
    city: "Studio City, CA",
    category: "high-streets",
    dataKey: "Street - Ventura Blvd",
    heroImage: heroStudioCity,
    active: true,
  },
  {
    slug: "la-arts-district",
    name: "LA Arts District",
    city: "Los Angeles, CA",
    category: "high-streets",
    dataKey: "Street - Arts District",
    heroImage: heroLaArtsDistrict,
    active: true,
  },
  {
    slug: "golden-triangle",
    name: "Golden Triangle",
    city: "Beverly Hills, CA",
    category: "high-streets",
    dataKey: "Street - Rodeo",
    heroImage: heroGoldenTriangle,
    active: true,
  },
  {
    slug: "downtown-la",
    name: "Downtown LA",
    city: "Los Angeles, CA",
    category: "high-streets",
    dataKey: "Street - Figueroa St",
    heroImage: heroDowntownLa,
    active: true,
  },

  {
    slug: "old-town-pasadena",
    name: "Old Town Pasadena",
    city: "Pasadena, CA",
    category: "high-streets",
    dataKey: "Street - Colorado Blvd",
    heroImage: heroOldTownPasadena,
    active: true,
  },
  {
    slug: "one-colorado",
    name: "One Colorado",
    city: "Pasadena, CA",
    category: "shopping-centers",
    // Broader Old Pasadena corridor dataset (same source as Old Town Pasadena)
    dataKey: "Street - Colorado Blvd",
    heroImage: heroOneColorado,
    sidebarGroup: "high-streets",
    sidebarIndent: 1,
    active: true,
  },
  {
    slug: "the-paseo",
    name: "The Paseo",
    city: "Pasadena, CA",
    category: "shopping-centers",
    heroImage: heroThePaseo,
    sidebarGroup: "high-streets",
    sidebarIndent: 1,
    active: true,
  },
  {
    slug: "culver-city",
    name: "Culver City",
    city: "Culver City, CA",
    category: "high-streets",
    dataKey: "Street - Culver City",
    heroImage: heroCulverCity,
    active: true,
  },
  {
    slug: "downtown-manhattan-beach",
    name: "Manhattan Beach",
    city: "Manhattan Beach, CA",
    category: "high-streets",
    dataKey: "Street - Manhattan Beach",
    heroImage: heroManhattanBeach,
    active: true,
  },
  {
    slug: "sunset-strip",
    name: "Sunset Strip",
    city: "West Hollywood, CA",
    category: "high-streets",
    dataKey: "Street - Sunset Blvd",
    heroImage: heroSunsetStrip,
    active: true,
  },

  // ——— SHOPPING CENTERS ———
  {
    slug: "americana-at-brand",
    name: "Americana at Brand",
    city: "Glendale, CA",
    category: "shopping-centers",
    heroImage: heroAmericanaAtBrand,
    active: true,
  },
  {
    slug: "brentwood-country-mart",
    name: "Brentwood Country Mart",
    city: "Los Angeles, CA",
    category: "shopping-centers",
    heroImage: heroBrentwoodCountryMart,
    active: true,
  },
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
    slug: "manhattan-village",
    name: "Manhattan Village",
    city: "Manhattan Beach, CA",
    category: "shopping-centers",
    heroImage: heroManhattanVillage,
    active: true,
  },
  {
    slug: "platform",
    name: "Platform",
    city: "Culver City, CA",
    category: "shopping-centers",
    heroImage: heroPlatform,
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
  {
    slug: "sportsmen-lodge",
    name: "Sportsmen's Lodge",
    city: "Studio City, CA",
    category: "shopping-centers",
    heroImage: heroSportsmenLodge,
    active: true,
  },
  {
    slug: "the-grove",
    name: "The Grove",
    city: "Los Angeles, CA",
    category: "shopping-centers",
    heroImage: heroTheGrove,
    active: true,
  },
  {
    slug: "the-point",
    name: "The Point",
    city: "El Segundo, CA",
    category: "shopping-centers",
    heroImage: heroThePoint,
    active: true,
  },
  {
    slug: "westfield-century-city",
    name: "Westfield Century City",
    city: "Los Angeles, CA",
    category: "shopping-centers",
    heroImage: heroWestfieldCenturyCity,
    active: true,
  },
];

/** Hero carousel — all active corridors with hero art, in category order */
export const HERO_SLIDES = CATEGORY_ORDER.flatMap((category) =>
  HIGH_STREET_CORRIDORS.filter(
    (c) => c.category === category && c.active && Boolean(c.heroImage)
  )
);

export function getCorridorBySlug(slug: string): HighStreetCorridor | undefined {
  return HIGH_STREET_CORRIDORS.find((c) => c.slug === slug);
}

export { getCorridorDetail, ABBOT_KINNEY_DETAIL } from "./corridorDetails";
