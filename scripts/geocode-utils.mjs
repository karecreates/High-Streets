/** California high-street corridor bounds — reject geocodes outside this box */
const SOCAL_BOUNDS = {
  minLat: 32.4,
  maxLat: 37.2,
  minLng: -122.6,
  maxLng: -117.0,
};

/** Downtown / Arts District LA — prefer results in this tighter box */
const DTLA_BOUNDS = {
  minLat: 33.98,
  maxLat: 34.08,
  minLng: -118.28,
  maxLng: -118.22,
};

export function isInSouthernCalifornia(lat, lng) {
  return (
    lat >= SOCAL_BOUNDS.minLat &&
    lat <= SOCAL_BOUNDS.maxLat &&
    lng >= SOCAL_BOUNDS.minLng &&
    lng <= SOCAL_BOUNDS.maxLng
  );
}

export function isInDowntownLA(lat, lng) {
  return (
    lat >= DTLA_BOUNDS.minLat &&
    lat <= DTLA_BOUNDS.maxLat &&
    lng >= DTLA_BOUNDS.minLng &&
    lng <= DTLA_BOUNDS.maxLng
  );
}

/**
 * Normalize property addresses from CoStar export for Google Geocoding.
 * Strips building labels and anchors ambiguous downtown addresses to Los Angeles.
 */
const CITY_SUFFIX_RULES = [
  [/san diego|kettner|hawthorn|fourth ave|fifth ave/i, "San Diego, CA"],
  [/pasadena|fair oaks/i, "Pasadena, CA"],
  [/santa monica|(3rd|third)\s+st(reet)?\s+promenade|montana/i, "Santa Monica, CA"],
  [/venice|abbot kinney|california ave/i, "Venice, CA"],
  [/manhattan beach/i, "Manhattan Beach, CA"],
  [/beverly hills|rodeo|canon dr|wilshire/i, "Beverly Hills, CA"],
  // 3300-4200 Sunset is Silver Lake (LA); 8000+ is the West Hollywood strip
  [/^[34]\d{3}\s+(w(est)?\s+)?sunset\s+b(ou)?l(e)?v(ar)?d/i, "Los Angeles, CA"],
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

export function normalizeAddressForGeocoding(address) {
  let cleaned = address.trim();

  // "115-133 E 2nd St - The Promenade Lofts" → street address only
  cleaned = cleaned.replace(/\s+-\s+[^,]+$/i, "");

  // "2017 7th St" → "2017 E 7th St" (Arts District convention)
  cleaned = cleaned.replace(/^(\d+(?:-\d+)?)\s+7th\s+St\b/i, "$1 E 7th St");

  // "8100-8118 Melrose Ave" → anchor to street number
  cleaned = cleaned.replace(
    /^(\d+)-\d+\s+(Melrose\s+Ave\b.*)$/i,
    "$1 $2"
  );

  // Google only resolves rooftops on "Sunset Blvd" (no W prefix);
  // "3801 W Sunset Blvd" falls back to the route centroid.
  cleaned = cleaned
    .replace(/^(\d+)-\d+(\s+W(est)?\s+Sunset\s+B)/i, "$1$2")
    .replace(/\bW(est)?\s+(Sunset\s+B(ou)?l(e)?v(ar)?d)/i, "$2");

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

export function buildGeocodeUrl(address, apiKey) {
  const query = normalizeAddressForGeocoding(address);
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "us");
  url.searchParams.set("components", "administrative_area:CA|country:US");
  return url;
}

export function pickBestGeocodeResult(results, address = "") {
  if (!results?.length) return null;

  // Only bias toward the DTLA box for Arts District-style addresses;
  // otherwise route centroids (e.g. "Sunset Blvd") inside the box beat rooftops.
  const preferDtla = /arts district|e\s*\d*(st|nd|rd|th)\s+st|mateo|traction|hewitt/i.test(
    address
  );

  const scored = results.map((result) => {
    const { lat, lng } = result.geometry.location;
    let score = 0;
    if (preferDtla && isInDowntownLA(lat, lng)) score += 3;
    else if (isInSouthernCalifornia(lat, lng)) score += 1;
    else score -= 5;

    const type = result.geometry.location_type;
    if (type === "ROOFTOP") score += 3;
    else if (type === "RANGE_INTERPOLATED") score += 2;

    if (/los angeles/i.test(result.formatted_address ?? "")) score += 1;

    return { result, score, lat, lng };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score < 0) return null;

  return {
    lat: best.lat,
    lng: best.lng,
    locationType: best.result.geometry.location_type ?? "UNKNOWN",
    formattedAddress: best.result.formatted_address,
  };
}
