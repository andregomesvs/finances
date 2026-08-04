import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { ExpensesPage } from "@/modules/expenses/components/expenses-page";
import { ListCardExpensesService } from "@/modules/expenses/services/list-card-expenses-service";
import { FirestoreTransactionRepository } from "@/modules/transactions/repositories/firestore-transaction-repository";

export const dynamic = "force-dynamic";

export default async function ExpensesRoute({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [params, expenses] = await Promise.all([
    searchParams,
    new ListCardExpensesService(new FirestoreTransactionRepository()).execute(user.uid),
  ]);

  return (
    <AuthenticatedShell user={user} activePath="/saidas">
      <ExpensesPage initialExpenses={expenses} startWithForm={params.nova === "1"} />
    </AuthenticatedShell>
  );
}
