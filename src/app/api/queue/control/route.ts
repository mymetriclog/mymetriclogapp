import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin-check";
import { getServerSupabaseClient } from "@/lib/supabase/server";

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
    const supabase = await getServerSupabaseClient();

    switch (action) {
      case "clear-old-reports":
        // Clear reports older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { error: deleteError } = await supabase
          .from("reports")
          .delete()
          .lt("created_at", thirtyDaysAgo.toISOString());

        if (deleteError) {
          throw new Error(`Failed to clear old reports: ${deleteError.message}`);
        }

        console.log("🧹 Old reports cleared");
        return NextResponse.json({
          success: true,
          message: "Old reports cleared successfully",
          data: { action: "clear-old-reports", timestamp: new Date().toISOString() },
        });

      case "get-counts":
        // Get report counts from database
        const { count: totalReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true });

        const { count: dailyReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("report_type", "daily");

        const { count: weeklyReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("report_type", "weekly");

        return NextResponse.json({
          success: true,
          data: {
            action: "get-counts",
            reportCounts: {
              total: totalReports || 0,
              daily: dailyReports || 0,
              weekly: weeklyReports || 0,
            },
            timestamp: new Date().toISOString(),
          },
        });

      case "get-stats":
        // Get comprehensive statistics
        const { data: allReports } = await supabase
          .from("reports")
          .select("score, created_at, report_type")
          .order("created_at", { ascending: false })
          .limit(100);

        const averageScore = allReports && allReports.length > 0
          ? Math.round(allReports.reduce((sum, r) => sum + r.score, 0) / allReports.length)
          : 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { count: todayReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString());

        return NextResponse.json({
          success: true,
          data: {
            action: "get-stats",
            stats: {
              totalReports: allReports?.length || 0,
              todayReports: todayReports || 0,
              averageScore,
              lastUpdated: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          },
        });

      default:
        return NextResponse.json(
          {
            error: "Invalid action",
            message:
              "Supported actions: clear-old-reports, get-counts, get-stats",
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

    // Get report statistics from database
    const supabase = await getServerSupabaseClient();
    
    const { count: totalReports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true });

    const { count: dailyReports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("report_type", "daily");

    const { count: weeklyReports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("report_type", "weekly");

    return NextResponse.json({
      success: true,
      data: {
        queueInfo: {
          name: "dynamic-report-generation",
          isActive: true, // New system is always active
          isPaused: false, // Not applicable for new system
          reportCounts: {
            total: totalReports || 0,
            daily: dailyReports || 0,
            weekly: weeklyReports || 0,
          },
          clientStatus: "ready",
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
