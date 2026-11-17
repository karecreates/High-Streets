/**
 * Curated "Major Tenants" allowlists by corridor slug.
 * When present, the map toggle filters to these names (exact, case-insensitive)
 * instead of the Brandfetch logo heuristic.
 */
export const MAJOR_TENANTS_BY_SLUG: Record<string, readonly string[]> = {
  "abbot-kinney": [
    "Everlane",
    "Blue Bottle Coffee",
    "Away",
    "Vuori",
    "Mejuri",
    "Rag & Bone",
    "Lululemon Athletica",
    "Suit Supply",
    "Marine Layer",
    "Madewell",
    "Joe & The Juice",
    "Birkenstock",
    "JINS",
    "Aviator Nation",
    "Alo Yoga",
    "Intelligentsia Coffee",
    "Hoka",
    "Todd Snyder",
    "J Crew",
    "Faherty Brand",
    "Adidas",
    "Vince",
    "Salt & Straw",
    "gorjana",
    "Ray Ban",
    "Warby Parker",
    "Aesop",
    "Buck Mason",
    "FP Movement",
    "Alfred Coffee",
    "Levain Bakery",
    "Erewhon Market",
    "Oakberry",
    "All'antico Vinaio",
    "Heist",
    "THE GREAT",
    "Baggu",
    "VEJA",
    "Carbon2Cobalt",
    "Arc'teryx",
    "Ahlem",
    "Le Labo Fragrances",
    "Bombas",
    "Circular Library",
    "Monos",
    "FLANNEL",
    "Cookman",
    "Farm Rio",
    "Velvet by Graham & Spencer",
    "Astrid and Miyu",
    "Our Place",
    "The goodr Cabana",
    "Credo Beauty",
    "Peak Design",
    "D.S. & DURGA",
    "Ruti",
    "Left on Friday",
    "Burro",
    "Alohas",
    "On Cloud",
    "Topdrawer",
    "Zadig & Voltaire",
    "Garrett Leight California Optical",
    "RESA",
    "Shinola",
    "Frankies Bikinis",
    "Framebridge",
    "Studs",
  ],
  "third-street-promenade": [
    "John Reed Fitness",
    "Chipotle",
    "Sephora",
    "AMC Entertainment",
    "Victoria's Secret",
    "Barnes & Noble",
    "Yogurtland",
    "Skechers",
    "Adidas",
    "Zara",
    "Patagonia",
    "WILSON",
    "Lids",
    "Oakley",
    "Beyond Yoga",
    "Raising Canes",
    "Apple Store",
    "Alo Yoga",
    "Vans Inc. (VF Sportswear)",
    "Uniqlo",
    "JD Sports",
    "Urban Outfitters",
    "Pac Sun",
    "Lululemon Athletica",
    "Silverlake Ramen",
    "McConnell's Fine Ice Creams",
    "Pandora",
    "Google Store",
  ],
  /** Beverly Hills Golden Triangle — curated major tenants (full-size like Abbot Kinney). */
  "golden-triangle": [
    "Christian Louboutin",
    "Wally's",
    "Hermes of Paris",
    "Chanel Fragrance and Beauty Boutique",
    "Alo Yoga",
    "James Perse",
    "Sam Edelman",
    "Geary's Beverly Hills",
    "Lululemon Athletica",
    "Cartier Inc.",
    "Wilson Sporting Goods",
    "Tom Ford",
    "Dolce & Gabbana, D&G",
    "Sephora",
    "Salvatore Ferragamo",
    "Balenciaga",
    "Louis Vuitton",
    "Gucci",
    "Prada",
    "Jimmy Choo",
    "Christian Dior",
    "Burberry",
    "Fendi",
    "Erewhon Market",
    "Rolex",
    "Loewe",
    "St. John Knits",
    "What Goes Around Comes Around",
    "All Saints",
    "Reformation",
    "Alice + Olivia",
    "Veronica Beard",
    "Pura Vida Miami",
    "Favorite Daughter",
    "Kitson",
  ],
  "old-town-pasadena": [
    "Apple",
    "TESLA",
    "Tiffany & Co",
    "Lululemon Athletica",
    "RH",
    "Crate & Barrel",
    "Urban Outfitters",
    "Free People",
    "Abercrombie & Fitch",
    "J Crew",
    "Madewell",
    "Arc'teryx",
    "Pandora Jewelry",
    "Warby Parker",
    "Foot Locker",
    "Dr. Martens",
    "Banana Republic Factory",
    "Sunglass Hut",
    "Eileen Fisher",
    "Room & Board",
    "Herman Miller",
    "Tempur-Pedic",
    "Lovesac",
    "Rivian Automotive",
    "Lucid Motors",
  ],
  "santa-monica-place": [
    "All Saints",
    "Club Studio",
    "Din Tai Fung",
    "ELIE TAHARI",
    "Hugo Boss",
    "Intimissimi",
    "Johnny Was",
    "Nike",
    "Paige",
    "Solstice Sunglasses",
    "Taranis",
    "Tenshoppe",
    "TESLA",
    "The Cheesecake Factory",
    "Tumi",
  ],
  /** Melrose Ave & Melrose Place — curated luxury / contemporary logos. */
  melrose: [
    "Ralph Lauren",
    "Bottega Veneta",
    "The Row",
    "Maison Margiela",
    "Chloé",
    "Vivienne Westwood",
    "Balmain",
    "Oscar de la Renta",
    "Golden Goose",
    "Adidas",
    "Isabel Marant",
    "Apc",
    "Reformation",
    "TheRealReal",
    "Glossier",
    "Love Shack Fancy",
    "STAUD",
    "Cult Gaia",
    "House Of Cb",
    "Mejuri",
    "L'Agence",
    "Agolde",
    "Monique Lhuillier",
    "G-Star",
    "Reebok LAB",
    "Rag & Bone",
    "Alice & Olivia",
    "On",
    "lululemon",
    "Vince",
    "RH",
    "Salomon",
    "The Great",
    "Sporty & Rich",
    "Fear of God",
  ],
  "la-brea": [
    "Aether Apparel",
    "Arc'teryx",
    "Carhartt",
    "Nudie Jeans",
    "Avec Les Filles",
    "EB Denim",
    "Fjall Raven",
    "Japan LA",
    "Stone Island",
    "Stussy",
    "Undefeated",
    "FA skate shop",
    "District La Brea",
    "Sweetgreen",
    "Trader Joe's",
  ],
  larchmont: [
    "Aesop",
    "Diptyque",
    "Beyond Yoga",
    "Buck Mason",
    "Blue Mercury",
    "DUER",
    "Faherty Brand",
    "Freda Salvador",
    "Rothy's",
    "WITTMORE",
    "Velvet by Graham & Spencer",
    "Chevalier's Books",
    "Levain Bakery",
    "Pressed Juicery",
  ],
  montana: [
    "Aesop",
    "Warby Parker",
    "Williams-Sonoma",
    "Free People",
    "Whole Foods",
    "Sweetgreen",
    "Kiehl's",
    "Benefit Cosmetics & Blowouts by Benefit",
    "FACEGYM",
    "Dry Bar",
    "Peet's Coffee & Tea",
    "Starbucks",
    "Kreation Organic",
    "Brooklinen",
    "Casper",
    "Ele Keats Jewelry",
    "Geek Eyewear",
    "The Shade Store, Inc.",
    "J. McLaughlin",
    "Van Leeuwen",
    "Bluemercury, Inc.",
    "Paper Source",
    "Jones Road Beauty",
    "Eileen Fisher",
    "Moscot",
    "Framebridge",
    "La La Land Kind Cafe",
    "Bread Head",
    "Nordstrom Local",
    "Visual Comfort & Co",
    "Fireclay Tile",
    "Farrow & Ball Santa Monica Showroom",
    "Sundays Furniture",
    "Avocado Green Mattress",
    "Naked Cashmere",
    "Malia Mills",
    "Ernesta",
    "Clare V.",
    "FLANNEL",
    "Margaret O'Leary",
    "Only Hearts",
    "Pink Chicken",
    "Unsubscribed",
  ],
  robertson: [
    "Alfred Coffee",
    "Blue Bottle Coffee",
    "Starbucks",
    "H.Lorenzo",
    "James Perse",
    "Kitson",
    "Armani Casa",
    "Boffi Los Angeles",
    "Cassina",
    "Duxiana",
    "Herman Miller",
    "Technogym",
    "The Ivy",
    "The Henry",
    "Box Union",
    "Leica Store and Gallery",
    "Z Gallerie",
    "Poliform",
  ],
  "silver-lake": [
    "Aesop",
    "Madewell",
    "Free People",
    "Warby Parker",
    "New Balance",
    "Le Labo Fragrances",
    "Garrett Leight California Optical",
    "A.P.C.",
    "Baggu",
    "Buck Mason",
    "Clare V",
    "Filson",
    "Undefeated",
    "Sunspel",
    "Erewhon Market",
    "AKILA Eyewear",
  ],
  "studio-city": [
    "Lululemon",
    "Sephora",
    "Athleta",
    "Urban Outfitters",
    "Free People",
    "Warby Parker",
    "gorjana",
    "Aesop",
    "Buck Mason",
    "Bluemercury, Inc.",
    "Barnes & Noble",
    "Calleen Cordero",
    "M. FREDRIC",
    "Crossroads Trading Company",
    "Blue Bottle Coffee",
    "Trader Joe's",
    "Chico's",
    "Paper Source",
    "Big 5 Sporting Goods",
  ],
  "la-arts-district": [
    "Alfred Coffee",
    "Blue Bottle Coffee",
    "Eightfold Coffee",
    "Groundwork Coffee",
    "Verve Coffee",
    "Le Labo",
    "Alchemy Works",
    "Salt & Straw",
    "Van Leeuwen",
    "Tatsu Ramen",
    "PIZZANISTA!",
    "Prince Street Pizza",
    "Urth Caffe",
    "Zinc Cafe",
    "Kreation Juicery & Avoholic Bar",
    "Arts District Brewing Co",
    "Wurstkuche",
    "Yeastie Boys",
    "Community Made",
    "Breadlam",
  ],
  "downtown-la": [
    "Zara",
    "H&M",
    "Sephora",
    "Urban Outfitters",
    "Foot Locker",
    "Sunglass Hut",
    "West Elm",
    "Aesop",
    "Mango",
    "Victoria's Secret",
    "Nordstrom Rack",
    "Bath and Body Works",
    "Skechers",
    "Gentle Monster Los Angeles",
    "M.A.C",
    "Target",
    "Blue Bottle Coffee",
    "Sweetgreen",
    "Bottega Louie",
    "Sugarfish",
  ],
  "culver-city": [
    "In-N-Out Burger",
    "Joe & The Juice",
    "Trader Joe's",
    "Ippudo",
    "Cava Grill",
    "Tender Greens",
    "Drybar",
    "Caffe Luxxe",
    "The Culver Hotel",
    "Citizen Public Market",
    "Honey's Kettle Fried Chicken",
    "Village Well Books & Coffee",
    "Breakfast Republic",
    "Bacari Restaurants",
    "Rocco's Tavern",
    "Cafe Vida",
    "The Coffee Bean & Tea Leaf",
    "Aldea Home & Baby",
    "Cold Stone Creamery",
    "Public School 310",
  ],
  "downtown-manhattan-beach": [
    "Vuori",
    "Free People",
    "Beyond Yoga",
    "Pressed Juicery",
    "Starbucks",
    "Kreation Organic",
    "Estell Boutique",
    "Nati Boutique",
    "Bluestone Lane Café",
    "Goodboybob Coffee Roasters",
    "Pasha Fine Jewelry",
    "Manhattan Denim",
    "Ya Ya's Boutique",
    "Uncorked The Wine Shop",
    "Skechers",
    "SLAY Italian Kitchen",
    "Rock'N Fish Restaurant",
    "Dash Dashi Sushi and Sake Bar",
    "All Seasons Skincare",
    "Manhattan Pizzeria",
  ],
  "sunset-strip": [
    "SKIMS",
    "Badgley Mischka Retail",
    "Oliver Peoples Los Angeles",
    "Patrick Ta Beauty",
    "KITH",
    "ELAINE KIM",
    "Leset",
    "Ron Dorff",
    "FP Journe",
    "David Orgell",
    "Joe & The Juice",
    "Sweetgreen",
    "Pura Vida Miami",
    "Andrea's Fashion",
    "Drybar",
    "SoulCycle",
    "Equinox",
    "Samina 13 Jewelry",
    "Philip Press Master Jewelers",
  ],
};

