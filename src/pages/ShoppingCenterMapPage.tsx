import { useParams } from "react-router-dom";
import { PillButton } from "../components/PillButton";
import { ShoppingCenterMapView } from "../components/ShoppingCenterMapView";
import { getCorridorBySlug } from "../data/highStreets";
import { getShoppingCenter } from "../data/shoppingCenters";

export function ShoppingCenterMapPage() {
  const { slug } = useParams<{ slug: string }>();
  const corridor = slug ? getCorridorBySlug(slug) : undefined;
  const center = slug ? getShoppingCenter(slug) : undefined;

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
      <div className="map-fullscreen">
        <PillButton to={`/center/${slug}`} className="map-fullscreen__back">
          ← Back
        </PillButton>

        <ShoppingCenterMapView center={center} />
      </div>
    </div>
  );
}
