import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIReportData {
  scores: {
    total: number;
    sleep: number;
    activity: number;
    heart: number;
    work: number;
  };
  gmailData?: any;
  googleCalendarData?: any;
  fitbitData?: any;
  spotifyData?: any;
  weatherData?: any;
  date: string;
  reportType: "daily" | "weekly";
}

export interface AIInsight {
  insight: string;
  mantra: string;
  moodInsight: string;
  recommendations: string[];
  trends: any;
  patterns: any;
}

/**
 * Generate AI-powered insights for daily reports
 * Mirrors the logic from code.js getGPTInsight function
 */
export async function generateDailyAIInsights(
  data: AIReportData
): Promise<AIInsight> {
  try {
    const prompt = buildDailyPrompt(data);
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a wellness and productivity AI coach. Analyze the user's data and provide personalized insights, motivational mantras, and actionable recommendations. Be encouraging but realistic. Use the exact format requested.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || "";

    const parsedInsights = parseAIResponse(response, data);

    return parsedInsights;
  } catch (error) {
    const fallbackInsights = generateFallbackInsights(data);
    return fallbackInsights;
  }
}

/**
 * Generate AI-powered insights for weekly reports
 * Mirrors the logic from code.js getEnhancedGPTInsight function
 */
export async function generateWeeklyAIInsights(
  data: AIReportData
): Promise<AIInsight> {
  try {
    const prompt = buildWeeklyPrompt(data);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a wellness and productivity AI coach specializing in weekly analysis. Provide comprehensive insights, identify patterns, and give actionable recommendations for the week ahead. Use the exact format requested.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || "";

    const parsedInsights = parseWeeklyAIResponse(response, data);

    return parsedInsights;
  } catch (error) {
    const fallbackInsights = generateWeeklyFallbackInsights(data);
    return fallbackInsights;
  }
}

/**
 * Build comprehensive prompt for daily insights
 * Mirrors the context building from code.js buildComprehensiveContext
 */
function buildDailyPrompt(data: AIReportData): string {
  const {
    scores,
    gmailData,
    googleCalendarData,
    fitbitData,
    spotifyData,
    date,
  } = data;

  let prompt = `Generate a daily wellness report for ${date} with the following data:\n\n`;

  // Scores section
  prompt += `SCORES:\n`;
  prompt += `- Overall: ${scores.total}/100\n`;
  prompt += `- Sleep: ${scores.sleep}/100\n`;
  prompt += `- Activity: ${scores.activity}/100\n`;
  prompt += `- Heart: ${scores.heart}/100\n`;
  prompt += `- Work: ${scores.work}/100\n\n`;

  // Gmail data
  if (gmailData?.stats) {
    prompt += `EMAIL DATA:\n`;
    prompt += `- Total emails: ${gmailData.stats.totalEmails}\n`;
    prompt += `- Unread: ${gmailData.stats.unreadCount}\n`;
    prompt += `- Response rate: ${
      gmailData.stats.totalEmails > 0
        ? Math.round(
            ((gmailData.stats.totalEmails - gmailData.stats.unreadCount) /
              gmailData.stats.totalEmails) *
              100
          )
        : 0
    }%\n\n`;
  }

  // Fitbit data
  if (fitbitData?.stats?.today) {
    const today = fitbitData.stats.today;
    prompt += `FITNESS DATA:\n`;
    prompt += `- Steps: ${today.steps?.toLocaleString() || 0}\n`;
    prompt += `- Sleep: ${Math.floor((today.sleep?.duration || 0) / 60)}h ${
      (today.sleep?.duration || 0) % 60
    }m\n`;
    prompt += `- Calories: ${today.calories?.toLocaleString() || 0}\n`;
    prompt += `- Resting HR: ${today.heartRate?.resting || 0} bpm\n\n`;
  }

  // Spotify data
  if (spotifyData?.stats) {
    prompt += `MUSIC DATA:\n`;
    prompt += `- Tracks played: ${spotifyData.stats.tracksPlayed}\n`;
    prompt += `- Mood: ${spotifyData.stats.mood}\n`;
    prompt += `- Top genre: ${spotifyData.stats.topGenre}\n\n`;
  }

  // Google Calendar data
  if (googleCalendarData?.stats) {
    prompt += `CALENDAR DATA:\n`;
    prompt += `- Total events: ${googleCalendarData.stats.totalEvents}\n`;
    prompt += `- Events today: ${googleCalendarData.stats.eventsToday}\n`;
    prompt += `- Upcoming events: ${googleCalendarData.stats.upcomingEvents}\n`;
    prompt += `- Average events per day: ${googleCalendarData.stats.avgEventsPerDay}\n`;
    prompt += `- Busy hours: ${
      googleCalendarData.stats.busyHours || "Not available"
    }\n\n`;
  }

  prompt += `Please provide:\n`;
  prompt += `1. A personalized daily insight (2-3 sentences)\n`;
  prompt += `2. A motivational daily mantra (1 sentence)\n`;
  prompt += `3. Mood analysis based on the data (2-3 sentences)\n`;
  prompt += `4. 3-4 specific, actionable recommendations\n\n`;
  prompt += `Format your response exactly like this:\n`;
  prompt += `INSIGHT: [your insight]\n`;
  prompt += `MANTRA: [your mantra]\n`;
  prompt += `MOOD: [your mood analysis]\n`;
  prompt += `RECOMMENDATIONS:\n- [recommendation 1]\n- [recommendation 2]\n- [recommendation 3]\n- [recommendation 4]`;

  return prompt;
}

