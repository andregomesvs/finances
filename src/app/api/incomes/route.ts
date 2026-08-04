import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { CreateIncomesService } from "@/modules/incomes/services/create-incomes-service";
import { createIncomesSchema } from "@/modules/incomes/schemas/income-schema";
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
    const payload = createIncomesSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { message: payload.error.issues[0]?.message ?? "Revise os dados informados." },
        { status: 422 },
      );
    }

    const service = new CreateIncomesService(new FirestoreTransactionRepository());
    const entries = await service.execute(user.uid, payload.data.entries);

    return NextResponse.json({ count: entries.length }, { status: 201 });
  } catch (error) {
    console.error("Falha ao cadastrar entradas", error);
    return NextResponse.json(
      { message: "Não foi possível salvar as entradas. Tente novamente." },
      { status: 500 },
    );
  }
}
