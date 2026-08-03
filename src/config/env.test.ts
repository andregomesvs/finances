import { afterEach, describe, expect, it } from "vitest";
import { getFirebaseEnv } from "./env";

const originalEnv = process.env;

afterEach(() => {
  process.env = originalEnv;
});

describe("getFirebaseEnv", () => {
  it("aceita configuração mínima para o emulador", () => {
    process.env = {
      ...originalEnv,
      FIREBASE_PROJECT_ID: "aurea-local",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
    };

    expect(getFirebaseEnv()).toMatchObject({
      FIREBASE_PROJECT_ID: "aurea-local",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
    });
  });

  it("rejeita host do emulador com protocolo", () => {
    process.env = {
      ...originalEnv,
      FIREBASE_PROJECT_ID: "aurea-local",
      FIRESTORE_EMULATOR_HOST: "http://127.0.0.1:8080",
    };

    expect(() => getFirebaseEnv()).toThrow();
  });
});
