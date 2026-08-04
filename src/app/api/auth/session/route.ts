import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  createSession,
  revokeSession,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  UnauthorizedUserError,
} from "@/modules/auth/services/session-service";
import { hasTrustedOrigin } from "@/utils/http-origin";

const requestSchema = z.object({ idToken: z.string().min(1).max(10_000) });

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ message: "Origem da requisição inválida." }, { status: 403 });
  }

  try {
    const { idToken } = requestSchema.parse(await request.json());
    const { cookie, user } = await createSession(idToken);
    const response = NextResponse.json({ user });

    response.cookies.set(SESSION_COOKIE_NAME, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    });

    return response;
  } catch (error) {
    const message = error instanceof UnauthorizedUserError
      ? error.message
      : "Não foi possível validar o login. Tente novamente.";

    if (!(error instanceof UnauthorizedUserError)) {
      console.error("Falha ao criar sessão do Firebase", error);
    }

    return NextResponse.json({ message }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ message: "Origem da requisição inválida." }, { status: 403 });
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookie) {
    try {
      await revokeSession(cookie);
    } catch {
      // A sessão pode já estar expirada; o cookie ainda deve ser removido.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
