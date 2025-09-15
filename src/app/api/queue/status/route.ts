import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin-check";
import { getServerSupabaseClient } from "@/lib/supabase/server";

// Simple in-memory tracking for development mode
let directProcessingStats = {
  total: 0,
  completed: 0,
  failed: 0,
  lastProcessed: null as string | null,
};

// Function to update direct processing stats
export function updateDirectProcessingStats(success: boolean) {
  directProcessingStats.total++;
  if (success) {
    directProcessingStats.completed++;
  } else {
    directProcessingStats.failed++;
  }
  directProcessingStats.lastProcessed = new Date().toISOString();
}

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

    // Get report statistics from database
    const supabase = await getServerSupabaseClient();

    // Get total reports count
    const { count: totalReports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true });

    // Get today's reports count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count: todayReports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    // Get recent reports for success rate calculation
    const { data: recentReports } = await supabase
      .from("reports")
      .select("score")
      .order("created_at", { ascending: false })
      .limit(100);

    const successRate =
      recentReports && recentReports.length > 0
        ? (recentReports.filter((r) => r.score > 0).length /
            recentReports.length) *
          100
        : 0;

    // Check if we're in development mode with direct processing
    const isLocalhost =
      process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") ||
      process.env.NEXT_PUBLIC_APP_URL?.includes("127.0.0.1");

    let summary;
    if (isLocalhost && directProcessingStats.total > 0) {
      // In development mode, show direct processing stats
      summary = {
        total: directProcessingStats.total,
        pending: 0,
        processing: 0,
        completed: directProcessingStats.completed,
        failed: directProcessingStats.failed,
        skipped: 0,
        successRate:
          directProcessingStats.total > 0
            ? (directProcessingStats.completed / directProcessingStats.total) *
              100
            : 0,
      };
    } else {
      summary = {
        total: totalReports || 0,
        pending: 0, // Not applicable for new system
        processing: 0, // Not applicable for new system
        completed: totalReports || 0,
        failed: 0, // Not applicable for new system
        skipped: 0,
        successRate: successRate,
      };
    }

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
