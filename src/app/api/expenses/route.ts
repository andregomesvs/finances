import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { cardExpenseInputSchema } from "@/modules/expenses/schemas/card-expense-schema";
import { CreateCardExpenseService } from "@/modules/expenses/services/create-card-expense-service";
import { FirestoreTransactionRepository } from "@/modules/transactions/repositories/firestore-transaction-repository";
import { hasTrustedOrigin } from "@/utils/http-origin";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ message: "Origem da requisição inválida." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  }

  try {
    const payload = cardExpenseInputSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { message: payload.error.issues[0]?.message ?? "Revise os dados informados." },
        { status: 422 },
      );
    }

    const installments = await new CreateCardExpenseService(
      new FirestoreTransactionRepository(),
    ).execute(user.uid, payload.data);

    return NextResponse.json({ count: installments.length }, { status: 201 });
  } catch (error) {
    console.error("Falha ao cadastrar saída do cartão", error);
    return NextResponse.json(
      { message: "Não foi possível salvar a compra. Tente novamente." },
      { status: 500 },
    );
  }
}
