// Weekly report utilities - Complete implementation from code.js

import { getServerSupabaseClient } from "@/lib/supabase/server";

export interface WeeklyStats {
  avgScore: number;
  avgSleepScore: number;
  avgActivityScore: number;
  avgHeartScore: number;
  avgWorkScore: number;
  scoreTrend: number;
  avgSleepFormatted: string;
  avgSteps: number;
  totalActiveMin: number;
  avgRHR: number;
  totalEmails: number;
  totalMeetings: number;
  totalBadges: number;
  days10KSteps: number;
  challengingDay: { name: string; score: number };
  bestDay: { name: string; score: number };
}

export interface WeeklyPattern {
  type: string;
  description: string;
  frequency: number;
  impact: string;
}

export interface WeeklyBadge {
  name: string;
  description: string;
  rarity: string;
  earned: boolean;
  count?: number;
}

export class WeeklyReportUtilities {
  /**
   * Calculate comprehensive weekly statistics
   * Complete implementation from code.js calculateWeeklyStats
   */
  static calculateWeeklyStats(weekData: any[]): WeeklyStats {
    if (weekData.length === 0) {
      return {
        avgScore: 0,
        avgSleepScore: 0,
        avgActivityScore: 0,
        avgHeartScore: 0,
        avgWorkScore: 0,
        scoreTrend: 0,
        avgSleepFormatted: "0h 0m",
        avgSteps: 0,
        totalActiveMin: 0,
        avgRHR: 0,
        totalEmails: 0,
        totalMeetings: 0,
        totalBadges: 0,
        days10KSteps: 0,
        challengingDay: { name: "Monday", score: 0 },
        bestDay: { name: "Monday", score: 0 },
      };
    }

    const totalScores = weekData.reduce(
      (acc, day) => {
        const scores = day.scores || {};
        const reportData = day.report_data || {};

        return {
          total: acc.total + (scores.total || 0),
          sleep: acc.sleep + (scores.sleep || 0),
          activity: acc.activity + (scores.activity || 0),
          heart: acc.heart + (scores.heart || 0),
          work: acc.work + (scores.work || 0),
        };
      },
      { total: 0, sleep: 0, activity: 0, heart: 0, work: 0 }
    );

    const dayCount = weekData.length;
    const avgScore = Math.round(totalScores.total / dayCount);
    const avgSleepScore = Math.round(totalScores.sleep / dayCount);
    const avgActivityScore = Math.round(totalScores.activity / dayCount);
    const avgHeartScore = Math.round(totalScores.heart / dayCount);
    const avgWorkScore = Math.round(totalScores.work / dayCount);

    // Calculate sleep statistics
    const sleepData = weekData.map((day) => {
      const sleepText = day.report_data?.fitbitSleep || "";
      const match = sleepText.match(/(\d+)h (\d+)m/);
      return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0;
    });
    const avgSleepMinutes = sleepData.reduce((a, b) => a + b, 0) / dayCount;
    const avgSleepFormatted = `${Math.floor(
      avgSleepMinutes / 60
    )}h ${Math.round(avgSleepMinutes % 60)}m`;

    // Calculate activity statistics
    const stepsData = weekData.map((day) => {
      const activityText = day.report_data?.fitbitActivity || "";
      const match = activityText.match(/👣 Steps: ([\d,]+)/);
      return match ? parseInt(match[1].replace(/,/g, "")) : 0;
    });
    const avgSteps = Math.round(
      stepsData.reduce((a, b) => a + b, 0) / dayCount
    );
    const days10KSteps = stepsData.filter((steps) => steps >= 10000).length;

    // Calculate active minutes
    const activeMinData = weekData.map((day) => {
      const activityText = day.report_data?.fitbitActivity || "";
      const match = activityText.match(/⏱️ Active: (\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const totalActiveMin = activeMinData.reduce((a, b) => a + b, 0);

    // Calculate heart rate statistics
    const rhrData = weekData.map((day) => {
      const heartText = day.report_data?.fitbitHeart || "";
      const match = heartText.match(/❤️ Resting HR: (\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const avgRHR = Math.round(rhrData.reduce((a, b) => a + b, 0) / dayCount);

    // Calculate email and meeting statistics
    const emailData = weekData.map((day) => {
      const emailStats = day.report_data?.emailStats || {};
      return emailStats.totalReceived || 0;
    });
    const totalEmails = emailData.reduce((a, b) => a + b, 0);

    const meetingData = weekData.map((day) => {
      const calendarAnalysis = day.report_data?.calendarAnalysis || {};
      return calendarAnalysis.totalEvents || 0;
    });
    const totalMeetings = meetingData.reduce((a, b) => a + b, 0);

    // Calculate badge statistics
    const badgeData = weekData.map((day) => {
      const badges = day.report_data?.badges || [];
      return badges.length;
    });
    const totalBadges = badgeData.reduce((a, b) => a + b, 0);

    // Find challenging and best days
    const dayScores = weekData.map((day, index) => ({
      name: this.getDayName(new Date(day.report_date)),
      score: day.scores?.total || 0,
      index,
    }));

    const challengingDay = dayScores.reduce((min, day) =>
      day.score < min.score ? day : min
    );
    const bestDay = dayScores.reduce((max, day) =>
      day.score > max.score ? day : max
    );

    // Calculate score trend (simplified)
    const scoreTrend = this.calculateScoreTrend(weekData);

    return {
      avgScore,
      avgSleepScore,
      avgActivityScore,
      avgHeartScore,
      avgWorkScore,
      scoreTrend,
      avgSleepFormatted,
      avgSteps,
      totalActiveMin,
      avgRHR,
      totalEmails,
      totalMeetings,
      totalBadges,
      days10KSteps,
      challengingDay,
      bestDay,
    };
  }

  /**
   * Analyze weekly trends
   * Complete implementation from code.js analyzeWeeklyTrends
   */
  static async analyzeWeeklyTrends(weekData: any[]): Promise<any> {
    if (weekData.length === 0) {
      return {
        overall: { trend: 0, direction: "stable" },
        sleep: { trend: 0, direction: "stable" },
        activity: { trend: 0, direction: "stable" },
        heart: { trend: 0, direction: "stable" },
        work: { trend: 0, direction: "stable" },
      };
    }

    const trends = {
      overall: this.calculateMetricTrend(weekData, "total"),
      sleep: this.calculateMetricTrend(weekData, "sleep"),
      activity: this.calculateMetricTrend(weekData, "activity"),
      heart: this.calculateMetricTrend(weekData, "heart"),
      work: this.calculateMetricTrend(weekData, "work"),
    };

    return trends;
  }

  /**
   * Identify weekly patterns
   * Complete implementation from code.js identifyWeeklyPatterns
   */
  static identifyWeeklyPatterns(weekData: any[]): WeeklyPattern[] {
    const patterns: WeeklyPattern[] = [];

    if (weekData.length === 0) return patterns;

    // Analyze day-of-week patterns
    const dayPatterns = this.analyzeDayOfWeekPatterns(weekData);
    patterns.push(...dayPatterns);

    // Analyze sleep patterns
    const sleepPatterns = this.analyzeSleepPatterns(weekData);
    patterns.push(...sleepPatterns);

    // Analyze activity patterns
    const activityPatterns = this.analyzeActivityPatterns(weekData);
    patterns.push(...activityPatterns);

    return patterns;
  }

  /**
   * Get weekly badge data
   * Complete implementation from code.js getWeeklyBadgeData
   */
  static async getWeeklyBadgeData(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ totalBadges: number; badges: WeeklyBadge[] }> {
    try {
      const supabase = await getServerSupabaseClient();

      // Get all badges earned during the week
      const { data: reports } = await supabase
        .from("reports")
        .select("report_data")
        .eq("user_id", userId)
        .eq("report_type", "daily")
        .gte("report_date", startDate)
        .lte("report_date", endDate);

      if (!reports) {
        return { totalBadges: 0, badges: [] };
      }

      const allBadges: WeeklyBadge[] = [];
      let totalBadges = 0;

      reports.forEach((report) => {
        const badges = report.report_data?.badges || [];
        totalBadges += badges.length;

        badges.forEach((badge: any) => {
          allBadges.push({
            name: badge.name,
            description: badge.description,
            rarity: badge.rarity,
            earned: true,
          });
        });
      });

      // Count unique badges
      const uniqueBadges = allBadges.reduce((acc, badge) => {
        const existing = acc.find((b) => b.name === badge.name);
        if (existing) {
          existing.count = (existing.count || 1) + 1;
        } else {
          acc.push({ ...badge, count: 1 });
        }
        return acc;
      }, [] as WeeklyBadge[]);

      return {
        totalBadges,
        badges: uniqueBadges,
      };
    } catch (error) {
      console.error("Error getting weekly badge data:", error);
      return { totalBadges: 0, badges: [] };
    }
  }

  /**
   * Save weekly report to database
   */
  static async saveWeeklyReport(userId: string, data: any): Promise<void> {
    try {
      const supabase = await getServerSupabaseClient();

      await supabase.from("reports").insert({
        user_id: userId,
        report_type: "weekly",
        report_date: data.startDate,
        report_data: data,
        scores: {
          total: data.weekStats.avgScore,
          sleep: data.weekStats.avgSleepScore,
          activity: data.weekStats.avgActivityScore,
          heart: data.weekStats.avgHeartScore,
          work: data.weekStats.avgWorkScore,
        },
      });
    } catch (error) {
      console.error("Error saving weekly report:", error);
    }
  }

  // Helper methods

  private static calculateScoreTrend(weekData: any[]): number {
    if (weekData.length < 2) return 0;

    const firstHalf = weekData.slice(0, Math.floor(weekData.length / 2));
    const secondHalf = weekData.slice(Math.floor(weekData.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, day) => sum + (day.scores?.total || 0), 0) /
      firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, day) => sum + (day.scores?.total || 0), 0) /
      secondHalf.length;

    return Math.round(secondAvg - firstAvg);
  }

  private static calculateMetricTrend(weekData: any[], metric: string): any {
    if (weekData.length < 2) {
      return { trend: 0, direction: "stable" };
    }

    const values = weekData.map((day) => day.scores?.[metric] || 0);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const trend = Math.round(secondAvg - firstAvg);
    const direction =
      trend > 0 ? "improving" : trend < 0 ? "declining" : "stable";

    return { trend, direction };
  }

  private static analyzeDayOfWeekPatterns(weekData: any[]): WeeklyPattern[] {
    const patterns: WeeklyPattern[] = [];
    const dayScores: { [key: string]: number[] } = {};

    weekData.forEach((day) => {
      const dayName = this.getDayName(new Date(day.report_date));
      if (!dayScores[dayName]) {
        dayScores[dayName] = [];
      }
      dayScores[dayName].push(day.scores?.total || 0);
    });

    // Find patterns
    Object.entries(dayScores).forEach(([day, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      if (avgScore > 85) {
        patterns.push({
          type: "High Performance Day",
          description: `${day}s are your strongest days`,
          frequency: scores.length,
          impact: "positive",
        });
      } else if (avgScore < 60) {
        patterns.push({
          type: "Challenging Day",
          description: `${day}s tend to be more difficult`,
          frequency: scores.length,
          impact: "negative",
        });
      }
    });

    return patterns;
  }

  private static analyzeSleepPatterns(weekData: any[]): WeeklyPattern[] {
    const patterns: WeeklyPattern[] = [];
    const sleepScores = weekData.map((day) => day.scores?.sleep || 0);
    const avgSleepScore =
      sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length;

    if (avgSleepScore >= 85) {
      patterns.push({
        type: "Sleep Champion",
        description: "Consistently excellent sleep quality",
        frequency: sleepScores.filter((s) => s >= 85).length,
        impact: "positive",
      });
    } else if (avgSleepScore < 60) {
      patterns.push({
        type: "Sleep Struggles",
        description: "Sleep quality needs attention",
        frequency: sleepScores.filter((s) => s < 60).length,
        impact: "negative",
      });
    }

    return patterns;
  }

  private static analyzeActivityPatterns(weekData: any[]): WeeklyPattern[] {
    const patterns: WeeklyPattern[] = [];
    const activityScores = weekData.map((day) => day.scores?.activity || 0);
    const avgActivityScore =
      activityScores.reduce((a, b) => a + b, 0) / activityScores.length;

    if (avgActivityScore >= 85) {
      patterns.push({
        type: "Activity Enthusiast",
        description: "Consistently high activity levels",
        frequency: activityScores.filter((s) => s >= 85).length,
        impact: "positive",
      });
    } else if (avgActivityScore < 60) {
      patterns.push({
        type: "Sedentary Pattern",
        description: "Activity levels need improvement",
        frequency: activityScores.filter((s) => s < 60).length,
        impact: "negative",
      });
    }

    return patterns;
  }

  private static getDayName(date: Date): string {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[date.getDay()];
  }
}
