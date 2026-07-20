import malibuCountryMartLogo from "@assets/Malibu Country Mart/malibu_country_mart.webp";
import malibuVillageLogo from "@assets/Malibu Village Photos/Malibu+Logo.webp";
import santaMonicaPlaceLogo from "@assets/Santa Monica Place Photos/Santa-Monica-Place---Blue-Logo.webp";
import shoppingCentersDataset from "./shopping-centers.json";

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
}

const CENTER_META: Record<string, ShoppingCenterMeta> = {
  "malibu-country-mart": {
    slug: "malibu-country-mart",
    name: "Malibu Country Mart",
    city: "Malibu, CA",
    address: "3835 Cross Creek Rd, Malibu, CA 90265",
    logo: malibuCountryMartLogo,
    mapCenter: { lat: 34.03569204363302, lng: -118.68561638399662 },
    mapZoom: 18,
  },
  "malibu-village": {
    slug: "malibu-village",
    name: "Malibu Village",
    city: "Malibu, CA",
    address: "3838 Cross Creek Rd, Malibu, CA 90265",
    logo: malibuVillageLogo,
    mapCenter: { lat: 34.03591217808638, lng: -118.68462972757658 },
    mapZoom: 18,
  },
  "santa-monica-place": {
    slug: "santa-monica-place",
    name: "Santa Monica Place",
    city: "Santa Monica, CA",
    address: "395 Santa Monica Pl, Santa Monica, CA 90401",
    logo: santaMonicaPlaceLogo,
    mapCenter: { lat: 34.013694718714774, lng: -118.49380813415459 },
    mapZoom: 18,
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