/**
 * Shopping-center maps that reuse Old Town Pasadena's curated majors
 * (same Colorado Blvd dataset, occupied logos only).
 */
export const OLD_TOWN_PASADENA_MAJOR_ALIAS_SLUGS = new Set([
  "one-colorado",
  "the-paseo",
]);

/** Resolve alias slugs to the corridor whose allowlist / layout they share. */
export function resolveMajorTenantLayoutSlug(
  slug: string | undefined
): string | undefined {
  if (!slug) return undefined;
  return OLD_TOWN_PASADENA_MAJOR_ALIAS_SLUGS.has(slug)
    ? "old-town-pasadena"
    : slug;
}

/** Corridors that should open the map with Major Tenants already on. */
export const MAJOR_TENANTS_DEFAULT_ON = new Set([
  "abbot-kinney",
  "third-street-promenade",
  "golden-triangle",
  "old-town-pasadena",
  "one-colorado",
  "the-paseo",
  "melrose",
  "la-brea",
  "larchmont",
  "montana",
  "robertson",
  "silver-lake",
  "studio-city",
  "la-arts-district",
  "downtown-la",
  "culver-city",
  "downtown-manhattan-beach",
  "sunset-strip",
]);

/**
 * Major-tenant packing: keep stems short, and park logos off the street axis.
 * `horizontal` = left/right (north–south streets). `vertical` = above/below.
 */
