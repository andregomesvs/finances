import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { InvestmentsPage } from "@/modules/investments/components/investments-page";
import { FirestoreInvestmentRepository } from "@/modules/investments/repositories/firestore-investment-repository";
import { ListInvestmentsService } from "@/modules/investments/services/investment-services";

export const dynamic = "force-dynamic";

export default async function InvestmentsRoute({ searchParams }: { searchParams: Promise<{ novo?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [params, investments] = await Promise.all([
    searchParams,
    new ListInvestmentsService(new FirestoreInvestmentRepository()).execute(user.uid),
  ]);

  return (
    <AuthenticatedShell user={user} activePath="/investimentos">
      <InvestmentsPage initialInvestments={investments} startWithForm={params.novo === "1"} />
    </AuthenticatedShell>
  );
}
