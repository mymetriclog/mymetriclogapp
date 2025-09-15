import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import {
  getGoogleTasksStats,
  getGoogleTasksAccessToken,
} from "@/lib/integrations/google-tasks";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const accessToken = await getGoogleTasksAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Tasks not connected" },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const stats = await getGoogleTasksStats(accessToken, date);
    if (!stats) {
      return NextResponse.json(
        { error: "Failed to fetch Google Tasks data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("❌ Google Tasks stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
