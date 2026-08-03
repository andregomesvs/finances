const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("O valor monetário deve ser um número finito.");
  }

  return brlFormatter.format(value);
}
