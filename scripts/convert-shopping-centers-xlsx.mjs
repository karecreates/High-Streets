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
import { sanitizeLogoDomain } from "./lib/logoDomains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const defaultXlsx = path.join(
  projectRoot,
  "assets/Shopping_Center_Occupied_AND_Vacant_7.028.xlsx"
);
const xlsxPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultXlsx;
const outFile = path.join(projectRoot, "src/data/shopping-centers.json");
const logoCacheFile = path.join(projectRoot, "public/data/logo-cache.json");
const logoOverridesFile = path.join(projectRoot, "public/data/logo-overrides.json");

/** Excel center name → app slug (only centers wired in the app so far). */
const SLUG_BY_CENTER_NAME = {
  "Malibu Country Mart": "malibu-country-mart",
  "Malibu Village": "malibu-village",
  "Santa Monica Place": "santa-monica-place",
  "Brentwood Country Mart": "brentwood-country-mart",
  "The Point At South Bay": "the-point",
  "The Point": "the-point",
  "The Platform": "platform",
  "Westfield Century City": "westfield-century-city",
  "The Americana at Brand": "americana-at-brand",
  "The Grove At Farmers Market": "the-grove",
  "The Grove": "the-grove",
  "The Paseo": "the-paseo",
  "The Shops at The Sportsman Lodge": "sportsmen-lodge",
  "One Colorado": "one-colorado",
  "Manhattan Village": "manhattan-village",
};

/** Excel tenant name → display name in the directory. */
const DISPLAY_NAME_BY_TENANT = {
  "H & M": "H&M",
};

/** Per-center display renames (Excel name → directory label). */
const DISPLAY_NAME_BY_CENTER = {
  "brentwood-country-mart": {
    "Frida Mexican Cuisine": "Frida Taqueria",
  },
  "malibu-country-mart": {
    "Cie Sparks Salon": "Cie Salon",
    Nenergy: "Nenergy Boost",
    "The Bunker": "The Bunker Surf & Skate",
    "Faherty Brand": "Faherty",
    "NAGA LA": "NAGA Los Angeles",
    "9026- Eyes": "9026-Eyes",
    "alicia adams alpaca": "Alicia Adams Alpaca",
    "Malibu Grooming Company": "Malibu Grooming Co.",
    Nomad: "Nomad Malibu",
    "L'Agence": "L'AGENCE",
    "M. FREDRIC": "M.FREDRIC",
    Vince: "Vince.",
    Paige: "PAIGE",
  },
  "the-point": {
    "Aveda Vicara Salon": "Vicara Aveda Salonspa",
    "Bluemercury, Inc.": "Bluemercury",
    "Cava Grill": "CAVA",
    "Lululemon Athletica": "lululemon",
    "Pause Wellness Studio": "Pause Studio",
    "Peet's Coffee & Tea": "Peet's Coffee",
    "Pressed Juicery": "Pressed",
    "Rabbit Ladder": "Rabbit Ladders",
    "Simmzy's": "Lil' Simmzy's",
    "state & liberty": "State & Liberty",
    "Van Leeuwen": "Van Leeuwen Ice Cream",
    YETI: "Yeti",
  },
  "sportsmen-lodge": {
    "Erewhon Market": "Erewhon",
    "ROLLING GREENS NURSERY, INC.": "Rolling Greens",
    "SALT Optics Inc": "SALT Optics",
    "THE GREAT": "The Great",
    "Tuesday’s Sweet Shoppe": "Tuesday's Sweet Shoppe",
    Hoka: "HOKA",
    Sugarfish: "SUGARFISH",
  },
  "manhattan-village": {
    ANTRHOPOLOGIE: "Anthropologie",
    "Bank of  America": "Bank of America",
  },
  "the-grove": {
    "Apple Store": "Apple",
  },
};

/**
 * Per-center logo domains — wins over global logo-cache / logo-overrides
 * when the same Excel tenant name means different brands at different centers.
 */
const LOGO_DOMAIN_BY_CENTER = {
  "brentwood-country-mart": {
    "Frida Mexican Cuisine": "fridatacosla.com",
  },
  "americana-at-brand": {
    "Frida Mexican Cuisine": "fridaamericana.com",
  },
  "the-grove": {
    "Apple Store": "apple.com",
  },
  "malibu-village": {
    "Shell Gas": "shell.com",
  },
};

/**
 * In-store / sub-concept tenants that share a parent brand logo.
 * Keep them out of the directory grid so the parent logo isn't shown twice.
 */
