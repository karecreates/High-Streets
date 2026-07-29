import type { ReactNode } from "react";
import { USE_LOGO_DEV_MARKERS } from "../config/mapMarkers";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Replaces the old stats block — e.g. MapControlsBar on the master map. */
  controls?: ReactNode;
}

export function FilterBar({
  search,
  onSearchChange,
  controls,
}: FilterBarProps) {
  return (
    <header className="filter-bar">
      <div className="filter-bar__brand">
        <span className="filter-bar__eyebrow">California</span>
        <h1 className="filter-bar__title">High Streets Tenant Map</h1>
        {USE_LOGO_DEV_MARKERS && (
          <span className="filter-bar__pilot">Logo markers · all corridors</span>
        )}
      </div>

      <div className="filter-bar__controls">
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

      {controls ? (
        <div className="filter-bar__map-controls">{controls}</div>
      ) : null}
    </header>
  );
}
