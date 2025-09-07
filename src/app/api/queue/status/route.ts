import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin-check";
import { getQueueStats } from "@/lib/queue/bull-queue-service";

export async function GET(req: NextRequest) {
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

    // Get Bull queue statistics
    const stats = await getQueueStats();

    const summary = {
      total: stats.total,
      pending: stats.waiting,
      processing: stats.active,
      completed: stats.completed,
      failed: stats.failed,
      skipped: 0, // Bull doesn't track skipped separately
      successRate: stats.successRate,
    };

    return NextResponse.json({
      success: true,
      message: "Queue status retrieved successfully",
      data: {
        summary,
        queueItems: [], // Could be populated with recent jobs if needed
        recentActivity: [], // Could be populated with recent activity if needed
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error getting queue status:", error);

    return NextResponse.json(
      {
        error: "Failed to get queue status",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
