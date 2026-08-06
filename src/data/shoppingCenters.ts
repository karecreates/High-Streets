import malibuCountryMartLogo from "@assets/Malibu Country Mart/malibu_country_mart.webp";
import brentwoodCountryMartLogo from "@assets/Brentwood_Countrymart/BrentwoodSince1948.webp";
import thePointLogo from "@assets/The Point Photos/ThePoint-header-logo.png";
import platformLogo from "@assets/The Platform Photos/Platform.webp";
import westfieldCenturyCityLogo from "@assets/Westfield Century City Photos/Westfield-Century-City-LOGO.webp";
import malibuVillageLogo from "@assets/Malibu Village Photos/Malibu+Logo.webp";
import santaMonicaPlaceLogo from "@assets/Santa Monica Place Photos/Santa-Monica-Place---Blue-Logo.webp";
import americanaAtBrandLogo from "@assets/Americana at Brand Photos/Americana-Logo-Vector.svg";
import theGroveLogo from "@assets/The Grove Photos/GAF_Logo_RGB_Charcoal.png";
import thePaseoLogo from "@assets/The Paseo Photos/465016768_1026507899486082_3310924949729474811_n.jpg";
import sportsmenLodgeLogo from "@assets/Sportsmens Lodge Photos/sportsmens_lodge_logo.png";
import oneColoradoLogo from "@assets/One Colorado Photos/One_Colorado_logo.svg";
import manhattanVillageLogo from "@assets/Manhattan Village Photos/Manhattan_Village_Logo.png";
import thePointSitePlan from "@assets/site_plans/the_point_site_plan.jpg";
import platformSitePlan from "@assets/site_plans/Platform_site_plan.webp";
import manhattanVillageSitePlan from "@assets/site_plans/manhattan_village_site_plan.pdf?url";
import brentwoodCountryMartSitePlan from "@assets/site_plans/brentwood_country_mart_site_plan.webp";
import shoppingCentersDataset from "./shopping-centers.json";
import type { ShoppingCenterLogoCrop } from "../utils/createShoppingCenterMarkerIcon";

interface ShoppingCentersDataset {
  centers: Array<{
    slug: string;
    centerName: string;
    tenants: ShoppingCenterTenant[];
    vacancies: ShoppingCenterVacancy[];
  }>;
}

export interface ShoppingCenterTenant {
  name: string;
  logoDomain: string | null;
  hasLogo: boolean;
  website: string | null;
  suite: string | null;
  unitStatus: string | null;
  spaceSf: string | null;
}

export interface ShoppingCenterVacancy {
  label: string;
  suite: string | null;
  spaceSf: string | null;
  spaceLabel: string | null;
  unitStatus: "Vacant";
}

export interface ShoppingCenter {
  slug: string;
  name: string;
  city: string;
  address: string;
  logo: string;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  lightLogoMarker?: boolean;
  /** Custom callout background (e.g. cream for dark-on-cream logos). */
  logoMarkerBg?: string;
  /** Crop empty artboard margins so the callout can be a tighter rectangle. */
  logoCrop?: ShoppingCenterLogoCrop;
  /**
   * Master-map logo direction relative to the true plot point.
   * Does not move coordinates — only which side the logo callout sits on.
   */
  masterMapLogoPlacement?: "above" | "below";
  /** Optional compact logo width override on the master map (px). */
  masterMapLogoWidth?: number;
  /**
   * When set, every tenant cell in the directory modal links here
   * instead of the individual tenant website (center retailer directory).
   */
  tenantDirectoryUrl?: string;
  /** Optional site plan image/PDF shown in a lightbox from the directory modal. */
  sitePlan?: string;
  /** Optional external site plan / directory map URL (opens in a new tab). */
  sitePlanUrl?: string;
  tenants: ShoppingCenterTenant[];
  vacancies: ShoppingCenterVacancy[];
}

interface ShoppingCenterMeta {
  slug: string;
  name: string;
  city: string;
  address: string;
  logo: string;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  lightLogoMarker?: boolean;
  logoMarkerBg?: string;
  logoCrop?: ShoppingCenterLogoCrop;
  masterMapLogoPlacement?: "above" | "below";
  masterMapLogoWidth?: number;
  tenantDirectoryUrl?: string;
  sitePlan?: string;
  sitePlanUrl?: string;
}

