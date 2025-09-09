import { getServerSupabaseClient } from "@/lib/supabase/server";
import {
  generateWeeklyAIInsights,
  type AIReportData,
} from "@/lib/ai/report-generation";
import { WeeklyReportUtilities } from "./weekly-utilities";

export interface WeeklyReportData {
  startDate: string;
  endDate: string;
  weekStats: any;
  insight: string;
  recommendations: string[];
  trends: any;
  badges: any;
  patterns: any[];
}

export async function generateWeeklyReport(
  userId: string,
  startDate?: Date
): Promise<WeeklyReportData> {
  console.log("🧠 [MyMetricLog] Starting weekly summary...");

  const now = startDate || new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 7);
  const end = new Date(now);
  end.setDate(now.getDate() - 1);

  const startDateStr = start.toISOString().split("T")[0];
  const endDateStr = end.toISOString().split("T")[0];

  // Get weekly data
  const weekData = await getWeeklyData(userId, start, end);
  const weekStats = WeeklyReportUtilities.calculateWeeklyStats(weekData);
  const trends = await WeeklyReportUtilities.analyzeWeeklyTrends(weekData);
  const patterns = WeeklyReportUtilities.identifyWeeklyPatterns(weekData);
  const badges = await WeeklyReportUtilities.getWeeklyBadgeData(
    userId,
    startDateStr,
    endDateStr
  );

  // Generate AI insights
  const aiData: AIReportData = {
    scores: {
      total: weekStats.avgScore,
      sleep: weekStats.avgSleepScore,
      activity: weekStats.avgActivityScore,
      heart: weekStats.avgHeartScore,
      work: weekStats.avgWorkScore,
    },
    gmailData: null,
    googleCalendarData: null,
    fitbitData: null,
    spotifyData: null,
    weatherData: null,
    date: startDateStr,
    reportType: "weekly",
  };

  const aiInsights = await generateWeeklyAIInsights(aiData);
  const insight = aiInsights.insight;
  const recommendations = aiInsights.recommendations || [];

  // Save to database
  await WeeklyReportUtilities.saveWeeklyReport(userId, {
    startDate: startDateStr,
    endDate: endDateStr,
    weekStats,
    insight,
    recommendations,
    trends,
    badges,
    patterns,
  });

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    weekStats,
    insight,
    recommendations,
    trends,
    badges,
    patterns,
  };
}

async function getWeeklyData(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const supabase = await getServerSupabaseClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .eq("report_type", "daily")
    .gte("report_date", startDate.toISOString().split("T")[0])
    .lte("report_date", endDate.toISOString().split("T")[0])
    .order("report_date", { ascending: true });

  return reports || [];
}

