/**
 * Converts shopping_centers.xlsx → src/data/shopping-centers.json
 *
 * Usage:
 *   npm run convert:shopping-centers
 *   npm run convert:shopping-centers -- "/path/to/shopping_centers.xlsx"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const defaultXlsx = path.join(projectRoot, "assets/shopping_centers.xlsx");
const xlsxPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultXlsx;
const outFile = path.join(projectRoot, "src/data/shopping-centers.json");
const logoCacheFile = path.join(projectRoot, "public/data/logo-cache.json");

/** Excel center name → app slug (only centers wired in the app so far). */
const SLUG_BY_CENTER_NAME = {
  "Malibu Country Mart": "malibu-country-mart",
  "Malibu Village": "malibu-village",
  "Santa Monica Place": "santa-monica-place",
};

function normalizeHeader(header) {
  return String(header ?? "")
    .replace(/\s*↑\s*$/u, "")
    .trim();
}

function findHeaderRowIndex(raw) {
  for (let i = 0; i < Math.min(raw.length, 40); i++) {
    const labels = raw[i].map((cell) => normalizeHeader(cell));
    if (labels.includes("Tenant: Account Name")) return i;
  }
  return -1;
}

function readRows(sheet) {
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headerRowIndex = findHeaderRowIndex(raw);
  if (headerRowIndex < 0) {
    throw new Error("Could not find header row with Tenant: Account Name");
  }

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

function websiteFromDomain(domain) {
  if (!domain) return null;
  const clean = domain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0];
  if (!clean) return null;
  return `https://${clean}`;
}

function resolveSuite(row) {
  const suite = cell(row, "Suite of Unit/Space");
  if (suite) return suite;

  const space = cell(row, "Space");
  const match = space.match(/Suite\s+([A-Za-z0-9]+)/i);
  return match?.[1] ?? null;
}

function vacancyLabel(suite) {
  return suite ? `Suite ${suite}` : "Available space";
}

function sortVacancies(a, b) {
  if (a.suite && b.suite) return a.suite.localeCompare(b.suite, undefined, { numeric: true });
  if (a.suite) return -1;
  if (b.suite) return 1;
  return a.label.localeCompare(b.label);
}

if (!fs.existsSync(xlsxPath)) {
  console.error(`Excel file not found: ${xlsxPath}`);
  process.exit(1);
}

/** @type {Record<string, string | null>} */
let logoCache = {};
if (fs.existsSync(logoCacheFile)) {
  logoCache = JSON.parse(fs.readFileSync(logoCacheFile, "utf8"));
}

const workbook = XLSX.readFile(xlsxPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = readRows(sheet);

let lastCenterName = "";
/** @type {Map<string, { centerName: string, slug: string, tenants: Map<string, object>, vacancies: object[] }>} */
const centersBySlug = new Map();

for (const row of rows) {
  const centerName = cell(row, "Center: Center Name") || lastCenterName;
  if (cell(row, "Center: Center Name")) {
    lastCenterName = centerName;
  }
  if (!centerName) continue;

  const slug = SLUG_BY_CENTER_NAME[centerName];
  if (!slug) continue;

  if (!centersBySlug.has(slug)) {
    centersBySlug.set(slug, {
      centerName,
      slug,
      tenants: new Map(),
      vacancies: [],
    });
  }

  const center = centersBySlug.get(slug);
  const unitStatus = cell(row, "Unit Status");
  const tenantName = cell(row, "Tenant: Account Name");

  if (unitStatus.toLowerCase() === "vacant") {
    const suite = resolveSuite(row);
    const spaceSf = cell(row, "Space SF") || null;
    center.vacancies.push({
      label: vacancyLabel(suite),
      suite,
      spaceSf,
      spaceLabel: cell(row, "Space") || null,
      unitStatus: "Vacant",
    });
    continue;
  }

  if (!tenantName) continue;

  const logoDomain = logoCache[tenantName] ?? null;

  if (!center.tenants.has(tenantName)) {
    center.tenants.set(tenantName, {
      name: tenantName,
      logoDomain,
      hasLogo: Boolean(logoDomain),
      website: websiteFromDomain(logoDomain),
      suite: cell(row, "Suite of Unit/Space") || null,
      unitStatus: unitStatus || null,
      spaceSf: cell(row, "Space SF") || null,
    });
  }
}

const centers = [...centersBySlug.values()].map((center) => ({
  centerName: center.centerName,
  slug: center.slug,
  tenants: [...center.tenants.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  ),
  vacancies: center.vacancies.sort(sortVacancies),
}));

const payload = {
  sourceFile: path.basename(xlsxPath),
  generatedAt: new Date().toISOString(),
  centers,
};

fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);

for (const center of centers) {
  const withLogo = center.tenants.filter((t) => t.logoDomain).length;
  console.log(
    `${center.centerName}: ${center.tenants.length} tenants (${withLogo} with logo domains), ${center.vacancies.length} vacancies`
  );
}
console.log(`\nWrote ${outFile}`);