const DIRECTORY_HIDDEN_TENANTS = new Set([
  "Barnes & Noble Cafe",
  "Nordstrom Ebar",
  "Bar Verde",
  "Macguffins Bar at AMC Theatres",
  "Seabutter Sushi- Handrolls",
  // Malibu: Double RL already represents the Ralph Lauren logo tile
  "Ralph Lauren",
]);

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
  const clean = sanitizeLogoDomain(domain, { empty: null });
  if (!clean) return null;
  return `https://${clean}`;
}

function resolveTenantLogoDomain(tenantName, slug, fallback = null) {
  const raw =
    LOGO_DOMAIN_BY_CENTER[slug]?.[tenantName] ??
    logoCache[tenantName] ??
    fallback ??
    null;
  return sanitizeLogoDomain(raw, { empty: null });
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
if (fs.existsSync(logoOverridesFile)) {
  logoCache = { ...logoCache, ...JSON.parse(fs.readFileSync(logoOverridesFile, "utf8")) };
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
  if (DIRECTORY_HIDDEN_TENANTS.has(tenantName)) continue;

  const logoDomain = resolveTenantLogoDomain(tenantName, slug);
  const displayName =
    DISPLAY_NAME_BY_CENTER[slug]?.[tenantName] ??
    DISPLAY_NAME_BY_TENANT[tenantName] ??
    tenantName;

  if (!center.tenants.has(displayName)) {
    center.tenants.set(displayName, {
      name: displayName,
      logoDomain,
      hasLogo: Boolean(logoDomain),
      website: websiteFromDomain(logoDomain),
      suite: cell(row, "Suite of Unit/Space") || null,
      unitStatus: unitStatus || null,
      spaceSf: cell(row, "Space SF") || null,
    });
  }
}

/** Extra tenants present on the official directory but missing from Excel. */
const EXTRA_TENANTS_BY_CENTER = {
  "the-point": [
    { name: "Lyon Stahl", suite: null, logoDomain: "lyonstahl.com" },
  ],
  "sportsmen-lodge": [
    { name: "UOVO", suite: "157", logoDomain: "uovo.la" },
  ],
};

for (const [slug, extras] of Object.entries(EXTRA_TENANTS_BY_CENTER)) {
  const center = centersBySlug.get(slug);
  if (!center) continue;
  for (const tenant of extras) {
    const name = tenant.name;
    if (!name || center.tenants.has(name)) continue;
    const logoDomain = resolveTenantLogoDomain(name, slug, tenant.logoDomain);
    center.tenants.set(name, {
      name,
      logoDomain,
      hasLogo: Boolean(logoDomain),
      website: websiteFromDomain(logoDomain),
      suite: tenant.suite ?? null,
      unitStatus: "Occupied",
      spaceSf: null,
    });
  }
}

/** Manual tenant directories for centers not (yet) in shopping_centers.xlsx */
const MANUAL_TENANT_FILES = {
  "the-paseo": {
    centerName: "The Paseo",
    file: path.join(__dirname, "the-paseo-tenants.json"),
  },
  "one-colorado": {
    centerName: "One Colorado",
    file: path.join(__dirname, "one-colorado-tenants.json"),
  },
  "manhattan-village": {
    centerName: "Manhattan Village",
    file: path.join(__dirname, "manhattan-village-tenants.json"),
  },
};

for (const [slug, config] of Object.entries(MANUAL_TENANT_FILES)) {
  if (centersBySlug.has(slug)) continue;
  if (!fs.existsSync(config.file)) {
    console.warn(`Manual tenant file missing for ${slug}: ${config.file}`);
    continue;
  }

  /** @type {Array<{ name: string, suite?: string | null, logoDomain?: string | null }>} */
  const manualTenants = JSON.parse(fs.readFileSync(config.file, "utf8"));
  const tenants = new Map();

  for (const tenant of manualTenants) {
    const name = String(tenant.name ?? "").trim();
    if (!name || DIRECTORY_HIDDEN_TENANTS.has(name)) continue;

    const logoDomain = resolveTenantLogoDomain(name, slug, tenant.logoDomain);

    tenants.set(name, {
      name,
      logoDomain,
      hasLogo: Boolean(logoDomain),
      website: websiteFromDomain(logoDomain),
      suite: tenant.suite ?? null,
      unitStatus: "Occupied",
      spaceSf: null,
    });
  }

  centersBySlug.set(slug, {
    centerName: config.centerName,
    slug,
    tenants,
    vacancies: [],
  });
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
