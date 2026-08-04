import { describe, expect, it } from "vitest";
import { hasTrustedOrigin } from "./http-origin";

describe("hasTrustedOrigin", () => {
  it("aceita o domínio encaminhado por um proxy confiável", () => {
    const request = new Request("http://internal:10000/api/incomes", {
      headers: {
        origin: "https://financesapp-iqt6.onrender.com",
        host: "internal:10000",
        "x-forwarded-host": "financesapp-iqt6.onrender.com",
      },
    });

    expect(hasTrustedOrigin(request)).toBe(true);
  });

  it("rejeita uma origem externa", () => {
    const request = new Request("https://financesapp-iqt6.onrender.com/api/incomes", {
      headers: { origin: "https://site-malicioso.example", host: "financesapp-iqt6.onrender.com" },
    });

    expect(hasTrustedOrigin(request)).toBe(false);
  });
});
