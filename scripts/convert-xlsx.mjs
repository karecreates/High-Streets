/**
 * Converts "MASTER HIGH STREET DATA" Excel export → tenants.json + vacancies.json
 *
 * Single source file contains both occupied tenants and vacant spaces.
 *
 * Usage:
 *   npm run convert
 *   npm run convert -- "/path/to/MASTER HIGH STREET DATA.xlsx"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { sanitizeLogoDomain } from "./lib/logoDomains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const defaultXlsx = path.resolve(
  projectRoot,
  "assets/Occupied_AND_Vacant_Space_7.28.xlsx"
);
const xlsxPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : defaultXlsx;

const outDir = path.join(projectRoot, "public/data");
const tenantsFile = path.join(outDir, "tenants.json");
const vacanciesFile = path.join(outDir, "vacancies.json");
const cacheFile = path.join(outDir, "geocode-cache.json");
const logoCacheFile = path.join(outDir, "logo-cache.json");

/** Strip Salesforce sort arrows from column headers */
function normalizeHeader(header) {
  return String(header ?? "")
    .replace(/\s*↑\s*$/u, "")
    .trim();
}

/** Find the row index that contains "Tenant: Account Name" */
function findHeaderRowIndex(sheet) {
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  for (let i = 0; i < Math.min(raw.length, 40); i++) {
    const labels = raw[i].map((cell) => normalizeHeader(cell));
    if (labels.includes("Tenant: Account Name")) return i;
  }
  return 0;
}

function readRows(sheet) {
  const headerRowIndex = findHeaderRowIndex(sheet);
  const raw = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });
  const headers = raw[headerRowIndex].map(normalizeHeader);
  const dataRows = raw.slice(headerRowIndex + 1);

  return dataRows
    .map((cells) => {
      /** @type {Record<string, string>} */
      const row = {};
      headers.forEach((header, i) => {
        if (header) row[header] = String(cells[i] ?? "").trim();
      });
      return row;
    })
    .filter((row) => Object.values(row).some(Boolean));
}

function cell(row, ...names) {
  for (const name of names) {
    const value = row[name];
    if (value) return value;
  }
  return "";
}

function isVacantStatus(status) {
  return /vacant|available/i.test(status);
}

function isSubtotalRow(row) {
  return /subtotal|^total$/i.test(cell(row, "Property: Property Name", "Property: High Street"));
}

