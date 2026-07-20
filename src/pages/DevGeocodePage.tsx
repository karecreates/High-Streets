import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { TenantsDataset } from "../types/tenant";
import type { VacanciesDataset } from "../types/vacancy";
import {
  geocodeAddressWithGeocoder,
  type GeocodeCache,
} from "../utils/geocodeAddress";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function DevGeocodePage() {
  const geocodingLib = useMapsLibrary("geocoding");
  const [cache, setCache] = useState<GeocodeCache>({});
  const [tenants, setTenants] = useState<TenantsDataset | null>(null);
  const [vacancies, setVacancies] = useState<VacanciesDataset | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/data/geocode-cache.json").then((r) => r.json()),
      fetch("/data/tenants.json").then((r) => r.json()),
      fetch("/data/vacancies.json").then((r) => r.json()),
    ]).then(([cacheData, tenantData, vacancyData]) => {
      setCache(cacheData);
      setTenants(tenantData);
      setVacancies(vacancyData);
    });
  }, []);

  const pendingAddresses = useMemo(() => {
    const addresses = new Set<string>();
    for (const t of tenants?.tenants ?? []) {
      if (t.address?.trim()) addresses.add(t.address.trim());
    }
    for (const v of vacancies?.vacancies ?? []) {
      if (v.address?.trim()) addresses.add(v.address.trim());
    }
    return [...addresses].filter((addr) => !cache[addr.toLowerCase()]);
  }, [cache, tenants, vacancies]);

  const appendLog = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-40), line]);
  }, []);

  const runGeocode = useCallback(async () => {
    if (!geocodingLib || !pendingAddresses.length) return;

    setRunning(true);
    setSaved(false);
    const geocoder = new geocodingLib.Geocoder();
    const nextCache = { ...cache };
    let success = 0;
    let failed = 0;

    for (let i = 0; i < pendingAddresses.length; i++) {
      const address = pendingAddresses[i];
      const key = address.toLowerCase();

      try {
        const result = await geocodeAddressWithGeocoder(geocoder, address);
        if (result) {
          nextCache[key] = result;
          success++;
          appendLog(`✓ ${address}`);
        } else {
          failed++;
          appendLog(`⚠ No SoCal match: ${address}`);
        }
      } catch {
        failed++;
        appendLog(`✗ Failed: ${address}`);
      }

      setCache({ ...nextCache });
      await sleep(200);
    }

    appendLog(`Done — ${success} geocoded, ${failed} failed.`);
    setRunning(false);
  }, [appendLog, cache, geocodingLib, pendingAddresses]);

  const saveCache = useCallback(async () => {
    const res = await fetch("/api/geocode-cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cache, null, 2),
    });
    if (!res.ok) {
      appendLog("Could not save cache (dev server only).");
      return;
    }
    setSaved(true);
    appendLog("Saved geocode-cache.json — run: npm run convert");
  }, [appendLog, cache]);

  return (
    <div className="dev-geocode">
      <header className="dev-geocode__header">
        <Link to="/map">← Back to map</Link>
        <h1>Geocode missing addresses</h1>
        <p>
          Your API key is browser-restricted, so <code>npm run geocode</code>{" "}
          fails with REQUEST_DENIED. This page uses the Maps JavaScript Geocoder
          instead (works with your key).
        </p>
      </header>

      <div className="dev-geocode__stats">
        <span>
          <strong>{pendingAddresses.length}</strong> addresses need geocoding
        </span>
        <span>
          <strong>{Object.keys(cache).length}</strong> in cache
        </span>
      </div>

      <div className="dev-geocode__actions">
        <button
          type="button"
          className="pill-btn pill-btn--primary"
          disabled={running || !geocodingLib || pendingAddresses.length === 0}
          onClick={() => void runGeocode()}
        >
          {running ? "Geocoding…" : "Geocode missing addresses"}
        </button>
        <button
          type="button"
          className="pill-btn pill-btn--outline"
          disabled={running}
          onClick={() => void saveCache()}
        >
          Save cache to project
        </button>
      </div>

      {saved && (
        <p className="dev-geocode__success">
          Cache saved. In terminal run:{" "}
          <code>npm run convert</code> then refresh the map.
        </p>
      )}

      <pre className="dev-geocode__log">{log.join("\n") || "Ready."}</pre>
    </div>
  );
}
