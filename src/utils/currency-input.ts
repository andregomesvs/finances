export function parseCurrencyToCents(value: string): number | null {
  const sanitized = value.replace(/R\$|\s/g, "");
  const normalized = sanitized.includes(",")
    ? sanitized.replace(/\./g, "").replace(",", ".")
    : sanitized;
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}
