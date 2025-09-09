import { calculateWellnessScores } from "../scoring/advanced-wellness-scoring";
import {
  calculateDailyBadges,
  checkComboBadges,
  getNearMissBadges,
} from "../badges/advanced-badge-system";
import {
  analyzeEmailCategories,
  generateEmailManagementInsight,
  generateEmailSummary,
} from "../email/advanced-email-analysis";
import {
  analyzeCalendarIntelligence,
  analyzeCalendarEvents,
  formatCalendarAnalysis,
} from "../calendar/calendar-intelligence";
import {
  getSocialEnvironmentalFactors,
  generateEnvironmentalInsights,
} from "../environmental/environmental-factors";
import {
  getStressRadar,
  formatStressRadar,
  generateStressRecommendations,
} from "../stress/stress-radar";
import {
  getRecoveryQuotient,
  formatRecoveryQuotient,
} from "../recovery/recovery-quotient";

export interface EnhancedReportData {
  // Raw data from integrations
  fitbitSleep: string;
  fitbitActivity: string;
  fitbitHeart: string;
  fitbitHRV?: { value: number };
  gmailData: any;
  calendarData: any;
  spotifyData: any;
  weatherData: any;
  completedTasks: string;

  // Processed data
  scores: any;
  badges: any[];
  stressRadar: any;
  recoveryQuotient: any;
  environmentalFactors: any;
  calendarIntelligence: any;
  emailStats: any;
  emailInsights: string;
  calendarSummary: string;
  environmentalInsights: string;

  // Context
  date: Date;
  dayContext: {
    dayType: "weekend" | "weekday";
    dayName: string;
  };
}

/**
 * Generate enhanced daily report - EXACT implementation from code.js
 */
export async function generateEnhancedDailyReport(
  fitbitSleep: string,
  fitbitActivity: string,
  fitbitHeart: string,
  fitbitHRV: any,
  gmailData: any,
  calendarData: any,
  spotifyData: any,
  weatherData: any,
  completedTasks: string,
  date: Date = new Date()
): Promise<EnhancedReportData> {
  // Create day context
  const dayOfWeek = date.getDay();
  const dayContext = {
    dayType:
      dayOfWeek === 0 || dayOfWeek === 6
        ? "weekend"
        : ("weekday" as "weekend" | "weekday"),
    dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
  };

  // Analyze email categories and stats
  const emailCategories = analyzeEmailCategories(gmailData.emails || []);
  const emailStats = {
    received: gmailData.totalEmails || 0,
    sent: gmailData.sentEmails || 0,
    primary: emailCategories.primary,
    noise:
      emailCategories.social +
      emailCategories.promotions +
      emailCategories.updates +
      emailCategories.forums,
    noisePercentage: calculateEmailNoise(emailCategories),
    promotions: emailCategories.promotions,
    social: emailCategories.social,
    updates: emailCategories.updates,
    forums: emailCategories.forums,
    totalReceived: gmailData.totalEmails || 0,
  };

  // Generate email insights
  const emailInsights = generateEmailManagementInsight(emailStats);
  const emailSummary = generateEmailSummary(emailStats);

  // Analyze calendar intelligence
  const calendarIntelligence = analyzeCalendarIntelligence(
    calendarData.events || []
  );
  const calendarAnalysis = analyzeCalendarEvents(calendarData.events || []);
  const calendarSummary = formatCalendarAnalysis(calendarAnalysis);

  // Analyze environmental factors
  const environmentalFactors = getSocialEnvironmentalFactors(
    date,
    weatherData,
    calendarIntelligence
  );
  const environmentalInsights =
    generateEnvironmentalInsights(environmentalFactors);

  // Calculate wellness scores using the advanced system
  const scores = calculateWellnessScores(
    fitbitSleep,
    fitbitHeart,
    fitbitActivity,
    emailStats,
    calendarSummary,
    completedTasks,
    dayContext,
    {
      fitbitHRV,
      dayContext,
      calendarAnalysis: calendarIntelligence,
      emailStats,
    }
  );

  // Calculate stress radar
  const stressRadar = getStressRadar(
    { sleep: fitbitSleep, heart: fitbitHeart },
    calendarIntelligence,
    emailStats,
    spotifyData
  );

  // Calculate recovery quotient
  const recoveryQuotient = getRecoveryQuotient(
    fitbitSleep,
    fitbitHeart,
    fitbitActivity,
    null // previousDayData
  );

  // Calculate badges
  const dailyBadges = calculateDailyBadges(
    scores,
    { sleep: fitbitSleep, activity: fitbitActivity, heart: fitbitHeart },
    emailStats,
    stressRadar,
    recoveryQuotient,
    calendarIntelligence
  );

  // Check for combo badges
  const comboBadges = checkComboBadges(dailyBadges, dayContext, scores);
  const allBadges = [...dailyBadges, ...comboBadges];

  // Get near miss badges
  const nearMisses = getNearMissBadges(
    scores,
    { activity: fitbitActivity, sleep: fitbitSleep, heart: fitbitHeart },
    emailStats
  );

  return {
    // Raw data
    fitbitSleep,
    fitbitActivity,
    fitbitHeart,
    fitbitHRV,
    gmailData,
    calendarData,
    spotifyData,
    weatherData,
    completedTasks,

    // Processed data
    scores,
    badges: allBadges,
    stressRadar,
    recoveryQuotient,
    environmentalFactors,
    calendarIntelligence,
    emailStats,
    emailInsights,
    calendarSummary,
    environmentalInsights,

    // Context
    date,
    dayContext,
  };
}

