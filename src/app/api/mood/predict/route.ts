import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { MoodPredictionService } from "@/lib/mood/mood-prediction-service";
import { MoodService } from "@/lib/mood/mood-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { wellnessData, savePrediction = false } = body;

    if (!wellnessData) {
      return NextResponse.json(
        { error: "Wellness data is required" },
        { status: 400 }
      );
    }

    // Generate mood prediction
    const prediction = MoodPredictionService.predictMood(wellnessData);
    const moodInsight = MoodPredictionService.generateMoodInsight(
      prediction,
      wellnessData.dayContext
    );

    // Save prediction if requested
    if (savePrediction) {
      const today = new Date();
      await MoodService.setMoodForDate(
        session.user.id,
        today,
        prediction.mood,
        "ai_generated",
        prediction.confidence_score,
        prediction.factors
      );
    }

    return NextResponse.json({
      prediction,
      moodInsight,
      moodEmoji: MoodPredictionService.getMoodEmoji(prediction.mood),
      moodColor: MoodPredictionService.getMoodColor(prediction.mood),
    });
  } catch (error) {
    console.error("❌ Mood prediction API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
