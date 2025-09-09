import OpenAI from "openai";
import {
  generateEnhancedDailyReport,
  generateGPTInsightPrompt,
  generateDailyMantra,
} from "../reports/enhanced-report-generator";

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
  completedTasks?: string;
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
    // Generate enhanced report data
    const enhancedReport = await generateEnhancedDailyReport(
      data.fitbitData?.sleep || "",
      data.fitbitData?.activity || "",
      data.fitbitData?.heart || "",
      data.fitbitData?.hrv,
      data.gmailData || {},
      data.googleCalendarData || {},
      data.spotifyData || {},
      data.weatherData || {},
      data.completedTasks || "",
      new Date(data.date)
    );

    // Generate GPT insight prompt
    const prompt = generateGPTInsightPrompt(enhancedReport);

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
      });
    } catch (modelError: any) {
      // Check for API key errors - if API key is invalid, don't generate report
      if (
        modelError.code === "invalid_api_key" ||
        modelError.code === "invalid_request_error"
      ) {
        console.error("❌ OpenAI API key is invalid. Cannot generate report.");
        throw new Error(
          "OpenAI API key is invalid. Please check your API key configuration."
        );
      }

      // Fallbacks for model issues or quota limits
      if (
        modelError.code === "model_not_found" ||
        modelError.code === "insufficient_quota"
      ) {
        console.log(
          "⚠️ GPT-4 unavailable or quota exceeded, falling back to gpt-3.5-turbo"
        );
        try {
          completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 800,
            presence_penalty: 0.3,
            frequency_penalty: 0.3,
          });
        } catch (fallbackErr: any) {
          if (fallbackErr.code === "insufficient_quota") {
            console.log(
              "⚠️ Quota exceeded for all models. Cannot generate report without AI insights."
            );
            throw new Error(
              "OpenAI quota exceeded. Cannot generate report without AI insights."
            );
          }
          throw fallbackErr;
        }
      } else {
        throw modelError;
      }
    }

    const response = completion.choices[0]?.message?.content || "";
    const parsed = parseAIResponse(response, data);

    return {
      insight: parsed.insight,
      mantra: generateDailyMantra(parsed.insight),
      moodInsight: parsed.moodInsight,
      recommendations: parsed.recommendations,
      trends: enhancedReport.scores,
      patterns: enhancedReport.badges,
    };
  } catch (error) {
    console.error("Error generating AI insights:", error);
    // If it's an API key error or quota error, don't generate fallback insights
    if (
      error instanceof Error &&
      (error.message.includes("API key is invalid") ||
        error.message.includes("quota exceeded"))
    ) {
      throw error; // Re-throw the error to stop report generation
    }
    return generateFallbackInsights(data);
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

    let completion;
    try {
      completion = await openai.chat.completions.create({
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
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
      });
    } catch (modelError: any) {
      // Check for API key errors - if API key is invalid, don't generate report
      if (
        modelError.code === "invalid_api_key" ||
        modelError.code === "invalid_request_error"
      ) {
        console.error(
          "❌ OpenAI API key is invalid. Cannot generate weekly report."
        );
        throw new Error(
          "OpenAI API key is invalid. Please check your API key configuration."
        );
      }

      // Fallbacks for model issues or quota limits
      if (
        modelError.code === "model_not_found" ||
        modelError.code === "insufficient_quota"
      ) {
        console.log(
          "⚠️ GPT-4 unavailable or quota exceeded, falling back to gpt-3.5-turbo"
        );
        try {
          completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
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
            presence_penalty: 0.3,
            frequency_penalty: 0.3,
          });
        } catch (fallbackErr: any) {
          if (fallbackErr.code === "insufficient_quota") {
            console.log(
              "⚠️ Quota exceeded for all models (weekly). Cannot generate report without AI insights."
            );
            throw new Error(
              "OpenAI quota exceeded. Cannot generate weekly report without AI insights."
            );
          }
          throw fallbackErr;
        }
      } else {
        throw modelError;
      }
    }

    const response = completion.choices[0]?.message?.content || "";

    const parsedInsights = parseWeeklyAIResponse(response, data);

    return parsedInsights;
  } catch (error) {
    console.error("Error generating weekly AI insights:", error);
    // If it's an API key error or quota error, don't generate fallback insights
    if (
      error instanceof Error &&
      (error.message.includes("API key is invalid") ||
        error.message.includes("quota exceeded"))
    ) {
      throw error; // Re-throw the error to stop report generation
    }
    const fallbackInsights = generateWeeklyFallbackInsights(data);
    return fallbackInsights;
  }
}