function tenantRowKey({ highStreet, address, tenantName, suite, lat, lng }) {
  const norm = (s) =>
    String(s ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  const location =
    lat != null && lng != null
      ? `${Number(lat).toFixed(5)}|${Number(lng).toFixed(5)}`
      : `addr:${norm(address)}`;
  return `${norm(highStreet)}|${location}|${norm(tenantName)}|${norm(suite)}`;
}

function vacancyRowKey({ highStreet, address, suite, space, lat, lng }) {
  const norm = (s) =>
    String(s ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  const location =
    lat != null && lng != null
      ? `${Number(lat).toFixed(5)}|${Number(lng).toFixed(5)}`
      : `addr:${norm(address)}`;
  return `${norm(highStreet)}|${location}|${norm(suite)}|${norm(space)}`;
}

if (!fs.existsSync(xlsxPath)) {
  console.error(`Excel file not found: ${xlsxPath}`);
  console.error(
    'Pass a path: npm run convert -- "/path/to/MASTER HIGH STREET DATA.xlsx"'
  );
  process.exit(1);
}

const workbook = XLSX.readFile(xlsxPath);
const sheetName =
  workbook.SheetNames.find((n) => /spaces by high street/i.test(n)) ??
  workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = readRows(sheet);

/** @type {Record<string, { lat: number, lng: number }>} */
let geocodeCache = {};
if (fs.existsSync(cacheFile)) {
  geocodeCache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
}

/**
 * Verified brand domain per tenant account name (or null → render as text).
 * Built by `npm run resolve-logos` via logo.dev's Brand Search API.
 * Manual fixes live in logo-overrides.json (global) and optional `@byStreet`
 * map for location-specific brands (same name, different business).
 * @type {Record<string, string | null>}
 */
let logoCache = {};
if (fs.existsSync(logoCacheFile)) {
  logoCache = JSON.parse(fs.readFileSync(logoCacheFile, "utf8"));
}

/** @type {Record<string, string | null>} */
let logoNameOverrides = {};
/** @type {Record<string, Record<string, string | null>>} */
let logoByStreet = {};
const logoOverridesFile = path.join(outDir, "logo-overrides.json");
if (fs.existsSync(logoOverridesFile)) {
  const raw = JSON.parse(fs.readFileSync(logoOverridesFile, "utf8"));
  const { ["@byStreet"]: byStreet, ...nameOverrides } = raw;
  logoNameOverrides = nameOverrides;
  logoByStreet =
    byStreet && typeof byStreet === "object" && !Array.isArray(byStreet)
      ? byStreet
      : {};
  logoCache = { ...logoCache, ...logoNameOverrides };
}

/**
 * Resolve logo domain with street context first, then global override/cache.
 * Street/name keys present with `null` force a text label (clear a bad auto-match).
 */
function resolveLogoDomain(tenantName, highStreet) {
  const name = tenantName.trim();
  const streetMap = highStreet ? logoByStreet[highStreet] : null;
  let raw = "";
  if (streetMap && Object.prototype.hasOwnProperty.call(streetMap, name)) {
    raw = streetMap[name] || "";
  } else if (Object.prototype.hasOwnProperty.call(logoNameOverrides, name)) {
    raw = logoNameOverrides[name] || "";
  } else {
    raw = logoCache[name] ?? "";
  }
  return sanitizeLogoDomain(raw);
}

const highStreetSet = new Set();
const tenants = [];
const vacancies = [];
const seenTenantKeys = new Set();
const seenVacancyKeys = new Set();
let skippedTenantDupes = 0;
let skippedVacancyDupes = 0;

let lastHighStreet = "";
let lastAddress = "";
let lastCostarUrl = "";

for (const row of rows) {
  if (isSubtotalRow(row)) continue;

  const unitStatus = cell(row, "Unit Status");
  const highStreet = cell(row, "Property: High Street") || lastHighStreet;
  const address = cell(row, "Property: Property Name") || lastAddress;
  const costarUrl = cell(row, "Property: Costar URL") || lastCostarUrl;

  if (cell(row, "Property: High Street")) {
    lastHighStreet = highStreet;
  }
  if (cell(row, "Property: Property Name")) {
    lastAddress = address;
  }
  if (cell(row, "Property: Costar URL")) {
    lastCostarUrl = costarUrl;
  }

  if (!address || !highStreet) continue;
  if (/^(subtotal|total)$/i.test(highStreet)) continue;

  if (highStreet) highStreetSet.add(highStreet);

  const suite = cell(row, "Suite of Unit/Space");
  const space = cell(row, "Space");
  const cacheKey = address.toLowerCase();
  const cached = geocodeCache[cacheKey];

  if (isVacantStatus(unitStatus)) {
    const rowKey = vacancyRowKey({
      highStreet,
      address,
      suite,
      space,
      lat: cached?.lat,
      lng: cached?.lng,
    });
    if (seenVacancyKeys.has(rowKey)) {
      skippedVacancyDupes++;
      continue;
    }
    seenVacancyKeys.add(rowKey);

    vacancies.push({
      id: `vacancy-${vacancies.length + 1}`,
      address,
      suite,
      space,
      highStreet,
      costarUrl,
      unitStatus,
      lat: cached?.lat ?? null,
      lng: cached?.lng ?? null,
    });
    continue;
  }

  const tenantName = cell(row, "Tenant: Account Name");
  if (!tenantName || unitStatus !== "Occupied") continue;

  const rowKey = tenantRowKey({
    highStreet,
    address,
    tenantName,
    suite,
    lat: cached?.lat,
    lng: cached?.lng,
  });
  if (seenTenantKeys.has(rowKey)) {
    skippedTenantDupes++;
    continue;
  }
  seenTenantKeys.add(rowKey);

  tenants.push({
    id: `tenant-${tenants.length + 1}`,
    tenantName,
    address,
    suite,
    highStreet,
    costarUrl,
    domain: cell(row, "Domain Guess"),
    faviconUrl: cell(row, "Favicon URL"),
    unitStatus,
    logoDomain: resolveLogoDomain(tenantName, highStreet),
    hasLogo: Boolean(resolveLogoDomain(tenantName, highStreet)),
    lat: cached?.lat ?? null,
    lng: cached?.lng ?? null,
  });
}

const geocodedTenants = tenants.filter(
  (t) => t.lat != null && t.lng != null
).length;
const geocodedVacancies = vacancies.filter(
  (v) => v.lat != null && v.lng != null
).length;
const withLogoCount = tenants.filter((t) => t.hasLogo).length;

const tenantsDataset = {
  generatedAt: new Date().toISOString(),
  sourceFile: path.basename(xlsxPath),
  totalRows: tenants.length,
  geocodedCount: geocodedTenants,
  highStreets: [...highStreetSet].sort((a, b) => a.localeCompare(b)),
  tenants,
};

const vacanciesDataset = {
  generatedAt: new Date().toISOString(),
  sourceFile: path.basename(xlsxPath),
  totalRows: vacancies.length,
  geocodedCount: geocodedVacancies,
  highStreets: [...highStreetSet].sort((a, b) => a.localeCompare(b)),
  vacancies,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(tenantsFile, JSON.stringify(tenantsDataset, null, 2));
fs.writeFileSync(vacanciesFile, JSON.stringify(vacanciesDataset, null, 2));

console.log(`Source: ${path.basename(xlsxPath)} (${sheetName})`);
console.log(`Wrote ${tenants.length} tenants → ${tenantsFile}`);
console.log(`Wrote ${vacancies.length} vacancies → ${vacanciesFile}`);
if (skippedTenantDupes > 0) {
  console.log(`Skipped ${skippedTenantDupes} duplicate tenant rows`);
}
if (skippedVacancyDupes > 0) {
  console.log(`Skipped ${skippedVacancyDupes} duplicate vacancy rows`);
}
console.log(`Geocoded tenants: ${geocodedTenants} / ${tenants.length}`);
console.log(`Geocoded vacancies: ${geocodedVacancies} / ${vacancies.length}`);
if (geocodedTenants < tenants.length || geocodedVacancies < vacancies.length) {
  console.log("Run npm run geocode to geocode remaining addresses.");
}
console.log(`With logo.dev logo: ${withLogoCount} / ${tenants.length}`);
if (Object.keys(logoCache).length === 0) {
  console.log("Run npm run resolve-logos to verify tenant logos.");
}
console.log(`High streets: ${highStreetSet.size}`);
