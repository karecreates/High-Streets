import type { Vacancy } from "../types/vacancy";
import { VacancyInfoWindowContent } from "./VacancyInfoWindowContent";

interface GroupedVacancyInfoWindowContentProps {
  vacancies: Vacancy[];
}

export function GroupedVacancyInfoWindowContent({
  vacancies,
}: GroupedVacancyInfoWindowContentProps) {
  if (vacancies.length === 1) {
    return <VacancyInfoWindowContent vacancy={vacancies[0]} />;
  }

  return (
    <div className="info-window info-window--group">
      <p className="info-window__group-label">
        {vacancies.length} vacant spaces at this address
      </p>
      <ul className="info-window__group-list">
        {vacancies.map((vacancy) => (
          <li key={vacancy.id} className="info-window__group-item">
            <VacancyInfoWindowContent vacancy={vacancy} />
          </li>
        ))}
      </ul>
    </div>
  );
}
