import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  // Security check: Only allow Vercel cron service
  const ua = request.headers.get("user-agent") || "";
  if (!ua.includes("vercel-cron/1.0")) {
    console.log("❌ Unauthorized cron access attempt:", ua);
    return NextResponse.json(
      {
        error: "Unauthorized Access",
        message: "This endpoint can only be accessed by Vercel's cron service",
        details: "Only requests with user-agent 'vercel-cron/1.0' are allowed",
        receivedUserAgent: ua,
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  console.log(
    "🕐 Vercel cron job triggered at 11 PM - starting queue processing..."
  );

  try {
    console.log(
      "🕐 Cron job triggered at 11 PM - starting queue processing..."
    );

    // Get the base URL for the internal API call
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Call the new Upstash queue schedule endpoint for daily reports
    const response = await fetch(`${baseUrl}/api/queue/schedule`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportType: "daily",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Cron job successfully triggered queue start:", result);
      return NextResponse.json({
        success: true,
        message: "Daily reports scheduled via cron job",
        timestamp: new Date().toISOString(),
        scheduledTime: "11:00 PM Daily",
        scheduledJobs: result.scheduledJobs?.length || 0,
        result,
      });
    } else {
      const errorText = await response.text();
      console.error(
        "❌ Cron job failed to start queue:",
        response.status,
        errorText
      );
      return NextResponse.json(
        {
          error: "Failed to start queue",
          status: response.status,
          details: errorText,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
