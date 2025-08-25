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
        // Note: Native Redis queue doesn't have pause/resume functionality like Bull
        // You could implement this by setting a flag in Redis if needed
        console.log(
          "⏸️ Queue pause requested (not implemented for native Redis)"
        );
        return NextResponse.json({
          success: true,
          message: "Queue pause not available with native Redis implementation",
          data: { action: "pause", timestamp: new Date().toISOString() },
        });

      case "resume":
        console.log(
          "▶️ Queue resume requested (not implemented for native Redis)"
        );
        return NextResponse.json({
          success: true,
          message:
            "Queue resume not available with native Redis implementation",
          data: { action: "resume", timestamp: new Date().toISOString() },
        });

      case "clear-completed":
        await userReportQueue.clearCompleted();
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
        await userReportQueue.clearFailed();
        console.log("🧹 Failed jobs cleared");
        return NextResponse.json({
          success: true,
          message: "Failed jobs cleared successfully",
          data: { action: "clear-failed", timestamp: new Date().toISOString() },
        });

      case "clear-all":
        await userReportQueue.clearAll();
        console.log("🧹 All jobs cleared");
        return NextResponse.json({
          success: true,
          message: "All jobs cleared successfully",
          data: { action: "clear-all", timestamp: new Date().toISOString() },
        });

      case "get-counts":
        const stats = await userReportQueue.getStats();
        return NextResponse.json({
          success: true,
          data: {
            action: "get-counts",
            jobCounts: {
              waiting: stats.pending,
              active: stats.processing,
              completed: stats.completed,
              failed: stats.failed,
            },
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
    const stats = await userReportQueue.getStats();
    const isActive = userReportQueue.isActive();

    return NextResponse.json({
      success: true,
      data: {
        queueInfo: {
          name: "user-report-generation",
          isActive,
          isPaused: false, // Native Redis doesn't support pause/resume
          jobCounts: {
            waiting: stats.pending,
            active: stats.processing,
            completed: stats.completed,
            failed: stats.failed,
          },
          clientStatus: isActive ? "ready" : "disconnected",
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
