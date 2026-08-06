/**
 * Re-geocodes specific property names that Google can't resolve from the CoStar
 * label alone (landmark buildings fall back to the state centroid).
 *
 * Usage: node scripts/fix-geocodes.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const cacheFile = path.join(projectRoot, "public/data/geocode-cache.json");

/** Cache key (lowercased property name) → precise query for Google. */
const QUERY_BY_ADDRESS = {
  "city national plaza retail":
    "City National Plaza, 505 S Flower St, Los Angeles, CA 90071",
  "the westin bonaventure hotel & suites":
    "404 S Figueroa St, Los Angeles, CA 90071",
  "215 7th street": "215 W 7th St, Los Angeles, CA 90014",
  "1649-1831 westcliff dr - westcliff court":
    "1649 Westcliff Dr, Newport Beach, CA 92660",
};

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
  console.error("Missing API key in .env");
  process.exit(1);
}

const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));

for (const [cacheKey, query] of Object.entries(QUERY_BY_ADDRESS)) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  const body = await response.json();
  const location = body.results?.[0]?.geometry?.location;

  if (!location) {
    console.warn(`✗ ${cacheKey} (${body.status})`);
    continue;
  }

  cache[cacheKey] = { lat: location.lat, lng: location.lng };
  console.log(`✓ ${cacheKey} → ${location.lat}, ${location.lng}`);
}

fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
console.log(`\nUpdated ${cacheFile}`);
