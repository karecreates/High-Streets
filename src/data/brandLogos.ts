/** Brand logos for corridor detail pages — sourced from assets/logos */

const EXCLUDED_LOGO_PATTERN =
  /logo-top\.png$|static1\.squarespace-1\.png$/i;

const logoModules = import.meta.glob<string>("@assets/logos/*", {
  eager: true,
  query: "?url",
  import: "default",
});

export const ABBOT_KINNEY_LOGOS: string[] = Object.entries(logoModules)
  .filter(([path]) => !EXCLUDED_LOGO_PATTERN.test(path))
  .map(([, url]) => url)
  .sort((a, b) => a.localeCompare(b));