export const MAJOR_TENANT_PACK_BY_SLUG: Record<
  string,
  { sides: "horizontal" | "vertical"; maxStem: number }
> = {
  "la-brea": { sides: "horizontal", maxStem: 24 },
  larchmont: { sides: "horizontal", maxStem: 36 },
  robertson: { sides: "horizontal", maxStem: 24 },
  "silver-lake": { sides: "horizontal", maxStem: 24 },
  "la-arts-district": { sides: "horizontal", maxStem: 24 },
  "downtown-la": { sides: "horizontal", maxStem: 24 },
  // Montana is fully hand-placed (see MAJOR_TENANT_LAYOUT_OVERRIDES_BY_SLUG);
  // the pack only governs any future major without an override.
  "abbot-kinney": { sides: "vertical", maxStem: 160 },
  montana: { sides: "vertical", maxStem: 60 },
  "studio-city": { sides: "vertical", maxStem: 36 },
  "sunset-strip": { sides: "vertical", maxStem: 36 },
  "culver-city": { sides: "vertical", maxStem: 32 },
  "downtown-manhattan-beach": { sides: "vertical", maxStem: 20 },
};

/** Co-located major-tenant pins: spread along the street axis. */
export const MAJOR_TENANT_SPREAD_BY_SLUG: Record<
  string,
  { bearingDeg: number; spacingMeters: number }
> = {
  "golden-triangle": { bearingDeg: -40, spacingMeters: 12 },
  "old-town-pasadena": { bearingDeg: 90, spacingMeters: 16 },
  "one-colorado": { bearingDeg: 90, spacingMeters: 16 },
  "the-paseo": { bearingDeg: 90, spacingMeters: 16 },
  melrose: { bearingDeg: 90, spacingMeters: 28 },
  "studio-city": { bearingDeg: 90, spacingMeters: 16 },
  "sunset-strip": { bearingDeg: 90, spacingMeters: 16 },
  "culver-city": { bearingDeg: 90, spacingMeters: 16 },
  "downtown-manhattan-beach": { bearingDeg: 90, spacingMeters: 16 },
  "la-brea": { bearingDeg: 0, spacingMeters: 14 },
  larchmont: { bearingDeg: 0, spacingMeters: 14 },
  robertson: { bearingDeg: 0, spacingMeters: 14 },
  "silver-lake": { bearingDeg: 0, spacingMeters: 14 },
  "downtown-la": { bearingDeg: 0, spacingMeters: 14 },
  "la-arts-district": { bearingDeg: 0, spacingMeters: 14 },
};

/**
 * Corridors whose major-tenant pins stay as one grouped callout per address
 * (co-located brands share a stacked logo box instead of fanning out).
 */
export const MAJOR_TENANT_KEEP_GROUPED_SLUGS = new Set(["abbot-kinney", "montana"]);

/**
 * Fold neighbouring majors into one grouped callout anchored on `anchor`
 * (e.g. the three 1402-1412 Montana storefronts). Keeps the frame readable
 * where storefront pins sit only a few metres apart.
 */
export const MAJOR_TENANT_MERGE_GROUPS_BY_SLUG: Record<
  string,
  Array<{ anchor: string; members: string[] }>
> = {
  montana: [
    { anchor: "Aesop", members: ["Van Leeuwen"] },
    { anchor: "Bluemercury, Inc.", members: ["Paper Source", "Jones Road Beauty"] },
    { anchor: "Bread Head", members: ["Kiehl's", "Eileen Fisher", "Pink Chicken"] },
    { anchor: "Sweetgreen", members: ["Moscot"] },
    {
      anchor: "Visual Comfort & Co",
      members: ["Fireclay Tile", "Farrow & Ball Santa Monica Showroom"],
    },
    {
      anchor: "Avocado Green Mattress",
      members: ["Naked Cashmere", "Malia Mills"],
    },
    {
      anchor: "Peet's Coffee & Tea",
      members: ["Only Hearts", "FLANNEL"],
    },
    { anchor: "Ernesta", members: ["Clare V.", "Free People"] },
  ],
  "abbot-kinney": [
    { anchor: "Vuori", members: ["Arc'teryx"] },
    { anchor: "Le Labo Fragrances", members: ["Bombas"] },
    { anchor: "Aviator Nation", members: ["Monos"] },
    {
      anchor: "Credo Beauty",
      members: ["Peak Design", "D.S. & DURGA", "Ruti"],
    },
    { anchor: "Rag & Bone", members: ["Lululemon Athletica"] },
    {
      anchor: "Blue Bottle Coffee",
      members: ["Away", "Everlane", "THE GREAT"],
    },
    { anchor: "Joe & The Juice", members: ["Birkenstock"] },
    {
      anchor: "Our Place",
      members: ["The goodr Cabana", "J Crew", "Faherty Brand"],
    },
    { anchor: "Warby Parker", members: ["On Cloud"] },
    { anchor: "Shinola", members: ["Buck Mason"] },
    { anchor: "Frankies Bikinis", members: ["RESA"] },
    { anchor: "Left on Friday", members: ["Burro"] },
    { anchor: "FP Movement", members: ["Framebridge"] },
    { anchor: "Alfred Coffee", members: ["Studs"] },
  ],
};

/** Manual callout tweaks for dense clusters (anchors stay on true lat/lng). */
export interface MajorTenantLayoutOverride {
  placement?: "above" | "below" | "left" | "right";
  /** Negative = left of pin; positive = right. Used with above/below only. */
  offsetX?: number;
  stemHeight?: number;
  /** Shrink/grow the logo box (1 = default). */
  scale?: number;
}

