import type { BrandLogoItem } from "../components/BrandLogoGrid";
import type { ShoppingCenterTenant } from "../data/shoppingCenters";
import type { Tenant } from "../types/tenant";

const SKIP_PATTERNS = [
  /ups store/i,
  /fedex/i,
  /\bbank\b/i,
  /chase\b/i,
  /wells fargo/i,
  /usps/i,
  /at&t/i,
  /verizon/i,
  /t-mobile/i,
  /dentist/i,
  /orthodont/i,
  /chiropract/i,
  /law firm/i,
  /attorney/i,
  /\bcpa\b/i,
  /accounting/i,
  /insurance/i,
  /real estate/i,
  /realty/i,
  /compass$/i,
  /coldwell/i,
  /keller williams/i,
  /property management/i,
  /\bmail\b/i,
  /laundry/i,
  /dry clean/i,
  /nail salon/i,
  /hair salon/i,
  /barber/i,
  /optometry/i,
  /veterinar/i,
  /pharmacy/i,
  /\bcvs\b/i,
  /walgreens/i,
  /salon/i,
  /spa\b/i,
  /clinic/i,
  /medical/i,
  /therapy/i,
  /pilates studio/i,
];

/** Recognizable national / retail / fashion brands (higher = better). */
const BRAND_PRIORITY = [
  "Apple",
  "Nike",
  "Adidas",
  "Lululemon",
  "Vuori",
  "Alo",
  "Sephora",
  "Nordstrom",
  "Zara",
  "H&M",
  "Uniqlo",
  "Aritzia",
  "Anthropologie",
  "Free People",
  "Madewell",
  "Reformation",
  "Everlane",
  "Warby Parker",
  "Aesop",
  "Le Labo",
  "Glossier",
  "Ralph Lauren",
  "Tommy Hilfiger",
  "Calvin Klein",
  "Levi",
  "Gap",
  "Banana Republic",
  "J.Crew",
  "Coach",
  "Michael Kors",
  "Kate Spade",
  "Tiffany",
  "Gucci",
  "Louis Vuitton",
  "Prada",
  "Saint Laurent",
  "Balenciaga",
  "Golden Goose",
  "On Running",
  "Allbirds",
  "Birkenstock",
  "UGG",
  "Tesla",
  "Sweetgreen",
  "Starbucks",
  "Blue Bottle",
  "Erewhon",
  "Whole Foods",
  "Trader Joe",
  "Equinox",
  "SoulCycle",
  "Barry's",
  "Solidcore",
  "Patagonia",
  "Arc'teryx",
  "The North Face",
  "Outdoor Voices",
  "Lululemon",
  "Aerie",
  "Victoria's Secret",
  "Bath & Body",
  "Ulta",
  "Mejuri",
  "Gorjana",
  "Kendra Scott",
  "Brilliant Earth",
  "West Elm",
  "Pottery Barn",
  "Williams Sonoma",
  "Crate & Barrel",
  "Restoration Hardware",
  "RH ",
  "CB2",
  "Design Within Reach",
  "Herman Miller",
  "Lululemon",
  "Alo Yoga",
  "Outdoor Voices",
  "Girlfriend Collective",
  "Spanx",
  "Skims",
  "Lululemon",
  "Canada Goose",
  "Moncler",
  "Stone Island",
  "Supreme",
  "Palace",
  "Stussy",
  "Carhartt",
  "Dickies",
  "Vans",
  "Converse",
  "New Balance",
  "Asics",
  "Hoka",
  "Salomon",
  "Arc'teryx",
  "Ray-Ban",
  "Oakley",
  "Sunglass Hut",
  "Crate",
  "Sur La Table",
  "Williams-Sonoma",
  "Lego",
  "Disney",
  "Microsoft",
  "Samsung",
  "Sony",
  "Bose",
  "Sonos",
  "GoPro",
  "Casio",
  "Rolex",
  "Omega",
  "Tag Heuer",
  "Cartier",
  "Hermès",
  "Chanel",
  "Dior",
  "Fendi",
  "Bottega",
  "Loewe",
  "Celine",
  "Balmain",
  "Off-White",
  "Fear of God",
  "Ami ",
  "APC",
  "A.P.C.",
  "Theory",
  "Vince",
  "James Perse",
  "Buck Mason",
  "Todd Snyder",
  "Suitsupply",
  "Rag & Bone",
  "Frame",
  "Citizens of Humanity",
  "AG Jeans",
  "Mother ",
  "Re/Done",
  "Agolde",
  "Outdoor Voices",
  "Outdoor Research",
  "REI",
  "Dick's",
  "Foot Locker",
  "Finish Line",
  "JD Sports",
  "Hibbett",
  "Champs",
  "Lululemon",
  "Alo",
  "Vuori",
  "Sweetgreen",
  "Cava",
  "Chipotle",
  "Shake Shack",
  "In-N-Out",
  "McDonald",
  "Starbucks",
  "Peet",
  "Intelligentsia",
  "Pressed",
  "Juice",
  "Sprinkles",
  "Milk Bar",
  "Salt & Straw",
  "Jeni",
  "Magnolia Bakery",
  "The Cheesecake Factory",
  "Nobu",
  "Catch",
  "Craig's",
  "Republique",
  "Bestia",
  "Gjelina",
  "Felix",
  "Jon & Vinny",
].map((name, i) => [name.toLowerCase(), 2000 - i] as const);