/**
 * Build comprehensive prompt for daily insights
 * Mirrors the context building from code.js buildComprehensiveContext
 */
export function buildDailyPrompt(data: AIReportData): string {
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
export function buildWeeklyPrompt(data: AIReportData): string {
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
 * Additional prompt builders (kept here to centralize all AI prompts)
 * These mirror specialized prompts used in code.js for deeper analysis.
 */
/**
 * EXACT code.js-style DAILY prompt (getGPTInsight)
 * Usage: pass the prebuilt summary string used as the user message.
 */
export function buildCodeJsDailySimplePrompt(summary: string): {
  system: string;
  user: string;
} {
  const system =
    "You are a reflective personal coach for productivity and emotional well-being.";
  return { system, user: summary };
}

/**
 * EXACT code.js-style WEEKLY/ENHANCED prompt (getEnhancedGPTInsight)
 * Mirrors system and user prompts; caller should provide allData fields similar to code.js.
 */
export function buildCodeJsWeeklyEnhancedPrompt(input: {
  summary: string;
  allData: {
    scores: {
      total: number;
      sleep: number;
      activity: number;
      heart: number;
      work: number;
      explanations?: {
        sleep?: string[];
        activity?: string[];
        heart?: string[];
        work?: string[];
      };
    };
    enhancedContext?: string;
    behavioralPatterns?: string;
    criticalFactors?: string;
  };
}): { system: string; user: string } {
  const { summary, allData } = input;
  const system =
    "You are an elite wellness analyst and behavioral scientist with expertise in:\n" +
    "- Circadian biology and sleep science\n" +
    "- Exercise physiology and recovery\n" +
    "- Behavioral psychology and habit formation\n" +
    "- Stress psychophysiology\n" +
    "- Nutritional biochemistry\n" +
    "- Performance optimization\n\n" +
    "Your role is to provide profound, actionable insights that go beyond surface-level observations. " +
    "You identify hidden patterns, explain causation (not just correlation), and provide specific, personalized recommendations.\n\n" +
    'IMPORTANT: Always use "you" and "your" when addressing the user. Never use third person.';

  const ctx = allData.enhancedContext ?? "";
  const patterns = allData.behavioralPatterns ?? "";
  const factors = allData.criticalFactors ?? "";
  const ex = allData.scores.explanations ?? {};

  const user =
    "Analyze this comprehensive wellness data and provide a world-class insight:\n\n" +
    "==== CONTEXTUAL INTELLIGENCE ====\n" +
    ctx +
    "\n\n" +
    "==== SCORE BREAKDOWNS (MUST REFERENCE) ====\n" +
    "Overall: " +
    allData.scores.total +
    "/100\n" +
    "Sleep: " +
    allData.scores.sleep +
    "/100\n" +
    "  - " +
    (ex.sleep?.join("\n  - ") ?? "") +
    "\n" +
    "Activity: " +
    allData.scores.activity +
    "/100\n" +
    "  - " +
    (ex.activity?.join("\n  - ") ?? "") +
    "\n" +
    "Heart: " +
    allData.scores.heart +
    "/100\n" +
    "  - " +
    (ex.heart?.join("\n  - ") ?? "") +
    "\n" +
    "Work: " +
    allData.scores.work +
    "/100\n" +
    "  - " +
    (ex.work?.join("\n  - ") ?? "") +
    "\n\n" +
    "==== BEHAVIORAL PATTERNS DETECTED ====\n" +
    patterns +
    "\n\n" +
    "==== CRITICAL PERFORMANCE FACTORS ====\n" +
    factors +
    "\n\n" +
    "==== YESTERDAY'S RAW DATA ====\n" +
    summary +
    "\n\n" +
    "==== YOUR ANALYSIS MUST FOLLOW THESE RULES ====\n\n" +
    "1. ACCURATE SCORING REFERENCES:\n" +
    "   - State the EXACT scores from the breakdowns above\n" +
    "   - Explain WHY each score is what it is using the breakdown explanations\n" +
    "   - If work score is 65, don't say 80. Be precise.\n\n" +
    "2. EMAIL CONTEXT:\n" +
    "   - 91% promotional emails means only 9% were real work emails\n" +
    "   - This is an INBOX MANAGEMENT issue, not a work performance issue\n" +
    "   - Focus on the fact they had 77 primary emails but only 7 were actually work-related\n\n" +
    "3. POSITIVE FRAMING:\n" +
    "   - Having 0 meetings = EXCELLENT focus opportunity (not a negative)\n" +
    "   - Full day of uninterrupted work = RARE and valuable\n" +
    "   - Low stress despite high activity = OPTIMAL state\n\n" +
    "4. ROOT CAUSE ANALYSIS:\n" +
    "   - Identify the PRIMARY driver affecting each score\n" +
    "   - For work score: explain each component (email, calendar, focus, tasks)\n" +
    "   - Connect the dots between different metrics\n\n" +
    "5. SPECIFIC RECOMMENDATIONS:\n" +
    "   - For email noise: recommend UNSUBSCRIBE actions, not generic 'manage emails'\n" +
    "   - Include exact times and measurable actions\n" +
    "   - Address the LOWEST scoring component with highest impact potential\n\n" +
    "FORMAT YOUR RESPONSE EXACTLY AS:\n\n" +
    "[First paragraph: State exact scores and explain WHY each scored what it did, referencing the specific point breakdowns]\n" +
    "[PARAGRAPH BREAK]\n" +
    "[Second paragraph: Connect the patterns - how did sleep affect activity? How did 0 meetings create opportunity? Why is 91% promotional emails significant?]\n" +
    "[PARAGRAPH BREAK]\n" +
    "[Third paragraph: ONE specific action targeting the biggest opportunity for improvement, with exact timing and expected outcome]\n\n" +
    "Use **bold** for all metrics, times, and key recommendations.\n" +
    "Be specific: 'your work score of **65/100** reflects excellent focus time (25/25) but was reduced by task tracking gaps (15/25)' not generic statements.\n";

  return { system, user };
}
export function buildStressAnalysisPrompt(input: {
  scores: AIReportData["scores"];
  stressRadar?: any;
  date: string;
}): string {
  const { scores, stressRadar, date } = input;
  return `Analyze stress for ${date} with:
SCORES: overall=${scores.total}, sleep=${scores.sleep}, activity=${
    scores.activity
  }, heart=${scores.heart}, work=${scores.work}
STRESS_RADAR: ${JSON.stringify(stressRadar ?? {})}

Provide 2-3 sentences on likely stressors and 3 targeted actions.`;
}

export function buildRecoveryPrompt(input: {
  scores: AIReportData["scores"];
  recoveryQuotient?: any;
  date: string;
}): string {
  const { scores, recoveryQuotient, date } = input;
  return `Assess recovery for ${date}:
SCORES: overall=${scores.total}, sleep=${scores.sleep}, activity=${
    scores.activity
  }, heart=${scores.heart}
RECOVERY: ${JSON.stringify(recoveryQuotient ?? {})}

Give a 2-sentence readiness summary and 3 prioritized recovery actions.`;
}

export function buildCalendarIntelligencePrompt(input: {
  calendarStats?: any;
  events?: any[];
  date: string;
}): string {
  const { calendarStats, events = [], date } = input;
  return `Analyze calendar for ${date}:
STATS: ${JSON.stringify(calendarStats ?? {})}
EVENTS_SAMPLE: ${JSON.stringify(events.slice(0, 10))}

Identify meeting load, context switching, and suggest 3 schedule optimizations.`;
}

export function buildBadgeNarrativePrompt(input: {
  badges?: any[];
  streakBadges?: any[];
  scores: AIReportData["scores"];
  dayContext?: any;
  date: string;
}): string {
  const { badges = [], streakBadges = [], scores, dayContext, date } = input;
  return `Create a short narrative for achievements on ${date}:
SCORES: ${JSON.stringify(scores)}
BADGES: ${JSON.stringify(badges)}
STREAKS: ${JSON.stringify(streakBadges)}
CONTEXT: ${JSON.stringify(dayContext ?? {})}

Narrative: 2-3 motivational sentences referencing notable badges.`;
}

export function buildDeepInsightsPrompt(input: {
  scores: AIReportData["scores"];
  trends?: any;
  anomalies?: any;
  calendarIntelligence?: any;
  spotifyStats?: any;
  weatherSummary?: string;
  date: string;
}): string {
  const {
    scores,
    trends,
    anomalies,
    calendarIntelligence,
    spotifyStats,
    weatherSummary,
    date,
  } = input;
  return `Derive cross-domain insights for ${date} using:
SCORES: ${JSON.stringify(scores)}
TRENDS: ${JSON.stringify(trends ?? {})}
ANOMALIES: ${JSON.stringify(anomalies ?? {})}
CALENDAR_INTEL: ${JSON.stringify(calendarIntelligence ?? {})}
SPOTIFY: ${JSON.stringify(spotifyStats ?? {})}
WEATHER: ${weatherSummary ?? "n/a"}

Return 3 concise insights linking correlations and 2 actionable next steps.`;
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
