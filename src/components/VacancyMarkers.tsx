import { InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import type { VacancyLocationGroup } from "../types/vacancy";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import { createVacancyPinIcon } from "../utils/createVacancyPinIcon";
import { GroupedVacancyInfoWindowContent } from "./GroupedVacancyInfoWindowContent";

/** Always render above tenant logo markers and clusters */
const VACANCY_MARKER_Z_INDEX = MAP_Z_INDEX.vacancyMarker;
const FOCUS_MIN_ZOOM = 17;

interface VacancyMarkersProps {
  locationGroups: VacancyLocationGroup[];
  focusGroupKey?: string | null;
  onFocusComplete?: () => void;
  /** When true, markers stay visible but clicks / popups are disabled. */
  staticMode?: boolean;
}

export function VacancyMarkers({
  locationGroups,
  focusGroupKey = null,
  onFocusComplete,
  staticMode = false,
}: VacancyMarkersProps) {
  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const [selected, setSelected] = useState<VacancyLocationGroup | null>(null);

  useEffect(() => {
    if (!map || !locationGroups.length) return;

    let cancelled = false;

    listenersRef.current.forEach((l) => l.remove());
    listenersRef.current = [];
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const markers = locationGroups.map((group) => {
      const label =
        group.vacancies.length === 1
          ? group.vacancies[0].space || group.address
          : `${group.vacancies.length} vacant spaces`;

      const marker = new google.maps.Marker({
        position: { lat: group.lat, lng: group.lng },
        title: label,
        optimized: false,
        zIndex: VACANCY_MARKER_Z_INDEX,
      });

      if (!staticMode) {
        const listener = marker.addListener("click", () => setSelected(group));
        listenersRef.current.push(listener);
      }
      marker.setMap(map);

      createVacancyPinIcon().then((icon) => {
        if (!cancelled) marker.setIcon(icon);
      });

      return marker;
    });

    markersRef.current = markers;

    return () => {
      cancelled = true;
      listenersRef.current.forEach((l) => l.remove());
      listenersRef.current = [];
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [map, locationGroups, staticMode]);

  useEffect(() => {
    if (staticMode) setSelected(null);
  }, [staticMode]);

  useEffect(() => {
    if (!map || !focusGroupKey || staticMode) return;

    const group = locationGroups.find((item) => item.key === focusGroupKey);
    if (!group) {
      onFocusComplete?.();
      return;
    }

    map.panTo({ lat: group.lat, lng: group.lng });
    const zoom = map.getZoom() ?? FOCUS_MIN_ZOOM;
    if (zoom < FOCUS_MIN_ZOOM) {
      map.setZoom(FOCUS_MIN_ZOOM);
    }

    setSelected(group);
    onFocusComplete?.();
  }, [focusGroupKey, locationGroups, map, onFocusComplete, staticMode]);

  if (!selected || staticMode) return null;

  return (
    <InfoWindow
      position={{ lat: selected.lat, lng: selected.lng }}
      zIndex={MAP_Z_INDEX.vacancyInfo}
      onCloseClick={() => setSelected(null)}
      onClose={() => setSelected(null)}
      maxWidth={360}
    >
      <GroupedVacancyInfoWindowContent vacancies={selected.vacancies} />
    </InfoWindow>
  );
}