/**
 * Build comprehensive prompt for weekly insights
 * Mirrors the weekly analysis from code.js
 */
function buildWeeklyPrompt(data: AIReportData): string {
  const {
    scores,
    gmailData,
    googleCalendarData,
    fitbitData,
    spotifyData,
    date,
  } = data;

  let prompt = `Generate a weekly wellness report for the week ending ${date} with the following data:\n\n`;

  // Weekly scores
  prompt += `WEEKLY PERFORMANCE:\n`;
  prompt += `- Average score: ${scores.total}/100\n`;
  prompt += `- Sleep average: ${scores.sleep}/100\n`;
  prompt += `- Activity average: ${scores.activity}/100\n`;
  prompt += `- Heart health average: ${scores.heart}/100\n`;
  prompt += `- Work productivity average: ${scores.work}/100\n\n`;

  // Weekly data summary
  if (gmailData?.stats) {
    prompt += `EMAIL SUMMARY:\n`;
    prompt += `- Total emails processed\n`;
    prompt += `- Response patterns and workload\n\n`;
  }

  if (googleCalendarData?.stats) {
    prompt += `CALENDAR SUMMARY:\n`;
    prompt += `- Total events scheduled\n`;
    prompt += `- Meeting patterns and busy periods\n`;
    prompt += `- Work-life balance indicators\n\n`;
  }

  if (fitbitData?.stats) {
    prompt += `FITNESS SUMMARY:\n`;
    prompt += `- Activity trends and patterns\n`;
    prompt += `- Sleep quality over the week\n`;
    prompt += `- Heart rate variability trends\n\n`;
  }

  if (spotifyData?.stats) {
    prompt += `MUSIC SUMMARY:\n`;
    prompt += `- Listening patterns and mood correlation\n`;
    prompt += `- Genre preferences and changes\n\n`;
  }

  // Weekly trends
  prompt += `Please analyze this data and provide:\n`;
  prompt += `1. Weekly insight (3-4 sentences about overall performance)\n`;
  prompt += `2. 4-5 specific recommendations for next week\n`;
  prompt += `3. Weekly trends analysis (sleep, activity, productivity, wellness)\n`;
  prompt += `4. Behavioral patterns identified\n\n`;
  prompt += `Format your response exactly like this:\n`;
  prompt += `INSIGHT: [your weekly insight]\n`;
  prompt += `RECOMMENDATIONS:\n- [recommendation 1]\n- [recommendation 2]\n- [recommendation 3]\n- [recommendation 4]\n- [recommendation 5]\n`;
  prompt += `TRENDS:\n- Sleep: [trend analysis]\n- Activity: [trend analysis]\n- Productivity: [trend analysis]\n- Wellness: [trend analysis]\n`;
  prompt += `PATTERNS:\n- [pattern 1]\n- [pattern 2]\n- [pattern 3]`;

  return prompt;
}

