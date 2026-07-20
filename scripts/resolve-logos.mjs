/**
 * Resolves each tenant account name to a VERIFIED brand domain using logo.dev's
 * Brand Search API, then uses that domain's logo (exact — no fuzzy guessing).
 *
 * Why: logo.dev's image `/name/` endpoint fuzzy-matches and returns wrong logos
 * even for exact brand names (e.g. "Trader Joe's" → an unrelated mark). The
 * Brand Search API returns real brand records ({ name, domain }); we accept a
 * match only when the returned brand name equals the account name (or is a
 * clean word-prefix, e.g. "Erewhon" ⊂ "Erewhon Market"). Everything else → text.
 *
 * For names the search API can't resolve, we derive a candidate domain from the
 * name (e.g. "Chamberlain Coffee" → chamberlaincoffee.com) and ACCEPT it only if
 * logo.dev actually has a real logo for that domain (verified via the image
 * endpoint with fallback=404). Derivation is limited to multi-word names to
 * avoid single-word collisions (e.g. "The Dig" → thedig.com).
 *
 * Output: public/data/logo-cache.json  { "<account name>": "<domain>" | null }
 * convert-xlsx.mjs stamps `logoDomain` + `hasLogo` onto each tenant.
 *
 * Usage:
 *   npm run resolve-logos
 *   npm run resolve-logos -- --refresh    (ignore cached search results)
 *   npm run resolve-logos -- --no-derive  (skip the domain-derivation fallback)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const dataDir = path.join(projectRoot, "public/data");
const tenantsFile = path.join(dataDir, "tenants.json");
const cacheFile = path.join(dataDir, "logo-cache.json");
const searchCacheFile = path.join(dataDir, "logo-search-cache.json");
const derivedCacheFile = path.join(dataDir, "logo-derived-cache.json");
const overridesFile = path.join(dataDir, "logo-overrides.json");

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

const secret = process.env.LOGO_DEV_SECRET?.trim();
if (!secret || !secret.startsWith("sk_")) {
  console.error(
    "Missing LOGO_DEV_SECRET (secret key, starts with sk_) in .env — required for the Brand Search API."
  );
  process.exit(1);
}
if (!fs.existsSync(tenantsFile)) {
  console.error("Run npm run convert first to create public/data/tenants.json");
  process.exit(1);
}

const refresh = process.argv.includes("--refresh");
const skipDerive = process.argv.includes("--no-derive");

const pubToken = process.env.VITE_LOGO_DEV_TOKEN?.trim();

/** logo.dev logos known to be generic placeholders — never accept these. */
const GENERIC_LOGO_HASHES = new Set([
  "29c532edf99d", // wordpress.com / .org mark
  "5d9618146861", // wordpress (dark)
]);

const STOP_WORDS = new Set([
  "llc",
  "inc",
  "incorporated",
  "corp",
  "corporation",
  "ltd",
  "the",
  "company",
]);

/** Normalize a brand/account name into comparable tokens. */
function tokenize(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOP_WORDS.has(w));
}

