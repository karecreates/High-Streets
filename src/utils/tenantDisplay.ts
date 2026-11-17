/** Tenants without a real name are hidden from the map. */
export function isNamedTenant(tenantName: string): boolean {
  const normalized = tenantName.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "(unnamed tenant)") return false;
  if (normalized === "unnamed tenant") return false;
  if (normalized === "unnamed") return false;
  if (normalized === "unamed") return false;
  return true;
}

function titleCaseWord(word: string): string {
  if (!word || word === "&") return word;

  const irish = word.match(/^(mc|mac)([a-z].*)$/i);
  if (irish) {
    const prefix = irish[1].toLowerCase() === "mac" ? "Mac" : "Mc";
    return prefix + titleCaseWord(irish[2]);
  }

  let capitalized = false;
  return [...word]
    .map((char) => {
      if (!/\p{L}/u.test(char)) return char;
      if (!capitalized) {
        capitalized = true;
        return char.toUpperCase();
      }
      return char.toLowerCase();
    })
    .join("");
}

/** Title case for map labels: Casa Martin, Wilson — never ALL CAPS. */
export function formatTenantDisplayName(tenantName: string): string {
  return tenantName
    .trim()
    .split(/\s+/)
    .map((token) => token.split("-").map(titleCaseWord).join("-"))
    .join(" ");
}
