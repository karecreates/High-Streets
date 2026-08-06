import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FilterBar } from "../components/FilterBar";
import {
  MapControlsBar,
  type CorridorSelectGroup,
  type MapDisplayMode,
} from "../components/MapControlsBar";
import { ShoppingCenterDirectoryModal } from "../components/ShoppingCenterDirectoryModal";
import { TenantMapView } from "../components/TenantMap";
import { useTenantsContext } from "../context/TenantsContext";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getCorridorBySlug,
  getCorridorDetail,
  HIGH_STREET_CORRIDORS,
} from "../data/highStreets";
import {
  getShoppingCenter,
  type ShoppingCenter,
} from "../data/shoppingCenters";
import { getMasterMapId } from "../utils/mapConfig";
import type { VacancyLocationGroup } from "../types/vacancy";
import { groupVacanciesByLocation } from "../utils/groupVacanciesByLocation";
import { isNamedTenant } from "../utils/tenantDisplay";
import {
  getFirstMappedTenantForStreet,
  STREET_FOCUS_ZOOM,
} from "../utils/streetMapFocus";
import {
  getActiveShoppingCenters,
  getStreetAndDistrictCallouts,
} from "../utils/mapContextOverlays";
import { SIDEBAR_TENANT_DATA_KEYS } from "../hooks/useTenants";

