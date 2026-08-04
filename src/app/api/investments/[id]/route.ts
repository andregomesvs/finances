import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { FirestoreInvestmentRepository } from "@/modules/investments/repositories/firestore-investment-repository";
import { investmentInputSchema } from "@/modules/investments/schemas/investment-schema";
import { DeleteInvestmentService, InvestmentNotFoundError, UpdateInvestmentService } from "@/modules/investments/services/investment-services";
import { hasTrustedOrigin } from "@/utils/http-origin";

async function authorize(request: NextRequest, params: Promise<{ id: string }>) {
  if (!hasTrustedOrigin(request)) return { response: NextResponse.json({ message: "Origem inválida." }, { status: 403 }) };
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ message: "Sua sessão expirou." }, { status: 401 }) };
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return { response: NextResponse.json({ message: "Identificador inválido." }, { status: 400 }) };
  return { user, id: id.data };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, params);
  if (auth.response) return auth.response;

  try {
    const payload = investmentInputSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ message: payload.error.issues[0]?.message }, { status: 422 });
    await new UpdateInvestmentService(new FirestoreInvestmentRepository()).execute(auth.id!, auth.user!.uid, payload.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InvestmentNotFoundError) return NextResponse.json({ message: error.message }, { status: 404 });
    console.error("Falha ao editar investimento", error);
    return NextResponse.json({ message: "Não foi possível editar o investimento." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, params);
  if (auth.response) return auth.response;

  try {
    await new DeleteInvestmentService(new FirestoreInvestmentRepository()).execute(auth.id!, auth.user!.uid);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof InvestmentNotFoundError) return NextResponse.json({ message: error.message }, { status: 404 });
    console.error("Falha ao apagar investimento", error);
    return NextResponse.json({ message: "Não foi possível apagar o investimento." }, { status: 500 });
  }
}
