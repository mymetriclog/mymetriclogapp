import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import {
  getFitbitAccessToken,
  getFitbitProfile,
  getFitbitStats,
} from "@/lib/integrations/fitbit";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get access token
    const accessToken = await getFitbitAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 400 });
    }

    // Fetch profile and stats
    const [profile, stats] = await Promise.all([
      getFitbitProfile(accessToken),
      getFitbitStats(accessToken),
    ]);

    if (!profile || !stats) {
      return NextResponse.json(
        { error: "Failed to fetch Fitbit data" },
        { status: 500 }
      );
    }

    const result = {
      account: {
        userId: profile.user.encodedId,
        name: profile.user.fullName,
        email: profile.user.email,
        avatar: profile.user.avatar,
        lastSync: new Date().toISOString(),
      },
      stats: stats,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
