import { QueueDashboard } from "@/components/queue-dashboard";
import { WeeklyReportInterface } from "@/components/weekly-report-interface";
import { getServerSession } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin-check";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin
  const isAdmin = isUserAdmin(session.user);

  if (!isAdmin) {
    // Instead of redirecting, show a message that admin access is required
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Admin Access Required
            </h2>
            <p className="text-red-600 mb-4">
              You need administrator privileges to access the queue dashboard.
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
      <Tabs defaultValue="daily">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily Reports</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <QueueDashboard />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <WeeklyReportInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
}
