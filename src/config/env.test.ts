import { afterEach, describe, expect, it } from "vitest";
import { getAuthEnv, getFirebaseEnv, getPluggyEnv } from "./env";

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

  it("valida o e-mail autorizado", () => {
    process.env = { ...originalEnv, FIREBASE_ALLOWED_EMAIL: "andre@example.com" };

    expect(getAuthEnv()).toEqual({ FIREBASE_ALLOWED_EMAIL: "andre@example.com" });
  });

  it("valida as credenciais server-side da Pluggy", () => {
    process.env = {
      ...originalEnv,
      PLUGGY_CLIENT_ID: "client-id",
      PLUGGY_CLIENT_SECRET: "client-secret",
    };

    expect(getPluggyEnv()).toEqual({
      PLUGGY_CLIENT_ID: "client-id",
      PLUGGY_CLIENT_SECRET: "client-secret",
    });
  });
});
