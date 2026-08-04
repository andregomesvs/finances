import { describe, expect, it } from "vitest";
import { addMonthsToIsoDate } from "./installment-date";

describe("addMonthsToIsoDate", () => {
  it("ajusta o vencimento para o último dia de meses menores", () => {
    expect(addMonthsToIsoDate("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonthsToIsoDate("2028-01-31", 1)).toBe("2028-02-29");
  });
});