/** First label of a domain, alphanumeric only: "rag-bone.com" → "ragbone". */
function domainRoot(domain) {
  return String(domain ?? "")
    .split("/")[0]
    .replace(/^www\./i, "")
    .split(".")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * How well a search result matches the account name.
 *   "name-exact"   → result name tokens identical to the query
 *   "domain-exact" → result domain root equals the query with spaces removed
 *   "name-prefix"  → shorter token list is a leading prefix of the longer one
 *                    (only trusted for multi-word queries; e.g. "Erewhon
 *                    Market" ⊃ "Erewhon", "Omnium Entertainment" ⊂ "Omnium
 *                    Entertainment Group")
 *   false          → not a confident match
 */
function matchStrength(queryTokens, result) {
  const nameTokens = tokenize(result?.name);
  const q = queryTokens.join(" ");
  const n = nameTokens.join(" ");
  if (n && q === n) return "name-exact";
  if (domainRoot(result?.domain) === queryTokens.join("")) return "domain-exact";
  if (queryTokens.length > 1 && nameTokens.length) {
    const [short, long] =
      queryTokens.length <= nameTokens.length
        ? [queryTokens, nameTokens]
        : [nameTokens, queryTokens];
    if (long.slice(0, short.length).join(" ") === short.join(" ")) {
      return "name-prefix";
    }
  }
  return false;
}

/** Name concatenated with no separators, keeping stop-words: "thedig". */
function nameConcatRaw(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Pick the verified domain for an account name from ranked search results.
 * Ranking is authoritative, so we trust the TOP result whenever it matches by
 * name or domain root. We also accept ANY result (top few) whose domain root IS
 * the tenant name (e.g. "All'antico Vinaio" → allanticovinaio.com) — the domain
 * literally being the name is high confidence regardless of the brand label.
 * The name+domain double-gate avoids traps like "Madewell" → madewellarchitects.
 */
function pickDomain(accountName, results) {
  if (!Array.isArray(results) || !results.length) return null;
  const queryTokens = tokenize(accountName);
  if (!queryTokens.length) return null;

  const roots = new Set([queryTokens.join(""), nameConcatRaw(accountName)]);

  const top = results[0];
  if (top?.domain && matchStrength(queryTokens, top)) return top.domain;

  for (const r of results.slice(0, 6)) {
    if (r?.domain && roots.has(domainRoot(r.domain))) return r.domain;
  }

  for (const r of results.slice(1, 5)) {
    if (
      r?.domain &&
      matchStrength(queryTokens, r) === "name-exact" &&
      roots.has(domainRoot(r.domain))
    ) {
      return r.domain;
    }
  }
  return null;
}

const dataset = JSON.parse(fs.readFileSync(tenantsFile, "utf8"));
const shoppingCentersFile = path.join(projectRoot, "src/data/shopping-centers.json");
const shoppingCenterNames = [];
if (fs.existsSync(shoppingCentersFile)) {
  const shoppingCenters = JSON.parse(fs.readFileSync(shoppingCentersFile, "utf8"));
  for (const center of shoppingCenters.centers ?? []) {
    for (const tenant of center.tenants ?? []) {
      const name = (tenant.name ?? "").trim();
      if (name) shoppingCenterNames.push(name);
    }
  }
}

const names = [
  ...new Set(
    [
      ...dataset.tenants.map((t) => (t.tenantName ?? "").trim()),
      ...shoppingCenterNames,
    ].filter((n) => n && n.toLowerCase() !== "(unnamed tenant)")
  ),
];

/** name -> raw search results (array) from a previous run */
let searchCache = {};
if (!refresh && fs.existsSync(searchCacheFile)) {
  searchCache = JSON.parse(fs.readFileSync(searchCacheFile, "utf8"));
}

const pending = names.filter((n) => !(n in searchCache));
console.log(`Unique names: ${names.length}`);
console.log(`Already searched: ${names.length - pending.length}`);
console.log(`To search now: ${pending.length}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(name) {
  const url = `https://api.logo.dev/search?q=${encodeURIComponent(name)}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(500 * attempt);
        continue;
      }
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      await sleep(500 * attempt);
    }
  }
  return [];
}

const CONCURRENCY = 8;
let done = 0;

async function worker(queue) {
  while (queue.length) {
    const name = queue.pop();
    searchCache[name] = await search(name);
    done++;
    if (done % 100 === 0) {
      console.log(`  searched ${done}/${pending.length}`);
      fs.writeFileSync(searchCacheFile, JSON.stringify(searchCache, null, 2));
    }
  }
}

const queue = [...pending];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () =>
    worker(queue)
  )
);
fs.writeFileSync(searchCacheFile, JSON.stringify(searchCache, null, 2));

/**
 * Manual corrections that ALWAYS win over auto-resolution. Use for ambiguous
 * names where the search API's top brand is the wrong company (e.g. "LOQUI" the
 * LA taco chain vs an unrelated "Loqui"). Set a domain to force that logo, or
 * null/"" to force text. Edit public/data/logo-overrides.json.
 * @type {Record<string, string | null>}
 */
let overrides = {};
if (fs.existsSync(overridesFile)) {
  overrides = JSON.parse(fs.readFileSync(overridesFile, "utf8"));
}

/** name -> domain | null (Brand Search pass) */
const cache = {};
for (const name of names) {
  cache[name] = pickDomain(name, searchCache[name]);
}

