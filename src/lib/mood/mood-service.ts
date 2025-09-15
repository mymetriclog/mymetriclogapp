import { getServerSupabaseClient } from "@/lib/supabase/server";

export type MoodType = "predicted" | "manual" | "ai_generated";

export interface UserMood {
  id: string;
  user_id: string;
  date: string;
  mood: string;
  mood_type: MoodType;
  confidence_score?: number;
  factors: string[];
  created_at: string;
  updated_at: string;
}

export interface MoodPrediction {
  mood: string;
  confidence_score: number;
  factors: string[];
  reasoning: string;
}

export class MoodService {
  /**
   * Get mood for a specific date
   */
  static async getMoodForDate(
    userId: string,
    date: Date
  ): Promise<UserMood | null> {
    try {
      const supabase = await getServerSupabaseClient();
      const dateStr = date.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("user_moods")
        .select("*")
        .eq("user_id", userId)
        .eq("date", dateStr)
        .maybeSingle();

      if (error) {
        console.error("❌ Error fetching mood:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("❌ Error in getMoodForDate:", error);
      return null;
    }
  }

  /**
   * Set mood for a specific date
   */
  static async setMoodForDate(
    userId: string,
    date: Date,
    mood: string,
    moodType: MoodType = "manual",
    confidenceScore?: number,
    factors: string[] = []
  ): Promise<UserMood | null> {
    try {
      const supabase = await getServerSupabaseClient();
      const dateStr = date.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("user_moods")
        .upsert(
          {
            user_id: userId,
            date: dateStr,
            mood,
            mood_type: moodType,
            confidence_score: confidenceScore,
            factors,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,date" }
        )
        .select()
        .single();

      if (error) {
        console.error("❌ Error setting mood:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("❌ Error in setMoodForDate:", error);
      return null;
    }
  }

  /**
   * Get mood from previous day
   */
  static async getMoodFromDayBefore(userId: string): Promise<string> {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const mood = await this.getMoodForDate(userId, twoDaysAgo);
      return mood?.mood || "Unknown";
    } catch (error) {
      console.error("❌ Error in getMoodFromDayBefore:", error);
      return "Unknown";
    }
  }

  /**
   * Get recent moods for trend analysis
   */
  static async getRecentMoods(
    userId: string,
    days: number = 7
  ): Promise<UserMood[]> {
    try {
      const supabase = await getServerSupabaseClient();
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("user_moods")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (error) {
        console.error("❌ Error fetching recent moods:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("❌ Error in getRecentMoods:", error);
      return [];
    }
  }

  /**
   * Clean up old mood entries (older than 30 days)
   */
  static async cleanupOldMoods(userId: string): Promise<void> {
    try {
      const supabase = await getServerSupabaseClient();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const { error } = await supabase
        .from("user_moods")
        .delete()
        .eq("user_id", userId)
        .lt("date", cutoffDate.toISOString().split("T")[0]);

      if (error) {
        console.error("❌ Error cleaning up old moods:", error);
      } else {
        console.log("✅ Cleaned up old mood entries");
      }
    } catch (error) {
      console.error("❌ Error in cleanupOldMoods:", error);
    }
  }

  /**
   * Get mood statistics for a date range
   */
  static async getMoodStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalMoods: number;
    averageConfidence: number;
    moodDistribution: Record<string, number>;
    mostCommonMood: string;
    moodTrend: "improving" | "declining" | "stable";
  }> {
    try {
      const moods = await this.getRecentMoods(
        userId,
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      const totalMoods = moods.length;
      const averageConfidence =
        moods.reduce((sum, mood) => sum + (mood.confidence_score || 0), 0) /
          totalMoods || 0;

      const moodDistribution = moods.reduce((acc, mood) => {
        acc[mood.mood] = (acc[mood.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonMood =
        Object.entries(moodDistribution).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] || "Unknown";

      // Simple trend analysis based on confidence scores
      const recentMoods = moods.slice(0, 3);
      const olderMoods = moods.slice(-3);
      const recentAvg =
        recentMoods.reduce(
          (sum, mood) => sum + (mood.confidence_score || 0),
          0
        ) / recentMoods.length || 0;
      const olderAvg =
        olderMoods.reduce(
          (sum, mood) => sum + (mood.confidence_score || 0),
          0
        ) / olderMoods.length || 0;

      let moodTrend: "improving" | "declining" | "stable" = "stable";
      if (recentAvg > olderAvg + 0.1) moodTrend = "improving";
      else if (recentAvg < olderAvg - 0.1) moodTrend = "declining";

      return {
        totalMoods,
        averageConfidence,
        moodDistribution,
        mostCommonMood,
        moodTrend,
      };
    } catch (error) {
      console.error("❌ Error in getMoodStats:", error);
      return {
        totalMoods: 0,
        averageConfidence: 0,
        moodDistribution: {},
        mostCommonMood: "Unknown",
        moodTrend: "stable",
      };
    }
  }
}
