import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { FirestorePluggyConnectionRepository } from "@/modules/open-finance/repositories/firestore-pluggy-connection-repository";
import {
  CreatePluggyConnectTokenService,
  PluggyConnectionNotFoundError,
} from "@/modules/open-finance/services/pluggy-services";
import { hasTrustedOrigin } from "@/utils/http-origin";

const requestSchema = z.object({ itemId: z.uuid().optional() });

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sua sessão expirou." }, { status: 401 });

  try {
    const payload = requestSchema.safeParse(await request.json().catch(() => ({})));
    if (!payload.success) return NextResponse.json({ message: "Conexão inválida." }, { status: 422 });
    const accessToken = await new CreatePluggyConnectTokenService(
      new FirestorePluggyConnectionRepository(),
    ).execute(user.uid, payload.data.itemId);
    return NextResponse.json({ accessToken });
  } catch (error) {
    if (error instanceof PluggyConnectionNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Falha ao criar Connect Token da Pluggy", error);
    return NextResponse.json({ message: "Não foi possível iniciar a conexão bancária." }, { status: 502 });
  }
}
