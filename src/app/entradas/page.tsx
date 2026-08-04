import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { IncomesPage } from "@/modules/incomes/components/incomes-page";
import { ListIncomesService } from "@/modules/incomes/services/list-incomes-service";
import { FirestoreTransactionRepository } from "@/modules/transactions/repositories/firestore-transaction-repository";

export const dynamic = "force-dynamic";

export default async function EntriesPage({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [params, entries] = await Promise.all([
    searchParams,
    new ListIncomesService(new FirestoreTransactionRepository()).execute(user.uid),
  ]);

  return (
    <AuthenticatedShell user={user} activePath="/entradas">
      <IncomesPage initialEntries={entries} startWithForm={params.nova === "1"} />
    </AuthenticatedShell>
  );
}
