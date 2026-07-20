export interface Vacancy {
  id: string;
  address: string;
  suite: string;
  space: string;
  highStreet: string;
  costarUrl: string;
  unitStatus: string;
  lat: number | null;
  lng: number | null;
}

export interface VacanciesDataset {
  generatedAt: string;
  sourceFile: string;
  totalRows: number;
  geocodedCount: number;
  highStreets: string[];
  vacancies: Vacancy[];
}

export interface VacancyLocationGroup {
  key: string;
  lat: number;
  lng: number;
  address: string;
  vacancies: Vacancy[];
}
