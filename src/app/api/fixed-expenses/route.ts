import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { FirestoreFixedExpenseRepository } from "@/modules/fixed-expenses/repositories/firestore-fixed-expense-repository";
import { fixedExpenseInputSchema } from "@/modules/fixed-expenses/schemas/fixed-expense-schema";
import { CreateFixedExpenseService } from "@/modules/fixed-expenses/services/fixed-expense-services";
import { hasTrustedOrigin } from "@/utils/http-origin";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sua sessão expirou." }, { status: 401 });
  try {
    const payload = fixedExpenseInputSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ message: payload.error.issues[0]?.message }, { status: 422 });
    await new CreateFixedExpenseService(new FirestoreFixedExpenseRepository()).execute(user.uid, payload.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Falha ao cadastrar gasto fixo", error);
    return NextResponse.json({ message: "Não foi possível salvar o gasto fixo." }, { status: 500 });
  }
}
