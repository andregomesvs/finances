import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { cardExpenseInputSchema } from "@/modules/expenses/schemas/card-expense-schema";
import { CardExpenseNotFoundError, DeleteCardExpenseService, UpdateCardExpenseService } from "@/modules/expenses/services/manage-card-expense-services";
import { FirestoreTransactionRepository } from "@/modules/transactions/repositories/firestore-transaction-repository";
import { hasTrustedOrigin } from "@/utils/http-origin";

async function authorize(request: NextRequest, params: Promise<{ groupId: string }>) {
  if (!hasTrustedOrigin(request)) return { response: NextResponse.json({ message: "Origem inválida." }, { status: 403 }) };
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ message: "Sua sessão expirou." }, { status: 401 }) };
  const id = z.uuid().safeParse((await params).groupId);
  if (!id.success) return { response: NextResponse.json({ message: "Identificador inválido." }, { status: 400 }) };
  return { user, id: id.data };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const auth = await authorize(request, params); if (auth.response) return auth.response;
  try {
    const payload = cardExpenseInputSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ message: payload.error.issues[0]?.message }, { status: 422 });
    await new UpdateCardExpenseService(new FirestoreTransactionRepository()).execute(auth.id!, auth.user!.uid, payload.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CardExpenseNotFoundError) return NextResponse.json({ message: error.message }, { status: 404 });
    console.error("Falha ao editar compra", error);
    return NextResponse.json({ message: "Não foi possível editar a compra." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const auth = await authorize(request, params); if (auth.response) return auth.response;
  try {
    await new DeleteCardExpenseService(new FirestoreTransactionRepository()).execute(auth.id!, auth.user!.uid);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof CardExpenseNotFoundError) return NextResponse.json({ message: error.message }, { status: 404 });
    console.error("Falha ao apagar compra", error);
    return NextResponse.json({ message: "Não foi possível apagar a compra." }, { status: 500 });
  }
}
