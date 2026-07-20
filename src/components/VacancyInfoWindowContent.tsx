import { betaMarkerSvg } from "../utils/createVacancyPinIcon";
import type { Vacancy } from "../types/vacancy";

interface VacancyInfoWindowContentProps {
  vacancy: Vacancy;
}

export function VacancyInfoWindowContent({ vacancy }: VacancyInfoWindowContentProps) {
  return (
    <article className="info-window info-window--vacancy">
      <header className="info-window__header">
        <img
          className="info-window__vacancy-pin"
          src={betaMarkerSvg}
          alt=""
        />
        <div>
          <h2 className="info-window__title">Vacant space</h2>
          {vacancy.unitStatus && (
            <span className="info-window__badge info-window__badge--vacancy">
              {vacancy.unitStatus}
            </span>
          )}
        </div>
      </header>

      <dl className="info-window__details">
        {vacancy.space && (
          <>
            <dt>Space</dt>
            <dd>{vacancy.space}</dd>
          </>
        )}
        {vacancy.costarUrl && (
          <>
            <dt>CoStar</dt>
            <dd>
              <a
                href={vacancy.costarUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View property in CoStar
              </a>
            </dd>
          </>
        )}
      </dl>
    </article>
  );
}