export const MAJOR_TENANT_LAYOUT_OVERRIDES_BY_SLUG: Record<
  string,
  Record<string, MajorTenantLayoutOverride>
> = {
  "abbot-kinney": {
    "blue bottle coffee": { placement: "above", offsetX: 0, stemHeight: 20, scale: 0.72 },
    away: { placement: "above", offsetX: 0, stemHeight: 20, scale: 0.72 },
    everlane: { placement: "above", offsetX: 0, stemHeight: 20, scale: 0.72 },
    gorjana: { placement: "above", offsetX: 0, stemHeight: 12 },
    madewell: { placement: "above", stemHeight: 16 },
    jins: { placement: "above", stemHeight: 112, scale: 0.72 },
    "circular library": { placement: "above", stemHeight: 112, scale: 0.72 },
    flannel: { placement: "above", stemHeight: 112, scale: 0.72 },
    cookman: { placement: "above", stemHeight: 112, scale: 0.72 },
    "joe & the juice": { placement: "right", stemHeight: 10, scale: 0.72 },
    "ray ban": { placement: "above", stemHeight: 14 },
    "rag & bone": { placement: "above", stemHeight: 16, offsetX: 0, scale: 0.72 },
    "marine layer": { placement: "below", stemHeight: 120 },
    "suit supply": { placement: "below", stemHeight: 48 },
    "lululemon athletica": {
      placement: "above",
      stemHeight: 16,
      offsetX: 0,
      scale: 0.72,
    },
    "all'antico vinaio": { placement: "above", offsetX: 0, stemHeight: 168, scale: 0.72 },
    ahlem: { placement: "above", offsetX: 0, stemHeight: 168, scale: 0.72 },
    hoka: { placement: "above", stemHeight: 14, scale: 0.72 },
    "intelligentsia coffee": { placement: "above", stemHeight: 14, scale: 0.72 },
    "velvet by graham & spencer": { placement: "above", stemHeight: 14, scale: 0.72 },
    "astrid and miyu": { placement: "above", stemHeight: 14, scale: 0.72 },
    birkenstock: { placement: "right", stemHeight: 10, scale: 0.72 },
    adidas: { placement: "above", stemHeight: 72, scale: 0.72 },
    vince: { placement: "above", stemHeight: 72, scale: 0.72 },
    "salt & straw": { placement: "above", stemHeight: 72, scale: 0.72 },
    "todd snyder": { placement: "below", stemHeight: 12 },
    "alfred coffee": { placement: "above", stemHeight: 12, scale: 0.72 },
    studs: { placement: "above", stemHeight: 12, scale: 0.72 },
    "buck mason": { placement: "above", offsetX: 0, stemHeight: 88, scale: 0.72 },
    "fp movement": { placement: "below", stemHeight: 12, scale: 0.72 },
    framebridge: { placement: "below", stemHeight: 12, scale: 0.72 },
    "erewhon market": { placement: "above", offsetX: 0, stemHeight: 16 },
    // New CSV storefronts — Montana-style short stems, grouped neighbours.
    heist: { placement: "left", stemHeight: 28 },
    "the great": { placement: "above", offsetX: 0, stemHeight: 20, scale: 0.72 },
    baggu: { placement: "below", stemHeight: 16, offsetX: -36, scale: 0.72 },
    veja: { placement: "below", stemHeight: 16, offsetX: -36, scale: 0.72 },
    vuori: { placement: "below", stemHeight: 160, offsetX: 0, scale: 0.72 },
    mejuri: { placement: "below", stemHeight: 160, offsetX: 0, scale: 0.72 },
    carbon2cobalt: { placement: "below", stemHeight: 160, offsetX: 0, scale: 0.72 },
    "arc'teryx": { placement: "below", stemHeight: 160, offsetX: 0, scale: 0.72 },
    "le labo fragrances": { placement: "above", stemHeight: 16, offsetX: 40, scale: 0.72 },
    bombas: { placement: "above", stemHeight: 16, offsetX: 40, scale: 0.72 },
    "aviator nation": { placement: "above", stemHeight: 14, scale: 0.72 },
    monos: { placement: "above", stemHeight: 14, scale: 0.72 },
    "alo yoga": { placement: "below", stemHeight: 14 },
    "farm rio": { placement: "below", stemHeight: 14, offsetX: -36 },
    "j crew": { placement: "below", offsetX: -80, stemHeight: 50, scale: 0.72 },
    "faherty brand": { placement: "below", offsetX: -80, stemHeight: 50, scale: 0.72 },
    "our place": { placement: "below", offsetX: -80, stemHeight: 50, scale: 0.72 },
    "the goodr cabana": {
      placement: "below",
      offsetX: -80,
      stemHeight: 50,
      scale: 0.72,
    },
    "credo beauty": { placement: "below", stemHeight: 145, offsetX: 0, scale: 0.72 },
    "peak design": { placement: "below", stemHeight: 145, offsetX: 0, scale: 0.72 },
    "d.s. & durga": { placement: "below", stemHeight: 145, offsetX: 0, scale: 0.72 },
    ruti: { placement: "below", stemHeight: 145, offsetX: 0, scale: 0.72 },
    "left on friday": { placement: "above", stemHeight: 14, offsetX: -24, scale: 0.72 },
    burro: { placement: "above", stemHeight: 14, offsetX: -24, scale: 0.72 },
    alohas: { placement: "below", stemHeight: 14 },
    "warby parker": { placement: "below", offsetX: 0, stemHeight: 80, scale: 0.72 },
    "on cloud": { placement: "below", offsetX: 0, stemHeight: 80, scale: 0.72 },
    oakberry: { placement: "above", stemHeight: 12 },
    aesop: { placement: "below", stemHeight: 16, scale: 0.72 },
    topdrawer: { placement: "below", stemHeight: 16, scale: 0.72 },
    "zadig & voltaire": { placement: "above", stemHeight: 14 },
    "garrett leight california optical": { placement: "above", stemHeight: 14 },
    resa: { placement: "above", offsetX: 0, stemHeight: 20, scale: 0.72 },
    shinola: { placement: "above", offsetX: 0, stemHeight: 88, scale: 0.72 },
    "frankies bikinis": { placement: "above", offsetX: 0, stemHeight: 20, scale: 0.72 },
    "levain bakery": { placement: "below", stemHeight: 14 },
  },
  /**
   * Third Street Promenade — Abbot Kinney style:
   * full-size logos, short stems, UP/DOWN + intentional LEFT/RIGHT.
   * Co-located pairs are separate pins (one above, one below).
   */
  "third-street-promenade": {
    // North / east
    "john reed fitness": { placement: "above", stemHeight: 12 },
    chipotle: { placement: "above", stemHeight: 14, offsetX: 48 },
    sephora: { placement: "below", stemHeight: 12 },
    "victoria's secret": { placement: "above", stemHeight: 12 },
    // Same above/below sandwich as Patagonia / Wilson
    "silverlake ramen": { placement: "above", stemHeight: 12 },
    yogurtland: { placement: "below", stemHeight: 12 },
    adidas: { placement: "above", stemHeight: 12, offsetX: 80 },
    patagonia: { placement: "above", stemHeight: 12 },
    wilson: { placement: "below", stemHeight: 12 },
    // Keep Beyond Yoga / Cane’s east of the Starbucks pile-up
    "beyond yoga": { placement: "above", stemHeight: 12, offsetX: 52 },
    "raising canes": { placement: "below", stemHeight: 12, offsetX: 52 },
    "apple store": { placement: "above", stemHeight: 14, offsetX: 28 },
    uniqlo: { placement: "above", stemHeight: 12, offsetX: 60 },
    "lululemon athletica": { placement: "above", stemHeight: 14, offsetX: -52 },
    // Just west of Lululemon — hang east so the wordmark clears that logo
    pandora: { placement: "right", stemHeight: 12 },
    // South of McConnell's — hang below so the logo stays off that pin
    "google store": { placement: "below", stemHeight: 14 },
    "mcconnell's fine ice creams": {
      placement: "below",
      stemHeight: 14,
      offsetX: 72,
    },

    // West side
    "amc entertainment": { placement: "above", stemHeight: 12 },
    "barnes & noble": { placement: "above", stemHeight: 12, offsetX: 40 },
    skechers: { placement: "above", stemHeight: 12 },
    lids: { placement: "below", stemHeight: 12, offsetX: -40 },
    zara: { placement: "below", stemHeight: 14, offsetX: -56 },
    oakley: { placement: "below", stemHeight: 12, offsetX: 36 },
    "alo yoga": { placement: "below", stemHeight: 12, offsetX: -48 },
    "vans inc. (vf sportswear)": {
      placement: "above",
      stemHeight: 12,
      offsetX: -48,
    },
    // Fan south cluster — clear of Uniqlo / Lulu / McConnell’s
    "jd sports": { placement: "below", stemHeight: 12, offsetX: -60 },
    "urban outfitters": { placement: "below", stemHeight: 64, offsetX: -60 },
    "pac sun": { placement: "above", stemHeight: 12, offsetX: 52 },
  },
  /**
   * Golden Triangle — Abbot Kinney style: full-size logos, short vertical
   * stems (no side-shift elbows). Co-located pairs are split pins.
   */
  "golden-triangle": {
    "wally's": { placement: "below", stemHeight: 14 },
    "alo yoga": { placement: "below", stemHeight: 12, scale: 0.75 },
    "christian louboutin": { placement: "above", stemHeight: 12 },
    "james perse": { placement: "above", stemHeight: 12 },
    "hermes of paris": { placement: "above", stemHeight: 14 },
    "sam edelman": { placement: "above", stemHeight: 36 },
    "geary's beverly hills": { placement: "above", stemHeight: 12 },
    "lululemon athletica": { placement: "below", stemHeight: 12 },
    "wilson sporting goods": { placement: "above", stemHeight: 12 },
    "chanel fragrance and beauty boutique": {
      placement: "above",
      stemHeight: 12,
    },
    "cartier inc.": { placement: "below", stemHeight: 12 },
    "salvatore ferragamo": { placement: "above", stemHeight: 12 },
    "louis vuitton": { placement: "above", stemHeight: 14 },
    "tom ford": { placement: "below", stemHeight: 12 },
    balenciaga: { placement: "above", stemHeight: 12 },
    gucci: { placement: "above", stemHeight: 12 },
    prada: { placement: "left", stemHeight: 16 },
    "christian dior": { placement: "below", offsetX: 0, stemHeight: 12 },
    burberry: { placement: "below", stemHeight: 12 },
    fendi: { placement: "below", stemHeight: 12 },
    sephora: { placement: "above", stemHeight: 12 },
    "dolce & gabbana, d&g": { placement: "above", stemHeight: 12 },
    "jimmy choo": { placement: "below", stemHeight: 12 },
    "erewhon market": { placement: "below", stemHeight: 14 },
    rolex: { placement: "right", stemHeight: 12, scale: 0.82 },
    loewe: { placement: "above", offsetX: 0, stemHeight: 14 },
    "st. john knits": { placement: "below", stemHeight: 16 },
    "what goes around comes around": { placement: "above", stemHeight: 14 },
    "all saints": { placement: "above", offsetX: 0, stemHeight: 14 },
    reformation: { placement: "below", offsetX: 0, stemHeight: 14 },
    "alice + olivia": { placement: "below", stemHeight: 14 },
    "veronica beard": { placement: "below", offsetX: 0, stemHeight: 14 },
    "favorite daughter": { placement: "above", offsetX: 0, stemHeight: 14 },
    "pura vida miami": { placement: "left", stemHeight: 12 },
    kitson: { placement: "right", stemHeight: 12 },
  },
  /**
   * Old Town Pasadena — Abbot Kinney / Golden Triangle style: full-size logos,
   * short vertical stems (no side-shift elbows). Co-located pairs are split.
   * North of Colorado → above; south → below; stacks alternate sides.
   */
  "old-town-pasadena": {
    "rivian automotive": { placement: "above", stemHeight: 14 },
    "urban outfitters": { placement: "above", stemHeight: 12 },
    "free people": { placement: "below", stemHeight: 12 },
    rh: { placement: "below", stemHeight: 12, scale: 0.58 },
    "tempur-pedic": { placement: "above", stemHeight: 14 },
    tesla: { placement: "above", stemHeight: 40 },
    "arc'teryx": { placement: "below", stemHeight: 12 },
    "pandora jewelry": { placement: "above", stemHeight: 72 },
    "lululemon athletica": { placement: "below", stemHeight: 36 },
    "sunglass hut": { placement: "above", stemHeight: 12 },
    "banana republic factory": { placement: "below", stemHeight: 14 },
    madewell: { placement: "below", stemHeight: 12 },
    "herman miller": { placement: "above", stemHeight: 48 },
    lovesac: { placement: "below", stemHeight: 36 },
    "warby parker": { placement: "above", stemHeight: 14 },
    "foot locker": { placement: "above", stemHeight: 12 },
    "tiffany & co": { placement: "below", stemHeight: 12 },
    "crate & barrel": { placement: "above", stemHeight: 36 },
    apple: { placement: "left", stemHeight: 16 },
    "j crew": { placement: "below", stemHeight: 36 },
    "abercrombie & fitch": { placement: "right", stemHeight: 20 },
    "lucid motors": { placement: "below", stemHeight: 12 },
    "room & board": { placement: "below", stemHeight: 14 },
    "eileen fisher": { placement: "above", stemHeight: 12 },
    "dr. martens": { placement: "below", stemHeight: 12 },
  },
  /**
   * Melrose Ave & Melrose Place — east–west luxury block.
   * North sidewalk of Place → above; Place center / Avenue → below.
   * Co-located pairs use two stem lengths after the E–W spread.
   */
  melrose: {
    // North sidewalk of Melrose Place
    "monique lhuillier": { placement: "above", stemHeight: 12 },
    "love shack fancy": { placement: "above", stemHeight: 14 },
    "maison margiela": { placement: "above", stemHeight: 12, offsetX: -24 },
    "bottega veneta": { placement: "above", stemHeight: 56, offsetX: 24 },
    balmain: { placement: "above", stemHeight: 12 },
    "golden goose": { placement: "above", stemHeight: 56 },
    staud: { placement: "above", offsetX: 56, stemHeight: 14 },
    agolde: { placement: "below", offsetX: 0, stemHeight: 14 },

    // Center of Place / south sidewalk — drop into the alley
    "the row": { placement: "above", offsetX: 0, stemHeight: 14 },
    "oscar de la renta": { placement: "below", stemHeight: 56 },
    chloé: { placement: "below", stemHeight: 12 },
    "l'agence": { placement: "above", stemHeight: 12 },
    "isabel marant": { placement: "below", stemHeight: 12, offsetX: -56 },
    apc: { placement: "below", stemHeight: 14, offsetX: 20 },
    mejuri: { placement: "below", stemHeight: 48, offsetX: 88 },

    // Melrose Ave
    therealreal: { placement: "right", stemHeight: 12 },
    glossier: { placement: "below", stemHeight: 14, offsetX: 28 },
    "reebok lab": { placement: "below", stemHeight: 12, offsetX: -48 },
    "house of cb": { placement: "above", offsetX: 0, stemHeight: 14 },
    "cult gaia": { placement: "below", stemHeight: 56, offsetX: 28 },
    adidas: { placement: "below", stemHeight: 12, scale: 0.7 },
    "g-star": { placement: "right", stemHeight: 16 },
    "vivienne westwood": { placement: "below", stemHeight: 12 },
    "ralph lauren": { placement: "below", stemHeight: 12 },
    reformation: { placement: "below", stemHeight: 12 },

    // West Melrose Ave — odd addresses north (above), even addresses south (below).
    salomon: { placement: "below", offsetX: 0, stemHeight: 14 },
    "sporty & rich": { placement: "above", offsetX: 0, stemHeight: 14 },
    "the great": { placement: "above", offsetX: 0, stemHeight: 14 },
    rh: { placement: "below", offsetX: 0, stemHeight: 14 },
    vince: { placement: "below", offsetX: -36, stemHeight: 14 },
    lululemon: { placement: "below", offsetX: 36, stemHeight: 14 },
    on: { placement: "above", offsetX: 0, stemHeight: 14 },
    "rag & bone": { placement: "above", offsetX: -28, stemHeight: 14 },
    "alice & olivia": { placement: "above", offsetX: 28, stemHeight: 14 },
    "fear of god": { placement: "right", stemHeight: 12 },
  },
  "downtown-manhattan-beach": {
    vuori: { placement: "above", stemHeight: 12 },
    "free people": { placement: "below", stemHeight: 12 },
    "pressed juicery": { placement: "above", stemHeight: 16 },
    "bluestone lane café": { placement: "left", stemHeight: 14 },
    "bluestone lane cafe": { placement: "left", stemHeight: 14 },
    "beyond yoga": { placement: "below", stemHeight: 12, offsetX: 36 },
    "nati boutique": { placement: "left", stemHeight: 12 },
    "pasha fine jewelry": { placement: "above", stemHeight: 16 },
    starbucks: { placement: "right", stemHeight: 16 },
    "ya ya's boutique": { placement: "right", stemHeight: 14 },
    "manhattan denim": { placement: "below", stemHeight: 14 },
    "manhattan pizzeria": { placement: "above", stemHeight: 16 },
  },
  "sunset-strip": {
    "badgley mischka retail": { placement: "above", stemHeight: 32 },
    "elaine kim": { placement: "left", stemHeight: 16 },
    "fp journe": { placement: "left", stemHeight: 16 },
  },
  "la-brea": {
    "stone island": { placement: "left", stemHeight: 16 },
    undefeated: { placement: "left", stemHeight: 14 },
    stussy: { placement: "right", stemHeight: 16 },
    "fa skate shop": { placement: "left", stemHeight: 14 },
    "nudie jeans": { placement: "left", stemHeight: 18 },
    carhartt: { placement: "right", stemHeight: 16 },
    "aether apparel": { placement: "right", stemHeight: 18 },
    "fjall raven": { placement: "left", stemHeight: 16 },
    "arc'teryx": { placement: "below", stemHeight: 16 },
    sweetgreen: { placement: "right", stemHeight: 16 },
    "district la brea": { placement: "left", stemHeight: 14 },
    "eb denim": { placement: "left", stemHeight: 16 },
    "avec les filles": { placement: "right", stemHeight: 16 },
    "japan la": { placement: "left", stemHeight: 14 },
    "trader joe's": { placement: "left", stemHeight: 14 },
  },
  larchmont: {
    "levain bakery": { placement: "right", stemHeight: 14 },
    "faherty brand": { placement: "left", stemHeight: 14 },
    "pressed juicery": { placement: "left", stemHeight: 14 },
    diptyque: { placement: "right", stemHeight: 16 },
    "beyond yoga": { placement: "right", stemHeight: 14 },
    "blue mercury": { placement: "left", stemHeight: 16 },
    duer: { placement: "above", stemHeight: 16 },
    "chevalier's books": { placement: "left", stemHeight: 22 },
    aesop: { placement: "right", stemHeight: 14 },
    wittmore: { placement: "right", stemHeight: 28, offsetX: 18 },
    "buck mason": { placement: "left", stemHeight: 16 },
    "velvet by graham & spencer": { placement: "left", stemHeight: 22 },
    "freda salvador": { placement: "left", stemHeight: 14 },
    "rothys": { placement: "right", stemHeight: 14 },
    "rothy's": { placement: "right", stemHeight: 14 },
  },
  montana: {
    // Hand-solved for the load camera (zoom 17): no box overlap, no leader
    // through a box, longest leader ≈ 78 px. Grouped callouts (see
    // MAJOR_TENANT_MERGE_GROUPS_BY_SLUG) are keyed by their anchor brand.
    starbucks: { placement: "below", stemHeight: 10, offsetX: 10 },
    "the shade store, inc.": { placement: "left", stemHeight: 20 },
    "kreation organic": { placement: "above", offsetX: 0, stemHeight: 16 },
    facegym: { placement: "below", offsetX: 0, stemHeight: 16 },
    "ele keats jewelry": { placement: "right", stemHeight: 18 },
    "benefit cosmetics & blowouts by benefit": {
      placement: "above",
      offsetX: 0,
      stemHeight: 16,
    },
    "warby parker": { placement: "below", stemHeight: 34, offsetX: -40 },
    "free people": { placement: "below", offsetX: 0, stemHeight: 32, scale: 0.72 },
    "j. mclaughlin": { placement: "above", offsetX: 0, stemHeight: 18 },
    brooklinen: { placement: "below", offsetX: 0, stemHeight: 18 },
    "peet's coffee & tea": {
      placement: "above",
      stemHeight: 88,
      offsetX: -120,
      scale: 0.72,
    },
    "bluemercury, inc.": {
      placement: "below",
      stemHeight: 42,
      offsetX: 70,
      scale: 0.72,
    },
    aesop: { placement: "above", stemHeight: 82, offsetX: -50, scale: 0.72 },
    "whole foods": { placement: "above", stemHeight: 78, offsetX: 40 },
    "dry bar": { placement: "below", stemHeight: 10, offsetX: 20 },
    "la la land kind cafe": { placement: "above", stemHeight: 10 },
    sweetgreen: { placement: "above", stemHeight: 62, offsetX: -30, scale: 0.72 },
    "bread head": { placement: "below", stemHeight: 66, offsetX: 50, scale: 0.72 },
    "nordstrom local": { placement: "below", stemHeight: 10, offsetX: 40 },
    framebridge: { placement: "above", stemHeight: 10, offsetX: 20 },
    "williams-sonoma": { placement: "right", stemHeight: 10 },
    casper: { placement: "right", stemHeight: 70, scale: 0.72 },
    "visual comfort & co": {
      placement: "below",
      offsetX: 0,
      stemHeight: 24,
      scale: 0.72,
    },
    "fireclay tile": {
      placement: "below",
      offsetX: 0,
      stemHeight: 24,
      scale: 0.72,
    },
    "farrow & ball santa monica showroom": {
      placement: "below",
      offsetX: 0,
      stemHeight: 24,
      scale: 0.72,
    },
    "sundays furniture": { placement: "above", offsetX: 0, stemHeight: 16 },
    "avocado green mattress": {
      placement: "below",
      stemHeight: 42,
      offsetX: 20,
      scale: 0.72,
    },
    "naked cashmere": {
      placement: "below",
      stemHeight: 42,
      offsetX: 20,
      scale: 0.72,
    },
    "malia mills": {
      placement: "below",
      stemHeight: 42,
      offsetX: 20,
      scale: 0.72,
    },
    ernesta: { placement: "below", offsetX: 0, stemHeight: 32, scale: 0.72 },
    "clare v.": { placement: "below", offsetX: 0, stemHeight: 32, scale: 0.72 },
    "only hearts": {
      placement: "above",
      stemHeight: 88,
      offsetX: -120,
      scale: 0.72,
    },
    flannel: { placement: "above", stemHeight: 88, offsetX: -120, scale: 0.72 },
    "pink chicken": {
      placement: "below",
      stemHeight: 66,
      offsetX: 50,
      scale: 0.72,
    },
    unsubscribed: { placement: "above", stemHeight: 16, offsetX: 50 },
    "margaret o'leary": { placement: "above", stemHeight: 16, offsetX: -20 },
  },
  robertson: {
    "leica store and gallery": { placement: "right", stemHeight: 16 },
    cassina: { placement: "left", stemHeight: 16 },
    "boffi los angeles": { placement: "right", stemHeight: 16 },
    "blue bottle coffee": { placement: "right", stemHeight: 14 },
    "james perse": { placement: "left", stemHeight: 16 },
    "armani casa": { placement: "left", stemHeight: 14 },
    kitson: { placement: "left", stemHeight: 16 },
    "herman miller": { placement: "right", stemHeight: 16 },
    duxiana: { placement: "left", stemHeight: 20 },
    technogym: { placement: "right", stemHeight: 20 },
    "the henry": { placement: "right", stemHeight: 24 },
    "the ivy": { placement: "left", stemHeight: 18 },
    starbucks: { placement: "above", stemHeight: 14 },
  },
  "silver-lake": {
    "erewhon market": { placement: "left", stemHeight: 16 },
    madewell: { placement: "below", stemHeight: 16 },
    "le labo fragrances": { placement: "right", stemHeight: 16 },
    "warby parker": { placement: "left", stemHeight: 20 },
    "garrett leight california optical": { placement: "left", stemHeight: 16 },
    "a.p.c.": { placement: "right", stemHeight: 16 },
    "buck mason": { placement: "above", stemHeight: 16 },
    aesop: { placement: "below", stemHeight: 16 },
    "clare v": { placement: "right", stemHeight: 16 },
    baggu: { placement: "above", stemHeight: 16 },
    undefeated: { placement: "above", stemHeight: 16 },
    "new balance": { placement: "left", stemHeight: 16 },
    "akila eyewear": { placement: "right", stemHeight: 24 },
    filson: { placement: "left", stemHeight: 16 },
    "free people": { placement: "right", stemHeight: 16 },
    sunspel: { placement: "left", stemHeight: 20 },
  },
  "studio-city": {
    lululemon: { placement: "above", stemHeight: 14 },
    gorjana: { placement: "above", stemHeight: 16 },
    aesop: { placement: "below", stemHeight: 16 },
    "buck mason": { placement: "left", stemHeight: 16 },
    "chico's": { placement: "below", stemHeight: 16 },
    "m. fredric": { placement: "above", stemHeight: 32 },
    "free people": { placement: "above", stemHeight: 14 },
    sephora: { placement: "above", stemHeight: 14 },
    athleta: { placement: "right", stemHeight: 16 },
    "blue bottle coffee": { placement: "below", stemHeight: 18 },
    "urban outfitters": { placement: "right", stemHeight: 16 },
    "warby parker": { placement: "above", stemHeight: 32 },
    "bluemercury, inc.": { placement: "below", stemHeight: 16 },
    "trader joe's": { placement: "left", stemHeight: 16 },
    "paper source": { placement: "right", stemHeight: 16 },
  },
  "culver-city": {
    "honey's kettle fried chicken": { placement: "left", stemHeight: 16 },
    "cava grill": { placement: "above", stemHeight: 28 },
    "citizen public market": { placement: "above", stemHeight: 16 },
    "trader joe's": { placement: "right", stemHeight: 14 },
    "joe & the juice": { placement: "below", stemHeight: 16 },
    "the culver hotel": { placement: "right", stemHeight: 16 },
  },
  "la-arts-district": {
    "alfred coffee": { placement: "left", stemHeight: 16 },
    "le labo": { placement: "right", stemHeight: 16 },
    breadlam: { placement: "right", stemHeight: 16 },
    "alchemy works": { placement: "right", stemHeight: 16 },
    wurstkuche: { placement: "right", stemHeight: 16 },
  },
};

