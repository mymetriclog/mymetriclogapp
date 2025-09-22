import type { ReactNode } from "react";
import { getServerSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClientLayout from "./client-layout";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

// Keep layout simple; rely on middleware for auth. If session missing, hard redirect.
export default async function DashboardProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = session.user;
  const name =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "User";
  const email = user?.email || "user@example.com";
  const role = user?.user_metadata?.role as string | undefined;

  return (
    <DashboardClientLayout user={{ name, email, role }}>
      {children}
    </DashboardClientLayout>
  );
}
