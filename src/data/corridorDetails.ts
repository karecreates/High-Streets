import galleryAdidas from "@assets/adidas.jpg";
import galleryAbbotKinney1 from "@assets/Abbot Kinney Photos/abbot_kinney_1.jpg";
import galleryAbbotKinney2 from "@assets/Abbot Kinney Photos/abbot_kinney_2.jpg";
import galleryAbbotKinney3 from "@assets/Abbot Kinney Photos/abbot_kinney_3.jpg";
import galleryAbbotKinney4 from "@assets/Abbot Kinney Photos/abbot_kinney_4.jpg";
import galleryAviator from "@assets/Aviator-Nation-Abbot-Kinney-Blvd-in-the-heart-of-Venice-CA.jpg";
import galleryBlueBottle from "@assets/blue-bottle-exterior.jpg";
import gallerySaltStraw from "@assets/2016-01-13-salt-straw-005.0.0.jpg";
import galleryLaBrea1 from "@assets/La Brea Photos/La_Brea_1.jpg";
import galleryLaBrea2 from "@assets/La Brea Photos/La_Brea_2.jpg";
import galleryLaBrea3 from "@assets/La Brea Photos/La_Brea_3.jpg";
import galleryLaBrea4 from "@assets/La Brea Photos/La_Brea_4.jpg";
import galleryLarchmont1 from "@assets/Larchmont Photos/Larchmont_1.jpg";
import galleryLarchmont2 from "@assets/Larchmont Photos/Larchmont_2.jpg";
import galleryLarchmont3 from "@assets/Larchmont Photos/Larchmont_3.jpg";
import galleryLarchmont4 from "@assets/Larchmont Photos/Larchmont_4.jpg";
import galleryMelrose1 from "@assets/Melrose Photos/melrose_1.jpg";
import galleryMelrose2 from "@assets/Melrose Photos/melrose_2.jpg";
import galleryMelrose3 from "@assets/Melrose Photos/melrose_3.jpg";
import galleryMelrose4 from "@assets/Melrose Photos/melrose_4.jpg";
import gallerySilverlake1 from "@assets/Silverlake Photos/silverlake_1.jpg";
import gallerySilverlake2 from "@assets/Silverlake Photos/silverlake_2.jpg";
import gallerySilverlake3 from "@assets/Silverlake Photos/silverlake_3.jpg";
import gallerySilverlake4 from "@assets/Silverlake Photos/silverlake_4.jpg";
import galleryMalibu1 from "@assets/Malibu Country Mart/malibu_country_mart_1.jpg";
import galleryMalibu2 from "@assets/Malibu Country Mart/malibu_country_mart_2.jpg";
import galleryMalibu3 from "@assets/Malibu Country Mart/malibu_country_mart_3.jpg";
import galleryMalibu4 from "@assets/Malibu Country Mart/malibu_country_mart_4.jpg";
import galleryMalibuVillage1 from "@assets/Malibu Village Photos/malibu_village_1.jpg";
import galleryMalibuVillage2 from "@assets/Malibu Village Photos/malibu_village_2.jpg";
import galleryMalibuVillage3 from "@assets/Malibu Village Photos/malibu_village_3.jpg";
import galleryMalibuVillage4 from "@assets/Malibu Village Photos/malibu_village_4.jpg";
import gallerySantaMonicaPlace1 from "@assets/Santa Monica Place Photos/santa_monica_place_1.jpg";
import gallerySantaMonicaPlace2 from "@assets/Santa Monica Place Photos/santa_monica_place_2.jpg";
import gallerySantaMonicaPlace3 from "@assets/Santa Monica Place Photos/santa_monica_place_3.jpg";
import gallerySantaMonicaPlace4 from "@assets/Santa Monica Place Photos/santa_monica_place_4.jpg";
import galleryManhattan1 from "@assets/Manhattan Beach Photos/manhattan_1.jpg";
import galleryManhattan2 from "@assets/Manhattan Beach Photos/manhattan_2.jpg";
import galleryManhattan3 from "@assets/Manhattan Beach Photos/manhattan_3.jpg";
import galleryManhattan4 from "@assets/Manhattan Beach Photos/manhattan_4.jpg";
import galleryCulver1 from "@assets/Culver City Photos/culver_1.jpg";
import galleryCulver2 from "@assets/Culver City Photos/culver_2.jpg";
import galleryCulver3 from "@assets/Culver City Photos/culver_3.jpg";
import galleryCulver4 from "@assets/Culver City Photos/culver_4.jpg";
import galleryMontana1 from "@assets/Montana Photos/montana_1.jpg";
import galleryMontana2 from "@assets/Montana Photos/montana_2.jpg";
import galleryMontana3 from "@assets/Montana Photos/montana_3.jpg";
import galleryMontana4 from "@assets/Montana Photos/montana_4.jpg";
import gallerySunsetStrip1 from "@assets/Sunset Strip Photos/sunset_strip_1.jpg";
import gallerySunsetStrip2 from "@assets/Sunset Strip Photos/sunset_strip_2.jpg";
import gallerySunsetStrip3 from "@assets/Sunset Strip Photos/sunset_strip_3.jpg";
import gallerySunsetStrip4 from "@assets/Sunset Strip Photos/sunset_strip_4.jpg";

