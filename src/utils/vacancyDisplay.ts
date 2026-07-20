import type { Vacancy } from "../types/vacancy";

/** Pull square footage from the CoStar space label, e.g. "… - 1,984 sf". */
export function parseVacancySqft(space: string): string | null {
  const match = space.match(/([\d,]+)\s*sf\b/i);
  if (!match) return null;
  const sqft = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(sqft) || sqft <= 0) return null;
  return `${match[1]} SF`;
}

/** Vacancies with explicit 0 SF are omitted from the map vacancy picker. */
export function isVacancyListable(vacancy: Vacancy): boolean {
  if (!vacancy.space) return true;
  const match = vacancy.space.match(/([\d,]+)\s*sf\b/i);
  if (!match) return true;
  const sqft = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(sqft) && sqft > 0;
}

export function getVacancyListMeta(vacancy: Vacancy) {
  const sqft = vacancy.space ? parseVacancySqft(vacancy.space) : null;
  const suite = vacancy.suite?.trim();

  return {
    id: vacancy.id,
    address: vacancy.address,
    suite: suite || null,
    sqft,
    status: vacancy.unitStatus,
  };
}

export function sortVacanciesForList(vacancies: Vacancy[]): Vacancy[] {
  return [...vacancies].sort((a, b) =>
    a.address.localeCompare(b.address, undefined, { numeric: true })
  );
}
