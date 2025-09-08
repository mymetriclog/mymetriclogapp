import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin-check";
import {
  getAllUsersWithIntegrations,
  addUsersToQueue,
  getQueueStats,
  userReportQueue,
} from "@/lib/queue/bull-queue-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      source,
      timestamp,
      scheduledTime,
      reportType = "daily",
      batchSize = 50,
      testingMode = false, // Add testing mode support
    } = body;

    // Public cron endpoint - no authentication required for cron requests
    if (source === "cron") {
      console.log("🕐 Processing public cron request");
    } else if (source === "manual") {
      // Manual requests still require admin authentication
      const session = await getServerSession();
      if (!session) {
        return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        );
      }

      const isAdmin = isUserAdmin(session.user);
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }

    // For weekly reports, check if it's Sunday OR if testing mode is enabled
    if (reportType === "weekly" && !testingMode) {
      const now = new Date();
      const today = now.getDay(); // 0 = Sunday
      if (today !== 0) {
        console.log(
          `⏭️ Weekly report generation skipped - today is not Sunday (${today})`
        );
        return NextResponse.json(
          {
            error: "Weekly reports can only be generated on Sundays",
            today: today,
            daysUntilSunday: 7 - today,
          },
          { status: 400 }
        );
      }
    }

    console.log(`🚀 Starting ${reportType} report generation from ${source}`);
    console.log(`📊 Report Type: ${reportType}`);
    console.log(`🧪 Testing Mode: ${testingMode}`);

    const users = await getAllUsersWithIntegrations();
    const usersWithIntegrations = users.filter((user) => user.hasIntegrations);
    const jobs = await addUsersToQueue(usersWithIntegrations, reportType);

    console.log(`✅ Added ${jobs.length} ${reportType} report jobs to queue`);
    console.log(`👥 Total users: ${users.length}`);
    console.log(`🔗 Users with integrations: ${usersWithIntegrations.length}`);
    console.log(
      `❌ Users without integrations: ${
        users.length - usersWithIntegrations.length
      }`
    );

    return NextResponse.json({
      success: true,
      jobsAdded: jobs.length,
      totalUsers: users.length,
      usersWithIntegrations: usersWithIntegrations.length,
      usersWithoutIntegrations: users.length - usersWithIntegrations.length,
      reportType,
      testingMode,
      message: `${reportType} report generation started successfully`,
    });
  } catch (error) {
    console.error("❌ Error starting report generation:", error);
    return NextResponse.json(
      { error: "Failed to start report generation" },
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
