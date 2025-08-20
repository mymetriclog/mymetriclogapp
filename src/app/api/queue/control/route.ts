import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin-check";
import { userReportQueue } from "@/lib/queue/queue-service";

export async function POST(req: NextRequest) {
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

    const { action } = await req.json();

    switch (action) {
      case "pause":
        await userReportQueue.pause();
        console.log("⏸️ Queue paused");
        return NextResponse.json({
          success: true,
          message: "Queue paused successfully",
          data: { action: "pause", timestamp: new Date().toISOString() },
        });

      case "resume":
        await userReportQueue.resume();
        console.log("▶️ Queue resumed");
        return NextResponse.json({
          success: true,
          message: "Queue resumed successfully",
          data: { action: "resume", timestamp: new Date().toISOString() },
        });

      case "clear-completed":
        await userReportQueue.clean(0, "completed");
        console.log("🧹 Completed jobs cleared");
        return NextResponse.json({
          success: true,
          message: "Completed jobs cleared successfully",
          data: {
            action: "clear-completed",
            timestamp: new Date().toISOString(),
          },
        });

      case "clear-failed":
        await userReportQueue.clean(0, "failed");
        console.log("🧹 Failed jobs cleared");
        return NextResponse.json({
          success: true,
          message: "Failed jobs cleared successfully",
          data: { action: "clear-failed", timestamp: new Date().toISOString() },
        });

      case "clear-all":
        await userReportQueue.empty();
        console.log("🧹 All jobs cleared");
        return NextResponse.json({
          success: true,
          message: "All jobs cleared successfully",
          data: { action: "clear-all", timestamp: new Date().toISOString() },
        });

      case "get-counts":
        const jobCounts = await userReportQueue.getJobCounts();
        return NextResponse.json({
          success: true,
          data: {
            action: "get-counts",
            jobCounts,
            timestamp: new Date().toISOString(),
          },
        });

      default:
        return NextResponse.json(
          {
            error: "Invalid action",
            message:
              "Supported actions: pause, resume, clear-completed, clear-failed, clear-all, get-counts",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("❌ Error controlling queue:", error);

    return NextResponse.json(
      {
        error: "Failed to control queue",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to get queue information
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

    // Get queue information
    const jobCounts = await userReportQueue.getJobCounts();
    const isPaused = await userReportQueue.isPaused();
    const isActive = userReportQueue.client.status === "ready";

    return NextResponse.json({
      success: true,
      data: {
        queueInfo: {
          name: userReportQueue.name,
          isActive,
          isPaused,
          jobCounts,
          clientStatus: userReportQueue.client.status,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error getting queue info:", error);

    return NextResponse.json(
      {
        error: "Failed to get queue info",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
