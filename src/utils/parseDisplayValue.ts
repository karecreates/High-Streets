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
      return {
        type: "number",
        target,
        prefix: moneyMatch[1] ?? "",
        suffix: moneyMatch[3] ?? "",
        format: (n) => String(Math.round(n)),
      };
    }
  }

  return { type: "text", value: trimmed };
}