// ── Domain-derivation fallback ──────────────────────────────────────────────
// For names the search couldn't resolve, guess a domain from the name and keep
// it only if logo.dev actually has a real (non-generic) logo for it.
let derivedCount = 0;
if (!skipDerive) {
  if (!pubToken) {
    console.warn(
      "Skipping derivation: VITE_LOGO_DEV_TOKEN (publishable pk_ key) not set in .env."
    );
  } else {
    /** domain -> { status, sha1 } */
    let derivedCache = {};
    if (!refresh && fs.existsSync(derivedCacheFile)) {
      derivedCache = JSON.parse(fs.readFileSync(derivedCacheFile, "utf8"));
    }

    function candidateDomains(name) {
      const t = tokenize(name);
      if (t.length < 2) return []; // multi-word only — avoids single-word collisions
      const joined = t.join("");
      const hyphen = t.join("-");
      return [`${joined}.com`, `${hyphen}.com`];
    }

    async function verifyDomain(domain) {
      if (domain in derivedCache) return derivedCache[domain];
      const params = new URLSearchParams({
        token: pubToken,
        format: "png",
        size: "80",
        fallback: "404",
      });
      let result = { status: 0, sha1: null };
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(
            `https://img.logo.dev/${encodeURIComponent(domain)}?${params}`
          );
          if (res.status === 429 || res.status >= 500) {
            await sleep(400 * attempt);
            continue;
          }
          if (res.status === 404) {
            result = { status: 404, sha1: null };
            break;
          }
          const buf = Buffer.from(await res.arrayBuffer());
          const type = res.headers.get("content-type") ?? "";
          if (!res.ok || !type.startsWith("image/")) {
            result = { status: res.status, sha1: null };
            break;
          }
          result = {
            status: 200,
            sha1: crypto.createHash("sha1").update(buf).digest("hex").slice(0, 12),
          };
          break;
        } catch {
          await sleep(400 * attempt);
        }
      }
      derivedCache[domain] = result;
      return result;
    }

    const targets = names.filter(
      (n) => !cache[n] && candidateDomains(n).length
    );
    console.log(`\nDeriving domains for ${targets.length} unresolved names…`);

    let processed = 0;
    async function deriveWorker(queue) {
      while (queue.length) {
        const name = queue.pop();
        for (const domain of candidateDomains(name)) {
          const { status, sha1 } = await verifyDomain(domain);
          if (status === 200 && sha1 && !GENERIC_LOGO_HASHES.has(sha1)) {
            cache[name] = domain;
            break;
          }
        }
        processed++;
        if (processed % 100 === 0) {
          console.log(`  derived ${processed}/${targets.length}`);
          fs.writeFileSync(derivedCacheFile, JSON.stringify(derivedCache, null, 2));
        }
      }
    }

    const queue = [...targets];
    await Promise.all(
      Array.from({ length: Math.min(10, queue.length) }, () =>
        deriveWorker(queue)
      )
    );
    fs.writeFileSync(derivedCacheFile, JSON.stringify(derivedCache, null, 2));

    // Reject any derived logo that's shared across many names (generic art).
    const sharedCounts = new Map();
    for (const name of targets) {
      const d = cache[name];
      const sha1 = d ? derivedCache[d]?.sha1 : null;
      if (sha1) sharedCounts.set(sha1, (sharedCounts.get(sha1) ?? 0) + 1);
    }
    for (const name of targets) {
      const d = cache[name];
      const sha1 = d ? derivedCache[d]?.sha1 : null;
      if (sha1 && sharedCounts.get(sha1) >= 4) cache[name] = null;
    }

    derivedCount = targets.filter((n) => cache[n]).length;
  }
}

// ── Manual overrides win over everything ────────────────────────────────────
let overridden = 0;
for (const name of names) {
  if (Object.prototype.hasOwnProperty.call(overrides, name)) {
    cache[name] = overrides[name] || null;
    overridden++;
  }
}

const matched = names.filter((n) => cache[n]).length;

fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

console.log(`\nResolved to a verified domain: ${matched} / ${names.length}`);
console.log(`  via domain derivation: ${derivedCount}`);
console.log(`No confident match (→ text): ${names.length - matched}`);
console.log(`Manual overrides applied: ${overridden}`);
console.log(`\nWrote ${cacheFile}`);
console.log("Re-run: npm run convert  (stamps logoDomain onto tenants)");
console.log("       npm run convert:shopping-centers  (stamps logoDomain onto shopping centers)");
