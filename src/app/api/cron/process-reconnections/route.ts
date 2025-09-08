import { NextRequest, NextResponse } from "next/server";
import { AutoReconnectService } from "@/lib/integrations/auto-reconnect-service";

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (in production, verify the cron secret)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log("❌ Unauthorized cron request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🔄 Starting reconnection notification processing...`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);

    const result =
      await AutoReconnectService.processReconnectionNotifications();

    console.log(`✅ Reconnection processing completed:`);
    console.log(`📊 Total users: ${result.totalUsers}`);
    console.log(`📧 Notifications sent: ${result.notificationsSent}`);
    console.log(`❌ Errors: ${result.errors}`);
    console.log(`⏰ Completed at: ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: "Reconnection notifications processed successfully",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`❌ Error in reconnection cron job:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Allow manual triggering via POST as well
  return GET(request);
}
