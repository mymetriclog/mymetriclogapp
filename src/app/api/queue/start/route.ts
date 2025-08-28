import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin-check";
import {
  getAllUsersWithIntegrations,
  addUsersToQueue,
  getQueueStats,
  userReportQueue,
} from "@/lib/queue/queue-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, timestamp, scheduledTime } = body;

    // Check if this is a cron request
    if (source === "cron") {
      // Verify cron secret for internal requests
      const authHeader = request.headers.get("Authorization");
      const cronSecret = process.env.CRON_SECRET;

      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        console.error("❌ Invalid cron secret in queue start");
        return NextResponse.json(
          { error: "Unauthorized cron request" },
          { status: 401 }
        );
      }

      console.log("🕐 Queue start triggered by cron job at:", timestamp);
      console.log("📅 Scheduled time:", scheduledTime);
    } else {
      // Regular user request - check admin permissions
      const session = await getServerSession();
      const isAdmin = session?.user?.user_metadata?.role === "admin";

      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { reportType = "daily", batchSize = 10 } = await request.json();

    // Use the existing function to get users with integrations
    const users = await getAllUsersWithIntegrations();

    const usersWithIntegrations = users.filter((user) => user.hasIntegrations);
    const usersWithoutIntegrations = users.filter(
      (user) => !user.hasIntegrations
    );

    // Add users to queue using the existing function
    const jobs = await addUsersToQueue(usersWithIntegrations);

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
