/** Shared map overlay stacking — tenant/vacancy callouts stay above parking. */
export const MAP_Z_INDEX = {
  districtLabel: 20,
  parkingLotFill: 40,
  parkingMarker: 100,
  parkingInfo: 200,
  tenantMarker: 1_000,
  tenantInfo: 2_000,
  vacancyMarker: 1_000_000,
  vacancyInfo: 1_000_001,
} as const;