/**
 * Parse AI response for daily insights
 * Mirrors the parsing logic from code.js
 */
function parseAIResponse(response: string, data: AIReportData): AIInsight {
  try {
    const lines = response.split("\n").filter((line) => line.trim());

    let insight = "";
    let mantra = "";
    let moodInsight = "";
    let recommendations: string[] = [];

    for (const line of lines) {
      if (line.startsWith("INSIGHT:")) {
        insight = line.replace("INSIGHT:", "").trim();
      } else if (line.startsWith("MANTRA:")) {
        mantra = line.replace("MANTRA:", "").trim();
      } else if (line.startsWith("MOOD:")) {
        moodInsight = line.replace("MOOD:", "").trim();
      } else if (line.startsWith("- ")) {
        const rec = line.replace("- ", "").trim();
        recommendations.push(rec);
      }
    }

    return {
      insight: insight || generateFallbackInsight(data),
      mantra: mantra || generateFallbackMantra(data),
      moodInsight: moodInsight || generateFallbackMoodInsight(data),
      recommendations:
        recommendations.length > 0
          ? recommendations
          : generateFallbackRecommendations(data),
      trends: {},
      patterns: [],
    };
  } catch (error) {
    return generateFallbackInsights(data);
  }
}

/**
 * Parse AI response for weekly insights
 */
function parseWeeklyAIResponse(
  response: string,
  data: AIReportData
): AIInsight {
  try {
    const lines = response.split("\n").filter((line) => line.trim());

    let insight = "";
    let recommendations: string[] = [];
    let trends: any = {};
    let patterns: string[] = [];

    for (const line of lines) {
      if (line.startsWith("INSIGHT:")) {
        insight = line.replace("INSIGHT:", "").trim();
      } else if (line.startsWith("- ") && !line.includes(":")) {
        const rec = line.replace("- ", "").trim();
        recommendations.push(rec);
      } else if (line.includes(":") && line.includes("trend")) {
        const [category, analysis] = line.split(":").map((s) => s.trim());
        if (category && analysis) {
          trends[category.toLowerCase()] = analysis;
        }
      } else if (line.startsWith("PATTERNS:") || line.match(/^[A-Z]+:$/)) {
        // Skip pattern headers
        continue;
      }
    }

    return {
      insight: insight || generateWeeklyFallbackInsight(data),
      mantra: generateWeeklyFallbackMantra(data),
      moodInsight: generateWeeklyFallbackMoodInsight(data),
      recommendations:
        recommendations.length > 0
          ? recommendations
          : generateWeeklyFallbackRecommendations(data),
      trends:
        Object.keys(trends).length > 0
          ? trends
          : generateWeeklyFallbackTrends(data),
      patterns:
        patterns.length > 0 ? patterns : generateWeeklyFallbackPatterns(data),
    };
  } catch (error) {
    return generateWeeklyFallbackInsights(data);
  }
}

/**
 * Fallback functions when AI fails
 * Mirrors the fallback logic from code.js
 */
function generateFallbackInsights(data: AIReportData): AIInsight {
  return {
    insight: generateFallbackInsight(data),
    mantra: generateFallbackMantra(data),
    moodInsight: generateFallbackMoodInsight(data),
    recommendations: generateFallbackRecommendations(data),
    trends: {},
    patterns: [],
  };
}