export function normalizeTenantName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** One Occupied pin per brand so the same store never plots twice. */
export function keepOneTenantPerBrand<
  T extends { tenantName: string; address: string; hasLogo?: boolean; lat?: number | null; lng?: number | null },
>(tenants: T[]): T[] {
  const byName = new Map<string, T[]>();
  for (const tenant of tenants) {
    const key = normalizeTenantName(tenant.tenantName);
    const list = byName.get(key) ?? [];
    list.push(tenant);
    byName.set(key, list);
  }

  const kept: T[] = [];
  for (const list of byName.values()) {
    if (list.length === 1) {
      kept.push(list[0]);
      continue;
    }
    const lat =
      list.reduce((sum, tenant) => sum + (tenant.lat ?? 0), 0) / list.length;
    const lng =
      list.reduce((sum, tenant) => sum + (tenant.lng ?? 0), 0) / list.length;
    kept.push(
      [...list].sort((a, b) => {
        const logo = Number(Boolean(b.hasLogo)) - Number(Boolean(a.hasLogo));
        if (logo) return logo;
        const da =
          ((a.lat ?? lat) - lat) ** 2 + ((a.lng ?? lng) - lng) ** 2;
        const db =
          ((b.lat ?? lat) - lat) ** 2 + ((b.lng ?? lng) - lng) ** 2;
        return da - db;
      })[0]
    );
  }
  return kept;
}

