import { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { PillButton } from "../components/PillButton";
import { ShoppingCenterDirectoryModal } from "../components/ShoppingCenterDirectoryModal";
import { StaticModeChrome } from "../components/StaticModeChrome";
import { TenantMapView } from "../components/TenantMap";
import {
  useAllStreetTenants,
  useAllStreetVacancies,
} from "../context/TenantsContext";
import { useStaticMapMode } from "../hooks/useStaticMapMode";
import { getCorridorBySlug } from "../data/highStreets";
import {
  getShoppingCenter,
  type ShoppingCenter,
} from "../data/shoppingCenters";
import {
  filterByProximity,
  NEARBY_TENANT_RADIUS_M,
} from "../utils/geoProximity";
import { getMasterMapId } from "../utils/mapConfig";
import { getNearbyShoppingCenters } from "../utils/mapContextOverlays";

export function ShoppingCenterMapPage() {
  const { slug } = useParams<{ slug: string }>();
  const corridor = slug ? getCorridorBySlug(slug) : undefined;
  const center = slug ? getShoppingCenter(slug) : undefined;
  const allTenants = useAllStreetTenants();
  const allVacancies = useAllStreetVacancies();
  const [directoryCenter, setDirectoryCenter] = useState<ShoppingCenter | null>(
    null
  );
  const mapFrameRef = useRef<HTMLDivElement>(null);
  const { staticMode, enterStaticMode, exitStaticMode } =
    useStaticMapMode(mapFrameRef);

  const nearbyTenants = useMemo(() => {
    if (!center) return [];
    return filterByProximity(
      allTenants,
      center.mapCenter,
      NEARBY_TENANT_RADIUS_M
    );
  }, [allTenants, center]);

  const nearbyVacancies = useMemo(() => {
    if (!center) return [];
    return filterByProximity(
      allVacancies,
      center.mapCenter,
      NEARBY_TENANT_RADIUS_M
    );
  }, [allVacancies, center]);

  const shoppingCenters = useMemo(() => {
    if (!center) return [];
    return getNearbyShoppingCenters(center.mapCenter, {
      alwaysIncludeSlug: center.slug,
    });
  }, [center]);

  const handleShoppingCenterSelect = useCallback((selected: ShoppingCenter) => {
    setDirectoryCenter(selected);
  }, []);

  if (!corridor?.active || !center) {
    return (
      <div className="street-page street-page--empty">
        <p>This map is not available yet.</p>
        <PillButton to="/dashboard">← Back to Dashboard</PillButton>
      </div>
    );
  }

  return (
    <div className="street-page street-page--map">
      <div
        ref={mapFrameRef}
        className={`map-fullscreen${staticMode ? " map-fullscreen--static" : ""}`}
      >
        {!staticMode ? (
          <PillButton to={`/center/${slug}`} className="map-fullscreen__back">
            ← Back
          </PillButton>
        ) : null}

        <StaticModeChrome
          staticMode={staticMode}
          onEnter={enterStaticMode}
          onExit={exitStaticMode}
        />

        <TenantMapView
          tenants={nearbyTenants}
          vacancies={nearbyVacancies}
          defaultCenter={center.mapCenter}
          defaultZoom={center.mapZoom}
          autoFitBounds={false}
          embedded
          displayMode="both"
          showMeteredParking={false}
          showParkingLots={false}
          mapIdOverride={getMasterMapId()}
          staticMode={staticMode}
          shoppingCenters={shoppingCenters}
          onShoppingCenterSelect={
            staticMode ? undefined : handleShoppingCenterSelect
          }
        />

        {directoryCenter && !staticMode ? (
          <ShoppingCenterDirectoryModal
            center={directoryCenter}
            onClose={() => setDirectoryCenter(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
