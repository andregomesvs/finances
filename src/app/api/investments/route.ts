import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { FirestoreInvestmentRepository } from "@/modules/investments/repositories/firestore-investment-repository";
import { investmentInputSchema } from "@/modules/investments/schemas/investment-schema";
import { CreateInvestmentService } from "@/modules/investments/services/investment-services";
import { hasTrustedOrigin } from "@/utils/http-origin";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sua sessão expirou." }, { status: 401 });

  try {
    const payload = investmentInputSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ message: payload.error.issues[0]?.message }, { status: 422 });
    await new CreateInvestmentService(new FirestoreInvestmentRepository()).execute(user.uid, payload.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Falha ao cadastrar investimento", error);
    return NextResponse.json({ message: "Não foi possível salvar o investimento." }, { status: 500 });
  }
}
