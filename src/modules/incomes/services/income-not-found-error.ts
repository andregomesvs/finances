export class IncomeNotFoundError extends Error {
  constructor() {
    super("Entrada não encontrada.");
  }
}
