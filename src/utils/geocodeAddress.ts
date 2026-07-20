/** Browser + script shared geocoding helpers for California high streets */

const CORRIDOR_BOUNDS = {
  minLat: 32.4,
  maxLat: 37.2,
  minLng: -122.6,
  maxLng: -117.0,
};

const DTLA_BOUNDS = {
  minLat: 33.98,
  maxLat: 34.08,
  minLng: -118.28,
  maxLng: -118.22,
};

const CITY_SUFFIX_RULES: [RegExp, string][] = [
  [/san diego|kettner|hawthorn|fourth ave|fifth ave/i, "San Diego, CA"],
  [/pasadena|fair oaks/i, "Pasadena, CA"],
  [/santa monica|3rd street promenade|montana/i, "Santa Monica, CA"],
  [/venice|abbot kinney/i, "Venice, CA"],
  [/manhattan beach/i, "Manhattan Beach, CA"],
  [/beverly hills|rodeo|canon dr|wilshire/i, "Beverly Hills, CA"],
  [/west hollywood|sunset blvd/i, "West Hollywood, CA"],
  [/culver|washington blvd|venice blvd|bagley|hughes/i, "Culver City, CA"],
  [/encinitas|coast highway/i, "Encinitas, CA"],
  [/laguna beach|forest ave/i, "Laguna Beach, CA"],
  [/santa cruz/i, "Santa Cruz, CA"],
  [/studio city|ventura blvd|woodland hills/i, "Los Angeles, CA"],
  [/newport|corona del mar|coast hwy/i, "Newport Beach, CA"],
  [/colorado blvd/i, "Pasadena, CA"],
  [/broadway|figueroa|la brea|melrose|robertson|arts district/i, "Los Angeles, CA"],
];

export function isInCorridorBounds(lat: number, lng: number): boolean {
  return (
    lat >= CORRIDOR_BOUNDS.minLat &&
    lat <= CORRIDOR_BOUNDS.maxLat &&
    lng >= CORRIDOR_BOUNDS.minLng &&
    lng <= CORRIDOR_BOUNDS.maxLng
  );
}

export function normalizeAddressForGeocoding(address: string): string {
  let cleaned = address.trim();
  cleaned = cleaned.replace(/\s+-\s+[^,]+$/i, "");
  cleaned = cleaned.replace(/^(\d+(?:-\d+)?)\s+7th\s+St\b/i, "$1 E 7th St");

  cleaned = cleaned.replace(
    /^(\d+)-\d+\s+(Melrose\s+Ave\b.*)$/i,
    "$1 $2"
  );

  if (/,\s*[A-Za-z]{2,}/.test(cleaned)) {
    return cleaned.includes("USA") ? cleaned : `${cleaned}, USA`;
  }

  for (const [pattern, city] of CITY_SUFFIX_RULES) {
    if (pattern.test(cleaned)) {
      return `${cleaned}, ${city}, USA`;
    }
  }

  return `${cleaned}, Los Angeles, CA, USA`;
}

export function pickBestGeocodeResult(
  results: google.maps.GeocoderResult[]
): { lat: number; lng: number; locationType: string } | null {
  if (!results.length) return null;

  const scored = results.map((result) => {
    const lat = result.geometry.location.lat();
    const lng = result.geometry.location.lng();
    let score = 0;

    if (
      lat >= DTLA_BOUNDS.minLat &&
      lat <= DTLA_BOUNDS.maxLat &&
      lng >= DTLA_BOUNDS.minLng &&
      lng <= DTLA_BOUNDS.maxLng
    ) {
      score += 3;
    } else if (isInCorridorBounds(lat, lng)) {
      score += 1;
    } else {
      score -= 5;
    }

    const type = result.geometry.location_type;
    if (type === "ROOFTOP") score += 2;
    else if (type === "RANGE_INTERPOLATED") score += 1;

    if (/los angeles/i.test(result.formatted_address ?? "")) score += 1;

    return { score, lat, lng, locationType: type };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score < 0) return null;

  return {
    lat: best.lat,
    lng: best.lng,
    locationType: best.locationType,
  };
}

export type GeocodeCache = Record<
  string,
  { lat: number; lng: number; locationType?: string }
>;

export async function geocodeAddressWithGeocoder(
  geocoder: google.maps.Geocoder,
  address: string
): Promise<GeocodeCache[string] | null> {
  const query = normalizeAddressForGeocoding(address);
  const response = await geocoder.geocode({
    address: query,
    region: "US",
    componentRestrictions: { country: "US", administrativeArea: "CA" },
  });

  if (response.results?.length) {
    const picked = pickBestGeocodeResult(response.results);
    if (picked) return picked;
  }

  return null;
}
