import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * API endpoint to fetch user's saved reports
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Initialize Supabase client
    const supabase = await getServerSupabaseClient();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type"); // 'daily', 'weekly', or null for all
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("reports")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add type filter if specified
    if (reportType && (reportType === "daily" || reportType === "weekly")) {
      query = query.eq("report_type", reportType);
    }

    const { data: reports, error, count } = await query;

    if (error) {
      console.error("❌ Error fetching reports:", error);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      reports: reports || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (reports?.length || 0) === limit,
    });
  } catch (error) {
    console.error("❌ Reports fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to fetch a specific report by ID
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { reportId } = await req.json();
    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID required" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await getServerSupabaseClient();

    const { data: report, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", session.user.id) // Ensure user can only access their own reports
      .single();

    if (error) {
      console.error("❌ Error fetching report:", error);
      return NextResponse.json(
        { error: "Failed to fetch report" },
        { status: 500 }
      );
    }

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("❌ Report fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
