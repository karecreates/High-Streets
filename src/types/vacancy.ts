export interface Vacancy {
  id: string;
  address: string;
  suite: string;
  space: string;
  highStreet: string;
  costarUrl: string;
  unitStatus: string;
  /** Vacant suite size from CoStar Space SF (when known). */
  sqft?: number | null;
  /** Asking rate PSF/yr when provided in the vacancy inventory. */
  askingRate?: number | null;
  lat: number | null;
  lng: number | null;
}

export interface VacantSfStreetTotal {
  spaces: number;
  sqft: number;
  knownSfSpaces: number;
}

export interface VacanciesDataset {
  generatedAt: string;
  sourceFile: string;
  totalRows: number;
  geocodedCount: number;
  highStreets: string[];
  /** Roll-up of vacant SF by `Property: High Street` data key. */
  vacantSfByHighStreet?: Record<string, VacantSfStreetTotal>;
  vacancies: Vacancy[];
}

export interface VacancyLocationGroup {
  key: string;
  lat: number;
  lng: number;
  address: string;
  vacancies: Vacancy[];
}
