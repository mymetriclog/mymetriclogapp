import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("❌ CRON_SECRET environment variable not set");
    return NextResponse.json(
      { error: "Cron secret not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("❌ Unauthorized cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log(
      "🕐 Cron job triggered at 11 PM - starting queue processing..."
    );

    // Get the base URL for the internal API call
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Call your queue start endpoint
    const response = await fetch(`${baseUrl}/api/queue/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`, // Pass the secret for internal auth
      },
      body: JSON.stringify({
        source: "cron",
        timestamp: new Date().toISOString(),
        scheduledTime: "11:00 PM Daily",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Cron job successfully triggered queue start:", result);
      return NextResponse.json({
        success: true,
        message: "Queue processing started via cron job",
        timestamp: new Date().toISOString(),
        scheduledTime: "11:00 PM Daily",
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
