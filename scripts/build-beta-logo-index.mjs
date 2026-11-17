/**
 * Index assets/Beta LOGOS so the app can resolve a brand name to a file
 * without importing thousands of images (apostrophes in filenames break
 * Vite's import.meta.glob). Re-run after adding logos:
 *   node scripts/build-beta-logo-index.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("assets/Beta LOGOS");
const FOLDERS = ["Retail Logos", "Restaurant Logos"];
const EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif", ".gif"]);
const NOISE = new Set([
  "logo", "logos", "logotype", "wordmark", "primary", "vector", "official",
  "horizontal", "stacked", "seeklogo", "trademark", "rgb", "cmyk", "icon",
  "badge", "web", "final", "copy", "large", "small", "sm", "lg", "beta",
  "black", "dark", "white", "light", "transparent", "knockout", "reversed",
  "color", "colour", "lockup", "png", "jpg", "svg", "webp", "avif", "jpeg",
  "img", "image", "gray", "grey", "owler", "original", "pantone", "bg",
  "background",
]);
const VARIANT = new Set(["white", "light", "knockout", "reversed"]);

/** A white/light/knockout file of a brand, not a brand that starts with White. */
function isLightVariantFile(fileName) {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const tokens = stem
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const at = tokens.findIndex((token) => VARIANT.has(token));
  if (at <= 0) return false;
  const next = tokens[at + 1];
  if (next === "bg" || next === "background") return false;
  return tokens.slice(0, at).some((token) => token.length > 1 && !NOISE.has(token));
}

function normalizeBrandLabel(raw) {
  return raw
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(
      (word) =>
        word &&
        !NOISE.has(word) &&
        !/^\d+$/.test(word) &&
        !/^\d+x\d+$/.test(word) &&
        !/^[a-f0-9]{8,}$/.test(word)
    )
    .join(" ")
    .replace(/\b(inc|llc|ltd|corp|corporation|company|limited)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fileScore(fileName) {
  const name = fileName.toLowerCase();
  let score = 0;
  if (/dark|black|gray|grey/.test(name) && !/white|light|knockout/.test(name)) {
    score += 40;
  }
  if (/white|light|knockout|reversed/.test(name)) score -= 80;
  if (name.endsWith(".svg")) score += 8;
  else if (/\.(png|webp)$/.test(name)) score += 4;
  if (/beta\s*2018|\(\d+\)/.test(name)) score -= 6;
  score -= fileName.length / 400;
  return score;
}

const ranked = new Map();
function add(key, rel, score) {
  if (key.length < 3) return;
  const bucket = ranked.get(key) ?? new Map();
  const prev = bucket.get(rel);
  if (prev == null || score > prev) bucket.set(rel, score);
  ranked.set(key, bucket);
}

let files = 0;
for (const folder of FOLDERS) {
  const dir = path.join(ROOT, folder);
  for (const name of fs.readdirSync(dir)) {
    if (!EXTS.has(path.extname(name).toLowerCase())) continue;
    files += 1;
    if (isLightVariantFile(name)) continue;
    const key = normalizeBrandLabel(name);
    if (!key) continue;
    const rel = `${folder}/${name}`;
    const score = fileScore(name);
    add(key, rel, score);
    add(key.replace(/ /g, ""), rel, score);
  }
}

const index = {};
for (const [key, bucket] of ranked) {
  index[key] = [...bucket.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([rel]) => rel);
}

const out = "src/data/betaLogoIndex.json";
// Nested so Vite's JSON named-exports stay a single valid identifier.
fs.writeFileSync(out, JSON.stringify({ entries: index }));
console.log(`indexed ${files} files, ${Object.keys(index).length} keys -> ${out}`);
