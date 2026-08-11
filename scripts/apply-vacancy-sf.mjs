/**
 * Apply Space SF (and asking rates) from Final_Vacancy_Report.xlsx onto
 * public/data/vacancies.json. Matches by high street + address/suite, then
 * appends unmatched report rows as new vacancies (geocode from cache when possible).
 *
 * Usage:
 *   node scripts/apply-vacancy-sf.mjs
 *   node scripts/apply-vacancy-sf.mjs path/to/report.xlsx
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const defaultReport = path.resolve(
  projectRoot,
  "assets/Final_Vacancy_Report.xlsx"
);
const reportPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : defaultReport;

const vacanciesFile = path.join(projectRoot, "public/data/vacancies.json");
const cacheFile = path.join(projectRoot, "public/data/geocode-cache.json");

function norm(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bstreet\b/g, "st")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return new Set(norm(value).split(" ").filter(Boolean));
}

function reportAddress(spaceName) {
  const head = String(spaceName ?? "").split(" - ")[0] ?? "";
  return norm(head.split(",")[0]);
}

function extractSuite(spaceName) {
  const match = String(spaceName ?? "").match(/suite\s+([^-\n]+)/i);
  return match ? norm(match[1]) : "";
}

function parseSpaceLabelSf(space) {
  const match = String(space ?? "").match(/([\d,]+)\s*sf\b/i);
  if (!match) return null;
  const n = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatSf(n) {
  return `${Number(n).toLocaleString("en-US")} sf`;
}

function scorePair(reportRow, vacancy) {
  const vacAddr = norm(vacancy.address);
  if (!reportRow.addr || !vacAddr) return -1;

  let score = 0;
  if (reportRow.addr === vacAddr) score += 100;
  else if (reportRow.addr.includes(vacAddr) || vacAddr.includes(reportRow.addr))
    score += 70;
  else {
    const reportNum = reportRow.addr.match(/^(\d+)/)?.[1];
    const vacNum = vacAddr.match(/^(\d+)/)?.[1];
    if (reportNum && vacNum && reportNum !== vacNum) return -1;
    const overlap = [...tokens(reportRow.addr)].filter((t) =>
      tokens(vacAddr).has(t)
    ).length;
    if (!overlap) return -1;
    score += overlap * 12;
  }

  const vacSuite = norm(vacancy.suite);
  if (reportRow.suite && vacSuite) {
    if (
      reportRow.suite === vacSuite ||
      reportRow.suite.includes(vacSuite) ||
      vacSuite.includes(reportRow.suite)
    ) {
      score += 40;
    } else {
      score -= 15;
    }
  }

  const nameOverlap = [...tokens(reportRow.name)].filter((t) =>
    tokens(vacancy.space).has(t)
  ).length;
  score += Math.min(30, nameOverlap * 3);

  const existingSf = vacancy.sqft ?? parseSpaceLabelSf(vacancy.space);
  if (reportRow.sf && existingSf && reportRow.sf === existingSf) score += 80;

  return score;
}

function ensureSpaceHasSf(space, sqft) {
  if (sqft == null) return space;
  if (/\b0\s*sf\b/i.test(space) || !/([\d,]+)\s*sf\b/i.test(space)) {
    if (/-\s*sf\s*$/i.test(space) || /-\s*$/i.test(space)) {
      return space.replace(/-\s*(sf)?\s*$/i, `- ${formatSf(sqft)}`);
    }
    if (/\bsf\b/i.test(space)) {
      return space.replace(/([\d,]*)\s*sf\b/i, formatSf(sqft));
    }
    return `${space} - ${formatSf(sqft)}`;
  }
  return space;
}

function lookupGeocode(cache, address) {
  if (!address) return null;
  const direct = cache[address.toLowerCase()];
  if (direct) return direct;
  // Try without city suffix / suite noise
  const stripped = address.split(",")[0].trim().toLowerCase();
  for (const [key, value] of Object.entries(cache)) {
    if (key.startsWith(stripped) || stripped.startsWith(key.split(",")[0])) {
      return value;
    }
  }
  return null;
}

if (!fs.existsSync(reportPath)) {
  console.error(`Report not found: ${reportPath}`);
  process.exit(1);
}
if (!fs.existsSync(vacanciesFile)) {
  console.error(`vacancies.json not found: ${vacanciesFile}`);
  process.exit(1);
}

const workbook = XLSX.readFile(reportPath);
const sheetName =
  workbook.SheetNames.find((n) => /inventory|vacant|spaces/i.test(n)) ??
  workbook.SheetNames[0];
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
  defval: "",
});

function isTestRow(value) {
  return /\btest\s*\d*\b/i.test(String(value ?? ""));
}

const report = rows
  .map((row) => {
    const street = String(row["Property: High Street"] ?? "").trim();
    const name = String(row["Space Name"] ?? "").trim();
    const rawSf = row["Space SF"];
    const sf =
      rawSf === "" || rawSf == null || Number(rawSf) === 0
        ? null
        : Number(rawSf);
    const askingRate =
      row["Asking Rate"] === "" || row["Asking Rate"] == null
        ? null
        : Number(row["Asking Rate"]);
    if (!street || !name || isTestRow(name) || isTestRow(street)) return null;
    return {
      street,
      name,
      sf: Number.isFinite(sf) ? sf : null,
      askingRate: Number.isFinite(askingRate) ? askingRate : null,
      addr: reportAddress(name),
      suite: extractSuite(name),
    };
  })
  .filter(Boolean);

/** @type {{ vacancies: any[], highStreets?: string[], [key: string]: any }} */
const dataset = JSON.parse(fs.readFileSync(vacanciesFile, "utf8"));
const vacancies = dataset.vacancies.filter((vacancy) => {
  const blob = `${vacancy.address} ${vacancy.space} ${vacancy.suite}`;
  return !isTestRow(blob);
});
/** @type {Record<string, { lat: number, lng: number }>} */
const geocodeCache = fs.existsSync(cacheFile)
  ? JSON.parse(fs.readFileSync(cacheFile, "utf8"))
  : {};

