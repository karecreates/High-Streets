import { useEffect, useMemo, useRef, useState } from "react";
import type { Vacancy, VacancyLocationGroup } from "../types/vacancy";
import { findVacancyGroup } from "../utils/groupVacanciesByLocation";
import {
  getVacancyListMeta,
  isVacancyListable,
  sortVacanciesForList,
} from "../utils/vacancyDisplay";
import { ParkingLayerToggles } from "./ParkingLayerToggles";

export type MapDisplayMode = "tenants" | "both" | "vacancies";

export interface CorridorSelectGroup {
  label: string;
  options: { value: string; label: string }[];
}

const DISPLAY_MODES: { value: MapDisplayMode; label: string }[] = [
  { value: "tenants", label: "Occupied" },
  { value: "both", label: "Both" },
  { value: "vacancies", label: "Vacancies" },
];

interface MapControlsBarProps {
  tenantsCount: number;
  vacancyGroups: VacancyLocationGroup[];
  displayMode: MapDisplayMode;
  onDisplayModeChange: (mode: MapDisplayMode) => void;
  onVacancyFocus: (group: VacancyLocationGroup) => void;
  showMeteredParking: boolean;
  showParkingLots: boolean;
  onMeteredParkingChange: (enabled: boolean) => void;
  onParkingLotsChange: (enabled: boolean) => void;
  /** Inline layout for embedding in a page header (master map). */
  variant?: "floating" | "inline";
  corridorGroups?: CorridorSelectGroup[];
  corridorValue?: string;
  onCorridorChange?: (value: string) => void;
}

export function MapControlsBar({
  tenantsCount,
  vacancyGroups,
  displayMode,
  onDisplayModeChange,
  onVacancyFocus,
  showMeteredParking,
  showParkingLots,
  onMeteredParkingChange,
  onParkingLotsChange,
  variant = "floating",
  corridorGroups,
  corridorValue = "all",
  onCorridorChange,
}: MapControlsBarProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const markerCount = vacancyGroups.length;
  const spaceCount = useMemo(
    () => vacancyGroups.reduce((sum, group) => sum + group.vacancies.length, 0),
    [vacancyGroups]
  );

  const sortedVacancies = useMemo(() => {
    const vacancies = vacancyGroups
      .flatMap((group) => group.vacancies)
      .filter(isVacancyListable);
    return sortVacanciesForList(vacancies);
  }, [vacancyGroups]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleVacancyClick = (vacancy: Vacancy) => {
    const group = findVacancyGroup(vacancy, vacancyGroups);
    if (!group) return;
    onVacancyFocus(group);
    setOpen(false);
  };

  const showCorridorSelect =
    Boolean(corridorGroups?.length) && typeof onCorridorChange === "function";

  return (
    <div
      className={`map-controls${variant === "inline" ? " map-controls--inline" : ""}`}
      ref={rootRef}
    >
      {showCorridorSelect ? (
        <>
          <label className="map-controls__corridor">
            <span className="map-controls__corridor-label">Corridor</span>
            <select
              className="map-controls__corridor-select"
              value={corridorValue}
              onChange={(e) => onCorridorChange?.(e.target.value)}
              aria-label="Select corridor"
            >
              <option value="all">All corridors</option>
              {corridorGroups!.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((option) => (
                    <option key={`${group.label}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="map-controls__divider" aria-hidden />
        </>
      ) : null}

      <div
        className="map-controls__segment"
        role="radiogroup"
        aria-label="Map display mode"
      >
        {DISPLAY_MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={displayMode === value}
            className={`map-controls__segment-btn${
              displayMode === value ? " map-controls__segment-btn--active" : ""
            }`}
            onClick={() => onDisplayModeChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="map-controls__divider" aria-hidden />

      <div className="map-controls__stat">
        <span className="map-controls__stat-pill">
          <strong>{tenantsCount}</strong> occupied
        </span>

        <div className="map-controls__dropdown-wrap">
          <button
            type="button"
            className={`map-controls__vacancy-trigger${
              open ? " map-controls__vacancy-trigger--open" : ""
            }`}
            aria-expanded={open}
            aria-haspopup="listbox"
            onClick={() => setOpen((prev) => !prev)}
          >
            <span className="map-controls__vacancy-count">{markerCount}</span>
            <span className="map-controls__vacancy-label">
              {markerCount === 1 ? "Vacancy" : "Vacancies"}
            </span>
            <span className="map-controls__vacancy-chevron" aria-hidden>
              ▾
            </span>
          </button>

          {open ? (
            <div className="map-controls__dropdown" role="listbox">
              <div className="map-controls__dropdown-header">
                <span>Vacant spaces</span>
                <span>
                  {spaceCount === markerCount
                    ? `${markerCount} on map`
                    : `${markerCount} on map · ${spaceCount} spaces`}
                </span>
              </div>

              {sortedVacancies.length ? (
                <ul className="map-controls__vacancy-list">
                  {sortedVacancies.map((vacancy) => {
                    const meta = getVacancyListMeta(vacancy);
                    return (
                      <li key={vacancy.id}>
                        <button
                          type="button"
                          role="option"
                          className="map-controls__vacancy-item"
                          onClick={() => handleVacancyClick(vacancy)}
                        >
                          <div className="map-controls__vacancy-item-main">
                            <span className="map-controls__vacancy-address">
                              {meta.address}
                            </span>
                            {meta.suite ? (
                              <span className="map-controls__vacancy-suite">
                                {meta.suite}
                              </span>
                            ) : null}
                          </div>
                          {meta.sqft ? (
                            <span className="map-controls__vacancy-sqft">
                              {meta.sqft}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="map-controls__dropdown-empty">
                  No mapped vacancies for this corridor.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="map-controls__divider" aria-hidden />

      <ParkingLayerToggles
        compact
        showMeteredParking={showMeteredParking}
        showParkingLots={showParkingLots}
        onMeteredParkingChange={onMeteredParkingChange}
        onParkingLotsChange={onParkingLotsChange}
      />
    </div>
  );
}
