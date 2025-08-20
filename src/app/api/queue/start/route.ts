import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin-check";
import {
  getAllUsersWithIntegrations,
  addUsersToQueue,
  getQueueStats,
} from "@/lib/queue/queue-service";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const isAdmin = session?.user?.user_metadata?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportType = "daily", batchSize = 10 } = await request.json();

    // Fetch users with integrations
    const supabase = await getServerSupabaseClient();
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .not("integrations", "is", null);

    if (usersError) {
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const usersWithIntegrations = users.filter(
      (user) => user.integrations && Object.keys(user.integrations).length > 0
    );

    const usersWithoutIntegrations = users.filter(
      (user) => !user.integrations || Object.keys(user.integrations).length === 0
    );

    // Add users to queue
    const jobs = [];
    for (const user of usersWithIntegrations) {
      const job = await addJobToQueue({
        userId: user.id,
        userEmail: user.email,
        reportType,
        priority: "normal",
      });

      if (job) {
        jobs.push(job);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Queue started with ${jobs.length} jobs`,
      jobsAdded: jobs.length,
      totalUsers: users.length,
      usersWithIntegrations: usersWithIntegrations.length,
      usersWithoutIntegrations: usersWithoutIntegrations.length,
    });
  } catch (error) {
    console.error("Queue start error:", error);
    return NextResponse.json(
      { error: "Failed to start queue" },
      { status: 500 }
    );
  }
}

// GET endpoint to check queue status
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = isUserAdmin(session.user);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const stats = await getQueueStats();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error getting queue stats:", error);

    return NextResponse.json(
      {
        error: "Failed to get queue stats",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
