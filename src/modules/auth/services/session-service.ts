import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { getAuthEnv } from "@/config/env";
import { getFirebaseAuth } from "@/infrastructure/firebase/auth";
import type { AuthenticatedUser } from "../domain/authenticated-user";

export const SESSION_COOKIE_NAME = "aurea_session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;
const MAX_ID_TOKEN_AGE_SECONDS = 5 * 60;

export class UnauthorizedUserError extends Error {}

function toAllowedUser(token: DecodedIdToken): AuthenticatedUser {
  const allowedEmail = getAuthEnv().FIREBASE_ALLOWED_EMAIL.trim().toLowerCase();
  const email = token.email?.trim().toLowerCase();

  if (!email || token.email_verified !== true || email !== allowedEmail) {
    throw new UnauthorizedUserError("Esta conta Google não possui acesso ao sistema.");
  }

  return {
    uid: token.uid,
    email,
    name: typeof token.name === "string" ? token.name : null,
    picture: typeof token.picture === "string" ? token.picture : null,
  };
}

export async function createSession(idToken: string) {
  const auth = getFirebaseAuth();
  const token = await auth.verifyIdToken(idToken);
  const tokenAge = Math.floor(Date.now() / 1000) - token.auth_time;

  if (tokenAge > MAX_ID_TOKEN_AGE_SECONDS) {
    throw new UnauthorizedUserError("Faça login novamente para continuar.");
  }

  const user = toAllowedUser(token);
  const cookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });

  return { cookie, user };
}

export async function verifySession(cookie: string): Promise<AuthenticatedUser> {
  const token = await getFirebaseAuth().verifySessionCookie(cookie, true);
  return toAllowedUser(token);
}

export async function revokeSession(cookie: string): Promise<void> {
  const token = await getFirebaseAuth().verifySessionCookie(cookie);
  await getFirebaseAuth().revokeRefreshTokens(token.uid);
}
