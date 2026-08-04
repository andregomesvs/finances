import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { GeminiInvestmentDocumentService, InvestmentDocumentAnalysisError } from "@/modules/investments/services/gemini-investment-document-service";
import { hasTrustedOrigin } from "@/utils/http-origin";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_PDF_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sua sessão expirou." }, { status: 401 });

  try {
    const formData = await request.formData();
    const document = formData.get("document");
    if (!(document instanceof File)) return NextResponse.json({ message: "Selecione um arquivo PDF." }, { status: 422 });
    if (document.type !== "application/pdf" || !document.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ message: "Envie um documento no formato PDF." }, { status: 415 });
    if (document.size === 0 || document.size > MAX_PDF_SIZE) return NextResponse.json({ message: "O PDF deve ter até 10 MB." }, { status: 413 });

    const bytes = Buffer.from(await document.arrayBuffer());
    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") return NextResponse.json({ message: "O arquivo enviado não é um PDF válido." }, { status: 415 });

    const result = await new GeminiInvestmentDocumentService().analyze(bytes);
    return NextResponse.json({ ...result, fileName: document.name, fileSize: document.size });
  } catch (error) {
    if (error instanceof InvestmentDocumentAnalysisError) return NextResponse.json({ message: error.message }, { status: 422 });
    console.error("Falha ao importar documento de investimentos", error);
    return NextResponse.json({ message: "Não foi possível processar o documento agora." }, { status: 500 });
  }
}
