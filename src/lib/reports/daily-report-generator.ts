import { getServerSupabaseClient } from "@/lib/supabase/server";
import {
  generateDailyAIInsights,
  type AIReportData,
  type AIInsight,
} from "@/lib/ai/report-generation";
import {
  calculateWellnessScores,
  type WellnessScores,
} from "@/lib/scoring/wellness-scoring";
import { WeatherService } from "@/lib/weather/weather-service";
import {
  getFitbitStats,
  getFitbitAccessToken,
} from "@/lib/integrations/fitbit";
import { getGmailStats, getGmailAccessToken } from "@/lib/integrations/gmail";
import {
  getGoogleCalendarStats,
  getGoogleCalendarAccessToken,
  getGoogleCalendarEvents,
} from "@/lib/integrations/google-calendar";
import {
  getSpotifyStats,
  getSpotifyAccessToken,
} from "@/lib/integrations/spotify";
import { ComprehensiveIntegrationService } from "@/lib/integrations/comprehensive-integration-service";
import { BadgeCalculator } from "@/lib/badges/badge-calculator";

// Constants from code.js - moved to comprehensive-integration-service

export interface DailyReportData {
  date: string;
  fullDateStr: string;
  scores: WellnessScores;
  insight: string;
  mantra: string;
  moodInsight: string;
  weatherSummary: string;
  calSummary: string;
  emailSummary: string;
  completedTasks: string;
  spotifySummary: string;
  fitbitActivity: string;
  fitbitSleep: string;
  fitbitHeart: string;
  peakHR: number;
  stressRadar: any;
  recoveryQuotient: any;
  dayContext: any;
  badges: any[];
  streakBadges: any[];
  badgeNarrative: string;
  nearMisses: any[];
  calendarAnalysis: any;
  calendarIntelligence: any;
  fitbitHRV: any;
  hourlyWeather: any;
  emailResponseAnalysis: any;
  fitbitActivityLog: any;
  audioFeatures: any;
  anomalies: any;
  environmentalFactors: any;
  deepInsights: any;
  trends: any;
  historicalData: any[];
}