const byStreetReport = new Map();
const byStreetVacancy = new Map();
for (let i = 0; i < report.length; i++) {
  const street = report[i].street;
  if (!byStreetReport.has(street)) byStreetReport.set(street, []);
  byStreetReport.get(street).push(i);
}
for (let i = 0; i < vacancies.length; i++) {
  const street = vacancies[i].highStreet;
  if (!byStreetVacancy.has(street)) byStreetVacancy.set(street, []);
  byStreetVacancy.get(street).push(i);
}

const pairs = [];
for (const [street, reportIdxs] of byStreetReport) {
  const vacIdxs = byStreetVacancy.get(street) ?? [];
  for (const ri of reportIdxs) {
    for (const vi of vacIdxs) {
      const score = scorePair(report[ri], vacancies[vi]);
      if (score >= 70) pairs.push({ score, ri, vi });
    }
  }
}
pairs.sort((a, b) => b.score - a.score);

const usedReport = new Set();
const usedVacancy = new Set();
let updated = 0;

for (const { ri, vi } of pairs) {
  if (usedReport.has(ri) || usedVacancy.has(vi)) continue;
  usedReport.add(ri);
  usedVacancy.add(vi);

  const row = report[ri];
  const vacancy = vacancies[vi];
  if (row.sf != null) {
    vacancy.sqft = row.sf;
    vacancy.space = ensureSpaceHasSf(vacancy.space || row.name, row.sf);
    updated++;
  } else if (vacancy.sqft == null) {
    vacancy.sqft = parseSpaceLabelSf(vacancy.space);
  }
  if (row.askingRate != null) vacancy.askingRate = row.askingRate;
  if (row.suite && !vacancy.suite) {
    // Keep human-readable suite from the report when vacancy suite was empty.
    const rawSuite = String(row.name).match(/suite\s+([^-\n]+)/i)?.[1]?.trim();
    if (rawSuite) vacancy.suite = rawSuite;
  }
}

let added = 0;
for (let ri = 0; ri < report.length; ri++) {
  if (usedReport.has(ri)) continue;
  const row = report[ri];
  const address =
    String(row.name).split(" - ")[0]?.split(",")[0]?.trim() || row.name;
  const cached = lookupGeocode(geocodeCache, address);
  const suite =
    String(row.name).match(/suite\s+([^-\n]+)/i)?.[1]?.trim() ?? "";
  const space =
    row.sf != null ? ensureSpaceHasSf(row.name, row.sf) : row.name;

  vacancies.push({
    id: `vacancy-${vacancies.length + 1}`,
    address,
    suite,
    space,
    highStreet: row.street,
    costarUrl: "",
    unitStatus: /available/i.test(row.name) ? "Available" : "Vacant",
    sqft: row.sf,
    askingRate: row.askingRate,
    lat: cached?.lat ?? null,
    lng: cached?.lng ?? null,
  });
  added++;
}

// Fill sqft from existing space labels where report had no match/value.
for (const vacancy of vacancies) {
  if (vacancy.sqft == null) {
    vacancy.sqft = parseSpaceLabelSf(vacancy.space);
  }
}

const highStreetSet = new Set(vacancies.map((v) => v.highStreet).filter(Boolean));
const totals = {};
for (const vacancy of vacancies) {
  const street = vacancy.highStreet;
  if (!street) continue;
  if (!totals[street]) totals[street] = { spaces: 0, sqft: 0, knownSfSpaces: 0 };
  totals[street].spaces += 1;
  if (vacancy.sqft != null && vacancy.sqft > 0) {
    totals[street].sqft += vacancy.sqft;
    totals[street].knownSfSpaces += 1;
  }
}

dataset.generatedAt = new Date().toISOString();
dataset.sourceFile = [
  dataset.sourceFile,
  path.basename(reportPath),
]
  .filter(Boolean)
  .filter((v, i, arr) => arr.indexOf(v) === i)
  .join(" + ");
dataset.totalRows = vacancies.length;
dataset.geocodedCount = vacancies.filter((v) => v.lat != null && v.lng != null).length;
dataset.highStreets = [...highStreetSet].sort((a, b) => a.localeCompare(b));
dataset.vacantSfByHighStreet = totals;
dataset.vacancies = vacancies;

fs.writeFileSync(vacanciesFile, JSON.stringify(dataset, null, 2));

console.log(`Report: ${path.basename(reportPath)} (${sheetName})`);
console.log(`Updated SF on ${updated} existing vacancies`);
console.log(`Added ${added} new vacancies from report`);
console.log(`Wrote ${vacancies.length} vacancies → ${vacanciesFile}`);
console.log("\nVacant SF by high street:");
for (const street of Object.keys(totals).sort()) {
  const t = totals[street];
  console.log(
    `  ${street}: ${t.sqft.toLocaleString("en-US")} SF across ${t.knownSfSpaces}/${t.spaces} spaces`
  );
}
