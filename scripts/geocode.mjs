/**
 * Batch-geocodes unique property addresses using Google Geocoding API.
 * Results are cached in public/data/geocode-cache.json and merged on convert.
 *
 * Prerequisites:
 *   1. Copy .env.example → .env
 *   2. Set GOOGLE_MAPS_API_KEY (enable Geocoding API in Cloud Console)
 *   3. npm run convert   (creates tenants.json from Excel)
 *
 * Usage:
 *   npm run geocode
 *   npm run geocode -- --limit 50
 *   npm run geocode -- --refresh-outliers   (re-geocode addresses outside SoCal)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildGeocodeUrl,
  isInSouthernCalifornia,
  pickBestGeocodeResult,
} from "./geocode-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const dataDir = path.join(projectRoot, "public/data");
const tenantsFile = path.join(dataDir, "tenants.json");
const cacheFile = path.join(dataDir, "geocode-cache.json");

function loadEnv() {
  const envPath = path.join(projectRoot, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const apiKey =
  process.env.GOOGLE_GEOCODING_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.VITE_GOOGLE_MAPS_API_KEY;

if (!apiKey || apiKey === "your_api_key_here") {
  console.error(
    "Missing API key. Set GOOGLE_GEOCODING_API_KEY or GOOGLE_MAPS_API_KEY in .env."
  );
  process.exit(1);
}

if (!fs.existsSync(tenantsFile)) {
  console.error("Run npm run convert first to create public/data/tenants.json");
  process.exit(1);
}

const limitArg = process.argv.indexOf("--limit");
const limit =
  limitArg !== -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const refreshOutliers = process.argv.includes("--refresh-outliers");

/** @type {Record<string, { lat: number, lng: number, locationType?: string }>} */
let cache = {};
if (fs.existsSync(cacheFile)) {
  cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
}

const dataset = JSON.parse(fs.readFileSync(tenantsFile, "utf8"));
const vacanciesFile = path.join(dataDir, "vacancies.json");
/** @type {string[]} */
const vacancyAddresses = fs.existsSync(vacanciesFile)
  ? JSON.parse(fs.readFileSync(vacanciesFile, "utf8")).vacancies
      .map((v) => v.address?.trim())
      .filter(Boolean)
  : [];

const uniqueAddresses = [
  ...new Set(
    [
      ...dataset.tenants.map((t) => t.address?.trim()).filter(Boolean),
      ...vacancyAddresses,
    ]
  ),
];

/** Corridor city hints so bare addresses ("333 3rd St") stay in the right town */
const CORRIDOR_CITIES = {
  "Street - Abbot Kinney": "Venice, CA",
  "Street - Arts District": "Los Angeles, CA",
  "Street - Broadway": "Los Angeles, CA",
  "Street - Colorado Blvd": "Pasadena, CA",
  "Street - Corona Del Mar": "Newport Beach, CA",
  "Street - Culver City": "Culver City, CA",
  "Street - Downtown Encinitas": "Encinitas, CA",
  "Street - Downtown Laguna Beach": "Laguna Beach, CA",
  "Street - Downtown San Diego": "San Diego, CA",
  "Street - Figueroa St": "Los Angeles, CA",
  "Street - La Brea": "Los Angeles, CA",
  "Street - Larchmont": "Los Angeles, CA",
  "Street - Liberty Station": "San Diego, CA",
  "Street - Manhattan Beach": "Manhattan Beach, CA",
  "Street - Melrose": "Los Angeles, CA",
  "Street - Montana": "Santa Monica, CA",
  "Street - Platform": "Culver City, CA",
  "Street - Robertson": "Los Angeles, CA",
  "Street - Rodeo": "Beverly Hills, CA",
  "Street - Seventeenth Street/West Cliff Drive": "Santa Cruz, CA",
  "Street - Silver Lake": "Los Angeles, CA",
  "Street - Sunset Blvd": "Los Angeles, CA",
  "Street - Third Street Promenade": "Santa Monica, CA",
  "Street - Ventura Blvd": "Los Angeles, CA",
};

/** address (lowercase) → corridor city hint */
const addressCityHints = new Map();
for (const t of dataset.tenants) {
  const addr = t.address?.trim().toLowerCase();
  const city = CORRIDOR_CITIES[t.highStreet];
  if (addr && city && !addressCityHints.has(addr)) {
    addressCityHints.set(addr, city);
  }
}

const pending = uniqueAddresses.filter((addr) => {
  const key = addr.toLowerCase();
  if (!cache[key]) return true;
  if (refreshOutliers && !isInSouthernCalifornia(cache[key].lat, cache[key].lng)) {
    return true;
  }
  return false;
});
const toGeocode = pending.slice(0, limit);

console.log(`Unique addresses: ${uniqueAddresses.length}`);
console.log(`Already cached: ${uniqueAddresses.length - pending.length}`);
console.log(`To geocode now: ${toGeocode.length}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocodeAddress(address) {
  // Anchor ambiguous bare addresses to their corridor's city
  const hint = addressCityHints.get(address.toLowerCase());
  const query =
    hint && !/,\s*[A-Za-z]{2,}/.test(address) ? `${address}, ${hint}` : address;
  const url = buildGeocodeUrl(query, apiKey);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results?.length) {
      const picked = pickBestGeocodeResult(data.results, address);
      if (picked) return picked;
      console.warn(`  ⚠ ${address}: no result in Southern California`);
      return null;
    }

    if (data.status === "OVER_QUERY_LIMIT") {
      throw new Error("OVER_QUERY_LIMIT — wait and retry, or increase quota");
    }

    if (data.status === "REQUEST_DENIED" && attempt < 3) {
      await sleep(400 * attempt);
      continue;
    }

    if (data.status === "REQUEST_DENIED") {
      console.warn(`  ⚠ ${address}: REQUEST_DENIED`);
      if (data.error_message) console.warn(`    ${data.error_message}`);
      return null;
    }

    console.warn(`  ⚠ ${address}: ${data.status}`);
    if (data.error_message) console.warn(`    ${data.error_message}`);
    return null;
  }

  return null;
}

let success = 0;
let failed = 0;

for (let i = 0; i < toGeocode.length; i++) {
  const address = toGeocode[i];
  const key = address.toLowerCase();

  try {
    const result = await geocodeAddress(address);
    if (result) {
      cache[key] = {
        lat: result.lat,
        lng: result.lng,
        locationType: result.locationType,
      };
      success++;
      const precision =
        result.locationType === "ROOFTOP" ? "✓" : `~${result.locationType}`;
      console.log(
        `[${i + 1}/${toGeocode.length}] ${precision} ${address} → ${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`
      );
    } else {
      failed++;
    }
  } catch (err) {
    console.error(err.message);
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
    process.exit(1);
  }

  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  await sleep(120);
}

console.log(`\nDone. Geocoded: ${success}, failed: ${failed}`);
console.log(`Cache: ${cacheFile}`);
console.log("Re-run: npm run convert");
