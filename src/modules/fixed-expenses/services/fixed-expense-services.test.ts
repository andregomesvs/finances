import { describe, expect, it } from "vitest";
import { isFixedExpenseActiveInMonth } from "./fixed-expense-services";

describe("isFixedExpenseActiveInMonth", () => {
  it("mantém uma recorrência sem mês final ativa depois do início", () => {
    const expense = { startMonth: "2026-08", endMonth: null };

    expect(isFixedExpenseActiveInMonth(expense, "2026-07")).toBe(false);
    expect(isFixedExpenseActiveInMonth(expense, "2026-08")).toBe(true);
    expect(isFixedExpenseActiveInMonth(expense, "2027-01")).toBe(true);
  });

  it("inclui os meses inicial e final no período ativo", () => {
    const expense = { startMonth: "2026-08", endMonth: "2026-10" };

    expect(isFixedExpenseActiveInMonth(expense, "2026-08")).toBe(true);
    expect(isFixedExpenseActiveInMonth(expense, "2026-10")).toBe(true);
    expect(isFixedExpenseActiveInMonth(expense, "2026-11")).toBe(false);
  });
});
