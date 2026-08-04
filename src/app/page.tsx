import { Dashboard } from "@/modules/dashboard/components/dashboard";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/services/current-user";
import { GetDashboardOverviewService } from "@/modules/dashboard/services/get-dashboard-overview";
import { FirestoreTransactionRepository } from "@/modules/transactions/repositories/firestore-transaction-repository";
import { FirestoreFixedExpenseRepository } from "@/modules/fixed-expenses/repositories/firestore-fixed-expense-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const overview = await new GetDashboardOverviewService(
    new FirestoreTransactionRepository(),
    new FirestoreFixedExpenseRepository(),
  ).execute(user.uid);

  return <Dashboard user={user} overview={overview} />;
}
