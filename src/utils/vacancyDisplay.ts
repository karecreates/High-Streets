import type { Vacancy } from "../types/vacancy";

function formatSqftLabel(sqft: number): string {
  return `${Math.round(sqft).toLocaleString("en-US")} SF`;
}

/** Numeric SF from the dedicated field or the CoStar space label. */
export function getVacancySqftNumber(vacancy: Vacancy): number | null {
  if (vacancy.sqft != null && Number.isFinite(vacancy.sqft) && vacancy.sqft > 0) {
    return vacancy.sqft;
  }
  const match = vacancy.space?.match(/([\d,]+)\s*sf\b/i);
  if (!match) return null;
  const sqft = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(sqft) || sqft <= 0) return null;
  return sqft;
}

/** Pull square footage for display, e.g. "1,984 SF". */
export function parseVacancySqft(space: string): string | null {
  const match = space.match(/([\d,]+)\s*sf\b/i);
  if (!match) return null;
  const sqft = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(sqft) || sqft <= 0) return null;
  return formatSqftLabel(sqft);
}

export function formatVacancySqft(vacancy: Vacancy): string | null {
  const sqft = getVacancySqftNumber(vacancy);
  return sqft == null ? null : formatSqftLabel(sqft);
}

/** Asking rent when present, e.g. "$67.08 PSF/yr". */
export function formatAskingRate(vacancy: Vacancy): string | null {
  const rate = vacancy.askingRate;
  if (rate == null || !Number.isFinite(rate) || rate <= 0) return null;
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(rate) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rate);
  return `${money} PSF/yr`;
}

/** Compact corridor total, e.g. "24.7K SF" / "1,200 SF". */
export function formatVacantSfTotal(sqft: number): string {
  if (!Number.isFinite(sqft) || sqft <= 0) return "—";
  if (sqft >= 10_000) {
    const thousands = sqft / 1000;
    const rounded =
      thousands >= 100
        ? Math.round(thousands)
        : Math.round(thousands * 10) / 10;
    const label = Number.isInteger(rounded)
      ? `${rounded}`
      : rounded.toFixed(1);
    return `${label}K SF`;
  }
  return formatSqftLabel(sqft);
}

export function sumVacantSf(vacancies: Vacancy[]): number {
  return vacancies.reduce((sum, vacancy) => {
    const sqft = getVacancySqftNumber(vacancy);
    return sqft == null ? sum : sum + sqft;
  }, 0);
}

/** Vacancies with explicit 0 SF are omitted from the map vacancy picker. */
export function isVacancyListable(vacancy: Vacancy): boolean {
  if (vacancy.sqft != null) return vacancy.sqft > 0;
  if (!vacancy.space) return true;
  const match = vacancy.space.match(/([\d,]+)\s*sf\b/i);
  if (!match) return true;
  const sqft = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(sqft) && sqft > 0;
}

export function getVacancyListMeta(vacancy: Vacancy) {
  const sqft = formatVacancySqft(vacancy);
  const askingRate = formatAskingRate(vacancy);
  const suite = vacancy.suite?.trim();

  return {
    id: vacancy.id,
    address: vacancy.address,
    suite: suite || null,
    sqft,
    askingRate,
    status: vacancy.unitStatus,
  };
}

export function sortVacanciesForList(vacancies: Vacancy[]): Vacancy[] {
  return [...vacancies].sort((a, b) =>
    a.address.localeCompare(b.address, undefined, { numeric: true })
  );
}
