import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FilterBar } from "../components/FilterBar";
import { ParkingLayerToggles } from "../components/ParkingLayerToggles";
import { TenantMapView } from "../components/TenantMap";
import { useTenantsContext } from "../context/TenantsContext";
import { getCorridorBySlug, HIGH_STREET_CORRIDORS } from "../data/highStreets";
import {
  getFirstMappedTenantForStreet,
  STREET_FOCUS_ZOOM,
} from "../utils/streetMapFocus";

export function MasterMapPage() {
  const [searchParams] = useSearchParams();
  const {
    dataset,
    filtered,
    filteredVacancies,
    stats,
    highStreet,
    setHighStreet,
    search,
    setSearch,
  } = useTenantsContext();
  const [showMeteredParking, setShowMeteredParking] = useState(true);
  const [showParkingLots, setShowParkingLots] = useState(false);

  useEffect(() => {
    const corridorSlug = searchParams.get("corridor");
    if (!corridorSlug) return;
    const corridor = getCorridorBySlug(corridorSlug);
    if (corridor?.dataKey) setHighStreet(corridor.dataKey);
  }, [searchParams, setHighStreet]);

  const highStreets = useMemo(() => {
    if (!dataset) return [] as { value: string; label: string }[];
    const inData = new Set(
      dataset.tenants.map((t) => t.highStreet).filter(Boolean)
    );
    // Only approved corridors with linked data appear in the dropdown
    // (high streets first, then shopping districts, per list order).
    return HIGH_STREET_CORRIDORS.filter(
      (c) => c.dataKey && inData.has(c.dataKey)
    ).map((c) => ({ value: c.dataKey!, label: c.name }));
  }, [dataset]);

  const mapFocus = useMemo(() => {
    if (!dataset || highStreet === "all") return null;
    const first = getFirstMappedTenantForStreet(dataset, highStreet);
    if (!first?.lat || !first?.lng) return null;
    return {
      center: { lat: first.lat, lng: first.lng },
      zoom: STREET_FOCUS_ZOOM,
    };
  }, [dataset, highStreet]);

  return (
    <div className="app master-map-page">
      <FilterBar
        highStreets={highStreets}
        highStreet={highStreet}
        onHighStreetChange={setHighStreet}
        search={search}
        onSearchChange={setSearch}
        stats={stats}
      />
      <div className="master-map-page__toolbar">
        <Link className="master-map-page__back" to="/dashboard">
          ← Dashboard
        </Link>
        <ParkingLayerToggles
          showMeteredParking={showMeteredParking}
          showParkingLots={showParkingLots}
          onMeteredParkingChange={setShowMeteredParking}
          onParkingLotsChange={setShowParkingLots}
        />
        {dataset?.sourceFile && (
          <span className="master-map-page__source" title="CoStar export used for markers">
            Data: {dataset.sourceFile}
          </span>
        )}
      </div>
      <div className="app__map">
        <TenantMapView
          tenants={filtered}
          vacancies={filteredVacancies}
          autoFitBounds={highStreet === "all"}
          mapFocus={mapFocus}
          showMeteredParking={showMeteredParking}
          showParkingLots={showParkingLots}
        />
      </div>
    </div>
  );
}
