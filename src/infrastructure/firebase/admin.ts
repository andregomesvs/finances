import "server-only";

import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirebaseEnv } from "@/config/env";

function createFirebaseAdminApp(): App {
  const env = getFirebaseEnv();

  if (env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
  }

  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return initializeApp({
      projectId: env.FIREBASE_PROJECT_ID,
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }

  return initializeApp({
    projectId: env.FIREBASE_PROJECT_ID,
    credential: applicationDefault(),
  });
}

export function getFirebaseAdminApp(): App {
  return getApps().length > 0 ? getApp() : createFirebaseAdminApp();
}
