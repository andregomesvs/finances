import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { AccountsPage } from "@/modules/open-finance/components/accounts-page";
import { FirestorePluggyConnectionRepository } from "@/modules/open-finance/repositories/firestore-pluggy-connection-repository";
import { GetOpenFinanceOverviewService } from "@/modules/open-finance/services/pluggy-services";

export const dynamic = "force-dynamic";

export default async function AccountsRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const overview = await new GetOpenFinanceOverviewService(
    new FirestorePluggyConnectionRepository(),
  ).execute(user.uid);

  return (
    <AuthenticatedShell user={user} activePath="/contas">
      <AccountsPage initialOverview={overview} />
    </AuthenticatedShell>
  );
}
