import { InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import type { LADOTParkingSelection } from "../types/ladotParking";
import { addLADOTParkingLayer } from "../utils/addLADOTParkingLayer";
import { fetchLADOTMeteredParking } from "../utils/fetchLADOTMeteredParking";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import { ParkingInfoWindowContent } from "./ParkingInfoWindowContent";

const PARKING_INFO_Z_INDEX = MAP_Z_INDEX.parkingInfo;

interface LADOTParkingLayerProps {
  enabled?: boolean;
}

export function LADOTParkingLayer({ enabled = true }: LADOTParkingLayerProps) {
  const map = useMap();
  const [selection, setSelection] = useState<LADOTParkingSelection | null>(
    null
  );
  const pinnedRef = useRef(false);

  useEffect(() => {
    if (!map || !enabled) return;

    let removeLayer: (() => void) | undefined;
    let cancelled = false;

    fetchLADOTMeteredParking()
      .then((featureCollection) => {
        if (cancelled) return;

        removeLayer = addLADOTParkingLayer(map, featureCollection, {
          onSelect: (properties, position) => {
            pinnedRef.current = true;
            setSelection({ properties, position });
          },
          onHover: (properties, position) => {
            if (pinnedRef.current) return;
            setSelection({ properties, position });
          },
          onHoverEnd: () => {
            if (pinnedRef.current) return;
            setSelection(null);
          },
        });
      })
      .catch((error) => {
        console.warn("LADOT metered parking failed to load:", error);
      });

    return () => {
      cancelled = true;
      pinnedRef.current = false;
      setSelection(null);
      removeLayer?.();
    };
  }, [map, enabled]);

  if (!selection) return null;

  return (
    <InfoWindow
      position={selection.position}
      zIndex={PARKING_INFO_Z_INDEX}
      onCloseClick={() => {
        pinnedRef.current = false;
        setSelection(null);
      }}
      onClose={() => {
        pinnedRef.current = false;
        setSelection(null);
      }}
      maxWidth={320}
    >
      <ParkingInfoWindowContent parking={selection.properties} />
    </InfoWindow>
  );
}
