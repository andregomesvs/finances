import { describe, expect, it } from "vitest";
import { parseCurrencyToCents } from "./currency-input";

describe("parseCurrencyToCents", () => {
  it("converte valores no formato brasileiro", () => {
    expect(parseCurrencyToCents("R$ 8.500,25")).toBe(850025);
  });

  it("rejeita valores inválidos ou não positivos", () => {
    expect(parseCurrencyToCents("0")).toBeNull();
    expect(parseCurrencyToCents("texto")).toBeNull();
  });
});
