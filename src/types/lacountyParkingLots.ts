/** GeoJSON source id for LA County parking lot polygons. */
export const LACOUNTY_PARKING_LOTS_SOURCE = "lacounty-parking-lots";

/** GeoJSON source id for LA County parking lot centroid labels. */
export const LACOUNTY_PARKING_LOTS_CENTROIDS_SOURCE =
  "lacounty-parking-lots-centroids";

export interface LACountyParkingLotProperties {
  fid: number;
  ain: string;
  useType: string;
  useDescription: string;
  /** Lot area in square feet (from Shape_STAr when available). */
  areaSqFt: number | null;
  /** Lot area in square meters (from Shape__Area). */
  areaSqM: number | null;
}

export interface LACountyParkingLotPolygonFeature {
  type: "Feature";
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  properties: LACountyParkingLotProperties;
}

export interface LACountyParkingLotCentroidFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: LACountyParkingLotProperties;
}

export interface LACountyParkingLotsCollection {
  type: "FeatureCollection";
  features: LACountyParkingLotPolygonFeature[];
}

export interface LACountyParkingLotCentroidsCollection {
  type: "FeatureCollection";
  features: LACountyParkingLotCentroidFeature[];
}

export interface LACountyParkingLotSelection {
  properties: LACountyParkingLotProperties;
  position: google.maps.LatLngLiteral;
}

export interface LACountyBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}