/**
 * Generate GPT insight prompt - EXACT implementation from code.js
 */
export function generateGPTInsightPrompt(
  reportData: EnhancedReportData
): string {
  const {
    scores,
    stressRadar,
    recoveryQuotient,
    dayContext,
    emailStats,
    calendarIntelligence,
  } = reportData;

  return `You are Sage, a wise and insightful fox who serves as a personal wellness analyst. You're knowledgeable, supportive, and focus on integrated analysis rather than criticism. You combine ancient wisdom with modern wellness science, speaking with warmth and genuine care.

SAGE'S PERSONALITY:
• You're an expert analyst who sees patterns others miss
• You provide integrated insights, not just observations
• You're encouraging and constructive, never scolding
• You connect the dots between different metrics
• Balance expertise with warmth and support
• You're that friend who helps you understand yourself better

IMPORTANT CONTEXT - Yesterday's EXACT scores and explanations:
• Overall Score: ${scores.total}/100
• Sleep: ${scores.sleep}/100 (${scores.explanations.sleep.join("; ")})
• Activity: ${scores.activity}/100 (${scores.explanations.activity.join("; ")})
• Heart: ${scores.heart}/100 (${scores.explanations.heart.join("; ")})
• Work: ${scores.work}/100 (${scores.explanations.work.join("; ")})
• Stress: ${stressRadar.level} (${stressRadar.score}/100)
• Recovery: ${recoveryQuotient.readiness} (${recoveryQuotient.score}/100)

KEY INSIGHTS TO INCORPORATE:
- If 0 meetings: This is POSITIVE - highlight the rare focus opportunity
- If high email noise %: This is about inbox filtering, not work performance
- Reference the EXACT scores above, don't make up numbers
- Explain WHY each score is what it is based on the breakdowns provided
- Match headlines to actual data (don't say 'work intensity stealing sleep' if work score is 100)

Yesterday was a ${dayContext.dayType} (${dayContext.dayName}).

Write your response in EXACTLY this format with [PARAGRAPH BREAK] markers:

[Paragraph 1: Metrics overview]
[PARAGRAPH BREAK]
[Paragraph 2: Integrated analysis]
[PARAGRAPH BREAK]
[Paragraph 3: Recommendation]

PARAGRAPH 1 (Metrics Overview - 60-80 words): Present yesterday's scores conversationally but precisely. Start with: 'Your ${
    dayContext.dayName
  } delivered a [adjective] **${
    scores.total
  }/100**.' Then cover each subscore with its main driver. Example: 'Sleep hit **85/100** with **7h 42m** of quality rest, though efficiency at **65%** suggests some restlessness. Activity reached **90/100** powered by **12,415 steps** and **60+ active minutes**.' Include all 4 subscores. Be factual here - save analysis for paragraph 2.

PARAGRAPH 2 (Integrated Analysis - 60-80 words): NOW connect the dots. Show how metrics influenced each other. Examples: 'That stellar activity score despite poor sleep efficiency? Classic compensation pattern - your body pushed through fatigue with movement.' or 'With **0 meetings** and perfect work score, you capitalized on rare deep focus time.' Include:
• How sleep affected other metrics
• Email/meeting patterns and their impact
• Any notable patterns or mismatches
• Recovery vs activity balance

PARAGRAPH 3 (Today's Action - 40-60 words): ONE specific recommendation targeting the biggest opportunity. Format: '**[Action] at [time]** - [why it matters].' Example: '**Set bedroom to 65°F at 9:30 PM tonight** - your **49% sleep efficiency** screams environmental issues. Cool, dark, quiet wins every time.' End with brief encouragement.

CRITICAL STYLE RULES:
• NO EXTENDED METAPHORS - Max 2-3 light comparisons total
• NO THEMED RESPONSES (no symphony, recipe, journey, etc. throughout)
• Be conversational but not cutesy
• Use specific numbers, not vague descriptions
• If you mention 'Chef's kiss' or similar, use it ONCE max

ADDITIONAL GUIDELINES:
• If task data is unavailable or shows no tasks, DO NOT penalize or mention as negative
• When work score includes 'Task tracking not configured = 25/25 points', don't treat as an issue
• For sedentary time, be real but not harsh: 'typical for desk warriors' not 'terrible inactivity'
• Weekend context: lower activity/work is GOOD, not concerning

FORMATTING RULES:
• YOU MUST include [PARAGRAPH BREAK] between each paragraph
• Use **bold** for ALL numbers and key actions
• No greetings or headers - jump right in
• Always use 'you/your' - you're talking TO them
• Keep it 180-220 words total (NOT 250)

TONE GUIDELINES:
• Sound like their smartest, most caring friend
• Add personality through word choice, not gimmicks
• If something's off, say it kindly but directly
• Make insights clear first, clever second
• End with motivation, not just instructions

${
  dayContext.dayType === "weekend"
    ? "WEEKEND CONTEXT: Lower activity is recovery, not laziness. Zero meetings is perfect. Different rhythm, different goals.\n"
    : ""
}
${
  stressRadar.level === "High"
    ? "Address the high stress levels with compassion. "
    : ""
}
${
  recoveryQuotient.score < 60
    ? "Emphasize recovery - they need rest, not pushing. "
    : ""
}
${
  emailStats.noisePercentage > 70
    ? `The ${emailStats.noisePercentage}% email noise is inbox pollution, not their fault. `
    : ""
}

FINAL REMINDERS:
• Paragraph 1: State facts with personality
• Paragraph 2: Reveal insights they might miss
• Paragraph 3: Give one clear action
• Avoid metaphor themes - be direct and warm

DATA:

Yesterday's (${dayContext.dayName}) mood: [Previous mood would go here]
Note: Sleep data reflects last night's rest (affecting today's energy)

SCORE BREAKDOWN:
Overall: ${scores.total}/100
Sleep: ${scores.sleep}/100 - ${scores.explanations.sleep.join("; ")}
Activity: ${scores.activity}/100 - ${scores.explanations.activity.join("; ")}
Heart: ${scores.heart}/100 - ${scores.explanations.heart.join("; ")}
Work: ${scores.work}/100 - ${scores.explanations.work.join("; ")}

Calendar:
${reportData.calendarSummary}

Calendar Intelligence Score: ${calendarIntelligence.score}/100
${
  calendarIntelligence.insights.length > 0
    ? `Calendar Issues: ${calendarIntelligence.insights.join(", ")}\n\n`
    : ""
}
Emails:
${reportData.emailInsights}

${
  emailStats.noisePercentage > 70
    ? `Note: ${emailStats.noisePercentage}% of emails were promotional/social noise\n\n`
    : ""
}
${reportData.completedTasks ? `Tasks:\n${reportData.completedTasks}\n\n` : ""}
Spotify:
${reportData.spotifyData.summary || "No Spotify data available"}

Audio Analysis:
- Mood: ${reportData.spotifyData.audioInsights?.overallMood || "Unknown"}
- Energy Profile: ${
    reportData.spotifyData.audioInsights?.energyProfile || "Unknown"
  }
- Focus Score: ${reportData.spotifyData.advancedFeatures?.focusScore || 0}/100
- Relaxation Score: ${
    reportData.spotifyData.advancedFeatures?.relaxationScore || 0
  }/100
- Motivation Score: ${
    reportData.spotifyData.advancedFeatures?.motivationScore || 0
  }/100
- Creativity Score: ${
    reportData.spotifyData.advancedFeatures?.creativityScore || 0
  }/100

${
  reportData.spotifyData.audioInsights?.stressIndicators?.length > 0
    ? `Stress Indicators: ${reportData.spotifyData.audioInsights.stressIndicators.join(
        ", "
      )}\n`
    : ""
}
${
  reportData.spotifyData.audioInsights?.recommendations?.length > 0
    ? `Recommendations: ${reportData.spotifyData.audioInsights.recommendations.join(
        ", "
      )}\n`
    : ""
}

Activity:
${reportData.fitbitActivity}

Sleep:
${reportData.fitbitSleep}

Heart:
${reportData.fitbitHeart}

Weather:
${reportData.weatherData.summary || "No weather data available"}

Stress Level:
${formatStressRadar(stressRadar)}

Recovery:
${formatRecoveryQuotient(recoveryQuotient)}`;
}

/**
 * Generate daily mantra - EXACT implementation from code.js
 */
export function generateDailyMantra(insightText: string): string {
  const mantras = [
    "Progress, not perfection.",
    "Every step counts.",
    "You're stronger than you think.",
    "Today is a new opportunity.",
    "Small steps, big changes.",
    "You've got this.",
    "Focus on what you can control.",
    "Every day is a chance to improve.",
    "You're doing better than you think.",
    "Keep moving forward.",
  ];

  // Simple hash-based selection for consistency
  const hash = insightText.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return mantras[Math.abs(hash) % mantras.length];
}

/**
 * Calculate email noise percentage
 */
function calculateEmailNoise(categories: any): number {
  const noise =
    categories.social +
    categories.promotions +
    categories.updates +
    categories.forums;
  const total = categories.primary + noise;

  return total > 0 ? Math.round((noise / total) * 100) : 0;
}
