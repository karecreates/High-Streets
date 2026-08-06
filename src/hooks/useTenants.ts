import { useEffect, useMemo, useState } from "react";
import { HIGH_STREET_CORRIDORS } from "../data/highStreets";
import type { Tenant, TenantsDataset } from "../types/tenant";
import type { VacanciesDataset, Vacancy } from "../types/vacancy";
import { isNamedTenant } from "../utils/tenantDisplay";

/**
 * Only active high streets from the dashboard sidebar.
 * Shopping centers use logo pins / their own directory — not Excel street rows.
 */
export const SIDEBAR_TENANT_DATA_KEYS = new Set(
  HIGH_STREET_CORRIDORS.filter(
    (c) => c.active && Boolean(c.dataKey) && c.category === "high-streets"
  ).flatMap((c) => (c.dataKey ? [c.dataKey] : []))
);

export function useTenants() {
  const [dataset, setDataset] = useState<TenantsDataset | null>(null);
  const [vacanciesDataset, setVacanciesDataset] =
    useState<VacanciesDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highStreet, setHighStreet] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/data/tenants.json").then((res) => {
        if (!res.ok) throw new Error("Could not load tenant data");
        return res.json() as Promise<TenantsDataset>;
      }),
      fetch("/data/vacancies.json")
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null) as Promise<VacanciesDataset | null>,
    ])
      .then(([tenantData, vacancyData]) => {
        if (!cancelled) {
          setDataset(tenantData);
          setVacanciesDataset(vacancyData);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!dataset) return [] as Tenant[];

    const q = search.trim().toLowerCase();

    return dataset.tenants.filter((tenant) => {
      if (!isNamedTenant(tenant.tenantName)) return false;
      if (!SIDEBAR_TENANT_DATA_KEYS.has(tenant.highStreet)) return false;
      if (highStreet !== "all" && tenant.highStreet !== highStreet) {
        return false;
      }
      if (q && !tenant.tenantName.toLowerCase().includes(q)) {
        return false;
      }
      return tenant.lat != null && tenant.lng != null;
    });
  }, [dataset, highStreet, search]);

  const filteredVacancies = useMemo(() => {
    if (!vacanciesDataset) return [] as Vacancy[];

    const q = search.trim().toLowerCase();

    return vacanciesDataset.vacancies.filter((vacancy) => {
      if (!SIDEBAR_TENANT_DATA_KEYS.has(vacancy.highStreet)) return false;
      if (highStreet !== "all" && vacancy.highStreet !== highStreet) {
        return false;
      }
      if (q) {
        const haystack = [
          vacancy.address,
          vacancy.suite,
          vacancy.space,
          vacancy.unitStatus,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return vacancy.lat != null && vacancy.lng != null;
    });
  }, [vacanciesDataset, highStreet, search]);

  const stats = useMemo(() => {
    if (!dataset) {
      return {
        total: 0,
        mapped: 0,
        visible: 0,
        needsGeocode: 0,
        vacancies: 0,
        vacanciesVisible: 0,
      };
    }
    const sidebarTenants = dataset.tenants.filter((t) =>
      SIDEBAR_TENANT_DATA_KEYS.has(t.highStreet)
    );
    const mapped = sidebarTenants.filter(
      (t) => t.lat != null && t.lng != null
    ).length;
    const vacanciesTotal =
      vacanciesDataset?.vacancies.filter((v) =>
        SIDEBAR_TENANT_DATA_KEYS.has(v.highStreet)
      ).length ?? 0;
    return {
      total: sidebarTenants.length,
      mapped,
      visible: filtered.length,
      needsGeocode: sidebarTenants.length - mapped,
      vacancies: vacanciesTotal,
      vacanciesVisible: filteredVacancies.length,
    };
  }, [dataset, vacanciesDataset, filtered.length, filteredVacancies.length]);

  return {
    dataset,
    vacanciesDataset,
    loading,
    error,
    filtered,
    filteredVacancies,
    stats,
    highStreet,
    setHighStreet,
    search,
    setSearch,
  };
}
