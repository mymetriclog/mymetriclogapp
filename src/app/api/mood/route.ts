import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { MoodService } from "@/lib/mood/mood-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const daysParam = url.searchParams.get("days");

    if (dateParam) {
      // Get mood for specific date
      const date = new Date(dateParam);
      const mood = await MoodService.getMoodForDate(session.user.id, date);
      return NextResponse.json({ mood });
    } else if (daysParam) {
      // Get recent moods
      const days = parseInt(daysParam) || 7;
      const moods = await MoodService.getRecentMoods(session.user.id, days);
      return NextResponse.json({ moods });
    } else {
      // Get today's mood
      const today = new Date();
      const mood = await MoodService.getMoodForDate(session.user.id, today);
      return NextResponse.json({ mood });
    }
  } catch (error) {
    console.error("❌ Mood API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const {
      date,
      mood,
      moodType = "manual",
      confidenceScore,
      factors = [],
    } = body;

    if (!date || !mood) {
      return NextResponse.json(
        { error: "Date and mood are required" },
        { status: 400 }
      );
    }

    const moodDate = new Date(date);
    const savedMood = await MoodService.setMoodForDate(
      session.user.id,
      moodDate,
      mood,
      moodType,
      confidenceScore,
      factors
    );

    if (!savedMood) {
      return NextResponse.json(
        { error: "Failed to save mood" },
        { status: 500 }
      );
    }

    return NextResponse.json({ mood: savedMood });
  } catch (error) {
    console.error("❌ Mood POST API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
