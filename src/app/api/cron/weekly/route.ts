import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Security check: Only allow Vercel cron service
    const ua = request.headers.get("user-agent") || "";
    if (!ua.includes("vercel-cron/1.0")) {
      console.log("❌ Unauthorized weekly cron access attempt:", ua);
      return NextResponse.json(
        {
          error: "Unauthorized Access",
          message:
            "This weekly cron endpoint can only be accessed by Vercel's cron service",
          details:
            "Only requests with user-agent 'vercel-cron/1.0' are allowed",
          receivedUserAgent: ua,
          endpoint: "weekly-cron",
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    console.log("🕐 Vercel weekly cron job triggered");

    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check if today is Sunday (0)
    if (today !== 0) {
      console.log(`⏭️ Weekly cron skipped - today is not Sunday (${today})`);
      return NextResponse.json({
        success: false,
        message: "Weekly cron only runs on Sundays",
        currentDay: today,
        dayName: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][today],
      });
    }

    console.log("🕐 Weekly cron triggered at:", now.toISOString());
    console.log("📅 Today is Sunday - starting weekly report generation");

    // Schedule weekly reports using Upstash QStash
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/queue/schedule`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportType: "weekly",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to schedule weekly reports: ${errorText}`);
    }

    const result = await response.json();
    const jobs = result.scheduledJobs || [];

    console.log(`✅ Weekly report queue started with ${jobs.length} jobs`);

    return NextResponse.json({
      success: true,
      message: `Weekly report queue started with ${jobs.length} jobs`,
      jobsAdded: jobs.length,
      scheduledJobs: result.scheduledJobs?.length || 0,
      cronType: "weekly",
      triggeredAt: now.toISOString(),
      dayOfWeek: "Sunday",
      result,
    });
  } catch (error) {
    console.error("❌ Weekly cron error:", error);
    return NextResponse.json(
      {
        error: "Failed to start weekly report queue",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check weekly cron status
export async function GET(request: NextRequest) {
  try {
    // Security check: Only allow Vercel cron service
    const ua = request.headers.get("user-agent") || "";
    if (!ua.includes("vercel-cron/1.0")) {
      console.log("❌ Unauthorized weekly cron status access attempt:", ua);
      return NextResponse.json(
        {
          error: "Unauthorized Access",
          message:
            "This weekly cron status endpoint can only be accessed by Vercel's cron service",
          details:
            "Only requests with user-agent 'vercel-cron/1.0' are allowed",
          receivedUserAgent: ua,
          endpoint: "weekly-cron-status",
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }
    const now = new Date();
    const today = now.getDay();
    const isSunday = today === 0;

    return NextResponse.json({
      success: true,
      cronType: "weekly",
      currentDay: today,
      dayName: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][today],
      isSunday,
      nextRun: isSunday ? "Today" : `Next Sunday (in ${7 - today} days)`,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("❌ Error getting weekly cron status:", error);
    return NextResponse.json(
      { error: "Failed to get weekly cron status" },
      { status: 500 }
    );
  }
}
