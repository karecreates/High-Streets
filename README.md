# California High Streets — Interactive Tenant Map

A client-ready React app that plots Salesforce high-street tenant data on **Google Maps** with favicon markers, clustering, filters, and info windows.

Data sources:
- Occupied tenants: `assets/Spaces by High Street-2026-05-14-14-22-53.xlsx`
- Vacancies: `assets/VACANT Spaces by High Street-2026-06-16-11-22-21.xlsx`

```bash
npm run convert:all   # tenants + vacancies JSON
npm run geocode       # geocode any new addresses
```

Master map: [http://localhost:5173/map](http://localhost:5173/map) — all corridors, Logo.dev markers, filter by high street.

## Quick start

```bash
cd "high streets interactive maps"
npm install
npm run convert
cp .env.example .env
# Edit .env — add your API key and Map ID (see below)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> **Note:** Markers only appear after addresses are geocoded. See [Geocoding](#geocoding-addresses) below.

## Google Maps API key

1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis).
2. Create or select a project.
3. Enable APIs:
   - **Maps JavaScript API** (for the map)
   - **Geocoding API** (for `npm run geocode`)
4. Create an API key under **Credentials**.
5. Restrict the key (recommended):
   - Application: HTTP referrers → `http://localhost:5173/*`
   - APIs: Maps JavaScript API + Geocoding API
6. Copy the key into `.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=AIza...
GOOGLE_MAPS_API_KEY=AIza...
```

## Map ID (required for custom markers)

Advanced Markers need a **Map ID**:

1. In Cloud Console → **Google Maps Platform** → **Map Management** → **Map IDs**.
2. **Create map ID** → type **JavaScript** → raster or vector (vector recommended).
3. Add to `.env`:

```env
VITE_GOOGLE_MAPS_MAP_ID=your_map_id_here
```

## Project structure

```
├── public/data/
│   ├── tenants.json          # Generated from Excel (git-friendly data file)
│   └── geocode-cache.json    # Cached lat/lng per address (created by geocode)
├── scripts/
│   ├── convert-xlsx.mjs      # Excel → tenants.json
│   └── geocode.mjs           # Batch geocode via Google Geocoding API
├── src/
│   ├── App.tsx
│   ├── components/           # Map, filters, info window
│   ├── hooks/useTenants.ts
│   ├── styles/
│   │   ├── variables.css     # ← Customize colors, marker size, fonts
│   │   └── main.css
│   └── types/tenant.ts
├── .env.example
└── package.json
```

## Data workflow

### 1. Convert Excel to JSON

Place your Excel file next to the project folder (default path), or pass a custom path:

```bash
npm run convert
# or
npm run convert -- "/path/to/high_streets_mapbox_favicons.xlsx"
```

This writes `public/data/tenants.json` with fields:

| Excel column | JSON field |
|---|---|
| Tenant: Account Name | `tenantName` |
| Property: Property Name | `address` |
| Suite of Unit/Space | `suite` |
| Property: High Street | `highStreet` |
| Domain Guess | `domain` |
| Favicon URL | `faviconUrl` |
| Unit Status | `unitStatus` |

There are **no latitude/longitude columns** in the export — coordinates come from geocoding.

### 2. Geocoding addresses

The app geocodes **unique property addresses** (~1,300 for the full California export) and caches results so re-runs are cheap.

```bash
# Test with 20 addresses first
npm run geocode -- --limit 20

# Full run (~15–25 min with rate limiting)
npm run geocode

# Merge cache into tenants.json
npm run convert
```

**How it works**

- `scripts/geocode.mjs` calls the [Geocoding API](https://developers.google.com/maps/documentation/geocoding/overview) with queries like `"1009 Abbot Kinney Blvd, California, USA"`.
- Results are saved to `public/data/geocode-cache.json`.
- `npm run convert` merges the cache into each tenant row (`lat`, `lng`).

**Costs & quotas:** Geocoding is billed per request. Unique addresses ≈ 1,296 requests for the full file. Check [Google Maps pricing](https://developers.google.com/maps/billing-and-pricing/pricing).

**Manual geocoding alternative:** You can add `lat` / `lng` columns to a CSV export and extend `convert-xlsx.mjs` to read them if you prefer.

## Features

- **Custom markers** — white rounded card, centered favicon, shadow (CSS variables in `variables.css`)
- **Info window** — tenant name, address, high street, website, logo
- **Filters** — corridor dropdown + tenant name search
- **Clustering** — markers cluster when zoomed out
- **Multi-corridor** — all high streets in one dataset; no hardcoded tenants

## Customizing the UI

Edit `src/styles/variables.css`:

```css
:root {
  --color-accent: #0d6e6e;
  --marker-width: 44px;
  --marker-radius: 10px;
  --marker-shadow: 0 2px 8px ...;
}
```

Component layout and filter bar styles live in `src/styles/main.css`.

## Build for production

```bash
npm run build
npm run preview
```

Serve the `dist/` folder from any static host. Set environment variables at build time for `VITE_GOOGLE_MAPS_API_KEY` and `VITE_GOOGLE_MAPS_MAP_ID`.

## Troubleshooting

| Issue | Fix |
|---|---|
| Blank map | Check API key in `.env`, Maps JavaScript API enabled |
| No markers | Run geocode + convert; check `geocodedCount` in `tenants.json` |
| Markers don't render | Set a valid `VITE_GOOGLE_MAPS_MAP_ID` |
| Geocode failures | Verify Geocoding API enabled; check address quality in Excel |
| Favicons missing | Some domains block hotlinking; fallback shows first letter |

## License

Private / internal use. Google Maps Platform terms apply to API usage.
