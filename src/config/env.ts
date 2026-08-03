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

export type FirebaseEnv = z.infer<typeof firebaseEnvSchema>;

export function getFirebaseEnv(): FirebaseEnv {
  return firebaseEnvSchema.parse(process.env);
}
