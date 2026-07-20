/**
 * Suggests top 15 notable brands per active high street corridor.
 * Run after: npm run convert && npm run resolve-logos
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const CORRIDORS = [
  { slug: "abbot-kinney", dataKey: "Street - Abbot Kinney" },
  { slug: "la-brea", dataKey: "Street - La Brea" },
  { slug: "larchmont", dataKey: "Street - Larchmont" },
  { slug: "melrose", dataKey: "Street - Melrose" },
  { slug: "montana", dataKey: "Street - Montana" },
  { slug: "robertson", dataKey: "Street - Robertson" },
  { slug: "silver-lake", dataKey: "Street - Silver Lake" },
  { slug: "culver-city", dataKey: "Street - Culver City" },
  { slug: "downtown-manhattan-beach", dataKey: "Street - Manhattan Beach" },
];

const SKIP_PATTERNS = [
  /ups store/i,
  /fedex/i,
  /bank\b/i,
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
  /cpa\b/i,
  /accounting/i,
  /insurance/i,
  /real estate/i,
  /realty/i,
  /compass$/i,
  /coldwell/i,
  /keller williams/i,
  /property management/i,
  /mail\b/i,
  /laundry/i,
  /dry clean/i,
  /nail salon/i,
  /hair salon/i,
  /barber/i,
  /optometry/i,
  /veterinar/i,
  /pharmacy/i,
  /cvs\b/i,
  /walgreens/i,
];

/** Higher score = more likely to be a flagship/notable brand */
const BRAND_PRIORITY = new Map(
  [
    "Whole Foods", "Trader Joe's", "Erewhon", "Sweetgreen", "Starbucks",
    "Peet's Coffee", "Blue Bottle Coffee", "Intelligentsia", "Alfred Coffee",
    "Williams-Sonoma", "Nordstrom", "Sephora", "Apple", "Lululemon",
    "Vuori", "Warby Parker", "Aesop", "Glossier", "Reformation", "Madewell",
    "J.Crew", "Patagonia", "Adidas", "Nike", "Casper", "Away", "Drybar",
    "Bluemercury", "Kiehl's", "Benefit", "Splendid", "Free People",
    "Anthropologie", "Urban Outfitters", "Shake Shack", "CAVA", "Equinox",
    "CorePower Yoga", "Salt & Straw", "Jeni's Splendid Ice Cream",
    "Pressed Juicery", "Tender Greens", "Mendocino Farms", "Skechers",
    "Ralph Lauren", "Golden Goose", "Balmain", "Chloé", "A.P.C.",
    "Carhartt", "Stüssy", "Undefeated", "Arc'teryx", "Stone Island",
    "Buck Mason", "Everlane", "Le Labo", "Suit Supply", "Aviator Nation",
    "Vuori", "Erewhon Market", "Groundwork Coffee", "Go Get Em Tiger",
    "Bardonna", "Sweet Lady Jane", "The Shade Store", "Clare V",
    "R+D Kitchen", "Public School", "Culver City", "Nordstrom Local",
  ].map((name, i) => [name.toLowerCase(), 1000 - i])
);

function displayName(tenantName) {
  return tenantName
    .replace(/, Inc\.?$/i, "")
    .replace(/\s+LLC$/i, "")
    .replace(/\s+Corp\.?$/i, "")
    .trim();
}

function brandScore(tenantName, logoDomain) {
  const lower = tenantName.toLowerCase();
  let score = 0;

  for (const [key, value] of BRAND_PRIORITY) {
    if (lower.includes(key)) {
      score = Math.max(score, value);
    }
  }

  if (logoDomain) score += 50;

  // Prefer shorter, cleaner brand names
  const clean = displayName(tenantName);
  if (clean.length <= 20) score += 10;
  if (clean.length <= 12) score += 5;

  // Penalize very local/generic names
  if (SKIP_PATTERNS.some((p) => p.test(tenantName))) score -= 500;

  return score;
}

function shouldSkip(tenantName) {
  return SKIP_PATTERNS.some((p) => p.test(tenantName));
}

const { tenants } = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "public/data/tenants.json"), "utf8")
);

const byStreet = new Map();
for (const t of tenants) {
  if (!t.logoDomain || shouldSkip(t.tenantName)) continue;
  const list = byStreet.get(t.highStreet) ?? [];
  const existing = list.find((x) => x.domain === t.logoDomain);
  if (!existing) {
    list.push({
      tenantName: t.tenantName,
      name: displayName(t.tenantName),
      domain: t.logoDomain,
      score: brandScore(t.tenantName, t.logoDomain),
    });
  } else if (brandScore(t.tenantName, t.logoDomain) > existing.score) {
    existing.tenantName = t.tenantName;
    existing.name = displayName(t.tenantName);
    existing.score = brandScore(t.tenantName, t.logoDomain);
  }
  byStreet.set(t.highStreet, list);
}

const output = {};
for (const { slug, dataKey } of CORRIDORS) {
  const brands = (byStreet.get(dataKey) ?? [])
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 15)
    .map(({ name, domain }) => ({ name, domain }));
  output[slug] = brands;
}

console.log(JSON.stringify(output, null, 2));
