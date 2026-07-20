interface SetupBannerProps {
  missingKey: boolean;
  needsGeocode: number;
}

export function SetupBanner({ missingKey, needsGeocode }: SetupBannerProps) {
  if (!missingKey && needsGeocode === 0) return null;

  return (
    <aside className="setup-banner" role="status">
      {missingKey && (
        <p>
          <strong>API key required.</strong> Copy <code>.env.example</code> to{" "}
          <code>.env</code> and set <code>VITE_GOOGLE_MAPS_API_KEY</code>. See
          README for Google Cloud setup.
        </p>
      )}
      {needsGeocode > 0 && (
        <p>
          <strong>{needsGeocode} tenants</strong> have no coordinates yet. Run{" "}
          <code>npm run geocode</code> then <code>npm run convert</code>.
        </p>
      )}
    </aside>
  );
}
