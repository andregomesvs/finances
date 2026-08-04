import "server-only";

import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirebaseAdminApp } from "./admin";

let auth: Auth | undefined;

export function getFirebaseAuth(): Auth {
  auth ??= getAuth(getFirebaseAdminApp());
  return auth;
}
