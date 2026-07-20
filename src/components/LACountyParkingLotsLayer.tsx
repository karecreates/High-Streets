import { InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import type { LACountyParkingLotSelection } from "../types/lacountyParkingLots";
import { addLACountyParkingLotsLayer } from "../utils/addLACountyParkingLotsLayer";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import { ParkingLotInfoWindowContent } from "./ParkingLotInfoWindowContent";

const PARKING_LOT_INFO_Z_INDEX = MAP_Z_INDEX.parkingInfo;

interface LACountyParkingLotsLayerProps {
  enabled?: boolean;
}

export function LACountyParkingLotsLayer({
  enabled = true,
}: LACountyParkingLotsLayerProps) {
  const map = useMap();
  const [selection, setSelection] = useState<LACountyParkingLotSelection | null>(
    null
  );
  const pinnedRef = useRef(false);

  useEffect(() => {
    if (!map || !enabled) return;

    const removeLayer = addLACountyParkingLotsLayer(map, {
      onSelect: (properties, position) => {
        pinnedRef.current = true;
        setSelection({ properties, position });
      },
    });

    return () => {
      pinnedRef.current = false;
      setSelection(null);
      removeLayer();
    };
  }, [map, enabled]);

  if (!selection) return null;

  return (
    <InfoWindow
      position={selection.position}
      zIndex={PARKING_LOT_INFO_Z_INDEX}
      onCloseClick={() => {
        pinnedRef.current = false;
        setSelection(null);
      }}
      onClose={() => {
        pinnedRef.current = false;
        setSelection(null);
      }}
      maxWidth={340}
    >
      <ParkingLotInfoWindowContent lot={selection.properties} />
    </InfoWindow>
  );
}