function displayName(tenantName: string): string {
  return tenantName
    .replace(/, Inc\.?$/i, "")
    .replace(/\s+LLC$/i, "")
    .replace(/\s+Corp\.?$/i, "")
    .trim();
}

function shouldSkip(tenantName: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(tenantName));
}

function brandScore(
  tenantName: string,
  logoDomain: string | null | undefined
): number {
  const lower = tenantName.toLowerCase();
  let score = 0;

  for (const [key, value] of BRAND_PRIORITY) {
    if (lower.includes(key.trim().toLowerCase())) {
      score = Math.max(score, value);
    }
  }

  if (logoDomain) score += 40;

  const clean = displayName(tenantName);
  // Prefer short recognizable names over long local shop names.
  if (clean.length <= 18) score += 15;
  if (clean.length <= 12) score += 10;
  if (clean.length > 28) score -= 40;
  if (/^\d/.test(clean)) score -= 80; // "310 …", "4100 Bar", etc.
  if (shouldSkip(tenantName)) score -= 500;

  return score;
}

interface BrandCandidate {
  name: string;
  domain: string;
  score: number;
}

function rankBrands(candidates: BrandCandidate[], limit = 10): BrandLogoItem[] {
  const byDomain = new Map<string, BrandCandidate>();

  for (const candidate of candidates) {
    const existing = byDomain.get(candidate.domain);
    if (!existing || candidate.score > existing.score) {
      byDomain.set(candidate.domain, candidate);
    }
  }

  return [...byDomain.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ name, domain }) => ({ name, domain }));
}

/** Top logo candidates from a shopping-center directory (logoDomain required). */
export function pickNotableBrandsFromCenterTenants(
  tenants: ShoppingCenterTenant[],
  limit = 10
): BrandLogoItem[] {
  const candidates: BrandCandidate[] = [];

  for (const tenant of tenants) {
    if (!tenant.logoDomain || shouldSkip(tenant.name)) continue;
    candidates.push({
      name: displayName(tenant.name),
      domain: tenant.logoDomain,
      score: brandScore(tenant.name, tenant.logoDomain),
    });
  }

  return rankBrands(candidates, limit);
}

/** Top logo candidates from high-street / district tenants (logoDomain required). */
export function pickNotableBrandsFromStreetTenants(
  tenants: Tenant[],
  limit = 10
): BrandLogoItem[] {
  const candidates: BrandCandidate[] = [];

  for (const tenant of tenants) {
    if (!tenant.logoDomain || shouldSkip(tenant.tenantName)) continue;
    candidates.push({
      name: displayName(tenant.tenantName),
      domain: tenant.logoDomain,
      score: brandScore(tenant.tenantName, tenant.logoDomain),
    });
  }

  return rankBrands(candidates, limit);
}