export function MasterMapPage() {
  const [searchParams] = useSearchParams();
  const {
    dataset,
    filtered,
    filteredVacancies,
    highStreet,
    setHighStreet,
    search,
    setSearch,
  } = useTenantsContext();
  const [corridorSlug, setCorridorSlug] = useState("all");
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>("both");
  const [showMeteredParking, setShowMeteredParking] = useState(false);
  const [showParkingLots, setShowParkingLots] = useState(false);
  const [focusedVacancyGroupKey, setFocusedVacancyGroupKey] = useState<
    string | null
  >(null);
  const [directoryCenter, setDirectoryCenter] = useState<ShoppingCenter | null>(
    null
  );
  const [focusNonce, setFocusNonce] = useState(0);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

  const shoppingCenters = useMemo(() => getActiveShoppingCenters(), []);

  const shoppingCenterPositions = useMemo(
    () => shoppingCenters.map((c) => c.mapCenter),
    [shoppingCenters]
  );

  const corridorCallouts = useMemo(
    () => getStreetAndDistrictCallouts(),
    []
  );

  const overviewFitPositions = useMemo(
    () => [
      ...shoppingCenterPositions,
      ...corridorCallouts.map((location) => location.position),
    ],
    [corridorCallouts, shoppingCenterPositions]
  );

  useEffect(() => {
    const paramSlug = searchParams.get("corridor");
    if (!paramSlug) return;
    const corridor = getCorridorBySlug(paramSlug);
    if (!corridor) return;
    setCorridorSlug(corridor.slug);
    if (corridor.dataKey) {
      setHighStreet(corridor.dataKey);
    } else if (corridor.category === "shopping-centers") {
      setHighStreet("all");
    }
  }, [searchParams, setHighStreet]);

  const corridorGroups = useMemo((): CorridorSelectGroup[] => {
    return CATEGORY_ORDER.map((category) => ({
      label: CATEGORY_LABELS[category],
      options: HIGH_STREET_CORRIDORS.filter((c) => {
        if (c.category !== category || !c.active) return false;
        if (c.category === "shopping-centers") {
          return Boolean(getShoppingCenter(c.slug));
        }
        return Boolean(c.dataKey) && SIDEBAR_TENANT_DATA_KEYS.has(c.dataKey!);
      }).map((c) => ({ value: c.slug, label: c.name })),
    })).filter((group) => group.options.length > 0);
  }, []);

  const focusShoppingCenter = useCallback(
    (center: ShoppingCenter, options?: { openDirectory?: boolean }) => {
      setCorridorSlug(center.slug);
      const corridor = getCorridorBySlug(center.slug);
      setHighStreet(corridor?.dataKey ?? "all");
      setFocusNonce((n) => n + 1);
      if (options?.openDirectory) {
        setDirectoryCenter(center);
      } else {
        setDirectoryCenter(null);
      }
    },
    [setHighStreet]
  );

  const handleShoppingCenterLogoClick = useCallback(
    (center: ShoppingCenter) => {
      focusShoppingCenter(center, { openDirectory: true });
    },
    [focusShoppingCenter]
  );

  const handleCorridorChange = useCallback(
    (slug: string) => {
      setCorridorSlug(slug);
      if (slug === "all") {
        setHighStreet("all");
        setDirectoryCenter(null);
        return;
      }

      const corridor = getCorridorBySlug(slug);
      if (!corridor) return;

      if (corridor.category === "shopping-centers") {
        const center = getShoppingCenter(corridor.slug);
        if (center) {
          focusShoppingCenter(center);
          return;
        }
      }

      setDirectoryCenter(null);
      if (corridor.dataKey) {
        setHighStreet(corridor.dataKey);
        setFocusNonce((n) => n + 1);
      }
    },
    [focusShoppingCenter, setHighStreet]
  );

  const mapFocus = useMemo(() => {
    const selected =
      corridorSlug !== "all" ? getCorridorBySlug(corridorSlug) : undefined;

    if (selected?.category === "shopping-centers") {
      const center = getShoppingCenter(selected.slug);
      if (center) {
        return {
          center: center.mapCenter,
          zoom: center.mapZoom,
          nonce: focusNonce,
        };
      }
    }

    if (!dataset || highStreet === "all") return null;

    const detail = selected ? getCorridorDetail(selected.slug) : undefined;
    if (detail?.mapCenter) {
      return {
        center: detail.mapCenter,
        zoom: detail.mapZoom ?? STREET_FOCUS_ZOOM,
        nonce: focusNonce,
      };
    }

    const first = getFirstMappedTenantForStreet(dataset, highStreet);
    if (!first?.lat || !first?.lng) return null;
    return {
      center: { lat: first.lat, lng: first.lng },
      zoom: STREET_FOCUS_ZOOM,
      nonce: focusNonce,
    };
  }, [corridorSlug, dataset, focusNonce, highStreet]);

  const vacancyGroups = useMemo(
    () => groupVacanciesByLocation(filteredVacancies),
    [filteredVacancies]
  );

  const tenantsCount = useMemo(
    () =>
      filtered.filter(
        (tenant) =>
          tenant.lat != null &&
          tenant.lng != null &&
          isNamedTenant(tenant.tenantName)
      ).length,
    [filtered]
  );

  const handleVacancyFocus = useCallback(
    (group: VacancyLocationGroup) => {
      if (displayMode === "tenants") {
        setDisplayMode("both");
      }
      setFocusedVacancyGroupKey(null);
      window.requestAnimationFrame(() => {
        setFocusedVacancyGroupKey(group.key);
      });
    },
    [displayMode]
  );

  const handleVacancyFocusComplete = useCallback(() => {
    setFocusedVacancyGroupKey(null);
  }, []);

  return (
    <div
      className={`app master-map-page${
        mobileControlsOpen ? " master-map-page--controls-open" : ""
      }`}
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        controls={
          <MapControlsBar
            variant="inline"
            tenantsCount={tenantsCount}
            vacancyGroups={vacancyGroups}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            onVacancyFocus={handleVacancyFocus}
            showMeteredParking={showMeteredParking}
            showParkingLots={showParkingLots}
            onMeteredParkingChange={setShowMeteredParking}
            onParkingLotsChange={setShowParkingLots}
            corridorGroups={corridorGroups}
            corridorValue={corridorSlug}
            onCorridorChange={handleCorridorChange}
          />
        }
      />
      <div className="master-map-page__toolbar">
        <Link className="master-map-page__back" to="/dashboard">
          ← Dashboard
        </Link>
        <button
          type="button"
          className="master-map-page__controls-toggle"
          aria-expanded={mobileControlsOpen}
          onClick={() => setMobileControlsOpen((open) => !open)}
        >
          {mobileControlsOpen ? "Hide filters" : "Map filters"}
        </button>
        {dataset?.sourceFile && (
          <span
            className="master-map-page__source"
            title="CoStar export used for markers"
          >
            Data: {dataset.sourceFile}
          </span>
        )}
      </div>
      <div className="app__map">
        <TenantMapView
          tenants={filtered}
          vacancies={filteredVacancies}
          autoFitBounds={highStreet === "all" && corridorSlug === "all"}
          mapFocus={mapFocus}
          displayMode={displayMode}
          focusedVacancyGroupKey={focusedVacancyGroupKey}
          onVacancyFocusComplete={handleVacancyFocusComplete}
          showMeteredParking={showMeteredParking}
          showParkingLots={showParkingLots}
          shoppingCenters={shoppingCenters}
          onShoppingCenterSelect={handleShoppingCenterLogoClick}
          extraFitPositions={overviewFitPositions}
          zoomGatedStreetMarkers
          corridorCallouts={corridorCallouts}
          onCorridorCalloutSelect={handleCorridorChange}
          forceShowStreetMarkers={search.trim().length > 0}
          mapIdOverride={getMasterMapId()}
        />
        {directoryCenter ? (
          <ShoppingCenterDirectoryModal
            center={directoryCenter}
            onClose={() => setDirectoryCenter(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
