import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      {
        error: "CRON_SECRET not configured",
        status: "not_configured",
      },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        status: "unauthorized",
        hasSecret: !!cronSecret,
        hasHeader: !!authHeader,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Cron authentication working!",
    timestamp: new Date().toISOString(),
    status: "authenticated",
    schedule: "Daily at 11:00 PM (23:00 UTC)",
  });
}
