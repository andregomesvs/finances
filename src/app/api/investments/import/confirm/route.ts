import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { FirestoreInvestmentRepository } from "@/modules/investments/repositories/firestore-investment-repository";
import { importedInvestmentInputSchema } from "@/modules/investments/schemas/investment-import-schema";
import { CreateImportedInvestmentsService } from "@/modules/investments/services/investment-services";
import { hasTrustedOrigin } from "@/utils/http-origin";

const confirmedInvestmentSchema = importedInvestmentInputSchema.extend({
  currentAmountInCents: z.number().int().positive("Informe o valor atual do investimento"),
});
const confirmationSchema = z.object({ investments: z.array(confirmedInvestmentSchema).min(1).max(100) });

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sua sessão expirou." }, { status: 401 });

  try {
    const payload = confirmationSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ message: payload.error.issues[0]?.message ?? "Revise os investimentos extraídos." }, { status: 422 });
    const created = await new CreateImportedInvestmentsService(new FirestoreInvestmentRepository()).execute(user.uid, payload.data.investments);
    return NextResponse.json({ count: created.length }, { status: 201 });
  } catch (error) {
    console.error("Falha ao confirmar importação", error);
    return NextResponse.json({ message: "Não foi possível salvar os investimentos importados." }, { status: 500 });
  }
}