/**
 * Address substrings to omit from major-tenants mode (case-insensitive).
 * Used when the same brand has multiple mapped locations.
 * String = drop any major tenant at that address; object = drop only that brand.
 */
export type MajorTenantAddressExclusion =
  | string
  | { address: string; tenant: string };

export const MAJOR_TENANT_ADDRESS_EXCLUSIONS_BY_SLUG: Record<
  string,
  readonly MajorTenantAddressExclusion[]
> = {
  "abbot-kinney": ["1201 Abbot Kinney"],
  montana: [{ address: "820 Montana", tenant: "Starbucks" }],
  robertson: [{ address: "111-117 S Robertson", tenant: "Kitson" }],
  larchmont: [{ address: "137-143 N Larchmont", tenant: "WITTMORE" }],
  "downtown-manhattan-beach": [
    { address: "1300 Highland", tenant: "Ya Ya's Boutique" },
    { address: "912-920 Manhattan", tenant: "Manhattan Denim" },
    { address: "Map 228", tenant: "Skechers" },
  ],
  "golden-triangle": [
    "295 N Rodeo",
    "421-427 N Beverly",
    "370 N Rodeo",
    "357 N Rodeo",
  ],
};

export function getMajorTenantAllowlist(
  slug: string | undefined
): ReadonlySet<string> | null {
  if (!slug) return null;
  const layoutSlug = resolveMajorTenantLayoutSlug(slug);
  const names = layoutSlug ? MAJOR_TENANTS_BY_SLUG[layoutSlug] : undefined;
  if (!names?.length) return null;
  return new Set(names.map(normalizeTenantName));
}

