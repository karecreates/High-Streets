import type { Vacancy, VacancyLocationGroup } from "../types/vacancy";
import { coordinateKey } from "./dedupeTenants";

/** Merge pins geocoded a few meters apart onto one marker. */
const MERGE_DISTANCE_METERS = 12;

function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

function findNearbyGroup(
  vacancy: Vacancy,
  groups: VacancyLocationGroup[]
): VacancyLocationGroup | undefined {
  if (vacancy.lat == null || vacancy.lng == null) return undefined;

  return groups.find(
    (group) =>
      distanceMeters(vacancy.lat!, vacancy.lng!, group.lat, group.lng) <=
      MERGE_DISTANCE_METERS
  );
}

export function vacancyLocationGroupKey(vacancy: Vacancy): string | null {
  if (vacancy.lat == null || vacancy.lng == null) return null;
  return coordinateKey(vacancy.lat, vacancy.lng, 6);
}

export function groupVacanciesByLocation(
  vacancies: Vacancy[]
): VacancyLocationGroup[] {
  const groups: VacancyLocationGroup[] = [];

  for (const vacancy of vacancies) {
    if (vacancy.lat == null || vacancy.lng == null) continue;

    const nearby = findNearbyGroup(vacancy, groups);
    if (nearby) {
      nearby.vacancies.push(vacancy);
      continue;
    }

    groups.push({
      key: vacancyLocationGroupKey(vacancy)!,
      lat: vacancy.lat,
      lng: vacancy.lng,
      address: vacancy.address,
      vacancies: [vacancy],
    });
  }

  return groups;
}

export function findVacancyGroup(
  vacancy: Vacancy,
  groups: VacancyLocationGroup[]
): VacancyLocationGroup | undefined {
  if (vacancy.lat == null || vacancy.lng == null) return undefined;

  const exactKey = vacancyLocationGroupKey(vacancy);
  const exact = groups.find((group) => group.key === exactKey);
  if (exact) return exact;

  return groups.find((group) =>
    group.vacancies.some((item) => item.id === vacancy.id)
  );
}