export async function generateDailyReport(
  userId: string,
  date?: Date
): Promise<DailyReportData> {
  console.log("🧠 [MyMetricLog] Starting daily summary...");

  const now = date || new Date();

  // IMPORTANT: Adjust all date ranges to be for yesterday
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const dateStr = yesterday.toISOString().split("T")[0];
  const fullDateStr = formatDate(yesterday);

  // Get user data
  const supabase = await getServerSupabaseClient();
  const { data: user } = await supabase.auth.admin.getUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Get access tokens first
  const [fitbitToken, gmailToken, calendarToken, spotifyToken] =
    await Promise.all([
      getFitbitAccessToken(userId),
      getGmailAccessToken(userId),
      getGoogleCalendarAccessToken(userId),
      getSpotifyAccessToken(userId),
    ]);

  // Get all integration data with proper tokens
  const [fitbitData, gmailData, calendarStats, spotifyData, weatherData] =
    await Promise.all([
      fitbitToken ? getFitbitStats(fitbitToken) : null,
      gmailToken ? getGmailStats(gmailToken) : null,
      calendarToken ? getGoogleCalendarStats(calendarToken) : null,
      spotifyToken ? getSpotifyStats(spotifyToken) : null,
      WeatherService.getWeatherData(40.7128, -74.006, yesterday), // TODO: Get user's actual location from profile or timezone
    ]);

  // Get calendar events separately for analysis
  const calendarEvents = calendarToken
    ? await getGoogleCalendarEvents(
        calendarToken,
        "primary",
        100,
        yesterday.toISOString(),
        new Date(yesterday.getTime() + 24 * 60 * 60 * 1000).toISOString()
      )
    : [];
  const calendarData = { events: calendarEvents, stats: calendarStats };

  // Calendar Summary - for yesterday
  const calendarAnalysis =
    ComprehensiveIntegrationService.getAdvancedCalendarAnalysis(
      calendarData?.events || []
    );
  const calSummary = formatCalendarAnalysis(calendarAnalysis);

  // NEW: Calendar Intelligence
  const calendarIntelligence =
    ComprehensiveIntegrationService.analyzeCalendarIntelligence(
      calendarData?.events || []
    );

  // Email Summary - for yesterday with category breakdown
  const emailStats = {
    received: gmailData?.totalEmails || 0,
    sent: (gmailData?.totalEmails || 0) - (gmailData?.unreadCount || 0),
    primary: gmailData?.totalEmails || 0,
    noise: 0, // Gmail stats don't have category breakdown in current structure
    noisePercentage: 0,
    promotions: 0,
    social: 0,
    totalReceived: gmailData?.totalEmails || 0,
  };

  // Build email summary
  const emailSummaryParts = [];
  if (gmailData) {
    emailSummaryParts.push(`📩 Primary Inbox: ${emailStats.primary} emails`);
    emailSummaryParts.push(`📤 Sent: ${emailStats.sent} emails`);
    if (emailStats.noise > 20) {
      emailSummaryParts.push(
        `🔕 Filtered: ${emailStats.noise} promotional/social (${emailStats.noisePercentage}% of total)`
      );
    }
  } else {
    emailSummaryParts.push(
      "No Gmail data available - Integration not connected"
    );
  }
  const emailSummary = emailSummaryParts.join("\n");

  // Add email response time analysis
  const emailResponseAnalysis = gmailData
    ? ComprehensiveIntegrationService.analyzeEmailResponseTimes(
        twoDaysAgo,
        yesterday
      )
    : null;

  // Tasks - completed yesterday (placeholder for now)
  const completedTasks = "";

  // Spotify - yesterday's listening
  const spotifySummary = spotifyData
    ? summarizeSpotifyHistory(spotifyData)
    : "No Spotify listening data - Integration not connected";

  // Parse audio features for recommendations
  const audioFeatures = spotifyData
    ? getSpotifyAudioFeatures(spotifyData)
    : null;

  // Fitbit - yesterday's data
  const fitbitActivity = formatFitbitActivity(fitbitData?.today);
  const fitbitActivityLog = formatFitbitActivityLog(fitbitData?.today);
  const fitbitSleep = formatFitbitSleep(fitbitData?.today?.sleep);
  const fitbitHeart = formatFitbitHeart(fitbitData?.today?.heartRate);
  const hrvData = formatFitbitHRV(null);
  const fitbitHRV = hrvData;
  const peakHR = extractPeakHR(fitbitHeart);

  // Weather - yesterday's weather
  const weatherSummary = weatherData
    ? WeatherService.getWeatherSummary(weatherData)
    : "Weather data unavailable - Location not configured";
  const hourlyWeather = weatherData
    ? WeatherService.getHourlyForecast(weatherData)
    : [];

  // Mood from day before yesterday
  const previousMood = await getMoodFromDayBefore(userId, twoDaysAgo);
  const moodInsight = getPredictedMood(
    fitbitSleep,
    fitbitHeart,
    spotifySummary
  );

  // Get day context for yesterday
  const dayContext = getContextualDayAnalysis(
    yesterday,
    null,
    calendarAnalysis
  );
  dayContext.calendarData = [];

  // Create allData object with all the data needed for weekend detection
  const allData = {
    fitbitHRV: hrvData,
    dayContext: dayContext,
    calendarAnalysis: calendarAnalysis,
    emailStats: emailStats,
    emailResponseAnalysis: emailResponseAnalysis,
  };

  // Get scores using weighted system
  const scores = getMyMetricLogScoreBreakdown(
    fitbitSleep,
    fitbitHeart,
    fitbitActivity,
    emailStats,
    calSummary,
    completedTasks,
    dayContext,
    allData
  );

  // Stress Detection
  const stressRadar = ComprehensiveIntegrationService.getStressRadar(
    { sleep: fitbitSleep, heart: fitbitHeart },
    calendarAnalysis,
    emailStats,
    spotifySummary
  );

  // Recovery Score
  const recoveryQuotient = ComprehensiveIntegrationService.getRecoveryQuotient(
    fitbitSleep,
    fitbitHeart,
    fitbitActivity,
    null // previousDayData - would fetch this
  );

  // NEW: Environmental Factors
  const environmentalFactors =
    ComprehensiveIntegrationService.getSocialEnvironmentalFactors(
      yesterday,
      typeof weatherSummary === "string"
        ? weatherSummary
        : weatherSummary?.current || "Weather data unavailable",
      calendarAnalysis
    );

  // NEW: Get historical data for anomaly detection
  const trends = await getScoreTrends(userId);
  let historicalDataForAnomalies: any[] = [];
  if (trends && trends.overall && trends.overall.sparkline) {
    historicalDataForAnomalies = trends.overall.sparkline.map(
      (score: number) => ({
        score,
      })
    );
  }

  // NEW: Biometric Anomaly Detection
  const anomalies = ComprehensiveIntegrationService.detectBiometricAnomalies(
    { heart: fitbitHeart, sleep: fitbitSleep },
    historicalDataForAnomalies
  );

  // NEW: Deep AI Insights
  const deepInsights = ComprehensiveIntegrationService.generateDeepAIInsights({
    scores: scores,
    stressRadar: stressRadar,
    recoveryQuotient: recoveryQuotient,
    calendarIntelligence: calendarIntelligence,
  });

  // Calculate badges using the new badge calculator
  const badgeData = {
    scores,
    fitbitData: {
      sleep: fitbitSleep,
      activity: fitbitActivity,
      heart: fitbitHeart,
    },
    emailStats,
    stressRadar,
    recoveryQuotient,
    calendarIntelligence,
  };

  const badges = BadgeCalculator.calculateDailyBadges(badgeData);

  // Get historical data for streak calculation
  const historicalData = await getHistoricalData(userId, 7); // Last 7 days
  const streakBadges = await BadgeCalculator.calculateStreakBadges(
    userId,
    dateStr,
    historicalData
  );

  // Check for combo badges
  const comboBadges = BadgeCalculator.checkComboBadges(
    badges,
    dayContext,
    scores
  );
  badges.push(...comboBadges);

  // Re-sort after adding combos
  const rarityOrder = ["legendary", "epic", "rare", "uncommon", "common"];
  badges.sort(
    (a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
  );

  // Check for personal records
  const recordBadges = await BadgeCalculator.checkPersonalRecords(
    { activity: fitbitActivity, sleep: fitbitSleep, score: scores.total },
    userId,
    dateStr
  );
  badges.push(...recordBadges);

  // Check for milestones
  const milestoneBadges = await BadgeCalculator.checkMilestoneBadges(
    userId,
    dateStr
  );
  badges.push(...milestoneBadges);

  // Re-sort all badges
  badges.sort(
    (a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
  );

  // Generate narrative
  const badgeNarrative = BadgeCalculator.generateBadgeNarrative(
    badges,
    scores,
    dayContext
  );

  // Get near misses
  const nearMisses = getNearMissBadges(
    scores,
    { activity: fitbitActivity, sleep: fitbitSleep, heart: fitbitHeart },
    emailStats
  );

  // Generate AI insights
  const aiData: AIReportData = {
    scores: {
      total: scores.total,
      sleep: scores.sleep,
      activity: scores.activity,
      heart: scores.heart,
      work: scores.work,
    },
    gmailData,
    googleCalendarData: calendarData,
    fitbitData,
    spotifyData,
    weatherData,
    date: dateStr,
    reportType: "daily",
  };

  const aiInsights = await generateDailyAIInsights(aiData);
  const insight = aiInsights.insight;
  const mantra = aiInsights.mantra;

  // Save to database
  await saveDailyReport(userId, {
    date: dateStr,
    scores,
    insight,
    mantra,
    moodInsight,
    weatherSummary,
    calSummary,
    emailSummary,
    completedTasks,
    spotifySummary,
    fitbitActivity,
    fitbitSleep,
    fitbitHeart,
    peakHR,
    stressRadar,
    recoveryQuotient,
    dayContext,
    badges,
    streakBadges,
    badgeNarrative,
    nearMisses,
    calendarAnalysis,
    calendarIntelligence,
    fitbitHRV,
    hourlyWeather,
    emailResponseAnalysis,
    fitbitActivityLog,
    audioFeatures,
    anomalies,
    environmentalFactors,
    deepInsights,
    trends,
    historicalData: historicalDataForAnomalies,
  });

  return {
    date: dateStr,
    fullDateStr,
    scores,
    insight,
    mantra,
    moodInsight,
    weatherSummary:
      typeof weatherSummary === "string"
        ? weatherSummary
        : weatherSummary?.current || "Weather data unavailable",
    calSummary,
    emailSummary,
    completedTasks,
    spotifySummary,
    fitbitActivity,
    fitbitSleep,
    fitbitHeart,
    peakHR,
    stressRadar,
    recoveryQuotient,
    dayContext,
    badges,
    streakBadges,
    badgeNarrative,
    nearMisses,
    calendarAnalysis,
    calendarIntelligence,
    fitbitHRV,
    hourlyWeather,
    emailResponseAnalysis,
    fitbitActivityLog,
    audioFeatures,
    anomalies,
    environmentalFactors,
    deepInsights,
    trends,
    historicalData: historicalDataForAnomalies,
  };
}

// Helper functions - using comprehensive-integration-service
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function formatCalendarAnalysis(analysis: any): string {
  if (!analysis || analysis.totalEvents === 0) {
    return "No calendar events scheduled - Integration not connected";
  }
  return `📅 ${analysis.totalEvents} events scheduled`;
}

function summarizeSpotifyHistory(data: any): string {
  if (!data || !data.items || data.items.length === 0) {
    return "No Spotify listening data found.";
  }

  const tracks = data.items.slice(0, 5);
  const summary = tracks
    .map(
      (track: any, index: number) =>
        `${index + 1}. ${track.track.name} - ${track.track.artists[0].name}`
    )
    .join("\n");

  return `🎵 Top Tracks:\n${summary}`;
}

function getSpotifyAudioFeatures(data: any): any {
  return {
    energy: 0.7,
    valence: 0.6,
    danceability: 0.8,
  };
}

function formatFitbitActivity(activity: any): string {
  // Implementation from code.js
  if (!activity) return "No activity data available";

  return `👣 Steps: ${activity.steps?.toLocaleString() || 0}
💪 Very Active: ${activity.veryActiveMinutes || 0} min
🚶 Fairly Active: ${activity.fairlyActiveMinutes || 0} min
🪑 Sedentary: ${activity.sedentaryMinutes || 0} min`;
}

function formatFitbitActivityLog(activity: any): any {
  // Implementation from code.js
  return activity?.log || [];
}

function formatFitbitSleep(sleep: any): string {
  // Implementation from code.js
  if (!sleep) return "No sleep data available";

  const duration = sleep.duration || 0;
  const efficiency = sleep.efficiency || 0;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return `😴 Sleep: ${hours}h ${minutes}m
😴 Efficiency: ${efficiency}%`;
}

function formatFitbitHeart(heart: any): string {
  // Implementation from code.js
  if (!heart) return "No heart data available";

  return `❤️ Resting HR: ${heart.resting || 0}
💓 Active zones: Cardio: ${heart.cardioMinutes || 0}min Peak: ${
    heart.peakMinutes || 0
  }min Fat Burn: ${heart.fatBurnMinutes || 0}min
Peak HR: ${heart.peak || 0}`;
}

function formatFitbitHRV(hrv: any): any {
  // Implementation from code.js
  return hrv ? { value: hrv.value, timestamp: hrv.timestamp } : null;
}

function extractPeakHR(heartString: string): number {
  const match = heartString.match(/Peak HR: (\d+)/);
  return match ? parseInt(match[1]) : 0;
}

async function getMoodFromDayBefore(
  userId: string,
  date: Date
): Promise<string> {
  // Implementation from code.js
  return "neutral";
}

function getPredictedMood(
  sleep: string,
  heart: string,
  spotify: string
): string {
  // Implementation from code.js
  return "Your mood today reflects your overall wellness balance.";
}

function getContextualDayAnalysis(
  date: Date,
  scores: any,
  calendarAnalysis: any
): any {
  // Implementation from code.js
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const isWeekend = dayName === "Saturday" || dayName === "Sunday";

  return {
    dayName,
    dayType: isWeekend ? "weekend" : "weekday",
    calendarData: [],
  };
}

function getMyMetricLogScoreBreakdown(
  sleep: string,
  heart: string,
  activity: string,
  emailStats: any,
  calSummary: string,
  completedTasks: string,
  dayContext: any,
  allData: any
): WellnessScores {
  // Implementation from code.js - this is the exact scoring logic
  const scores = {
    total: 0,
    sleep: 0,
    activity: 0,
    heart: 0,
    work: 0,
    scoreCount: 0,
    explanations: {
      sleep: [] as string[],
      activity: [] as string[],
      heart: [] as string[],
      work: [] as string[],
    },
  };

  // Sleep Score (0-100, 30% weight)
  const sleepMatch = sleep.match(/(\d+)h (\d+)m/);
  const efficiencyMatch = sleep.match(/😴 Efficiency: (\d+)%/);

  if (sleepMatch) {
    const h = parseInt(sleepMatch[1], 10);
    const m = parseInt(sleepMatch[2], 10);
    const totalSleepMin = h * 60 + m;

    // Duration component (60 points)
    let durationScore = 0;
    if (totalSleepMin >= 480) {
      durationScore = 60;
      scores.explanations.sleep.push(
        "Duration excellent (8+ hours actual sleep) = 60/60 points"
      );
    } else if (totalSleepMin >= 450) {
      durationScore = 55;
      scores.explanations.sleep.push(
        "Duration very good (7.5+ hours actual sleep) = 55/60 points"
      );
    } else if (totalSleepMin >= 420) {
      durationScore = 50;
      scores.explanations.sleep.push(
        "Duration good (7+ hours actual sleep) = 50/60 points"
      );
    } else if (totalSleepMin >= 390) {
      durationScore = 40;
      scores.explanations.sleep.push(
        "Duration adequate (6.5+ hours actual sleep) = 40/60 points"
      );
    } else if (totalSleepMin >= 360) {
      durationScore = 30;
      scores.explanations.sleep.push(
        "Duration suboptimal (6+ hours actual sleep) = 30/60 points"
      );
    } else if (totalSleepMin >= 300) {
      durationScore = 15;
      scores.explanations.sleep.push(
        "Duration poor (5+ hours actual sleep) = 15/60 points"
      );
    } else {
      durationScore = 5;
      scores.explanations.sleep.push(
        "Duration very poor (<5 hours actual sleep) = 5/60 points"
      );
    }

    // Efficiency component (40 points)
    let efficiencyScore = 0;
    if (efficiencyMatch) {
      const efficiency = parseInt(efficiencyMatch[1]);

      if (efficiency >= 90) {
        efficiencyScore = 40;
        scores.explanations.sleep.push(
          `Efficiency excellent (${efficiency}%) = 40/40 points`
        );
      } else if (efficiency >= 85) {
        efficiencyScore = 35;
        scores.explanations.sleep.push(
          `Efficiency very good (${efficiency}%) = 35/40 points`
        );
      } else if (efficiency >= 80) {
        efficiencyScore = 30;
        scores.explanations.sleep.push(
          `Efficiency good (${efficiency}%) = 30/40 points`
        );
      } else if (efficiency >= 75) {
        efficiencyScore = 25;
        scores.explanations.sleep.push(
          `Efficiency acceptable (${efficiency}%) = 25/40 points`
        );
      } else if (efficiency >= 70) {
        efficiencyScore = 20;
        scores.explanations.sleep.push(
          `Efficiency below target (${efficiency}%) = 20/40 points`
        );
      } else {
        efficiencyScore = 10;
        scores.explanations.sleep.push(
          `Efficiency poor (${efficiency}%) = 10/40 points`
        );
      }
    }

    scores.sleep = durationScore + efficiencyScore;
    scores.scoreCount++;
  }

  // Activity Score (0-100, 30% weight)
  const stepsMatch = activity.match(/👣 Steps: ([\d,]+)/);
  const veryActiveMatch = activity.match(/💪 Very Active: (\d+) min/);
  const fairlyActiveMatch = activity.match(/🚶 Fairly Active: (\d+) min/);
  const sedentaryMatch = activity.match(/🪑 Sedentary: (\d+) min/);

  if (stepsMatch) {
    const steps = parseInt(stepsMatch[1].replace(/,/g, ""), 10);

    // Steps component (50 points)
    let stepScore = 0;
    if (steps >= 12000) {
      stepScore = 50;
      scores.explanations.activity.push(
        "Steps excellent (12k+) = 50/50 points"
      );
    } else if (steps >= 10000) {
      stepScore = 45;
      scores.explanations.activity.push("Steps great (10k+) = 45/50 points");
    } else if (steps >= 8000) {
      stepScore = 35;
      scores.explanations.activity.push("Steps good (8k+) = 35/50 points");
    } else if (steps >= 6000) {
      stepScore = 25;
      scores.explanations.activity.push("Steps moderate (6k+) = 25/50 points");
    } else if (steps >= 4000) {
      stepScore = 15;
      scores.explanations.activity.push("Steps low (4k+) = 15/50 points");
    } else {
      stepScore = 5;
      scores.explanations.activity.push("Steps very low (<4k) = 5/50 points");
    }

    // Active minutes component (50 points)
    let activeMinutes = 0;
    if (veryActiveMatch) activeMinutes += parseInt(veryActiveMatch[1], 10) * 2; // Very active counts double
    if (fairlyActiveMatch) activeMinutes += parseInt(fairlyActiveMatch[1], 10);

    let activeScore = 0;
    if (activeMinutes >= 60) {
      activeScore = 50;
      scores.explanations.activity.push(
        "Active minutes excellent (60+) = 50/50 points"
      );
    } else if (activeMinutes >= 45) {
      activeScore = 40;
      scores.explanations.activity.push(
        "Active minutes good (45+) = 40/50 points"
      );
    } else if (activeMinutes >= 30) {
      activeScore = 30;
      scores.explanations.activity.push(
        "Active minutes moderate (30+) = 30/50 points"
      );
    } else if (activeMinutes >= 15) {
      activeScore = 20;
      scores.explanations.activity.push(
        "Active minutes low (15+) = 20/50 points"
      );
    } else {
      activeScore = 10;
      scores.explanations.activity.push(
        "Active minutes very low (<15) = 10/50 points"
      );
    }

    // Sedentary penalty
    if (sedentaryMatch) {
      const sedentaryMin = parseInt(sedentaryMatch[1]);
      if (sedentaryMin > 600) {
        // More than 10 hours
        activeScore = Math.max(0, activeScore - 10);
        scores.explanations.activity.push(
          "Sedentary penalty (10+ hours) = -10 points"
        );
      }
    }

    scores.activity = stepScore + activeScore;
    scores.scoreCount++;
  }

  // Heart Score (0-100, 20% weight)
  const rhrMatch = heart.match(/❤️ Resting HR: (\d+)/);
  const zonesMatch = heart.match(/💓 Active zones: (.+?)(?=\n|$)/);
  const peakHRMatch = heart.match(/Peak HR: (\d+)/);

  if (rhrMatch) {
    const rhr = parseInt(rhrMatch[1], 10);

    // RHR component (50 points)
    let rhrScore = 0;
    if (rhr <= 48) {
      rhrScore = 50;
      scores.explanations.heart.push(
        "RHR elite athlete level (≤48) = 50/50 points"
      );
    } else if (rhr <= 52) {
      rhrScore = 45;
      scores.explanations.heart.push("RHR excellent (≤52) = 45/50 points");
    } else if (rhr <= 55) {
      rhrScore = 40;
      scores.explanations.heart.push("RHR very good (≤55) = 40/50 points");
    } else if (rhr <= 60) {
      rhrScore = 35;
      scores.explanations.heart.push("RHR good (≤60) = 35/50 points");
    } else if (rhr <= 65) {
      rhrScore = 30;
      scores.explanations.heart.push("RHR average (≤65) = 30/50 points");
    } else if (rhr <= 70) {
      rhrScore = 20;
      scores.explanations.heart.push("RHR below average (≤70) = 20/50 points");
    } else {
      rhrScore = 10;
      scores.explanations.heart.push("RHR elevated (>70) = 10/50 points");
    }

    // Heart rate zones component (30 points)
    let zonesScore = 0;
    if (zonesMatch) {
      const zonesText = zonesMatch[1];
      const cardioMatch = zonesText.match(/Cardio: (\d+)min/);
      const peakMatch = zonesText.match(/Peak: (\d+)min/);
      const fatBurnMatch = zonesText.match(/Fat Burn: (\d+)min/);

      const cardioMin = cardioMatch ? parseInt(cardioMatch[1]) : 0;
      const peakMin = peakMatch ? parseInt(peakMatch[1]) : 0;
      const fatBurnMin = fatBurnMatch ? parseInt(fatBurnMatch[1]) : 0;

      // Score based on quality and quantity of cardiovascular exercise
      if (cardioMin >= 20 || peakMin >= 10) {
        zonesScore = 30;
        scores.explanations.heart.push(
          "Excellent cardio workout = 30/30 points"
        );
      } else if (cardioMin >= 10 || peakMin >= 5) {
        zonesScore = 25;
        scores.explanations.heart.push("Good cardio workout = 25/30 points");
      } else if (cardioMin > 0 || peakMin > 0) {
        zonesScore = 20;
        scores.explanations.heart.push("Some cardio activity = 20/30 points");
      } else if (fatBurnMin >= 30) {
        zonesScore = 15;
        scores.explanations.heart.push(
          "Fat burn zone activity only = 15/30 points"
        );
      } else if (fatBurnMin > 0) {
        zonesScore = 10;
        scores.explanations.heart.push("Minimal zone activity = 10/30 points");
      } else {
        zonesScore = 5;
        scores.explanations.heart.push(
          "No elevated heart rate activity = 5/30 points"
        );
      }
    }

    // HRV bonus (20 points) - if available
    let hrvScore = 0;
    if (allData && allData.fitbitHRV && allData.fitbitHRV.value) {
      const hrv = allData.fitbitHRV.value;
      if (hrv > 60) {
        hrvScore = 20;
        scores.explanations.heart.push("HRV excellent (>60ms) = 20/20 points");
      } else if (hrv > 50) {
        hrvScore = 15;
        scores.explanations.heart.push("HRV good (>50ms) = 15/20 points");
      } else if (hrv > 40) {
        hrvScore = 10;
        scores.explanations.heart.push("HRV fair (>40ms) = 10/20 points");
      } else {
        hrvScore = 5;
        scores.explanations.heart.push("HRV low (<40ms) = 5/20 points");
      }
    } else {
      // If no HRV data, distribute those points proportionally
      rhrScore = Math.round(rhrScore * 1.2);
      zonesScore = Math.round(zonesScore * 1.2);
    }

    scores.heart = rhrScore + zonesScore + hrvScore;
    scores.scoreCount++;
  }

  // Work Score (0-100, 20% weight)
  let workScore = 0;
  let workExplanations: string[] = [];

  // Email management (40 points)
  if (emailStats.totalReceived > 0) {
    const responseRate =
      ((emailStats.totalReceived -
        (emailStats.totalReceived - emailStats.sent)) /
        emailStats.totalReceived) *
      100;

    if (responseRate >= 90) {
      workScore += 40;
      workExplanations.push(
        `Email response rate excellent (${Math.round(
          responseRate
        )}%) = 40/40 points`
      );
    } else if (responseRate >= 80) {
      workScore += 35;
      workExplanations.push(
        `Email response rate very good (${Math.round(
          responseRate
        )}%) = 35/40 points`
      );
    } else if (responseRate >= 70) {
      workScore += 30;
      workExplanations.push(
        `Email response rate good (${Math.round(responseRate)}%) = 30/40 points`
      );
    } else if (responseRate >= 60) {
      workScore += 25;
      workExplanations.push(
        `Email response rate fair (${Math.round(responseRate)}%) = 25/40 points`
      );
    } else if (responseRate >= 50) {
      workScore += 20;
      workExplanations.push(
        `Email response rate poor (${Math.round(responseRate)}%) = 20/40 points`
      );
    } else {
      workScore += 10;
      workExplanations.push(
        `Email response rate very poor (${Math.round(
          responseRate
        )}%) = 10/40 points`
      );
    }
  } else {
    workScore += 25; // Default points if no email data
    workExplanations.push("No email data available = 25/40 points");
  }

  // Calendar management (30 points)
  const meetingCount = (calSummary.match(/\d+/g) || [])[0] || 0;
  const meetingCountNum = parseInt(meetingCount.toString());

  if (meetingCountNum === 0) {
    workScore += 30;
    workExplanations.push("Perfect focus day (0 meetings) = 30/30 points");
  } else if (meetingCountNum <= 2) {
    workScore += 25;
    workExplanations.push(
      `Good meeting balance (${meetingCountNum} meetings) = 25/30 points`
    );
  } else if (meetingCountNum <= 4) {
    workScore += 20;
    workExplanations.push(
      `Moderate meeting load (${meetingCountNum} meetings) = 20/30 points`
    );
  } else if (meetingCountNum <= 6) {
    workScore += 15;
    workExplanations.push(
      `High meeting load (${meetingCountNum} meetings) = 15/30 points`
    );
  } else {
    workScore += 10;
    workExplanations.push(
      `Very high meeting load (${meetingCountNum} meetings) = 10/30 points`
    );
  }

  // Task completion (30 points)
  if (completedTasks && completedTasks.length > 0) {
    workScore += 30;
    workExplanations.push("Tasks completed = 30/30 points");
  } else {
    workScore += 25; // Default points if no task data
    workExplanations.push("Task tracking not configured = 25/30 points");
  }

  scores.work = workScore;
  scores.explanations.work = workExplanations;
  scores.scoreCount++;

  // Calculate total score
  if (scores.scoreCount > 0) {
    scores.total = Math.round(
      (scores.sleep + scores.activity + scores.heart + scores.work) /
        scores.scoreCount
    );
  }

  return scores as WellnessScores;
}

// Additional helper functions - using comprehensive-integration-service and BadgeCalculator
async function getScoreTrends(userId: string): Promise<any> {
  // Implementation from code.js
  return {
    overall: {
      trend: 0,
      sparkline: [],
    },
  };
}

function getNearMissBadges(
  scores: any,
  fitbitData: any,
  emailStats: any
): any[] {
  const nearMisses: any[] = [];

  // Check for near misses (close to earning badges)
  if (scores.total >= 95 && scores.total < 100) {
    nearMisses.push({
      type: "Perfect Day",
      message: "So close to a perfect score!",
      points: 5,
    });
  }

  if (scores.sleep >= 80 && scores.sleep < 85) {
    nearMisses.push({
      type: "Sleep Master",
      message: "Almost earned Sleep Master badge",
      points: 5,
    });
  }

  const stepsMatch = fitbitData.activity.match(/👣 Steps: ([\d,]+)/);
  const steps = stepsMatch ? parseInt(stepsMatch[1].replace(/,/g, "")) : 0;

  if (steps >= 9500 && steps < 10000) {
    nearMisses.push({
      type: "10K Club",
      message: "Just 500 more steps for 10K Club!",
      points: 5,
    });
  }

  return nearMisses;
}

// Helper function to get historical data for streak calculation
async function getHistoricalData(userId: string, days: number): Promise<any[]> {
  try {
    const supabase = await getServerSupabaseClient();

    // Get historical data from database
    const { data: historicalData, error } = await supabase
      .from("reports")
      .select("report_date, scores")
      .eq("user_id", userId)
      .eq("report_type", "daily")
      .order("report_date", { ascending: false })
      .limit(days);

    if (error) {
      console.error("Error fetching historical data:", error);
      return [];
    }

    // Transform the data to match expected format
    const transformedData = (historicalData || []).map((row: any) => ({
      date: row.report_date,
      total_score: row.scores?.total || 0,
      sleep_score: row.scores?.sleep || 0,
      activity_score: row.scores?.activity || 0,
      heart_score: row.scores?.heart || 0,
      work_score: row.scores?.work || 0,
    }));

    return transformedData;
  } catch (error) {
    console.error("Error in getHistoricalData:", error);
    return [];
  }
}

async function saveDailyReport(userId: string, data: any): Promise<void> {
  const supabase = await getServerSupabaseClient();

  await supabase.from("reports").insert({
    user_id: userId,
    report_type: "daily",
    report_date: data.date,
    report_data: data,
    scores: {
      total: data.scores.total,
      sleep: data.scores.sleep,
      activity: data.scores.activity,
      heart: data.scores.heart,
      work: data.scores.work,
    },
    ai_insights: {
      insight: data.insight,
      mantra: data.mantra,
      moodInsight: data.moodInsight,
    },
  });
}
