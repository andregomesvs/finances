import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { FirestorePluggyConnectionRepository } from "@/modules/open-finance/repositories/firestore-pluggy-connection-repository";
import { PluggyOwnershipError, SavePluggyConnectionService } from "@/modules/open-finance/services/pluggy-services";
import { hasTrustedOrigin } from "@/utils/http-origin";

const requestSchema = z.object({ itemId: z.uuid() });

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sua sessão expirou." }, { status: 401 });

  try {
    const payload = requestSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ message: "Item da Pluggy inválido." }, { status: 422 });
    const connection = await new SavePluggyConnectionService(
      new FirestorePluggyConnectionRepository(),
    ).execute(user.uid, payload.data.itemId);
    return NextResponse.json({ itemId: connection.itemId }, { status: 201 });
  } catch (error) {
    if (error instanceof PluggyOwnershipError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Falha ao registrar conexão da Pluggy", error);
    return NextResponse.json({ message: "Não foi possível registrar a conta conectada." }, { status: 502 });
  }
}
