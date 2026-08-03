import { describe, expect, it } from "vitest";
import { formatCurrency } from "./money";

describe("formatCurrency", () => {
  it("formata valores em real brasileiro", () => {
    expect(formatCurrency(1234.56)).toContain("1.234,56");
  });

  it("rejeita valores não finitos", () => {
    expect(() => formatCurrency(Number.NaN)).toThrow(TypeError);
  });
});
