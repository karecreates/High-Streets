/**
 * Disk cache for booklet logo captures.
 *
 * Street, overview, and shopping-center grabs are large base64 payloads.
 * They are written one at a time so a full 91-page export never holds every
 * image in a single request, and a later run can skip work that already
 * succeeded. The cache is wiped when tenant, logo, or layout files change
 * so a PDF cannot reuse stale artwork.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CACHE_DIR = path.resolve("tmp/booklet-captures");
const KINDS = new Set(["overview", "street-map", "center-map"]);

const FINGERPRINT_FILES = [
  "public/data/tenants.json",
  "public/data/logo-overrides.json",
  "public/data/logo-cache.json",
  "public/data/vacancies.json",
  "src/data/shopping-centers.json",
  "src/data/majorTenants.ts",
  "src/data/corridorDetails.ts",
  "src/data/textOnlyLayout.ts",
  "src/styles/playbook.css",
  "src/components/PlacerInsights.tsx",
  "src/pages/StreetDetailPage.tsx",
];

/** @type {{ phase: string, current: number, total: number, label: string, failures: string[] }} */
let progress = {
  phase: "idle",
  current: 0,
  total: 0,
  label: "",
  failures: [],
};

function manifestPath() {
  return path.join(CACHE_DIR, "manifest.json");
}

export function captureFingerprint() {
  const hash = crypto.createHash("sha1");
  for (const rel of FINGERPRINT_FILES) {
    const abs = path.resolve(rel);
    if (!fs.existsSync(abs)) {
      hash.update(`${rel}:missing`);
      continue;
    }
    const stat = fs.statSync(abs);
    hash.update(`${rel}:${stat.size}:${Math.round(stat.mtimeMs)}`);
  }
  return hash.digest("hex");
}

function readManifest() {
  const file = manifestPath();
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/** Drops the cache when source data has changed. */
export function prepareCaptureCache() {
  const fingerprint = captureFingerprint();
  const manifest = readManifest();
  if (!manifest || manifest.fingerprint !== fingerprint) {
    fs.rmSync(CACHE_DIR, { recursive: true, force: true });
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(
      manifestPath(),
      JSON.stringify({ fingerprint, savedAt: new Date().toISOString() })
    );
  } else if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  return fingerprint;
}

function safeSlug(slug) {
  if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("Invalid capture slug.");
  }
  return slug;
}

function capturePath(kind, slug) {
  if (!KINDS.has(kind)) throw new Error("Invalid capture kind.");
  return path.join(CACHE_DIR, kind, `${safeSlug(slug)}.json`);
}

export function writeCapture(kind, slug, payload) {
  prepareCaptureCache();
  const file = capturePath(kind, slug);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const json = JSON.stringify(payload);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, file);
}

export function readCapture(kind, slug) {
  prepareCaptureCache();
  const file = capturePath(kind, slug);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/** Which saved captures exist for the requested slugs. */
export function listReadyCaptures(slugs) {
  prepareCaptureCache();
  /** @type {Record<string, string[]>} */
  const ready = {};
  for (const slug of slugs) {
    if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) continue;
    const kinds = [];
    for (const kind of KINDS) {
      if (fs.existsSync(capturePath(kind, slug))) kinds.push(kind);
    }
    if (kinds.length) ready[slug] = kinds;
  }
  return ready;
}

export function loadCapturesForExport(slugs) {
  const streetMapOverlays = {};
  const overviewCaptures = {};
  const centerMapCaptures = {};
  for (const slug of slugs) {
    if (typeof slug !== "string") continue;
    const street = readCapture("street-map", slug);
    const overview = readCapture("overview", slug);
    const center = readCapture("center-map", slug);
    if (street) streetMapOverlays[slug] = street;
    if (overview) overviewCaptures[slug] = overview;
    if (center) centerMapCaptures[slug] = center;
  }
  return { streetMapOverlays, overviewCaptures, centerMapCaptures };
}

export function getExportProgress() {
  return progress;
}

export function setExportProgress(patch) {
  progress = { ...progress, ...patch };
}

export function resetExportProgress() {
  progress = {
    phase: "idle",
    current: 0,
    total: 0,
    label: "",
    failures: [],
  };
}
