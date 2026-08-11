import type { Tenant } from "../types/tenant";
import type { Vacancy } from "../types/vacancy";
import { groupVacanciesByLocation } from "./groupVacanciesByLocation";
import { isNamedTenant } from "./tenantDisplay";

/**
 * Vacancy rate = vacant locations ÷ (vacant locations + occupied tenants).
 *
 * Vacancy count matches the map (one pin per geocoded location, even when
 * CoStar lists several vacant suites at the same address). Occupied count
 * matches the map's named, mapped tenant total.
 *
 * Example — Third Street Promenade: 21 locations / (21 + 84 occupied) = 20.0%.
 */
export function countOccupiedTenants(tenants: Tenant[]): number {
  return tenants.filter(
    (tenant) =>
      tenant.lat != null &&
      tenant.lng != null &&
      isNamedTenant(tenant.tenantName)
  ).length;
}

export function countVacancySpaces(vacancies: Vacancy[]): number {
  return vacancies.length;
}

/** Mapped vacancy pins (one per geocoded location). */
export function countVacancyLocations(vacancies: Vacancy[]): number {
  return groupVacanciesByLocation(
    vacancies.filter((v) => v.lat != null && v.lng != null)
  ).length;
}

export function formatVacancyRate(
  vacancies: number,
  occupied: number
): string | null {
  const total = vacancies + occupied;
  if (total <= 0) return null;
  const rate = (vacancies / total) * 100;
  const rounded = Math.round(rate * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

export function vacancyRateFromStreetData(
  tenants: Tenant[],
  vacancies: Vacancy[]
): string | null {
  return formatVacancyRate(
    countVacancyLocations(vacancies),
    countOccupiedTenants(tenants)
  );
}