const CENTER_META: Record<string, ShoppingCenterMeta> = {
  "brentwood-country-mart": {
    slug: "brentwood-country-mart",
    name: "Brentwood Country Mart",
    city: "Los Angeles, CA",
    address: "225 26th St, Santa Monica, CA 90402",
    logo: brentwoodCountryMartLogo,
    mapCenter: { lat: 34.047694038862915, lng: -118.49045143346667 },
    mapZoom: 18,
    tenantDirectoryUrl: "https://www.brentwoodcountrymart.com/directory",
    sitePlan: brentwoodCountryMartSitePlan,
  },
  "malibu-country-mart": {
    slug: "malibu-country-mart",
    name: "Malibu Country Mart",
    city: "Malibu, CA",
    address: "3835 Cross Creek Rd, Malibu, CA 90265",
    logo: malibuCountryMartLogo,
    mapCenter: { lat: 34.03569204363302, lng: -118.68561638399662 },
    mapZoom: 18,
    // Opposite of Malibu Village — plot stays on mapCenter
    masterMapLogoPlacement: "above",
    tenantDirectoryUrl: "https://malibucountrymart.com/directory/",
  },
  "malibu-village": {
    slug: "malibu-village",
    name: "Malibu Village",
    city: "Malibu, CA",
    address: "3838 Cross Creek Rd, Malibu, CA 90265",
    logo: malibuVillageLogo,
    mapCenter: { lat: 34.03591217808638, lng: -118.68462972757658 },
    mapZoom: 18,
    // Hang below so it clears Country Mart — lat/lng unchanged
    masterMapLogoPlacement: "below",
    tenantDirectoryUrl: "https://www.malibuvillage.com/directory-1",
  },
  "santa-monica-place": {
    slug: "santa-monica-place",
    name: "Santa Monica Place",
    city: "Santa Monica, CA",
    address: "395 Santa Monica Pl, Santa Monica, CA 90401",
    logo: santaMonicaPlaceLogo,
    mapCenter: { lat: 34.013694718714774, lng: -118.49380813415459 },
    mapZoom: 18,
    logoMarkerBg: "#FFFFFF",
    // Wider than default compact (52) — wordmark was hard to read near 3rd St
    masterMapLogoWidth: 88,
    tenantDirectoryUrl: "https://www.santamonicaplace.com/shop",
    sitePlanUrl: "https://www.santamonicaplace.com/directory#/",
  },
  "the-point": {
    slug: "the-point",
    name: "The Point",
    city: "El Segundo, CA",
    address: "830 S Sepulveda Blvd, El Segundo, CA 90245",
    logo: thePointLogo,
    mapCenter: { lat: 33.90285063536709, lng: -118.39505288392672 },
    mapZoom: 18,
    lightLogoMarker: true,
    // Opposite of Manhattan Village — plot stays on mapCenter
    masterMapLogoPlacement: "above",
    tenantDirectoryUrl: "https://thepointsb.com/shop-dine-more/",
    sitePlan: thePointSitePlan,
  },
  platform: {
    slug: "platform",
    name: "Platform",
    city: "Culver City, CA",
    address: "8850 Washington Blvd, Culver City, CA 90232",
    logo: platformLogo,
    mapCenter: { lat: 34.0272792218618, lng: -118.38773539031313 },
    mapZoom: 18,
    tenantDirectoryUrl: "https://platformlosangeles.com/pages/visit",
    sitePlan: platformSitePlan,
  },
  "westfield-century-city": {
    slug: "westfield-century-city",
    name: "Westfield Century City",
    city: "Los Angeles, CA",
    address: "10250 Santa Monica Blvd, Los Angeles, CA 90067",
    logo: westfieldCenturyCityLogo,
    mapCenter: { lat: 34.05876376913148, lng: -118.41905072261834 },
    mapZoom: 18,
    tenantDirectoryUrl:
      "https://www.westfield.com/en/united-states/centurycity/retailers",
  },
  "americana-at-brand": {
    slug: "americana-at-brand",
    name: "Americana at Brand",
    city: "Glendale, CA",
    address: "889 Americana Way, Glendale, CA 91210",
    logo: americanaAtBrandLogo,
    mapCenter: { lat: 34.14491618800622, lng: -118.25650632000237 },
    mapZoom: 18,
    tenantDirectoryUrl: "https://americanaatbrand.com/shopping/",
  },
  "the-grove": {
    slug: "the-grove",
    name: "The Grove",
    city: "Los Angeles, CA",
    address: "189 The Grove Dr, Los Angeles, CA 90036",
    logo: theGroveLogo,
    mapCenter: { lat: 34.07198357761211, lng: -118.35748715851972 },
    mapZoom: 18,
    // Smaller than default compact (52) — square artboard still reads clearly
    masterMapLogoWidth: 28,
    tenantDirectoryUrl: "https://thegrovela.com/shopping/",
  },
  "the-paseo": {
    slug: "the-paseo",
    name: "The Paseo",
    city: "Pasadena, CA",
    address: "300 E Colorado Blvd, Pasadena, CA 91101",
    logo: thePaseoLogo,
    mapCenter: { lat: 34.14585, lng: -118.14355 },
    mapZoom: 18,
    logoMarkerBg: "#F7F1E5",
    // Square artboard has heavy cream padding — crop to a horizontal wordmark
    logoCrop: { top: 0.28, bottom: 0.28 },
    // Hang below so it clears One Colorado — lat/lng unchanged
    masterMapLogoPlacement: "below",
    tenantDirectoryUrl: "https://www.thepaseopasadena.com/shops",
    sitePlanUrl: "https://www.thepaseopasadena.com/shops",
  },
  "sportsmen-lodge": {
    slug: "sportsmen-lodge",
    name: "Sportsmen's Lodge",
    city: "Studio City, CA",
    address: "12833 Ventura Blvd, Studio City, CA 91604",
    logo: sportsmenLodgeLogo,
    mapCenter: { lat: 34.14631696173862, lng: -118.4129050581419 },
    mapZoom: 18,
    // White callout — logo is white wordmark on black artboard
    logoMarkerBg: "#FFFFFF",
    tenantDirectoryUrl: "https://www.shopsatsportsmenslodge.com/shopping/",
  },
  "one-colorado": {
    slug: "one-colorado",
    name: "One Colorado",
    city: "Pasadena, CA",
    address: "41 Hugus Alley, Pasadena, CA 91103",
    logo: oneColoradoLogo,
    mapCenter: { lat: 34.14666478402269, lng: -118.15138820680242 },
    mapZoom: 18,
    logoMarkerBg: "#FFFFFF",
    // Stay above — opposite of The Paseo; lat/lng unchanged
    masterMapLogoPlacement: "above",
    tenantDirectoryUrl: "https://www.onecolorado.com/directory/",
    sitePlanUrl: "https://www.onecolorado.com/directory/",
  },
  "manhattan-village": {
    slug: "manhattan-village",
    name: "Manhattan Village",
    city: "Manhattan Beach, CA",
    address: "3200 Sepulveda Blvd, Manhattan Beach, CA 90266",
    logo: manhattanVillageLogo,
    mapCenter: { lat: 33.89856223195897, lng: -118.39335182633175 },
    mapZoom: 17,
    logoMarkerBg: "#FFFFFF",
    // Hang below so it clears The Point — lat/lng unchanged
    masterMapLogoPlacement: "below",
    tenantDirectoryUrl: "https://www.shopmanhattanvillage.com/directory/",
    sitePlan: manhattanVillageSitePlan,
  },
};

function buildShoppingCenters(): Record<string, ShoppingCenter> {
  const result: Record<string, ShoppingCenter> = {};
  const dataset = shoppingCentersDataset as ShoppingCentersDataset;

  for (const center of dataset.centers) {
    const meta = CENTER_META[center.slug];
    if (!meta) continue;

    result[center.slug] = {
      ...meta,
      tenants: center.tenants,
      vacancies: center.vacancies ?? [],
    };
  }

  return result;
}

export const SHOPPING_CENTERS = buildShoppingCenters();

export function getShoppingCenter(slug: string): ShoppingCenter | undefined {
  return SHOPPING_CENTERS[slug];
}

export function isShoppingCenterSlug(slug: string): boolean {
  return slug in SHOPPING_CENTERS;
}

export function getAllShoppingCenters(): ShoppingCenter[] {
  return Object.values(SHOPPING_CENTERS);
}
