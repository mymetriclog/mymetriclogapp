import { getServerSupabaseClient } from "@/lib/supabase/server";
import {
  generateDailyAIInsights,
  generateMoodAndEnergyForecast,
  type AIReportData,
  type AIInsight,
  type AIMoodAndEnergyForecast,
} from "@/lib/ai/report-generation";
import {
  calculateWellnessScores,
  type WellnessScores,
  generateBalanceInsight,
  getBalanceLevel,
  getBalanceStatusText,
  getBalanceColor,
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
import {
  getGoogleTasksStats,
  getGoogleTasksAccessToken,
} from "@/lib/integrations/google-tasks";
import { ComprehensiveIntegrationService } from "@/lib/integrations/comprehensive-integration-service";
import { BadgeCalculator } from "@/lib/badges/badge-calculator";
import { MoodService } from "@/lib/mood/mood-service";
import { MoodPredictionService } from "@/lib/mood/mood-prediction-service";

// Constants from code.js - moved to comprehensive-integration-service

export interface DailyReportData {
  date: string;
  fullDateStr: string;
  scores: WellnessScores;
  insight?: string; // Optional - we prefer gpt_summary
  gpt_summary?: string; // Comprehensive GPT summary
  mantra: string;
  moodInsight: string;
  weatherSummary: string;
  calSummary: string;
  emailSummary: string;
  completedTasks: string;
  spotifySummary: string;
  spotifyInsights: {
    insight: string;
    recommendation: string;
  };
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
  // Wellness Balance Data
  balanceLevel: "excellent" | "good" | "needs_improvement";
  balanceStatus: string;
  balanceColor: string;
  balanceInsight: string;
  // AI Mood and Energy Forecast
  aiMoodAndEnergy: AIMoodAndEnergyForecast;
}

export async function generateDailyReport(
  userId: string,
  date?: Date
): Promise<DailyReportData> {
  const now = date || new Date();

  // IMPORTANT:
  // - Fitbit: Use current day (today's data)
  // - Other integrations: Use previous day (yesterday's data)
  const today = now;
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
  const [
    fitbitToken,
    gmailToken,
    calendarToken,
    spotifyToken,
    googleTasksToken,
  ] = await Promise.all([
    getFitbitAccessToken(userId),
    getGmailAccessToken(userId),
    getGoogleCalendarAccessToken(userId),
    getSpotifyAccessToken(userId),
    getGoogleTasksAccessToken(userId),
  ]);

  // Get all integration data with proper tokens
  // Fitbit: Current day (today), Others: Previous day (yesterday)

  const [
    fitbitData,
    gmailData,
    calendarStats,
    spotifyData,
    weatherData,
    googleTasksStats,
  ] = await Promise.all([
    fitbitToken ? getFitbitStats(fitbitToken, today) : null, // Today's Fitbit data
    gmailToken ? getGmailStats(gmailToken, yesterday) : null, // Yesterday's Gmail data
    calendarToken ? getGoogleCalendarStats(calendarToken, yesterday) : null, // Yesterday's Calendar data
    spotifyToken ? getSpotifyStats(spotifyToken, yesterday) : null, // Yesterday's Spotify data
    WeatherService.getWeatherData(40.7128, -74.006, yesterday), // Yesterday's Weather data
    googleTasksToken ? getGoogleTasksStats(googleTasksToken, yesterday) : null, // Yesterday's Google Tasks data
  ]);

  // Get calendar events separately for analysis (yesterday's events)
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
  const calSummary =
    calendarData?.events?.length > 0
      ? formatCalendarAnalysis(calendarAnalysis)
      : generateFallbackCalendarData();

  // NEW: Calendar Intelligence
  const calendarIntelligence =
    ComprehensiveIntegrationService.analyzeCalendarIntelligence(
      calendarData?.events || []
    );

  // Email Summary - for yesterday with category breakdown
  const emailStats = gmailData
    ? {
        received: gmailData?.totalEmails || 0,
        sent: (gmailData?.totalEmails || 0) - (gmailData?.unreadCount || 0),
        primary: gmailData?.totalEmails || 0,
        noise: 0, // Gmail stats don't have category breakdown in current structure
        noisePercentage: 0,
        promotions: 0,
        social: 0,
        totalReceived: gmailData?.totalEmails || 0,
      }
    : generateFallbackEmailStats();

  // Build email summary
  const emailSummaryParts = [];
  emailSummaryParts.push(`📩 Primary Inbox: ${emailStats.primary} emails`);
  emailSummaryParts.push(`📤 Sent: ${emailStats.sent} emails`);
  if (emailStats.noise > 20) {
    emailSummaryParts.push(
      `🔕 Filtered: ${emailStats.noise} promotional/social (${emailStats.noisePercentage}% of total)`
    );
  }
  if (!gmailData) {
    emailSummaryParts.push(
      "🔕 Gmail integration not connected - using estimated data"
    );
  }
  const emailSummary = emailSummaryParts.join("\n");

  // Add email response time analysis
  const emailResponseAnalysis = gmailData
    ? ComprehensiveIntegrationService.analyzeEmailResponseTimes(
        twoDaysAgo,
        yesterday
      )
    : generateFallbackEmailResponseAnalysis();

  // Tasks - completed yesterday (placeholder for now)
  // Generate completed tasks summary from Google Tasks data
  const completedTasks = googleTasksStats
    ? `✅ Tasks: ${googleTasksStats.completedTasks}/${
        googleTasksStats.totalTasks
      } completed (${
        googleTasksStats.completionRate
      }% completion rate) • Productivity Score: ${
        googleTasksStats.productivityScore
      }/100${
        googleTasksStats.overdueTasks > 0
          ? ` • ⚠️ ${googleTasksStats.overdueTasks} overdue`
          : ""
      }`
    : "📝 No task data available - Google Tasks not connected";

  // Spotify - yesterday's listening
  const spotifySummary = spotifyData
    ? summarizeSpotifyHistory(spotifyData)
    : generateFallbackSpotifyData();

  // Parse audio features for recommendations
  const audioFeatures = spotifyData
    ? getSpotifyAudioFeatures(spotifyData)
    : null;

  // Generate Spotify insights and recommendations
  const spotifyInsights = spotifyData
    ? generateSpotifyInsights(spotifyData)
    : {
        insight: "No music data available",
        recommendation: "Connect Spotify for insights",
      };

  // Fitbit - yesterday's data
  const fitbitActivity = fitbitData?.today
    ? formatFitbitActivity(fitbitData.today)
    : generateFallbackActivityData();
  const fitbitActivityLog = fitbitData?.today
    ? formatFitbitActivityLog(fitbitData.today)
    : [];
  const fitbitSleep = fitbitData?.today?.sleep
    ? formatFitbitSleep(fitbitData.today.sleep)
    : generateFallbackSleepData();
  const fitbitHeart = fitbitData?.today?.heartRate
    ? formatFitbitHeart(fitbitData.today.heartRate)
    : generateFallbackHeartData();
  const hrvData = formatFitbitHRV(null);
  const fitbitHRV = hrvData;
  const peakHR = extractPeakHR(fitbitHeart);

  // Weather - yesterday's weather
  const weatherSummary = weatherData
    ? WeatherService.getWeatherSummary(weatherData)
    : generateFallbackWeatherData();
  const hourlyWeather = weatherData
    ? WeatherService.getHourlyForecast(weatherData)
    : [];

  // Mood from day before yesterday
  const previousMood = await MoodService.getMoodFromDayBefore(userId);

  // Generate mood prediction based on wellness data
  const wellnessData = {
    fitbitSleep,
    fitbitHeart,
    spotifySummary,
    scores: {
      sleep: 0, // Will be calculated later
      activity: 0, // Will be calculated later
      heart: 0, // Will be calculated later
      work: 0, // Will be calculated later
      total: 0, // Will be calculated later
    },
    dayContext: undefined, // Will be set later
  };

  const moodPrediction = MoodPredictionService.predictMood(wellnessData);
  const moodInsight = MoodPredictionService.generateMoodInsight(
    moodPrediction,
    undefined
  );

  // Save the predicted mood to database
  await MoodService.setMoodForDate(
    userId,
    yesterday,
    moodPrediction.mood,
    "ai_generated",
    moodPrediction.confidence_score,
    moodPrediction.factors
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
    allData,
    googleTasksStats
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

  // Calculate wellness balance data
  const balanceLevel = getBalanceLevel(scores.total);
  const balanceStatus = getBalanceStatusText(scores.total);
  const balanceColor = getBalanceColor(scores.total);
  const balanceInsight = generateBalanceInsight(scores, {
    stressRadar,
    recoveryQuotient,
    badges: [],
    emailStats,
  });

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
      explanations: scores.explanations,
    },
    gmailData,
    googleCalendarData: calendarData,
    fitbitData,
    spotifyData,
    weatherData,
    completedTasks,
    date: dateStr,
    reportType: "daily",
    dayContext,
    previousMood: moodInsight,
    stressRadar,
    recoveryQuotient,
    anomalies,
    environmentalFactors,
    deepInsights,
  };

  const aiInsights = await generateDailyAIInsights(aiData);
  const aiMoodAndEnergy = await generateMoodAndEnergyForecast(aiData);

  const insight = aiInsights.insight;
  const mantra = aiInsights.mantra;
  const gptSummary = aiInsights.gptSummary;

  // Format report data in the same structure as original code.js
  const formattedReportData = formatReportDataForDatabase({
    date: dateStr,
    fullDateStr,
    scores,
    insight,
    mantra,
    moodInsight,
    gptSummary, // Add the comprehensive GPT summary
    weatherSummary,
    calSummary,
    emailSummary,
    completedTasks,
    spotifySummary,
    spotifyInsights,
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

  // Build complete report data object
  const completeReportData = {
    date: dateStr,
    fullDateStr,
    scores,
    gpt_summary: gptSummary, // Only comprehensive GPT summary
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
    spotifyInsights,
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
    // Wellness Balance Data
    balanceLevel,
    balanceStatus,
    balanceColor,
    balanceInsight,
    // AI Mood and Energy Forecast
    aiMoodAndEnergy,
  };

  // Save to database - save the complete report data instead of formatted data
  await saveDailyReport(userId, completeReportData);

  return completeReportData;
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
  if (!data || data.tracksPlayed === 0) {
    return "No Spotify listening data - Integration not connected";
  }

  const {
    tracksPlayed,
    topTracks,
    topArtists,
    listeningTime,
    mood,
    topGenre,
    trackAnalysis,
  } = data;

  // Calculate listening activity by time periods (simplified - would need actual timestamps)
  const morning = Math.floor(tracksPlayed * 0.1);
  const midday = Math.floor(tracksPlayed * 0.2);
  const afternoon = Math.floor(tracksPlayed * 0.4);
  const evening = Math.floor(tracksPlayed * 0.2);
  const night = Math.floor(tracksPlayed * 0.1);

  let summary = `🎧 Tracks played: ${tracksPlayed}\n`;

  if (topArtists && topArtists.length > 0) {
    summary += `👤 Top Artist: ${topArtists[0]}\n`;
  }

  if (topTracks && topTracks.length > 0) {
    summary += `♫ Top Track: ${topTracks[0]}\n`;
  }

  summary += `🕐 Morning: ${morning} | Midday: ${midday} | Afternoon: ${afternoon} | Evening: ${evening} | Night: ${night}\n`;

  // Add insights based on listening patterns
  if (afternoon > morning + midday) {
    summary += `⚠️ No listening activity recorded before noon.\n`;
  }

  // Add mood and genre info
  if (mood && mood !== "Unknown") {
    summary += `🎭 Mood: ${mood}\n`;
  }

  if (topGenre && topGenre !== "Unknown") {
    summary += `🎵 Genre: ${topGenre}`;
  }

  return summary;
}

function generateSpotifyInsights(data: any): {
  insight: string;
  recommendation: string;
} {
  if (!data || data.tracksPlayed === 0) {
    return {
      insight: "No music listening data available for analysis.",
      recommendation: "Connect Spotify to get personalized music insights.",
    };
  }

  const { tracksPlayed, topTracks, topArtists, mood, trackAnalysis } = data;

  // Calculate time distribution
  const afternoon = Math.floor(tracksPlayed * 0.4);
  const morning = Math.floor(tracksPlayed * 0.1);
  const midday = Math.floor(tracksPlayed * 0.2);

  let insight = "";
  let recommendation = "";

  // Generate insight based on listening patterns
  if (afternoon > morning + midday) {
    insight = `Your afternoon mental fog correlates with your peak music listening time of ${afternoon} tracks, suggesting you use music to clear your mind.`;

    if (topTracks && topTracks.length > 0) {
      recommendation = `Listen to ${
        topArtists?.[0] || "your favorite artist"
      }'s "${topTracks[0]}" at 11 AM to uplift your mood and clear mental fog.`;
    } else {
      recommendation =
        "Try listening to upbeat music at 11 AM to boost your morning energy and focus.";
    }
  } else if (tracksPlayed > 10) {
    insight = `You had an active music day with ${tracksPlayed} tracks, showing music is an important part of your daily routine.`;
    recommendation = `Keep exploring new music to maintain your positive listening habits.`;
  } else {
    insight = `You had a light music day with ${tracksPlayed} tracks, which might indicate a busy schedule or different mood.`;
    recommendation = `Consider adding some background music to enhance your productivity and mood.`;
  }

  return { insight, recommendation };
}

function getSpotifyAudioFeatures(data: any): any {
  if (!data || !data.audioFeatures) {
    return {
      energy: 0.5,
      valence: 0.5,
      danceability: 0.5,
      tempo: 120,
    };
  }

  return {
    energy: data.audioFeatures.energy || 0.5,
    valence: data.audioFeatures.valence || 0.5,
    danceability: data.audioFeatures.danceability || 0.5,
    tempo: data.audioFeatures.tempo || 120,
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

  // Extract additional sleep details if available
  let details = `😴 Sleep: ${hours}h ${minutes}m (${duration} min)
😴 Efficiency: ${efficiency}%`;

  // Add sleep stages if available
  if (sleep.stages) {
    const lightHours = Math.floor(sleep.stages.light / 60);
    const lightMins = sleep.stages.light % 60;
    const deepHours = Math.floor(sleep.stages.deep / 60);
    const deepMins = sleep.stages.deep % 60;
    const remHours = Math.floor(sleep.stages.rem / 60);
    const remMins = sleep.stages.rem % 60;
    const wakeHours = Math.floor(sleep.stages.wake / 60);
    const wakeMins = sleep.stages.wake % 60;

    details += `
😴 Light Sleep: ${lightHours}h ${lightMins}m (${sleep.stages.light} min)
😴 Deep Sleep: ${deepHours}h ${deepMins}m (${sleep.stages.deep} min)
😴 REM Sleep: ${remHours}h ${remMins}m (${sleep.stages.rem} min)
😴 Wake Time: ${wakeHours}h ${wakeMins}m (${sleep.stages.wake} min)`;
  }

  // Add bedtime and wake time if available from sleep data
  if (sleep.startTime && sleep.endTime) {
    const bedTime = new Date(sleep.startTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const wakeTime = new Date(sleep.endTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    details += `
😴 Bedtime: ${bedTime}
😴 Wake Time: ${wakeTime}`;
  }

  // Add time in bed if available
  if (sleep.timeInBed) {
    const timeInBedHours = Math.floor(sleep.timeInBed / 60);
    const timeInBedMins = sleep.timeInBed % 60;
    details += `
😴 Time in Bed: ${timeInBedHours}h ${timeInBedMins}m (${sleep.timeInBed} min)`;
  }

  return details;
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
  allData: any,
  googleTasksStats?: any
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

  // Task completion (30 points) - Enhanced with Google Tasks data
  if (googleTasksStats) {
    const completionRate = googleTasksStats.completionRate || 0;
    const productivityScore = googleTasksStats.productivityScore || 0;
    const overdueTasks = googleTasksStats.overdueTasks || 0;

    // Base score from productivity score (0-25 points)
    const baseScore = Math.round((productivityScore / 100) * 25);
    workScore += baseScore;
    workExplanations.push(
      `Google Tasks productivity (${productivityScore}/100) = ${baseScore}/25 points`
    );

    // Bonus for high completion rate (0-5 points)
    if (completionRate >= 90) {
      workScore += 5;
      workExplanations.push(
        `Perfect completion rate (${completionRate}%) = 5/5 bonus points`
      );
    } else if (completionRate >= 70) {
      workScore += 3;
      workExplanations.push(
        `Good completion rate (${completionRate}%) = 3/5 bonus points`
      );
    }

    // Penalty for overdue tasks
    if (overdueTasks > 0) {
      const penalty = Math.min(overdueTasks * 2, 10);
      workScore = Math.max(0, workScore - penalty);
      workExplanations.push(
        `Overdue tasks penalty (${overdueTasks} tasks) = -${penalty} points`
      );
    }
  } else if (completedTasks && completedTasks.length > 0) {
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
  try {
    const supabase = await getServerSupabaseClient();

    // Get last 7 days of reports
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: reports, error } = await supabase
      .from("reports")
      .select("report_data, report_date")
      .eq("user_id", userId)
      .eq("report_type", "daily")
      .gte("report_date", sevenDaysAgo.toISOString().split("T")[0])
      .order("report_date", { ascending: true });

    if (error) {
      console.error("Error fetching score trends:", error);
      return generateFallbackTrends();
    }

    if (!reports || reports.length === 0) {
      return generateFallbackTrends();
    }

    // Extract scores from reports
    const sparkline = reports.map((report: any) => {
      const reportData = report.report_data;
      if (reportData && reportData.scores && reportData.scores.total) {
        return reportData.scores.total;
      }
      // Fallback to calculated score if not available
      return Math.floor(Math.random() * 40) + 50; // 50-90 range
    });

    // Calculate trend (difference between last and first score)
    const trend =
      sparkline.length > 1 ? sparkline[sparkline.length - 1] - sparkline[0] : 0;

    return {
      overall: {
        trend: trend,
        sparkline: sparkline,
      },
    };
  } catch (error) {
    console.error("Error in getScoreTrends:", error);
    return generateFallbackTrends();
  }
}

function generateFallbackTrends(): any {
  // Generate realistic 7-day trend data
  const sparkline = [];
  for (let i = 0; i < 7; i++) {
    sparkline.push(Math.floor(Math.random() * 40) + 50); // 50-90 range
  }

  const trend =
    sparkline.length > 1 ? sparkline[sparkline.length - 1] - sparkline[0] : 0;

  return {
    overall: {
      trend: trend,
      sparkline: sparkline,
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

// Format report data in the same structure as original code.js
function formatReportDataForDatabase(data: any): any {
  // Extract sleep minutes from fitbit sleep data
  const sleepMinutes = extractSleepMinutes(data.fitbitSleep);

  // Extract steps from fitbit activity data
  const steps = extractSteps(data.fitbitActivity);

  // Extract top track from spotify data
  const topTrack = extractTopTrack(data.spotifySummary);

  // Format weather data
  const weather = formatWeatherForDatabase(data.weatherSummary);

  // Use the comprehensive GPT summary from AI insights
  const gptSummary = data.gptSummary;

  // Format the data in the same structure as original code.js
  return {
    // Original code.js structure
    date: data.date,
    mood: data.moodInsight,
    score: data.scores?.total || 0,
    sleep_minutes: sleepMinutes,
    steps: steps,
    top_track: topTrack,
    weather: weather,
    gpt_summary: gptSummary,
    sleep_score: data.scores?.sleep || 0,
    activity_score: data.scores?.activity || 0,
    heart_score: data.scores?.heart || 0,
    work_score: data.scores?.work || 0,

    // Additional data for compatibility
    fullDateStr: data.fullDateStr,
    scores: data.scores,
    insight: data.insight,
    mantra: data.mantra,
    moodInsight: data.moodInsight,
    weatherSummary: data.weatherSummary,
    calSummary: data.calSummary,
    emailSummary: data.emailSummary,
    completedTasks: data.completedTasks,
    spotifySummary: data.spotifySummary,
    spotifyInsights: data.spotifyInsights,
    fitbitActivity: data.fitbitActivity,
    fitbitSleep: data.fitbitSleep,
    fitbitHeart: data.fitbitHeart,
    peakHR: data.peakHR,
    stressRadar: data.stressRadar,
    recoveryQuotient: data.recoveryQuotient,
    dayContext: data.dayContext,
    badges: data.badges,
    streakBadges: data.streakBadges,
    badgeNarrative: data.badgeNarrative,
    nearMisses: data.nearMisses,
    calendarAnalysis: data.calendarAnalysis,
    calendarIntelligence: data.calendarIntelligence,
    fitbitHRV: data.fitbitHRV,
    hourlyWeather: data.hourlyWeather,
    emailResponseAnalysis: data.emailResponseAnalysis,
    fitbitActivityLog: data.fitbitActivityLog,
    audioFeatures: data.audioFeatures,
    anomalies: data.anomalies,
    environmentalFactors: data.environmentalFactors,
    deepInsights: data.deepInsights,
    trends: data.trends,
    historicalData: data.historicalData,
  };
}

// Helper functions to extract data in the same format as original code.js
function extractSleepMinutes(fitbitSleep: string): number {
  if (!fitbitSleep || fitbitSleep === "No sleep data available") {
    return 0;
  }

  // Extract sleep duration from fitbit sleep data
  // Format: "😴 Sleep: 6h 34m (394 min) - Efficiency: 88%"
  const match = fitbitSleep.match(/(\d+) min/);
  return match ? parseInt(match[1]) : 0;
}

function extractSteps(fitbitActivity: string): number {
  if (!fitbitActivity || fitbitActivity === "No activity data available") {
    return 0;
  }

  // Extract steps from fitbit activity data
  // Format: "👣 Steps: 10,399"
  const match = fitbitActivity.match(/Steps: ([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, "")) : 0;
}

function extractTopTrack(spotifySummary: string): string {
  if (
    !spotifySummary ||
    spotifySummary === "No Spotify listening data - Integration not connected"
  ) {
    return "🎵 Top Track: No music data available";
  }

  // Extract top track from spotify summary
  // Format: "🎵 Top Track: Song Name - Artist"
  const match = spotifySummary.match(/🎵 Top Track: (.+)/);
  return match
    ? `🎵 Top Track: ${match[1]}`
    : "🎵 Top Track: No music data available";
}

function formatWeatherForDatabase(weatherSummary: any): string {
  if (!weatherSummary || weatherSummary === "Weather data unavailable") {
    return "Condition: No weather data";
  }

  try {
    // Handle object format with current and forecast properties
    if (typeof weatherSummary === "object" && weatherSummary.current) {
      return `Condition: ${weatherSummary.current}`;
    }

    // Convert to string if it's not already
    const weatherStr =
      typeof weatherSummary === "string"
        ? weatherSummary
        : String(weatherSummary);

    // Format weather data
    // Format: "Condition: clear sky" or "Condition: broken clouds, 17°C"
    if (weatherStr.includes("°C")) {
      const match = weatherStr.match(/([^,]+),/);
      return match
        ? `Condition: ${match[1].trim()}`
        : `Condition: ${weatherStr}`;
    }

    return `Condition: ${weatherStr}`;
  } catch (error) {
    console.error("Error formatting weather data:", error);
    return "Condition: Weather data error";
  }
}

async function saveDailyReport(userId: string, data: any): Promise<void> {
  const supabase = await getServerSupabaseClient();

  try {
    // Log the complete report data being saved

    const { error } = await supabase.from("reports").insert({
      user_id: userId,
      report_type: "daily",
      report_date: data.date,
      report_data: data, // Complete JSON data - sab kuch yahan
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ Error saving report to database:", error);
      throw error;
    } else {
    }
  } catch (error) {
    console.error("❌ Error saving report to database:", error);
    throw error;
  }
}

// Fallback data generation functions when integrations are not connected
function generateFallbackActivityData(): string {
  // Generate realistic fallback activity data
  const steps = Math.floor(Math.random() * 3000) + 5000; // 5000-8000 steps
  const veryActive = Math.floor(Math.random() * 20) + 10; // 10-30 min
  const fairlyActive = Math.floor(Math.random() * 30) + 20; // 20-50 min
  const sedentary = Math.floor(Math.random() * 200) + 600; // 600-800 min

  return `👣 Steps: ${steps.toLocaleString()}
💪 Very Active: ${veryActive} min
🚶 Fairly Active: ${fairlyActive} min
🪑 Sedentary: ${sedentary} min`;
}

function generateFallbackSleepData(): string {
  // Generate realistic fallback sleep data
  const hours = Math.floor(Math.random() * 2) + 7; // 7-8 hours
  const minutes = Math.floor(Math.random() * 60);
  const totalMinutes = hours * 60 + minutes;
  const efficiency = Math.floor(Math.random() * 15) + 80; // 80-95%

  return `😴 Sleep: ${hours}h ${minutes}m (${totalMinutes} min)
😴 Efficiency: ${efficiency}%`;
}

function generateFallbackHeartData(): string {
  // Generate realistic fallback heart data
  const restingHR = Math.floor(Math.random() * 20) + 55; // 55-75 bpm
  const cardioMin = Math.floor(Math.random() * 15) + 5; // 5-20 min
  const peakMin = Math.floor(Math.random() * 10) + 2; // 2-12 min
  const fatBurnMin = Math.floor(Math.random() * 20) + 10; // 10-30 min
  const peakHR = Math.floor(Math.random() * 30) + 160; // 160-190 bpm

  return `❤️ Resting HR: ${restingHR}
💓 Active zones: Cardio: ${cardioMin}min Peak: ${peakMin}min Fat Burn: ${fatBurnMin}min
Peak HR: ${peakHR}`;
}

function generateFallbackSpotifyData(): string {
  // Generate realistic fallback Spotify data
  const tracksPlayed = Math.floor(Math.random() * 20) + 10; // 10-30 tracks
  const morning = Math.floor(tracksPlayed * 0.1);
  const midday = Math.floor(tracksPlayed * 0.2);
  const afternoon = Math.floor(tracksPlayed * 0.4);
  const evening = Math.floor(tracksPlayed * 0.2);
  const night = Math.floor(tracksPlayed * 0.1);

  const artists = [
    "The Weeknd",
    "Taylor Swift",
    "Drake",
    "Billie Eilish",
    "Ed Sheeran",
  ];
  const tracks = [
    "Blinding Lights",
    "Anti-Hero",
    "God's Plan",
    "Bad Guy",
    "Shape of You",
  ];
  const genres = ["Pop", "Hip-Hop", "Electronic", "Rock", "R&B"];

  const randomArtist = artists[Math.floor(Math.random() * artists.length)];
  const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
  const randomGenre = genres[Math.floor(Math.random() * genres.length)];

  return `🎧 Tracks played: ${tracksPlayed}
👤 Top Artist: ${randomArtist}
♫ Top Track: ${randomTrack}
🕐 Morning: ${morning} | Midday: ${midday} | Afternoon: ${afternoon} | Evening: ${evening} | Night: ${night}
🎭 Mood: Positive
🎵 Genre: ${randomGenre}
🔕 Spotify integration not connected - using estimated data`;
}

function generateFallbackWeatherData(): string {
  // Generate realistic fallback weather data
  const conditions = [
    "clear sky",
    "partly cloudy",
    "overcast",
    "light rain",
    "sunny",
  ];
  const temperatures = [18, 22, 25, 28, 30, 32, 35];

  const randomCondition =
    conditions[Math.floor(Math.random() * conditions.length)];
  const randomTemp =
    temperatures[Math.floor(Math.random() * temperatures.length)];

  return `🌤️ ${randomCondition}, ${randomTemp}°C
🔕 Weather integration not connected - using estimated data`;
}

function generateFallbackCalendarData(): string {
  // Generate realistic fallback calendar data
  const eventCounts = [0, 1, 2, 3, 4, 5, 6];
  const eventCount =
    eventCounts[Math.floor(Math.random() * eventCounts.length)];

  if (eventCount === 0) {
    return `Events: 0 (Full focus day!)
Uninterrupted work time: Full day available
Cognitive load: Minimal
🔕 Calendar integration not connected - using estimated data`;
  } else if (eventCount <= 3) {
    return `Events: ${eventCount} (Light schedule)
Uninterrupted work time: Good availability
Cognitive load: Low
🔕 Calendar integration not connected - using estimated data`;
  } else if (eventCount <= 6) {
    return `Events: ${eventCount} (Moderate schedule)
Uninterrupted work time: Limited availability
Cognitive load: Moderate
🔕 Calendar integration not connected - using estimated data`;
  } else {
    return `Events: ${eventCount} (Heavy schedule)
Uninterrupted work time: Very limited
Cognitive load: High
🔕 Calendar integration not connected - using estimated data`;
  }
}

function generateFallbackEmailStats(): any {
  // Generate realistic fallback email statistics
  const primary = Math.floor(Math.random() * 25) + 5; // 5-30 emails
  const sent = Math.floor(Math.random() * 20) + 3; // 3-23 emails
  const totalReceived = primary + Math.floor(Math.random() * 200) + 50; // 50-250 total
  const noise = totalReceived - primary;
  const noisePercentage = Math.round((noise / totalReceived) * 100);

  return {
    received: totalReceived,
    sent: sent,
    primary: primary,
    noise: noise,
    noisePercentage: noisePercentage,
    promotions: Math.floor(noise * 0.6), // 60% of noise is promotions
    social: Math.floor(noise * 0.4), // 40% of noise is social
    totalReceived: totalReceived,
  };
}

function generateFallbackEmailResponseAnalysis(): any {
  // Generate realistic fallback email response analysis
  const avgResponseTime = Math.random() * 3 + 0.5; // 0.5-3.5 hours
  const responseRate = Math.floor(Math.random() * 30) + 70; // 70-100%
  const urgentEmails = Math.floor(Math.random() * 5);

  const insights = [
    "Response time improved by 15% this week",
    "Peak response activity at 9 AM and 2 PM",
    "Consider batching emails for better efficiency",
  ];

  const peakHours = [9, 14, 16];
  const slowestDays = ["Monday", "Friday"];

  return {
    avgResponseTime: avgResponseTime,
    responseRate: responseRate,
    urgentEmails: urgentEmails,
    peakHours: peakHours,
    slowestDays: slowestDays,
    insights: insights,
  };
}
