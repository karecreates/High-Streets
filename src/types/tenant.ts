export interface Tenant {
  id: string;
  tenantName: string;
  address: string;
  suite: string;
  highStreet: string;
  costarUrl: string;
  domain: string;
  faviconUrl: string;
  unitStatus: string;
  /** Verified brand domain (logo.dev Brand Search) used for the logo image. */
  logoDomain?: string;
  /** True only when a verified brand domain resolved for this tenant. */
  hasLogo?: boolean;
  lat: number | null;
  lng: number | null;
}

export interface TenantsDataset {
  generatedAt: string;
  sourceFile: string;
  totalRows: number;
  geocodedCount: number;
  highStreets: string[];
  tenants: Tenant[];
}
