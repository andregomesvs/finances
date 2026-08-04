import { Dashboard } from "@/modules/dashboard/components/dashboard";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/services/current-user";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <Dashboard user={user} />;
}
