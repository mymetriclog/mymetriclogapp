import { getServerSupabaseClient } from "@/lib/supabase/server";

export interface MoodData {
  id?: string;
  user_id: string;
  date: string;
  mood: string;
  mood_type?: "predicted" | "manual" | "ai_generated";
  confidence_score?: number;
  factors?: string[];
  created_at?: string;
  updated_at?: string;
}

export class MoodService {
  /**
   * Set mood for a specific date
   */
  async setMoodForDate(
    userId: string,
    date: string,
    mood: string,
    moodType: "predicted" | "manual" | "ai_generated" = "ai_generated",
    confidenceScore?: number,
    factors?: string[]
  ): Promise<MoodData> {
    try {
      const supabase = await getServerSupabaseClient();

      // Upsert mood data (update if exists, insert if new)
      const { data, error } = await supabase
        .from("user_moods")
        .upsert(
          {
            user_id: userId,
            date: date,
            mood: mood,
            mood_type: moodType,
            confidence_score: confidenceScore,
            factors: factors,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,date",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("❌ [MoodService] Error setting mood:", error);
        throw error;
      }

      console.log("✅ [MoodService] Mood set successfully:", {
        userId,
        date,
        mood: mood.substring(0, 50) + "...",
        moodType,
      });

      return data;
    } catch (error) {
      console.error("❌ [MoodService] Error setting mood for date:", error);
      throw error;
    }
  }

  /**
   * Get mood for a specific date
   */
  async getMoodForDate(userId: string, date: string): Promise<MoodData | null> {
    try {
      const supabase = await getServerSupabaseClient();

      const { data, error } = await supabase
        .from("user_moods")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("❌ [MoodService] Error getting mood:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("❌ [MoodService] Error getting mood for date:", error);
      return null;
    }
  }

  /**
   * Get mood from day before (for historical analysis)
   */
  async getMoodFromDayBefore(
    userId: string,
    currentDate: string
  ): Promise<MoodData | null> {
    try {
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      return await this.getMoodForDate(userId, yesterdayStr);
    } catch (error) {
      console.error("❌ [MoodService] Error getting yesterday's mood:", error);
      return null;
    }
  }

  /**
   * Get mood history for a date range
   */
  async getMoodHistory(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<MoodData[]> {
    try {
      const supabase = await getServerSupabaseClient();

      const { data, error } = await supabase
        .from("user_moods")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (error) {
        console.error("❌ [MoodService] Error getting mood history:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("❌ [MoodService] Error getting mood history:", error);
      return [];
    }
  }

  /**
   * Clean up old mood data (keep only last 90 days)
   */
  async cleanupOldMoodData(userId: string): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

      const supabase = await getServerSupabaseClient();

      const { error } = await supabase
        .from("user_moods")
        .delete()
        .eq("user_id", userId)
        .lt("date", cutoffDateStr);

      if (error) {
        console.error(
          "❌ [MoodService] Error cleaning up old mood data:",
          error
        );
        throw error;
      }

      console.log(
        "✅ [MoodService] Cleaned up old mood data for user:",
        userId
      );
    } catch (error) {
      console.error("❌ [MoodService] Error cleaning up old mood data:", error);
      throw error;
    }
  }

  /**
   * Get mood trends and patterns
   */
  async getMoodTrends(userId: string, days: number = 30): Promise<any> {
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split("T")[0];

      const moodHistory = await this.getMoodHistory(
        userId,
        startDateStr,
        endDate
      );

      // Analyze trends
      const totalDays = moodHistory.length;
      const positiveMoods = moodHistory.filter(
        (m) =>
          m.mood.toLowerCase().includes("positive") ||
          m.mood.toLowerCase().includes("good") ||
          m.mood.toLowerCase().includes("energetic")
      ).length;

      const negativeMoods = moodHistory.filter(
        (m) =>
          m.mood.toLowerCase().includes("negative") ||
          m.mood.toLowerCase().includes("tired") ||
          m.mood.toLowerCase().includes("stressed")
      ).length;

      return {
        totalDays,
        positiveMoods,
        negativeMoods,
        neutralMoods: totalDays - positiveMoods - negativeMoods,
        averageConfidence:
          moodHistory.reduce((sum, m) => sum + (m.confidence_score || 0), 0) /
            totalDays || 0,
        trends: this.analyzeMoodPatterns(moodHistory),
      };
    } catch (error) {
      console.error("❌ [MoodService] Error getting mood trends:", error);
      return null;
    }
  }

  /**
   * Analyze mood patterns from history
   */
  private analyzeMoodPatterns(moodHistory: MoodData[]): any {
    const patterns = {
      weeklyPattern: {} as Record<string, string[]>,
      commonFactors: {} as Record<string, number>,
      moodDistribution: {},
    };

    // Analyze weekly patterns
    moodHistory.forEach((mood) => {
      const dayOfWeek = new Date(mood.date).getDay();
      const dayName = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][dayOfWeek];

      if (!patterns.weeklyPattern[dayName]) {
        patterns.weeklyPattern[dayName] = [];
      }
      patterns.weeklyPattern[dayName].push(mood.mood);
    });

    // Analyze common factors
    moodHistory.forEach((mood) => {
      if (mood.factors) {
        mood.factors.forEach((factor) => {
          patterns.commonFactors[factor] =
            (patterns.commonFactors[factor] || 0) + 1;
        });
      }
    });

    return patterns;
  }
}

// Export singleton instance
export const moodService = new MoodService();
