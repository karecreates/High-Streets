export type ParsedDisplayValue =
  | {
      type: "number";
      target: number;
      prefix: string;
      suffix: string;
      format: (n: number) => string;
    }
  | { type: "text"; value: string };

export function parseDisplayValue(raw: string): ParsedDisplayValue {
  const trimmed = raw.trim();

  const cpdMatch = trimmed.match(/^([\d,]+)\s*(.+)$/i);
  if (cpdMatch && /cpd/i.test(cpdMatch[2])) {
    const target = Number.parseInt(cpdMatch[1].replace(/,/g, ""), 10);
    return {
      type: "number",
      target,
      prefix: "",
      suffix: ` ${cpdMatch[2].trim()}`,
      format: (n) => Math.round(n).toLocaleString("en-US"),
    };
  }

  const moneyMatch = trimmed.match(/^(\$?)([\d.]+)(.*)$/);
  if (moneyMatch && moneyMatch[2]) {
    const target = Number.parseFloat(moneyMatch[2]);
    if (!Number.isNaN(target)) {
      // Keep the source's decimal precision ("1.63M" must not settle at "2M").
      const decimals = (moneyMatch[2].split(".")[1] ?? "").length;
      return {
        type: "number",
        target,
        prefix: moneyMatch[1] ?? "",
        suffix: moneyMatch[3] ?? "",
        format: (n) => n.toFixed(decimals),
      };
    }
  }

  return { type: "text", value: trimmed };
}
