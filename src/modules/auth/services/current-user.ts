import "server-only";

import { cookies } from "next/headers";
import type { AuthenticatedUser } from "../domain/authenticated-user";
import { SESSION_COOKIE_NAME, verifySession } from "./session-service";

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    return await verifySession(sessionCookie);
  } catch {
    return null;
  }
}
