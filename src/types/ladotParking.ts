/** GeoJSON source id for LADOT metered parking (Mapbox-style naming for consistency). */
export const LADOT_METERED_PARKING_SOURCE = "ladot-metered-parking";

export interface LADOTParkingProperties {
  spaceId: string;
  blockface: string;
  meterType: string;
  rateType: string;
  rateRange: string;
  timeLimit: string;
}

export interface LADOTParkingPointFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: LADOTParkingProperties;
}

export interface LADOTParkingFeatureCollection {
  type: "FeatureCollection";
  features: LADOTParkingPointFeature[];
}

export interface LADOTParkingSelection {
  properties: LADOTParkingProperties;
  position: google.maps.LatLngLiteral;
}