function calculateWeeklyStats(weekData: any[]): any {
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
    };
  }

  const totalScores = weekData.reduce(
    (acc, day) => {
      const scores = day.scores || {};
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

  // Calculate other stats
  const totalSteps = weekData.reduce((sum, day) => {
    const activity = day.report_data?.fitbitActivity || "";
    const match = activity.match(/👣 Steps: ([\d,]+)/);
    return sum + (match ? parseInt(match[1].replace(/,/g, "")) : 0);
  }, 0);

  const avgSteps = Math.round(totalSteps / dayCount);
  const days10KSteps = weekData.filter((day) => {
    const activity = day.report_data?.fitbitActivity || "";
    const match = activity.match(/👣 Steps: ([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, "")) >= 10000 : false;
  }).length;

  const totalActiveMin = weekData.reduce((sum, day) => {
    const activity = day.report_data?.fitbitActivity || "";
    const veryActiveMatch = activity.match(/💪 Very Active: (\d+) min/);
    const fairlyActiveMatch = activity.match(/🚶 Fairly Active: (\d+) min/);
    const veryActive = veryActiveMatch ? parseInt(veryActiveMatch[1]) : 0;
    const fairlyActive = fairlyActiveMatch ? parseInt(fairlyActiveMatch[1]) : 0;
    return sum + veryActive + fairlyActive;
  }, 0);

  const totalRHR = weekData.reduce((sum, day) => {
    const heart = day.report_data?.fitbitHeart || "";
    const match = heart.match(/❤️ Resting HR: (\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  const avgRHR = Math.round(totalRHR / dayCount);

  const totalEmails = weekData.reduce((sum, day) => {
    const emailStats = day.report_data?.emailStats || {};
    return sum + (emailStats.received || 0);
  }, 0);

  const totalMeetings = weekData.reduce((sum, day) => {
    const calSummary = day.report_data?.calSummary || "";
    const match = calSummary.match(/\d+/);
    return sum + (match ? parseInt(match[0]) : 0);
  }, 0);

  // Find challenging day
  const challengingDay = weekData.reduce(
    (worst, day) => {
      const score = day.scores?.total || 0;
      return score < worst.score
        ? { name: getDayName(new Date(day.report_date)), score }
        : worst;
    },
    { name: "Monday", score: 100 }
  );

  // Calculate score trend (simplified)
  const firstHalf = weekData.slice(0, Math.ceil(dayCount / 2));
  const secondHalf = weekData.slice(Math.floor(dayCount / 2));

  const firstHalfAvg =
    firstHalf.reduce((sum, day) => sum + (day.scores?.total || 0), 0) /
    firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, day) => sum + (day.scores?.total || 0), 0) /
    secondHalf.length;

  const scoreTrend = Math.round(secondHalfAvg - firstHalfAvg);

  // Format average sleep
  const totalSleepMin = weekData.reduce((sum, day) => {
    const sleep = day.report_data?.fitbitSleep || "";
    const match = sleep.match(/(\d+)h (\d+)m/);
    if (match) {
      return sum + parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return sum;
  }, 0);

  const avgSleepMin = Math.round(totalSleepMin / dayCount);
  const avgSleepHours = Math.floor(avgSleepMin / 60);
  const avgSleepMinutes = avgSleepMin % 60;
  const avgSleepFormatted = `${avgSleepHours}h ${avgSleepMinutes}m`;

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
    totalBadges: 0, // Will be calculated from badges
    days10KSteps,
    challengingDay,
  };
}

async function analyzeWeeklyTrends(weekData: any[]): Promise<any> {
  // Implementation from code.js
  return {
    overall: {
      trend: 0,
      sparkline: weekData.map((day) => day.scores?.total || 0),
    },
    sleep: {
      trend: 0,
      sparkline: weekData.map((day) => day.scores?.sleep || 0),
    },
    activity: {
      trend: 0,
      sparkline: weekData.map((day) => day.scores?.activity || 0),
    },
    heart: {
      trend: 0,
      sparkline: weekData.map((day) => day.scores?.heart || 0),
    },
    work: {
      trend: 0,
      sparkline: weekData.map((day) => day.scores?.work || 0),
    },
  };
}

function identifyWeeklyPatterns(weekData: any[]): any[] {
  // Implementation from code.js
  const patterns = [];

  // Pattern: High scores on weekends
  const weekendScores = weekData
    .filter((day) => {
      const dayName = getDayName(new Date(day.report_date));
      return dayName === "Saturday" || dayName === "Sunday";
    })
    .map((day) => day.scores?.total || 0);

  const weekdayScores = weekData
    .filter((day) => {
      const dayName = getDayName(new Date(day.report_date));
      return dayName !== "Saturday" && dayName !== "Sunday";
    })
    .map((day) => day.scores?.total || 0);

  if (weekendScores.length > 0 && weekdayScores.length > 0) {
    const weekendAvg =
      weekendScores.reduce((sum, score) => sum + score, 0) /
      weekendScores.length;
    const weekdayAvg =
      weekdayScores.reduce((sum, score) => sum + score, 0) /
      weekdayScores.length;

    if (weekendAvg > weekdayAvg + 10) {
      patterns.push({
        type: "Weekend Warrior",
        description: "You perform significantly better on weekends",
        impact: "positive",
        recommendation:
          "Consider what makes weekends more successful and apply those strategies to weekdays",
      });
    }
  }

  // Pattern: Declining performance
  const scores = weekData.map((day) => day.scores?.total || 0);
  if (scores.length >= 3) {
    const firstThird = scores.slice(0, Math.ceil(scores.length / 3));
    const lastThird = scores.slice(-Math.ceil(scores.length / 3));

    const firstAvg =
      firstThird.reduce((sum, score) => sum + score, 0) / firstThird.length;
    const lastAvg =
      lastThird.reduce((sum, score) => sum + score, 0) / lastThird.length;

    if (lastAvg < firstAvg - 15) {
      patterns.push({
        type: "Weekend Fatigue",
        description: "Performance declines as the week progresses",
        impact: "negative",
        recommendation: "Consider lighter scheduling on Thursdays and Fridays",
      });
    }
  }

  return patterns;
}

async function getWeeklyBadgeData(
  userId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const supabase = await getServerSupabaseClient();

  const { data: badges } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId)
    .gte("earned_date", startDate)
    .lte("earned_date", endDate);

  return {
    totalBadges: badges?.length || 0,
    badges: badges || [],
  };
}

function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

async function saveWeeklyReport(userId: string, data: any): Promise<void> {
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
    ai_insights: {
      insight: data.insight,
      recommendations: data.recommendations,
    },
  });
}
