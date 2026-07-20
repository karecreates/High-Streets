import { USE_LOGO_DEV_MARKERS } from "../config/mapMarkers";

interface FilterBarProps {
  highStreets: { value: string; label: string }[];
  highStreet: string;
  onHighStreetChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  stats: {
    total: number;
    mapped: number;
    visible: number;
    needsGeocode: number;
    vacancies?: number;
    vacanciesVisible?: number;
  };
}

export function FilterBar({
  highStreets,
  highStreet,
  onHighStreetChange,
  search,
  onSearchChange,
  stats,
}: FilterBarProps) {
  return (
    <header className="filter-bar">
      <div className="filter-bar__brand">
        <span className="filter-bar__eyebrow">California</span>
        <h1 className="filter-bar__title">High Streets Tenant Map</h1>
        {USE_LOGO_DEV_MARKERS && (
          <span className="filter-bar__pilot">Logo.dev markers · all corridors</span>
        )}
      </div>

      <div className="filter-bar__controls">
        <label className="field">
          <span className="field__label">High street</span>
          <select
            className="field__input"
            value={highStreet}
            onChange={(e) => onHighStreetChange(e.target.value)}
          >
            <option value="all">All corridors</option>
            {highStreets.map((street) => (
              <option key={street.value} value={street.value}>
                {street.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field field--grow">
          <span className="field__label">Search tenant</span>
          <input
            className="field__input"
            type="search"
            placeholder="Type a tenant name…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>
      </div>

      <div className="filter-bar__stats" aria-live="polite">
        <span>
          <strong>{stats.visible}</strong> on map
        </span>
        <span className="filter-bar__divider" />
        <span>{stats.mapped} geocoded</span>
        <span className="filter-bar__divider" />
        <span>{stats.total} total</span>
        {(stats.vacanciesVisible ?? 0) > 0 && (
          <>
            <span className="filter-bar__divider" />
            <span>
              <strong>{stats.vacanciesVisible}</strong> vacancies
            </span>
          </>
        )}
        {stats.needsGeocode > 0 && (
          <>
            <span className="filter-bar__divider" />
            <span className="filter-bar__warn">
              {stats.needsGeocode} need geocoding
            </span>
          </>
        )}
      </div>
    </header>
  );
}
