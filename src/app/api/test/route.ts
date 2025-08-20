import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userTimezone = session.user.user_metadata?.timezone || "UTC";

    // Test timezone conversion
    const now = new Date();
    const utcDate = now.toISOString().split("T")[0];
    const userDate = now.toLocaleDateString("en-CA", {
      timeZone: userTimezone,
    });

    // Test yesterday calculation
    const userToday = new Date(userDate + "T00:00:00");
    const userYesterday = new Date(userToday.getTime() - 24 * 60 * 60 * 1000);
    const userYesterdayDate = userYesterday.toLocaleDateString("en-CA", {
      timeZone: userTimezone,
    });

    // UTC yesterday
    const utcYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const utcYesterdayDate = utcYesterday.toISOString().split("T")[0];

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        timezone: userTimezone,
        metadata: session.user.user_metadata,
      },
      timezoneTest: {
        currentUTC: now.toISOString(),
        currentUTCDate: utcDate,
        currentUserDate: userDate,
        userYesterday: userYesterdayDate,
        utcYesterday: utcYesterdayDate,
        dateDifference: userYesterdayDate + " vs " + utcYesterdayDate,
      },
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to get user timezone info" },
      { status: 500 }
    );
  }
}
