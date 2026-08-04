import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const firebaseEnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID é obrigatório"),
  FIREBASE_CLIENT_EMAIL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.email().optional(),
  ),
  FIREBASE_PRIVATE_KEY: optionalString,
  GOOGLE_APPLICATION_CREDENTIALS: optionalString,
  FIRESTORE_EMULATOR_HOST: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().regex(/^[^:/\s]+:\d+$/, "Use host:porta, sem http://").optional(),
  ),
});

const authEnvSchema = z.object({
  FIREBASE_ALLOWED_EMAIL: z.email("FIREBASE_ALLOWED_EMAIL deve ser um e-mail válido"),
});

export type FirebaseEnv = z.infer<typeof firebaseEnvSchema>;
export type AuthEnv = z.infer<typeof authEnvSchema>;

export function getFirebaseEnv(): FirebaseEnv {
  return firebaseEnvSchema.parse(process.env);
}

export function getAuthEnv(): AuthEnv {
  return authEnvSchema.parse(process.env);
}