function generateWeeklyFallbackInsights(data: AIReportData): AIInsight {
  return {
    insight: generateWeeklyFallbackInsight(data),
    mantra: generateWeeklyFallbackMantra(data),
    moodInsight: generateWeeklyFallbackMoodInsight(data),
    recommendations: generateWeeklyFallbackRecommendations(data),
    trends: generateWeeklyFallbackTrends(data),
    patterns: generateWeeklyFallbackPatterns(data),
  };
}

function generateFallbackInsight(data: AIReportData): string {
  const { scores } = data;
  const total = scores.total;

  if (total >= 90) {
    return "Exceptional day! You're operating at peak performance across all metrics. Keep this momentum going!";
  } else if (total >= 80) {
    return "Great day! You're maintaining excellent habits and productivity. Minor optimizations could push you to exceptional.";
  } else if (total >= 70) {
    return "Good day with room for improvement. Focus on your weakest area to boost overall performance.";
  } else if (total >= 60) {
    return "Moderate day. Consider what's working well and what needs attention to improve tomorrow.";
  } else {
    return "Challenging day. Tomorrow is a new opportunity to reset and focus on your key priorities.";
  }
}

function generateFallbackMantra(data: AIReportData): string {
  const mantras = [
    "Every step forward is progress, no matter how small.",
    "Your health is your wealth - prioritize it daily.",
    "Small consistent actions lead to big results.",
    "Today's effort is tomorrow's achievement.",
    "Balance is the key to sustainable success.",
  ];
  return mantras[Math.floor(Math.random() * mantras.length)];
}

function generateFallbackMoodInsight(data: AIReportData): string {
  let insight = "Your mood today reflects your overall wellness balance.";

  if (data.fitbitData?.stats?.today?.sleep?.efficiency >= 85) {
    insight +=
      " Excellent sleep quality suggests you're well-rested and ready for the day.";
  }

  if (data.spotifyData?.stats?.mood === "positive") {
    insight += " Your music choices indicate a positive emotional state.";
  }

  return insight;
}

function generateFallbackRecommendations(data: AIReportData): string[] {
  const { scores } = data;
  const recommendations = [];

  if (scores.sleep < 80) {
    recommendations.push("Prioritize 7-9 hours of quality sleep");
  }
  if (scores.activity < 80) {
    recommendations.push("Aim for 10,000 steps or 30 minutes of activity");
  }
  if (scores.heart < 80) {
    recommendations.push("Focus on stress management and recovery");
  }
  if (scores.work < 80) {
    recommendations.push("Improve email management and task completion");
  }

  return recommendations;
}

function generateWeeklyFallbackInsight(data: AIReportData): string {
  return "This week shows consistent patterns in your health and productivity metrics. Focus on maintaining your strengths while addressing areas for improvement.";
}

function generateWeeklyFallbackMantra(data: AIReportData): string {
  return "Weekly consistency builds lasting change. Every day is a building block toward your goals.";
}

function generateWeeklyFallbackMoodInsight(data: AIReportData): string {
  return "Your weekly mood patterns reflect your overall wellness journey. Consistency in healthy habits leads to improved emotional well-being.";
}

function generateWeeklyFallbackRecommendations(data: AIReportData): string[] {
  return [
    "Maintain your current sleep schedule",
    "Increase daily step count gradually",
    "Improve email response time",
    "Schedule regular breaks during work",
    "Focus on stress management techniques",
  ];
}

function generateWeeklyFallbackTrends(data: AIReportData): any {
  return {
    sleep: "stable",
    activity: "increasing",
    productivity: "stable",
    wellness: "improving",
  };
}

function generateWeeklyFallbackPatterns(data: AIReportData): string[] {
  return [
    "You perform better on weekdays",
    "Sleep quality improves on weekends",
    "Activity peaks mid-week",
  ];
}
