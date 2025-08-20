import type { ReactNode } from "react";
import { getServerSession } from "@/lib/supabase/server";
import DashboardClientLayout from "./client-layout";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

// Dashboard layout - authentication is now handled by middleware
export default async function DashboardProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    // Get session for user data (middleware should have verified authentication)
    const session = await getServerSession();

    if (!session) {
      // If middleware didn't work, show error message
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              🔴 Authentication Required
            </h1>
            <p className="text-gray-700 mb-4">
              <strong>Please log in to continue.</strong>
            </p>
            <a
              href="/login"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Login
            </a>
          </div>
        </div>
      );
    }

    // Additional validation: check if user has required metadata
    if (!session.user?.email) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Invalid Session
            </h1>
            <p className="text-gray-600">
              Your session is invalid. Please log in again.
            </p>
            <a
              href="/login"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              Go to Login
            </a>
          </div>
        </div>
      );
    }

    // Extract user details to pass to the client layout
    const user = session.user;
    const name =
      (user?.user_metadata?.full_name as string | undefined) ||
      user?.email?.split("@")[0] ||
      "User";
    const email = user?.email || "user@example.com";
    const role = user?.user_metadata?.role as string | undefined;

    // Render the client layout, passing children and user data
    return (
      <DashboardClientLayout user={{ name, email, role }}>
        {children}
      </DashboardClientLayout>
    );
  } catch (error) {
    console.error("🔴 Dashboard layout error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">
            An error occurred while loading the dashboard.
          </p>
          <a
            href="/login"
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }
}
