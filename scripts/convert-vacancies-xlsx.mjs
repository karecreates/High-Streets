/**
 * @deprecated Vacancies are now extracted by convert-xlsx.mjs from the master file.
 * Kept for backwards compatibility — reads the same MASTER HIGH STREET DATA.xlsx.
 *
 * Usage:
 *   npm run convert:vacancies
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const defaultXlsx = path.resolve(
  projectRoot,
  "assets/MASTER HIGH STREET DATA.xlsx"
);
const xlsxPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : defaultXlsx;

const outDir = path.join(projectRoot, "public/data");
const outFile = path.join(outDir, "vacancies.json");
const cacheFile = path.join(outDir, "geocode-cache.json");

function normalizeHeader(header) {
  return String(header ?? "")
    .replace(/\s*↑\s*$/u, "")
    .trim();
}

function findHeaderRowIndex(sheet) {
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  for (let i = 0; i < Math.min(raw.length, 40); i++) {
    const labels = raw[i].map((cell) => normalizeHeader(cell));
    if (labels.includes("Unit Status")) return i;
  }
  return 0;
}

function readRows(sheet) {
  const headerRowIndex = findHeaderRowIndex(sheet);
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
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

const highStreetSet = new Set();
const vacancies = [];
const seenKeys = new Set();
let skippedDupes = 0;

let lastHighStreet = "";
let lastAddress = "";
let lastCostarUrl = "";

for (const row of rows) {
  if (/subtotal/i.test(cell(row, "Property: Property Name"))) continue;

  const unitStatus = cell(row, "Unit Status");
  if (!isVacantStatus(unitStatus)) continue;

  const highStreet = cell(row, "Property: High Street") || lastHighStreet;
  const address = cell(row, "Property: Property Name") || lastAddress;
  const costarUrl = cell(row, "Property: Costar URL") || lastCostarUrl;

  if (cell(row, "Property: High Street")) lastHighStreet = highStreet;
  if (cell(row, "Property: Property Name")) lastAddress = address;
  if (cell(row, "Property: Costar URL")) lastCostarUrl = costarUrl;

  if (!address) continue;
  if (highStreet) highStreetSet.add(highStreet);

  const suite = cell(row, "Suite of Unit/Space");
  const space = cell(row, "Space");
  const cacheKey = address.toLowerCase();
  const cached = geocodeCache[cacheKey];

  const rowKey = vacancyRowKey({
    highStreet,
    address,
    suite,
    space,
    lat: cached?.lat,
    lng: cached?.lng,
  });
  if (seenKeys.has(rowKey)) {
    skippedDupes++;
    continue;
  }
  seenKeys.add(rowKey);

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
}

const geocodedCount = vacancies.filter(
  (v) => v.lat != null && v.lng != null
).length;

const dataset = {
  generatedAt: new Date().toISOString(),
  sourceFile: path.basename(xlsxPath),
  totalRows: vacancies.length,
  geocodedCount,
  highStreets: [...highStreetSet].sort((a, b) => a.localeCompare(b)),
  vacancies,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(dataset, null, 2));

console.log(`Source: ${path.basename(xlsxPath)} (${sheetName})`);
console.log(`Wrote ${vacancies.length} vacancies → ${outFile}`);
if (skippedDupes > 0) console.log(`Skipped ${skippedDupes} duplicate rows`);
console.log(`Geocoded: ${geocodedCount} / ${vacancies.length}`);
if (geocodedCount < vacancies.length) {
  console.log("Run npm run geocode to geocode remaining addresses.");
}
console.log(`High streets: ${highStreetSet.size}`);
