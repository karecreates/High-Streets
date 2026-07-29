import { useRef } from "react";
import { useParams } from "react-router-dom";
import { PillButton } from "../components/PillButton";
import { ShoppingCenterMapView } from "../components/ShoppingCenterMapView";
import { StaticModeChrome } from "../components/StaticModeChrome";
import { getCorridorBySlug } from "../data/highStreets";
import { getShoppingCenter } from "../data/shoppingCenters";
import { useStaticMapMode } from "../hooks/useStaticMapMode";

export function ShoppingCenterMapPage() {
  const { slug } = useParams<{ slug: string }>();
  const corridor = slug ? getCorridorBySlug(slug) : undefined;
  const center = slug ? getShoppingCenter(slug) : undefined;
  const mapFrameRef = useRef<HTMLDivElement>(null);
  const { staticMode, enterStaticMode, exitStaticMode } =
    useStaticMapMode(mapFrameRef);

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

        <ShoppingCenterMapView center={center} staticMode={staticMode} />
      </div>
    </div>
  );
}
