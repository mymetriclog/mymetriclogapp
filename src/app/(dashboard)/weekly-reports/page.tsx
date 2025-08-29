import { WeeklyReportInterface } from "@/components/weekly-report-interface";
import { getServerSession } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin-check";
import { redirect } from "next/navigation";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

export default async function WeeklyReportsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin
  const isAdmin = isUserAdmin(session.user);

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Admin Access Required
            </h2>
            <p className="text-red-600 mb-4">
              You need administrator privileges to access weekly reports.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <WeeklyReportInterface />
    </div>
  );
}