/**
 * Directory overlay uses the center's own curated names only. Street aliases
 * (One Colorado / The Paseo → Old Town Pasadena) are for map pins, not the
 * tenant-logo popup — those centers have their own directory lists.
 */
export function getShoppingCenterDirectoryAllowlist(
  slug: string | undefined
): ReadonlySet<string> | null {
  if (!slug) return null;
  const names = MAJOR_TENANTS_BY_SLUG[slug];
  if (!names?.length) return null;
  return new Set(names.map(normalizeTenantName));
}

export function getMajorTenantAddressExclusions(
  slug: string | undefined
): readonly MajorTenantAddressExclusion[] {
  if (!slug) return [];
  return MAJOR_TENANT_ADDRESS_EXCLUSIONS_BY_SLUG[slug] ?? [];
}

function addressIsExcluded(
  address: string,
  tenantName: string,
  exclusions: readonly MajorTenantAddressExclusion[]
): boolean {
  if (!exclusions.length) return false;
  const normalizedAddr = address.trim().toLowerCase();
  const normalizedTenant = normalizeTenantName(tenantName);
  return exclusions.some((ex) => {
    if (typeof ex === "string") {
      return normalizedAddr.includes(ex.trim().toLowerCase());
    }
    return (
      normalizedAddr.includes(ex.address.trim().toLowerCase()) &&
      normalizedTenant === normalizeTenantName(ex.tenant)
    );
  });
}

/** True when this tenant should appear in major-tenants mode for the corridor. */
export function isMajorTenantAllowed(
  slug: string | undefined,
  tenant: { tenantName: string; address: string },
  allowlist: ReadonlySet<string> | null
): boolean {
  if (!allowlist?.has(normalizeTenantName(tenant.tenantName))) return false;
  return !addressIsExcluded(
    tenant.address,
    tenant.tenantName,
    getMajorTenantAddressExclusions(slug)
  );
}

/** Merge per-tenant overrides for a co-located marker group. */
export function getMajorTenantLayoutOverride(
  slug: string | undefined,
  tenantNames: readonly string[]
): MajorTenantLayoutOverride | null {
  if (!slug) return null;
  const layoutSlug = resolveMajorTenantLayoutSlug(slug);
  const byName = layoutSlug
    ? MAJOR_TENANT_LAYOUT_OVERRIDES_BY_SLUG[layoutSlug]
    : undefined;
  if (!byName) return null;

  const merged: MajorTenantLayoutOverride = {};
  let found = false;
  for (const name of tenantNames) {
    const override = byName[normalizeTenantName(name)];
    if (!override) continue;
    Object.assign(merged, override);
    found = true;
  }
  return found ? merged : null;
}
