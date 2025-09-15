import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { DynamicReportGenerator } from "@/lib/reports/dynamic-report-generator";

export async function POST(request: NextRequest) {
  try {
    const { userId, reportType, date } = await request.json();

    if (!userId || !reportType || !date) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, reportType, date" },
        { status: 400 }
      );
    }

    if (!["daily", "weekly"].includes(reportType)) {
      return NextResponse.json(
        { error: "Invalid reportType. Must be 'daily' or 'weekly'" },
        { status: 400 }
      );
    }

    // Get user data from database
    const supabase = await getServerSupabaseClient();
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id, email, full_name, timezone, latitude, longitude")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create report generator
    const reportGenerator = new DynamicReportGenerator();

    // Prepare user data for report generation
    const userReportData = {
      userId: userData.id,
      userEmail: userData.email,
      userName: userData.full_name || userData.email.split("@")[0],
      date: date,
      timezone: userData.timezone || "UTC",
      latitude: userData.latitude,
      longitude: userData.longitude,
    };

    // Generate report
    let report;
    if (reportType === "daily") {
      report = await reportGenerator.generateDailyReport(userReportData);
    } else {
      report = await reportGenerator.generateWeeklyReport(userReportData);
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        userId: report.userId,
        userEmail: report.userEmail,
        userName: report.userName,
        date: report.date,
        kind: report.kind,
        score: report.score,
        created_at: report.created_at,
      },
    });
  } catch (error) {
    console.error("❌ [API] Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const reportType = searchParams.get("reportType") || "daily";
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 }
      );
    }

    // Get user data from database
    const supabase = await getServerSupabaseClient();
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id, email, full_name, timezone, latitude, longitude")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create report generator
    const reportGenerator = new DynamicReportGenerator();

    // Prepare user data for report generation
    const userReportData = {
      userId: userData.id,
      userEmail: userData.email,
      userName: userData.full_name || userData.email.split("@")[0],
      date: date,
      timezone: userData.timezone || "UTC",
      latitude: userData.latitude,
      longitude: userData.longitude,
    };

    // Generate report
    let report;
    if (reportType === "daily") {
      report = await reportGenerator.generateDailyReport(userReportData);
    } else {
      report = await reportGenerator.generateWeeklyReport(userReportData);
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        userId: report.userId,
        userEmail: report.userEmail,
        userName: report.userName,
        date: report.date,
        kind: report.kind,
        score: report.score,
        created_at: report.created_at,
      },
    });
  } catch (error) {
    console.error("❌ [API] Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