export interface GalleryImage {
  src: string;
  alt: string;
}

export interface AreaStat {
  value: string;
  label: string;
}

export interface TrafficCount {
  street: string;
  count: string;
}

export interface NotableBrand {
  name: string;
  /** Verified brand domain for an exact logo.dev logo. */
  domain: string;
}

export interface StreetCorridorDetail {
  title: string;
  description: string;
  estimatedRents: string;
  galleryImages: GalleryImage[];
  /** Static logo image URLs (legacy fallback) */
  brandLogos?: string[];
  /** Tenant names for Logo.dev name lookup (Arts District) */
  notableBrandNames?: string[];
  /** Verified brand name + domain for exact logo.dev logos */
  notableBrands?: NotableBrand[];
  bikeScore: number;
  walkScore: number;
  areaStats: AreaStat[];
  trafficCounts: TrafficCount[];
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
}

export const CORRIDOR_DETAILS: Record<string, StreetCorridorDetail> = {
  "abbot-kinney": {
    title: "Abbot Kinney Blvd",
    description:
      'Named as "the coolest block in America", Abbot Kinney Blvd is a popular shopping, dining and entertainment strip located in Venice, California, minutes from the beach. The boulevard is located within the emerging "Silicon Beach" tech corridor hosting offices for such companies as Google, Snapchat, and YouTube and features a mix of boutiques, one-of-a-kind retail shops, and famous food trucks as well as an array of restaurants with culinary tastes to satisfy any discerning diner.',
    estimatedRents: "$150-$240 PSF/yr NNN",
    galleryImages: [
      { src: galleryAbbotKinney1, alt: "Alo storefront on Abbot Kinney Blvd" },
      { src: galleryAbbotKinney2, alt: "Ray-Ban storefront on Abbot Kinney Blvd" },
      { src: galleryAbbotKinney3, alt: "On running store on Abbot Kinney Blvd" },
      { src: galleryAbbotKinney4, alt: "Retail storefront on Abbot Kinney Blvd" },
    ],
    notableBrands: [
      { name: "Erewhon Market", domain: "erewhon.com" },
      { name: "Adidas", domain: "adidas.com" },
      { name: "Warby Parker", domain: "warbyparker.com" },
      { name: "Aesop", domain: "aesop.com" },
      { name: "Blue Bottle Coffee", domain: "bluebottlecoffee.com" },
      { name: "Intelligentsia Coffee", domain: "intelligentsia.com" },
      { name: "Salt & Straw", domain: "saltandstraw.com" },
      { name: "Madewell", domain: "madewell.com" },
      { name: "Everlane", domain: "everlane.com" },
      { name: "Away", domain: "awaytravel.com" },
      { name: "Vuori", domain: "vuoriclothing.com" },
      { name: "Aviator Nation", domain: "aviatornation.com" },
      { name: "Suit Supply", domain: "suitsupply.com" },
      { name: "Le Labo", domain: "lelabofragrances.com" },
      { name: "J.Crew", domain: "jcrew.com" },
    ],
    bikeScore: 95,
    walkScore: 95,
    areaStats: [
      { value: "$98M", label: "VENICE RESIDENTS SPEND ON OUTSIDE FOOD ANNUALLY" },
      {
        value: "$90M",
        label: "SPENT ANNUALLY ON CONSUMER ENTERTAINMENT AND RECREATION",
      },
      { value: "8M", label: "VISITORS A YEAR" },
      {
        value: "TOP 5 LARGEST",
        label: "TOURIST ATTRACTION IN SOUTHERN CALIFORNIA",
      },
    ],
    trafficCounts: [
      { street: "Abbot Kinney Blvd", count: "20,000 CPD" },
      { street: "Venice Blvd", count: "22,000 CPD" },
    ],
    mapCenter: { lat: 33.9909036, lng: -118.4679279 },
    mapZoom: 18,
  },
  "la-brea": {
    title: "La Brea Ave",
    description:
      "Wedged between The Grove and Hancock Park, La Brea Avenue represents one of the hippest shopping destinations in Los Angeles. Made up of just two city blocks, the La Brea shopping district is home to a number of hype driven flagships and a curated mix of emerging retailers coupled with eclectic art galleries, edgy boutiques, staple eateries, and Los Angeles's best selection of elevated menswear.",
    estimatedRents: "$66-$100 PSF/yr NNN",
    galleryImages: [
      { src: galleryLaBrea1, alt: "La Brea Ave storefront" },
      { src: galleryLaBrea2, alt: "La Brea Ave retail corridor" },
      { src: galleryLaBrea3, alt: "La Brea Ave streetscape" },
      { src: galleryLaBrea4, alt: "La Brea Ave shopping district" },
    ],
    notableBrands: [
      { name: "Carhartt", domain: "carhartt.com" },
      { name: "Stüssy", domain: "stussy.com" },
      { name: "Undefeated", domain: "undefeated.com" },
      { name: "Stone Island", domain: "stoneisland.com" },
      { name: "Arc'teryx", domain: "arcteryx.com" },
      { name: "Sweetgreen", domain: "sweetgreen.com" },
      { name: "Trader Joe's", domain: "traderjoes.com" },
      { name: "Sugarfish", domain: "sugarfish.com" },
      { name: "American Rag Cie", domain: "americanrag.com" },
      { name: "Nudie Jeans", domain: "nudiejeans.com" },
      { name: "Self Edge", domain: "selfedge.com" },
      { name: "Fjällräven", domain: "fjallraven.com" },
      { name: "Garrett Leight", domain: "garrettleight.com" },
      { name: "The Sycamore Kitchen", domain: "thesycamorekitchen.com" },
      { name: "Aether Apparel", domain: "aetherapparel.com" },
    ],
    bikeScore: 60,
    walkScore: 89,
    areaStats: [
      {
        value: "$85M",
        label: "SPENT ANNUALLY ON CONSUMER ENTERTAINMENT AND RECREATION",
      },
      { value: "$120K", label: "AVG. HOUSEHOLD INCOME WITHIN ONE MILE" },
      { value: "41K", label: "PEOPLE LIVING WITHIN ONE MILE" },
      { value: "70%", label: "OF POPULATION ARE YOUNGER THAN 40 YEARS OLD" },
    ],
    trafficCounts: [{ street: "La Brea Ave", count: "48,000 CPD" }],
    mapCenter: { lat: 34.0731, lng: -118.3441 },
    mapZoom: 16,
  },
  larchmont: {
    title: "Larchmont Blvd",
    description:
      "Known for its old-town feel and historic homes, Larchmont offers a unique mix of longstanding independent shops such as Chevalier's Books (est. in 1940) to the latest third wave coffee shops and trendy eateries. Larchmont Boulevard is largely made up of coffee shops, restaurants, and hip daily needs offerings. This historic north-south shopping district is truly made up of one of the most diverse and charming tenant mixes.",
    estimatedRents: "$80-$140 PSF/yr NNN",
    galleryImages: [
      { src: galleryLarchmont1, alt: "Larchmont Blvd storefront" },
      { src: galleryLarchmont2, alt: "Bluemercury on Larchmont Blvd" },
      { src: galleryLarchmont3, alt: "Pressed Juicery on Larchmont Blvd" },
      { src: galleryLarchmont4, alt: "Go Get Em Tiger on Larchmont Blvd" },
    ],
    notableBrands: [
      { name: "Salt & Straw", domain: "saltandstraw.com" },
      { name: "Bluemercury", domain: "bluemercury.com" },
      { name: "Starbucks", domain: "starbucks.com" },
      { name: "Pressed Juicery", domain: "pressed.com" },
      { name: "Buck Mason", domain: "buckmason.com" },
      { name: "The Shade Store", domain: "shadestore.com" },
      { name: "Groundwork Coffee", domain: "groundworkcoffee.com" },
      { name: "Go Get Em Tiger", domain: "gogetemtiger.com" },
      { name: "Jeni's Splendid Ice Cream", domain: "jenissplendidicecream.com" },
      { name: "Sweet Lady Jane", domain: "sweetladyjane.com" },
      { name: "Beyond Yoga", domain: "beyondyoga.com" },
      { name: "Aesop", domain: "aesop.com" },
      { name: "Sweetfin Poke", domain: "sweetfin.com" },
      { name: "Burger Lounge", domain: "burgerlounge.com" },
      { name: "Credo Beauty", domain: "credobeauty.com" },
    ],
    bikeScore: 66,
    walkScore: 86,
    areaStats: [
      {
        value: "$1.37B",
        label: "ESTIMATED TOTAL HOUSEHOLD EXPENDITURE VALUE",
      },
      { value: "$120K", label: "AVG. HOUSEHOLD INCOME WITHIN ONE MILE" },
      {
        value: "5 YEARS",
        label:
          "LARCHMONT VILLAGE HAS SEEN SOME OF THE LARGEST INCREASES IN PROPERTY VALUES",
      },
    ],
    trafficCounts: [{ street: "Larchmont Blvd", count: "15,000 CPD" }],
    mapCenter: { lat: 34.0778, lng: -118.3237 },
    mapZoom: 16,
  },
  melrose: {
    title: "Melrose Ave & Melrose Place",
    description:
      "Melrose Avenue and Melrose Place are a major east-west commercial corridor running from Beverly Hills through Hollywood, offering an eclectic mix of edgy boutiques and unique flagships as well as upscale eateries and trendy cafes. West of Fairfax Avenue along Melrose you'll find chic fashion labels as well as first-to-market concepts such as Nordstrom Local. East of Fairfax you'll find edgy retailers, high-end secondhand stores, and foodie mainstays. In the center of it all, Melrose Trading Post — an artsy flea market — meets every Sunday with 100+ fashion-forward vendors.",
    estimatedRents: "$150-$250 PSF/yr NNN",
    galleryImages: [
      { src: galleryMelrose1, alt: "Melrose Avenue streetscape" },
      { src: galleryMelrose2, alt: "Retail along Melrose Avenue" },
      { src: galleryMelrose3, alt: "Melrose Place storefront" },
      { src: galleryMelrose4, alt: "Melrose corridor shopping district" },
    ],
    notableBrands: [
      { name: "Glossier", domain: "glossier.com" },
      { name: "Reformation", domain: "thereformation.com" },
      { name: "Adidas", domain: "adidas.com" },
      { name: "Alfred Coffee", domain: "alfred.la" },
      { name: "Casper", domain: "casper.com" },
      { name: "Away", domain: "awaytravel.com" },
      { name: "Ralph Lauren", domain: "ralphlauren.com" },
      { name: "Golden Goose", domain: "goldengoose.com" },
      { name: "Balmain", domain: "balmain.com" },
      { name: "Chloé", domain: "chloe.com" },
      { name: "A.P.C.", domain: "apc.com" },
      { name: "Sweet Lady Jane", domain: "sweetladyjane.com" },
      { name: "Fred Segal", domain: "fredsegal.com" },
      { name: "Joybird", domain: "joybird.com" },
      { name: "TheRealReal", domain: "therealreal.com" },
    ],
    bikeScore: 62,
    walkScore: 88,
    areaStats: [
      { value: "$340M", label: "SPENT ANNUALLY ON FOOD AWAY FROM HOME" },
      {
        value: "$129M",
        label: "SPENT ANNUALLY ON CONSUMER ENTERTAINMENT AND RECREATION",
      },
      { value: "$4M", label: "INVESTED INTO PEDESTRIAN IMPROVEMENTS" },
      { value: "$112K", label: "AVG. HOUSEHOLD INCOME WITHIN ONE MILE" },
    ],
    trafficCounts: [
      { street: "Melrose Ave", count: "42,000 CPD" },
      { street: "La Cienega Blvd", count: "39,000 CPD" },
    ],
    mapCenter: { lat: 34.0838834, lng: -118.3758989 },
    mapZoom: 16,
  },
  robertson: {
    title: "Robertson Blvd",
    description:
      "Robertson Boulevard, stretching from Beverly Hills to the north and all the way through West LA to the south, is a primary commercial and shopping corridor known for its fashion boutiques and celebrity sightings. Robertson Plaza, directly across from The Ivy, recently underwent a multi-million dollar renovation. Robertson Boulevard has recently undergone significant turnover, which has allowed new retail concepts and restaurants to enter the trade area.",
    estimatedRents: "$84-$160 PSF/yr NNN",
    galleryImages: [
      { src: galleryAdidas, alt: "Robertson Blvd storefront" },
      { src: galleryBlueBottle, alt: "Robertson Blvd retail" },
      { src: galleryAviator, alt: "Robertson Blvd streetscape" },
      { src: gallerySaltStraw, alt: "Robertson Blvd corridor" },
    ],
    notableBrands: [
      { name: "Herman Miller", domain: "hermanmiller.com" },
      { name: "Kitson", domain: "kitsonpartners.com" },
      { name: "Starbucks", domain: "starbucks.com" },
      { name: "Alfred Coffee", domain: "alfred.la" },
      { name: "Cha Cha Matcha", domain: "chachamatcha.com" },
      { name: "Technogym", domain: "technogym.com" },
      { name: "James Perse", domain: "jamesperse.com" },
      { name: "Blue Bottle Coffee", domain: "bluebottlecoffee.com" },
      { name: "Box Union", domain: "boxunion.com" },
      { name: "Petrossian", domain: "petrosian.ca" },
      { name: "Armani Casa", domain: "armanicasa.com" },
      { name: "Bang & Olufsen", domain: "bang-olufsen.com" },
      { name: "Z Gallerie", domain: "zgallerie.com" },
      { name: "Pizzana", domain: "pizzana.com" },
      { name: "H.Lorenzo", domain: "hlorenzo.com" },
    ],
    bikeScore: 62,
    walkScore: 93,
    areaStats: [
      {
        value: "$295M",
        label: "SPENT ANNUALLY ON FOOD AWAY FROM HOME",
      },
      {
        value: "$114M",
        label: "SPENT ANNUALLY ON CONSUMER ENTERTAINMENT AND RECREATION",
      },
      { value: "250K", label: "DAYTIME POPULATION" },
      { value: "$132K", label: "AVG. HOUSEHOLD INCOME WITHIN ONE MILE" },
    ],
    trafficCounts: [
      { street: "Robertson Blvd", count: "36,000 CPD" },
      { street: "3rd St", count: "22,000 CPD" },
    ],
    mapCenter: { lat: 34.0754807, lng: -118.3839494 },
    mapZoom: 17,
  },
  "silver-lake": {
    title: "Silver Lake & Echo Park",
    description:
      "Silver Lake, named America's Best Hipster Neighborhood in 2012 by Forbes, is best known for its uber trendy offerings from third wave coffee to boutique retailers. Contrasting the glitz and glamour of Rodeo Drive and the Golden Triangle, Silver Lake and its shopping district is characterized by its diversity, grunge, and its eclectic aesthetic. The row of boutiques and eateries along the stretch of Sunset Boulevard are heavily concentrated, making it one of the most walkable and busy shopping districts in Los Angeles.",
    estimatedRents: "$75-$115 PSF/yr NNN",
    galleryImages: [
      { src: gallerySilverlake1, alt: "Silver Lake bakery interior" },
      { src: gallerySilverlake2, alt: "Erewhon storefront at dusk" },
      { src: gallerySilverlake3, alt: "Alfred Coffee on Sunset Boulevard" },
      { src: gallerySilverlake4, alt: "La Colombe Coffee Roasters on Sunset Blvd" },
    ],
    notableBrands: [
      { name: "Warby Parker", domain: "warbyparker.com" },
      { name: "Sweetgreen", domain: "sweetgreen.com" },
      { name: "La Colombe", domain: "lacolombe.com" },
      { name: "Madewell", domain: "madewell.com" },
      { name: "Intelligentsia", domain: "intelligentsia.com" },
      { name: "Aesop", domain: "aesop.com" },
      { name: "Undefeated", domain: "undefeated.com" },
      { name: "Alfred Coffee", domain: "alfred.la" },
      { name: "Buck Mason", domain: "buckmason.com" },
      { name: "Parachute Home", domain: "parachutehome.com" },
      { name: "Salt & Straw", domain: "saltandstraw.com" },
      { name: "A.P.C.", domain: "apc.com" },
      { name: "Shake Shack", domain: "shakeshack.com" },
      { name: "Le Labo", domain: "lelabofragrances.com" },
      { name: "Clare V.", domain: "clarev.com" },
    ],
    bikeScore: 67,
    walkScore: 95,
    areaStats: [
      { value: "$81.2M", label: "ESTIMATED LOCAL CONSUMER EXPENDITURE" },
      { value: "300K", label: "PEOPLE WITHIN 2 MILES OF SILVER LAKE" },
      { value: "$88K", label: "ANNUAL AVG. HOUSEHOLD INCOME AMONG RESIDENTS" },
      {
        value: "45%",
        label: "IMMEDIATE POPULATION WITH A BACHELOR'S DEGREE OR HIGHER",
      },
    ],
    trafficCounts: [
      { street: "Sunset Blvd", count: "31,000 CPD" },
      { street: "Alvarado St", count: "36,000 CPD" },
      { street: "Glendale Blvd", count: "30,000 CPD" },
    ],
    mapCenter: { lat: 34.087444, lng: -118.2754793 },
    mapZoom: 16,
  },
  "malibu-country-mart": {
    title: "Malibu Country Mart",
    description:
      "Malibu Country Mart features a perfect combination of curated, high-end retail and dining with the beautiful picturesque views of Malibu. A unique outdoor lifestyle center full of boutiques and luxury brands, Malibu Country Mart comes alive with gardens, a playground, outdoor dining and picnic areas. Nestled between the scenic mountains and the iconic beaches, Malibu Country Mart allows both locals and visitors to pamper themselves and indulge in a unique retail experience.",
    estimatedRents: "$115-$190 PSF/yr NNN",
    galleryImages: [
      { src: galleryMalibu1, alt: "Malibu Country Mart exterior" },
      { src: galleryMalibu2, alt: "Faherty storefront at Malibu Country Mart" },
      { src: galleryMalibu3, alt: "Paige storefront at Malibu Country Mart" },
      { src: galleryMalibu4, alt: "John Varvatos at Malibu Country Mart" },
    ],
    notableBrands: [
      { name: "SunLife Organics", domain: "sunlifeorganics.com" },
      { name: "Double RL & Co.", domain: "ralphlauren.com" },
      { name: "Oliver Peoples", domain: "oliverpeoples.com" },
      { name: "Chrome Hearts", domain: "chromehearts.com" },
      { name: "Faherty", domain: "fahertybrand.com" },
      { name: "Brandy Melville", domain: "brandymelville.com" },
      { name: "Vuori", domain: "vuoriclothing.com" },
      { name: "Gorjana", domain: "gorjana.com" },
      { name: "Madison Los Angeles", domain: "madisonlosangeles.com" },
      { name: "MR CHOW", domain: "mrchow.com" },
      { name: "Planet Blue", domain: "planetblue.com" },
      { name: "Vince", domain: "vince.com" },
    ],
    bikeScore: 55,
    walkScore: 45,
    areaStats: [
      {
        value: "$276M",
        label: "MALIBU RETAILERS GENERATE IN REVENUE PER YEAR",
      },
      { value: "15M", label: "ANNUAL VISITORS" },
      { value: "$131K", label: "MEDIAN HOUSEHOLD INCOME" },
      {
        value: "55%",
        label:
          "OF THE IMMEDIATE POPULATION HAS A BACHELOR'S DEGREE OR HIGHER",
      },
    ],
    trafficCounts: [
      { street: "Pacific Coast Hwy", count: "43,000 CPD" },
      { street: "Civic Center Way", count: "2,000 CPD" },
    ],
    mapCenter: { lat: 34.03569204363302, lng: -118.68561638399662 },
    mapZoom: 18,
  },
  "malibu-village": {
    title: "Malibu Village",
    description:
      "Located directly across from Malibu Country Mart and the Malibu Lumber Yard, Malibu Village is located just off Pacific Coast Highway in the heart of Malibu. Malibu Village features high-end retailers as well as daily needs and restaurants that cater to the surrounding affluent community and Malibu's 15 million annual visitors.",
    estimatedRents: "$100-$180 PSF/yr NNN",
    galleryImages: [
      { src: galleryMalibuVillage1, alt: "Malibu Village shopping center exterior" },
      { src: galleryMalibuVillage2, alt: "Marmalade Cafe at Malibu Village" },
      { src: galleryMalibuVillage3, alt: "Zadig & Voltaire and Saje at Malibu Village" },
      { src: galleryMalibuVillage4, alt: "Lululemon storefront at Malibu Village" },
    ],
    notableBrands: [
      { name: "Broad Street Oyster Co.", domain: "broadstreetoyster.com" },
      { name: "Marine Layer", domain: "marinelayer.com" },
      { name: "Lululemon", domain: "lululemon.com" },
      { name: "Sephora", domain: "sephora.com" },
      { name: "Catch Surf", domain: "catchsurf.com" },
      { name: "Wittmore", domain: "wittmore.com" },
      { name: "Marmalade Cafe", domain: "marmaladecafe.com" },
      { name: "Chipotle", domain: "chipotle.com" },
      { name: "Fred Segal", domain: "fredsegal.com" },
      { name: "Kreation Organic", domain: "kreationjuice.com" },
      { name: "Kitson", domain: "kitsonpartners.com" },
      { name: "RES IPSA", domain: "res-ipsa.com" },
      { name: "LiveWire", domain: "livewire.com" },
      { name: "Surfing Cowboys", domain: "surfingcowboys.com" },
      { name: "The Alcove", domain: "thealcove.org" },
    ],
    bikeScore: 55,
    walkScore: 45,
    areaStats: [
      {
        value: "$276M",
        label: "MALIBU RETAILERS GENERATE IN REVENUE PER YEAR",
      },
      { value: "15M", label: "ANNUAL VISITORS" },
      { value: "$131K", label: "MEDIAN HOUSEHOLD INCOME" },
      {
        value: "55%",
        label:
          "OF THE IMMEDIATE POPULATION HAS A BACHELOR'S DEGREE OR HIGHER",
      },
    ],
    trafficCounts: [
      { street: "Pacific Coast Hwy", count: "43,000 CPD" },
      { street: "Cross Creek Rd", count: "1,000 CPD" },
    ],
    mapCenter: { lat: 34.03591217808638, lng: -118.68462972757658 },
    mapZoom: 18,
  },
  "santa-monica-place": {
    title: "Santa Monica Place",
    description:
      "Located at the end of the 3rd Street Promenade, Santa Monica Place is an open-air 475,000 square foot luxury shopping center featuring high end department stores, chef driven restaurants, and innovative retail concepts. Santa Monica Place serves as a regional shopping destination as well as a large draw for tourists, coupling scenic ocean views with a wide variety of offerings for consumers.",
    estimatedRents: "$60-$150 PSF/yr NNN",
    galleryImages: [
      { src: gallerySantaMonicaPlace1, alt: "Nike storefront at Santa Monica Place" },
      { src: gallerySantaMonicaPlace2, alt: "Santa Monica Place open-air courtyard" },
      { src: gallerySantaMonicaPlace3, alt: "The Dudes' Brewing Co. patio at Santa Monica Place" },
      { src: gallerySantaMonicaPlace4, alt: "Nordstrom and plaza at Santa Monica Place" },
    ],
    notableBrands: [
      { name: "Pandora", domain: "pandora.net" },
      { name: "Rolex", domain: "rolex.com" },
      { name: "Aesop", domain: "aesop.com" },
      { name: "Tesla", domain: "tesla.com" },
      { name: "Gearys Rolex Boutique", domain: "gearys.com" },
      { name: "Coach", domain: "coach.com" },
      { name: "Drybar", domain: "drybarshops.com" },
      { name: "Chubbies", domain: "chubbiesshorts.com" },
      { name: "Disney", domain: "disney.com" },
      { name: "Nordstrom", domain: "nordstrom.com" },
      { name: "Free People", domain: "freepeople.com" },
      { name: "Barry's", domain: "barrys.com" },
      { name: "Nike", domain: "nike.com" },
      { name: "Hugo Boss", domain: "hugoboss.com" },
      { name: "Din Tai Fung", domain: "dintaifungusa.com" },
    ],
    bikeScore: 85,
    walkScore: 85,
    areaStats: [
      { value: "$200M", label: "TOTAL SALES IN 2015" },
      {
        value: "14M",
        label: "RECORDED VISITORS ON THIRD STREET PROMENADE IN 2017",
      },
      {
        value: "$250M",
        label: "MACERICH HAS INVESTED INTO THE CENTER IN THE LAST 10 YEARS",
      },
      { value: "38K", label: "EMPLOYEES WITHIN 1 MILE OF THE IMMEDIATE AREA" },
    ],
    trafficCounts: [
      { street: "4th St", count: "16,000 CPD" },
      { street: "Colorado Ave", count: "16,000 CPD" },
    ],
    mapCenter: { lat: 34.013694718714774, lng: -118.49380813415459 },
    mapZoom: 18,
  },
  "downtown-manhattan-beach": {
    title: "Downtown Manhattan Beach",
    description:
      "Downtown Manhattan Beach is home to over 150 retailers, including children's, mens', womens', home furnishings, art galleries, and more! Just steps away from the picturesque Manhattan Beach Pier. In addition there are award winning chefs, world class ocean-view dining + family friendly atmosphere, all within steps of each other - with over 50 restaurants, cafes, delis + coffee shops.",
    estimatedRents: "$90-$140 PSF/yr NNN",
    galleryImages: [
      { src: galleryManhattan4, alt: "Downtown Manhattan Beach streetscape" },
      { src: galleryManhattan3, alt: "Nordstrom Local at Downtown Manhattan Beach" },
      { src: galleryManhattan1, alt: "Retail along Manhattan Beach Blvd" },
      { src: galleryManhattan2, alt: "Skechers storefront near Manhattan Beach Pier" },
    ],
    notableBrands: [
      { name: "Skechers", domain: "skechers.com" },
      { name: "Splendid", domain: "splendid.com" },
      { name: "Vuori", domain: "vuoriclothing.com" },
      { name: "Free People", domain: "freepeople.com" },
      { name: "Salt & Straw", domain: "saltandstraw.com" },
      { name: "Pressed Juicery", domain: "pressed.com" },
      { name: "Starbucks", domain: "starbucks.com" },
      { name: "Beyond Yoga", domain: "beyondyoga.com" },
      { name: "The Shade Store", domain: "shadestore.com" },
      { name: "Simmzy's", domain: "simmzys.com" },
      { name: "The Arthur J", domain: "thearthurj.com" },
      { name: "BLVD", domain: "blvd.com" },
      { name: "Marine Layer", domain: "marinelayer.com" },
      { name: "Kreation Organic", domain: "kreationjuice.com" },
      { name: "Everything But Water", domain: "everythingbutwater.com" },
    ],
    bikeScore: 52,
    walkScore: 73,
    areaStats: [
      {
        value: "$1.37B",
        label: "TOTAL HOUSEHOLD EXPENDITURE IN THE IMMEDIATE SURROUNDING AREA",
      },
      {
        value: "$171K",
        label: "AVG. HOUSEHOLD INCOME WITHIN 1 MILE OF DOWNTOWN MANHATTAN BEACH",
      },
      { value: "17.7K", label: "DAYTIME POPULATION" },
    ],
    trafficCounts: [
      { street: "Manhattan Beach Blvd", count: "14,565 CPD" },
    ],
    mapCenter: { lat: 33.88637850892859, lng: -118.40589150089282 },
    mapZoom: 17,
  },
  "culver-city": {
    title: "Culver City",
    description:
      "Downtown Culver City boasts one of the smallest, but one of the most up-and-coming shopping and dining districts in Los Angeles. Once known primarily for its role in Los Angeles's historic movie industry, it's now known for some of the finest eateries and drinking establishments. Downtown Culver City is anchored by the large daytime population and employee base that surrounds it, becoming an extension of Silicon Beach.",
    estimatedRents: "$72-$90 PSF/yr NNN",
    galleryImages: [
      { src: galleryCulver1, alt: "Sephora storefront in Downtown Culver City" },
      { src: galleryCulver2, alt: "CAVA in Downtown Culver City" },
      { src: galleryCulver3, alt: "Salt & Straw in Downtown Culver City" },
      { src: galleryCulver4, alt: "Equinox entrance in Downtown Culver City" },
    ],
    notableBrands: [
      { name: "CAVA", domain: "cava.com" },
      { name: "Tender Greens", domain: "tendergreens.com" },
      { name: "Drybar", domain: "drybarshops.com" },
      { name: "Trader Joe's", domain: "traderjoes.com" },
      { name: "IN-N-Out Burger", domain: "innoutburger.com" },
      { name: "Ippudo", domain: "ippudo.com" },
      { name: "Luna Grill", domain: "lunagrill.com" },
      { name: "Citizen Public Market", domain: "citizenpublicmarket.com" },
      { name: "Stanley's Wet Goods", domain: "stanleyswetgoods.com" },
      { name: "Breakfast Republic", domain: "breakfastrepublic.com" },
      { name: "Cafe Vida", domain: "cafevida.net" },
      { name: "Caffe Luxxe", domain: "caffeluxxe.com" },
      { name: "33 Taps", domain: "33taps.com" },
      { name: "Bacari", domain: "bacarirestaurants.com" },
      { name: "Topson Downs", domain: "topsondowns.com" },
    ],
    bikeScore: 74,
    walkScore: 96,
    areaStats: [
      {
        value: "$1.45B",
        label: "TOTAL HOUSEHOLD EXPENDITURE IN THE IMMEDIATE SURROUNDING AREA",
      },
      { value: "130K", label: "EMPLOYEES IN THE IMMEDIATE DOWNTOWN AREA" },
      {
        value: "$114K",
        label: "AVG. HOUSEHOLD INCOME WITHIN 2 MILES OF DOWNTOWN CULVER CITY",
      },
      { value: "30K", label: "DAYTIME POPULATION" },
    ],
    trafficCounts: [
      { street: "Culver Blvd", count: "20,000 CPD" },
      { street: "Washington Blvd", count: "29,000 CPD" },
    ],
    mapCenter: { lat: 34.0238822, lng: -118.396119 },
    mapZoom: 17,
  },
  montana: {
    title: "Montana Ave",
    description:
      "Located between Brentwood and Santa Monica, Montana Avenue is one of the Westside's most chic and charming shopping destinations. Stretching about 10 city blocks, Montana Avenue is filled with upscale boutiques, restaurants, and cafes. Montana Avenue's blend of elegant boutiques and neighborhood appeal has given it a reputation of being a more polished and established alternative to the promotional Third Street Promenade or edgy Abbot Kinney.",
    estimatedRents: "$72-$110 PSF/yr NNN",
    galleryImages: [
      { src: galleryMontana1, alt: "Williams-Sonoma storefront on Montana Ave" },
      { src: galleryMontana2, alt: "R+D Kitchen entrance on Montana Ave" },
      { src: galleryMontana3, alt: "Whole Foods Market on Montana Ave" },
      { src: galleryMontana4, alt: "Outdoor dining along Montana Ave" },
    ],
    notableBrands: [
      { name: "Whole Foods Market", domain: "wholefoodsmarket.com" },
      { name: "Bardonna", domain: "bardonna.com" },
      { name: "Sweetgreen", domain: "sweetgreen.com" },
      { name: "Williams-Sonoma", domain: "williams-sonoma.com" },
      { name: "Sweet Lady Jane", domain: "sweetladyjane.com" },
      { name: "Kiehl's", domain: "kiehls.com" },
      { name: "Splendid", domain: "splendid.com" },
      { name: "The Shade Store", domain: "shadestore.com" },
      { name: "Kreation Organic", domain: "kreationjuice.com" },
      { name: "Avocado", domain: "avocadogreenmattress.com" },
      { name: "Drybar", domain: "drybar.com" },
      { name: "Casper", domain: "casper.com" },
      { name: "Brooklinen", domain: "brooklinen.com" },
      { name: "Van Leeuwen", domain: "vanleeuwenicecream.com" },
      { name: "Free People", domain: "freepeople.com" },
    ],
    bikeScore: 81,
    walkScore: 88,
    areaStats: [
      {
        value: "$115M",
        label: "SPENT ANNUALLY ON FOOD AWAY FROM HOME",
      },
      {
        value: "$100M",
        label: "SPENT ANNUALLY ON CONSUMER ENTERTAINMENT AND RECREATION",
      },
      { value: "$125K", label: "AVG. HOUSEHOLD INCOME WITHIN ONE MILE" },
    ],
    trafficCounts: [{ street: "Montana Ave", count: "21,000 CPD" }],
    mapCenter: { lat: 34.0311253, lng: -118.4962138 },
    mapZoom: 17,
  },
  "sunset-strip": {
    title: "Sunset Strip",
    description:
      "The Sunset Strip, once legendary for its nightlife, music venues, and history of rock n' roll influence, is now home to a wide variety of retailers. Stretching approximately a mile and half along Sunset Boulevard, between Crescent Heights Boulevard and Doheny Drive, has seen an influx of promotional retailers, chic boutiques, and hip restaurants while still offering historic hotels, popular night clubs, and small concert venues. The Sunset Strip has also seen several new developments including new boutique hotels, mixed use projects, and high-end shopping centers.",
    estimatedRents: "$75-$105 PSF/yr NNN",
    galleryImages: [
      { src: gallerySunsetStrip1, alt: "Supreme storefront on the Sunset Strip" },
      { src: gallerySunsetStrip2, alt: "Oliver Peoples storefront on the Sunset Strip" },
      { src: gallerySunsetStrip3, alt: "Outdoor patio dining on the Sunset Strip" },
      { src: gallerySunsetStrip4, alt: "Tocaya Organica on the Sunset Strip" },
    ],
    notableBrands: [
      { name: "Equinox", domain: "equinox.com" },
      { name: "Oliver Peoples", domain: "oliverpeoples.com" },
      { name: "Kith", domain: "kith.com" },
      { name: "SunLife Organics", domain: "sunlifeorganics.com" },
      { name: "Coffee Bean & Tea Leaf", domain: "coffeebean.com" },
      { name: "H. Lorenzo", domain: "hlorenzo.com" },
      { name: "Bluemercury", domain: "bluemercury.com" },
      { name: "Drybar", domain: "drybarshops.com" },
      { name: "Tocaya Organica", domain: "tocaya.com" },
      { name: "Sweetgreen", domain: "sweetgreen.com" },
      { name: "Supreme", domain: "supremenewyork.com" },
      { name: "Next Health", domain: "next-health.com" },
      { name: "SoulCycle", domain: "soul-cycle.com" },
      { name: "Alice + Olivia", domain: "aliceandolivia.com" },
      { name: "SKIMS", domain: "skims.com" },
    ],
    bikeScore: 29,
    walkScore: 89,
    areaStats: [
      {
        value: "$2.1B",
        label: "AVG. HOUSEHOLD EXPENDITURE OF SURROUNDING POPULATION IN 2017",
      },
      {
        value: "$2.9M",
        label:
          "AVG. SALES PRICE OF HOMES NORTH OF THE SUNSET STRIP, SOME OF THE HIGHEST IN LA COUNTY",
      },
      {
        value: "$130K",
        label: "AVG. HOUSEHOLD INCOME OF RESIDENTS WITHIN 1 MILE OF THE SUNSET STRIP",
      },
    ],
    trafficCounts: [{ street: "Sunset Blvd", count: "31,000 CPD" }],
    mapCenter: { lat: 34.092648330681776, lng: -118.37921673409075 },
    mapZoom: 17,
  },
};

export function getCorridorDetail(slug: string): StreetCorridorDetail | undefined {
  return CORRIDOR_DETAILS[slug];
}

/** @deprecated Use getCorridorDetail("abbot-kinney") */
export const ABBOT_KINNEY_DETAIL = CORRIDOR_DETAILS["abbot-kinney"];
