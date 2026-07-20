import { createContext, useContext, type ReactNode } from "react";
import { useTenants } from "../hooks/useTenants";
import type { Tenant, TenantsDataset } from "../types/tenant";
import { isNamedTenant } from "../utils/tenantDisplay";

type TenantsContextValue = ReturnType<typeof useTenants>;

const TenantsContext = createContext<TenantsContextValue | null>(null);

export function TenantsProvider({ children }: { children: ReactNode }) {
  const value = useTenants();

  if (value.loading) {
    return (
      <div className="app-loading">
        <p>Loading high street data…</p>
      </div>
    );
  }

  if (value.error || !value.dataset) {
    return (
      <div className="app-loading app-loading--error">
        <h1>Could not load data</h1>
        <p>{value.error ?? "Unknown error"}</p>
      </div>
    );
  }

  return (
    <TenantsContext.Provider value={value}>{children}</TenantsContext.Provider>
  );
}

export function useTenantsContext() {
  const ctx = useContext(TenantsContext);
  if (!ctx) throw new Error("useTenantsContext must be used within TenantsProvider");
  return ctx;
}

export function useStreetTenants(dataKey: string): Tenant[] {
  const { dataset } = useTenantsContext();
  if (!dataset) return [];
  return dataset.tenants.filter(
    (t) =>
      t.highStreet === dataKey &&
      t.lat != null &&
      t.lng != null &&
      isNamedTenant(t.tenantName)
  );
}

export function useStreetVacancies(dataKey: string) {
  const { vacanciesDataset } = useTenantsContext();
  if (!vacanciesDataset) return [];
  return vacanciesDataset.vacancies.filter(
    (v) => v.highStreet === dataKey && v.lat != null && v.lng != null
  );
}

export function useDataset(): TenantsDataset | null {
  return useTenantsContext().dataset;
}
