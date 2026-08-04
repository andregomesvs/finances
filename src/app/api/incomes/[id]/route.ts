import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { DeleteIncomeService } from "@/modules/incomes/services/delete-income-service";
import { IncomeNotFoundError } from "@/modules/incomes/services/income-not-found-error";
import { UpdateIncomeService } from "@/modules/incomes/services/update-income-service";
import { incomeInputSchema } from "@/modules/incomes/schemas/income-schema";
import { FirestoreTransactionRepository } from "@/modules/transactions/repositories/firestore-transaction-repository";
import { hasTrustedOrigin } from "@/utils/http-origin";

const idSchema = z.uuid();

async function getAuthorizedRequest(request: NextRequest, params: Promise<{ id: string }>) {
  if (!hasTrustedOrigin(request)) {
    return { error: NextResponse.json({ message: "Origem da requisição inválida." }, { status: 403 }) };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ message: "Sua sessão expirou. Entre novamente." }, { status: 401 }) };
  }

  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) {
    return { error: NextResponse.json({ message: "Identificador inválido." }, { status: 400 }) };
  }

  return { id: parsedId.data, user };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await getAuthorizedRequest(request, params);
  if (authorization.error) return authorization.error;

  try {
    const payload = incomeInputSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { message: payload.error.issues[0]?.message ?? "Revise os dados informados." },
        { status: 422 },
      );
    }

    await new UpdateIncomeService(new FirestoreTransactionRepository()).execute(
      authorization.id,
      authorization.user.uid,
      payload.data,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof IncomeNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Falha ao editar entrada", error);
    return NextResponse.json({ message: "Não foi possível editar a entrada." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await getAuthorizedRequest(request, params);
  if (authorization.error) return authorization.error;

  try {
    await new DeleteIncomeService(new FirestoreTransactionRepository()).execute(
      authorization.id,
      authorization.user.uid,
    );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof IncomeNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Falha ao apagar entrada", error);
    return NextResponse.json({ message: "Não foi possível apagar a entrada." }, { status: 500 });
  }
}
