import OpenAI from "openai";
import { generateDailyMantra } from "../reports/enhanced-report-generator";

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
    explanations?: {
      sleep: string[];
      activity: string[];
      heart: string[];
      work: string[];
    };
  };
  gmailData?: any;
  googleCalendarData?: any;
  fitbitData?: any;
  spotifyData?: any;
  weatherData?: any;
  completedTasks?: string;
  date: string;
  reportType: "daily" | "weekly";
  dayContext?: {
    dayName: string;
    dayType: string;
  };
  previousMood?: string;
  stressRadar?: any;
  recoveryQuotient?: any;
  anomalies?: any;
  environmentalFactors?: any;
  deepInsights?: any;
}

export interface AIInsight {
  insight: string;
  mantra: string;
  moodInsight: string;
  recommendations: string[];
  trends: any;
  patterns: any;
  gptSummary: string; // Add comprehensive GPT summary
}

export interface AIMoodAndEnergyForecast {
  mood: {
    state: string; // e.g., "Balanced", "Energized", "Foggy"
    description: string; // e.g., "You may experience some mental fog today, especially in the afternoon."
    additionalInfo: string; // e.g., "Mixed signals make prediction less certain."
  };
  energyForecast: {
    level: string; // e.g., "moderate to good"
    description: string; // e.g., "Expected productivity: moderate to good. Prioritize key tasks."
  };
}

/**
 * Build comprehensive GPT input exactly like the original code.js
 */
function buildComprehensiveGPTInput(data: AIReportData): string {
  const dayContext = data.dayContext || { dayName: "day", dayType: "weekday" };
  const previousMood = data.previousMood || "balanced";

  let gptInput = `Yesterday's (${dayContext.dayName}) mood: ${previousMood}
Note: Sleep data reflects last night's rest (affecting today's energy)

SCORE BREAKDOWN:
Overall: ${data.scores?.total || 0}/100
Sleep: ${data.scores?.sleep || 0}/100 - ${
    data.scores?.explanations?.sleep?.join("; ") || "No explanations available"
  }
Activity: ${data.scores?.activity || 0}/100 - ${
    data.scores?.explanations?.activity?.join("; ") ||
    "No explanations available"
  }
Heart: ${data.scores?.heart || 0}/100 - ${
    data.scores?.explanations?.heart?.join("; ") || "No explanations available"
  }
Work: ${data.scores?.work || 0}/100 - ${
    data.scores?.explanations?.work?.join("; ") || "No explanations available"
  }

Calendar:
${data.googleCalendarData?.calSummary || "No calendar data available"}

Calendar Intelligence Score: ${
    data.googleCalendarData?.calendarIntelligence?.score || 0
  }/100
${
  data.googleCalendarData?.calendarIntelligence?.insights?.length > 0
    ? `Calendar Issues: ${data.googleCalendarData.calendarIntelligence.insights.join(
        ", "
      )}\n\n`
    : ""
}Emails:
${data.gmailData?.emailSummary || "No email data available"}

${
  data.gmailData?.noisePercentage > 70
    ? `Note: ${data.gmailData.noisePercentage}% of emails were promotional/social noise\n\n`
    : ""
}${data.completedTasks ? `Tasks:\n${data.completedTasks}\n\n` : ""}Spotify:
${data.spotifyData?.spotifySummary || "No Spotify listening data found."}

Activity:
${data.fitbitData?.fitbitActivity || "No activity data available"}

Sleep:
${data.fitbitData?.fitbitSleep || "No sleep data available"}

Heart:
${data.fitbitData?.fitbitHeart || "No heart data available"}

Weather:
${data.weatherData?.weatherSummary || "No weather data available"}

Stress Level:
${data.stressRadar?.level || "Unknown"} (${data.stressRadar?.score || 0}/100)

Recovery:
${data.recoveryQuotient?.readiness || "Unknown"} (${
    data.recoveryQuotient?.score || 0
  }/100)

${
  data.anomalies?.detected?.length > 0
    ? `Biometric Anomalies: ${data.anomalies.detected
        .map((a: any) => `${a.type} - ${a.insight}`)
        .join("; ")}\n\n`
    : ""
}${
    data.environmentalFactors?.weather?.impact !== "neutral"
      ? `Environmental Impact: ${data.environmentalFactors.weather.insight}\n\n`
      : ""
  }${
    data.deepInsights?.patterns?.length > 0
      ? `AI Pattern Detected: ${data.deepInsights.patterns[0].type} - ${data.deepInsights.patterns[0].detail}\n\n`
      : ""
  }`;

  return gptInput;
}

/**
 * Generate AI-powered mood and energy forecast
 * Creates the specific format shown in the screenshot
 */
export async function generateMoodAndEnergyForecast(
  data: AIReportData
): Promise<AIMoodAndEnergyForecast> {
  try {
    console.log("🤖 Generating AI mood and energy forecast...");

    const prompt = `You are Sage, a wise wellness analyst. Based on the user's wellness data, generate a mood assessment and energy forecast in the EXACT format specified below.

USER'S WELLNESS DATA:
- Overall Score: ${data.scores?.total || 0}/100
- Sleep Score: ${data.scores?.sleep || 0}/100
- Activity Score: ${data.scores?.activity || 0}/100
- Heart Score: ${data.scores?.heart || 0}/100
- Work Score: ${data.scores?.work || 0}/100
- Stress Level: ${data.stressRadar?.level || "Unknown"} (${
      data.stressRadar?.score || 0
    }/100)
- Recovery: ${data.recoveryQuotient?.readiness || "Unknown"} (${
      data.recoveryQuotient?.score || 0
    }/100)

SLEEP DATA: ${data.fitbitData?.fitbitSleep || "No sleep data available"}
ACTIVITY DATA: ${
      data.fitbitData?.fitbitActivity || "No activity data available"
    }
HEART DATA: ${data.fitbitData?.fitbitHeart || "No heart data available"}

INSTRUCTIONS:
1. Analyze the wellness scores and data to determine the user's likely mood state
2. Generate an energy forecast based on sleep quality, activity levels, and stress
3. Use the EXACT format below - no variations

REQUIRED FORMAT:
MOOD_STATE: [Single word mood state like "Balanced", "Energized", "Foggy", "Tired", "Focused", "Restless"]
MOOD_DESCRIPTION: [2-3 sentences describing the mood and what to expect, like "You may experience some mental fog today, especially in the afternoon."]
MOOD_ADDITIONAL: [1 sentence with additional context, like "Mixed signals make prediction less certain." or "Clear patterns suggest consistent energy."]
ENERGY_LEVEL: [Energy level description like "moderate to good", "high", "low", "variable"]
ENERGY_DESCRIPTION: [1 sentence describing expected productivity, like "Expected productivity: moderate to good. Prioritize key tasks."]

MOOD STATE OPTIONS (choose the most appropriate):
- "Balanced" - when scores are relatively even and stable
- "Energized" - when activity and heart scores are high
- "Foggy" - when sleep quality is poor or there are mixed signals
- "Tired" - when sleep score is low and recovery is poor
- "Focused" - when work score is high and stress is low
- "Restless" - when there's high activity but poor sleep
- "Calm" - when stress is low and scores are moderate
- "Stressed" - when stress radar shows high levels

ENERGY LEVEL OPTIONS:
- "high" - for scores 80+ with good sleep
- "moderate to good" - for scores 60-79 with decent sleep
- "moderate" - for scores 50-69 with some issues
- "low" - for scores below 50 or poor sleep
- "variable" - when there are mixed signals

Be specific and actionable in your descriptions. Reference the actual data when relevant.`;

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
        max_tokens: 400,
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
      });
    } catch (modelError: any) {
      if (
        modelError.code === "invalid_api_key" ||
        modelError.code === "invalid_request_error"
      ) {
        console.error(
          "❌ OpenAI API key is invalid. Cannot generate mood forecast."
        );
        throw new Error(
          "OpenAI API key is invalid. Please check your API key configuration."
        );
      }

      if (
        modelError.code === "model_not_found" ||
        modelError.code === "insufficient_quota"
      ) {
        console.log(
          "⚠️ GPT-4 unavailable, falling back to gpt-3.5-turbo for mood forecast"
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
            max_tokens: 400,
            presence_penalty: 0.3,
            frequency_penalty: 0.3,
          });
        } catch (fallbackErr: any) {
          if (fallbackErr.code === "insufficient_quota") {
            console.log(
              "⚠️ Quota exceeded for all models. Using fallback mood forecast."
            );
            return generateFallbackMoodAndEnergyForecast(data);
          }
          throw fallbackErr;
        }
      } else {
        throw modelError;
      }
    }

    const response = completion.choices[0]?.message?.content || "";
    return parseMoodAndEnergyResponse(response, data);
  } catch (error) {
    console.error("Error generating mood and energy forecast:", error);
    return generateFallbackMoodAndEnergyForecast(data);
  }
}

/**
 * Generate AI-powered insights for daily reports
 * Mirrors the logic from code.js getGPTInsight function
 */
export async function generateDailyAIInsights(
  data: AIReportData
): Promise<AIInsight> {
  try {
    // Avoid recursion - use direct AI call instead of enhanced report
    console.log("🤖 Generating AI insights directly...");

    // Build comprehensive GPT input exactly like the original code.js
    const gptInput = buildComprehensiveGPTInput(data);

    // Use the same prompt structure as the original code.js
    const prompt = `You are Sage, a wise and insightful fox who serves as a personal wellness analyst. You're knowledgeable, supportive, and focus on integrated analysis rather than criticism. You combine ancient wisdom with modern wellness science, speaking with warmth and genuine care.

SAGE'S PERSONALITY:
• You're an expert analyst who sees patterns others miss
• You provide integrated insights, not just observations
• You're encouraging and constructive, never scolding
• You connect the dots between different metrics
• Balance expertise with warmth and support
• You're that friend who helps you understand yourself better

IMPORTANT CONTEXT - Yesterday's EXACT scores and explanations:
• Overall Score: ${data.scores?.total || 0}/100
• Sleep: ${data.scores?.sleep || 0}/100 (${
      data.scores?.explanations?.sleep?.join("; ") ||
      "No explanations available"
    })
• Activity: ${data.scores?.activity || 0}/100 (${
      data.scores?.explanations?.activity?.join("; ") ||
      "No explanations available"
    })
• Heart: ${data.scores?.heart || 0}/100 (${
      data.scores?.explanations?.heart?.join("; ") ||
      "No explanations available"
    })
• Work: ${data.scores?.work || 0}/100 (${
      data.scores?.explanations?.work?.join("; ") || "No explanations available"
    })

KEY INSIGHTS TO INCORPORATE:
- If 0 meetings: This is POSITIVE - highlight the rare focus opportunity
- If high email noise %: This is about inbox filtering, not work performance
- Reference the EXACT scores above, don't make up numbers
- Explain WHY each score is what it is based on the breakdowns provided
- Match headlines to actual data (don't say 'work intensity stealing sleep' if work score is 100)

Write your response in EXACTLY this format with [PARAGRAPH BREAK] markers:

[Paragraph 1: Metrics overview]
[PARAGRAPH BREAK]
[Paragraph 2: Integrated analysis]
[PARAGRAPH BREAK]
[Paragraph 3: Recommendation]

PARAGRAPH 1 (Metrics Overview - 60-80 words): Present yesterday's scores conversationally but precisely. Start with: 'Your ${
      data.dayContext?.dayName || "day"
    } delivered a [adjective] **${
      data.scores?.total || 0
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

DATA:

${gptInput}`;

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
      trends: data.scores,
      patterns: [],
      gptSummary: response, // Use the full AI response as GPT summary
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
    weatherData,
    completedTasks,
    date,
  } = data;

  // Extract additional data for the enhanced prompt
  const dayContext = (data as any).dayContext || {
    dayType: "weekday",
    dayName: "day",
  };
  const stressRadar = (data as any).stressRadar || { level: "Low", score: 50 };
  const recoveryQuotient = (data as any).recoveryQuotient || {
    readiness: "Good",
    score: 70,
  };
  const anomalies = (data as any).anomalies || { detected: [] };
  const emailStats = (data as any).emailStats || { noisePercentage: 0 };

  // Build the comprehensive GPT input like in code.js
  const gptInput = `Yesterday's (${dayContext.dayName}) mood: ${
    (data as any).previousMood || "Not available"
  }
Note: Sleep data reflects last night's rest (affecting today's energy)

SCORE BREAKDOWN:
Overall: ${scores.total}/100
Sleep: ${scores.sleep}/100 - ${
    (scores as any).explanations?.sleep?.join("; ") ||
    "No explanations available"
  }
Activity: ${scores.activity}/100 - ${
    (scores as any).explanations?.activity?.join("; ") ||
    "No explanations available"
  }
Heart: ${scores.heart}/100 - ${
    (scores as any).explanations?.heart?.join("; ") ||
    "No explanations available"
  }
Work: ${scores.work}/100 - ${
    (scores as any).explanations?.work?.join("; ") ||
    "No explanations available"
  }

Calendar:
${(data as any).calSummary || "No calendar data available"}

Calendar Intelligence Score: ${
    (data as any).calendarIntelligence?.score || 0
  }/100
${
  (data as any).calendarIntelligence?.insights?.length > 0
    ? `Calendar Issues: ${(data as any).calendarIntelligence.insights.join(
        ", "
      )}`
    : ""
}

Emails:
${(data as any).emailSummary || "No email data available"}

${
  emailStats.noisePercentage > 70
    ? `Note: ${emailStats.noisePercentage}% of emails were promotional/social noise`
    : ""
}

${completedTasks ? `Tasks:\n${completedTasks}` : ""}

Spotify:
${(data as any).spotifySummary || "No Spotify data available"}

Activity:
${fitbitData?.activity || "No activity data available"}

Sleep:
${fitbitData?.sleep || "No sleep data available"}

Heart:
${fitbitData?.heart || "No heart data available"}

Weather:
${weatherData || "No weather data available"}

Stress Level:
${(data as any).stressRadar?.formatted || "No stress data available"}

Recovery:
${(data as any).recoveryQuotient?.formatted || "No recovery data available"}

${
  anomalies.detected.length > 0
    ? `Biometric Anomalies: ${anomalies.detected
        .map((a: any) => `${a.type} - ${a.insight}`)
        .join("; ")}`
    : ""
}

${
  (data as any).environmentalFactors?.weather?.impact !== "neutral"
    ? `Environmental Impact: ${
        (data as any).environmentalFactors.weather.insight
      }`
    : ""
}

${
  (data as any).deepInsights?.patterns?.length > 0
    ? `AI Pattern Detected: ${(data as any).deepInsights.patterns[0].type} - ${
        (data as any).deepInsights.patterns[0].detail
      }`
    : ""
}`;

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
• Sleep: ${scores.sleep}/100 (${
    (scores as any).explanations?.sleep?.join("; ") ||
    "No explanations available"
  })
• Activity: ${scores.activity}/100 (${
    (scores as any).explanations?.activity?.join("; ") ||
    "No explanations available"
  })
• Heart: ${scores.heart}/100 (${
    (scores as any).explanations?.heart?.join("; ") ||
    "No explanations available"
  })
• Work: ${scores.work}/100 (${
    (scores as any).explanations?.work?.join("; ") ||
    "No explanations available"
  })
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
    ? "WEEKEND CONTEXT: Lower activity is recovery, not laziness. Zero meetings is perfect. Different rhythm, different goals."
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
  anomalies.detected.length > 0
    ? "Mention the biometric anomaly but don't alarm them. "
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

${gptInput}`;
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
 * Parse AI response for mood and energy forecast
 */
function parseMoodAndEnergyResponse(
  response: string,
  data: AIReportData
): AIMoodAndEnergyForecast {
  try {
    const lines = response.split("\n").filter((line) => line.trim());

    let moodState = "Balanced";
    let moodDescription =
      "Your mood today reflects your overall wellness balance.";
    let moodAdditional = "Clear patterns suggest consistent energy.";
    let energyLevel = "moderate to good";
    let energyDescription =
      "Expected productivity: moderate to good. Prioritize key tasks.";

    for (const line of lines) {
      if (line.startsWith("MOOD_STATE:")) {
        moodState = line.replace("MOOD_STATE:", "").trim();
      } else if (line.startsWith("MOOD_DESCRIPTION:")) {
        moodDescription = line.replace("MOOD_DESCRIPTION:", "").trim();
      } else if (line.startsWith("MOOD_ADDITIONAL:")) {
        moodAdditional = line.replace("MOOD_ADDITIONAL:", "").trim();
      } else if (line.startsWith("ENERGY_LEVEL:")) {
        energyLevel = line.replace("ENERGY_LEVEL:", "").trim();
      } else if (line.startsWith("ENERGY_DESCRIPTION:")) {
        energyDescription = line.replace("ENERGY_DESCRIPTION:", "").trim();
      }
    }

    return {
      mood: {
        state: moodState,
        description: moodDescription,
        additionalInfo: moodAdditional,
      },
      energyForecast: {
        level: energyLevel,
        description: energyDescription,
      },
    };
  } catch (error) {
    console.error("Error parsing mood and energy response:", error);
    return generateFallbackMoodAndEnergyForecast(data);
  }
}

/**
 * Generate fallback mood and energy forecast when AI fails
 */
function generateFallbackMoodAndEnergyForecast(
  data: AIReportData
): AIMoodAndEnergyForecast {
  const total = data.scores?.total || 0;
  const sleep = data.scores?.sleep || 0;
  const activity = data.scores?.activity || 0;
  const stress = data.stressRadar?.score || 50;

  let moodState = "Balanced";
  let moodDescription =
    "Your mood today reflects your overall wellness balance.";
  let moodAdditional = "Clear patterns suggest consistent energy.";
  let energyLevel = "moderate to good";
  let energyDescription =
    "Expected productivity: moderate to good. Prioritize key tasks.";

  // Determine mood based on scores
  if (total >= 80 && sleep >= 80) {
    moodState = "Energized";
    moodDescription =
      "Excellent sleep and high activity levels suggest you're feeling energized and ready for the day.";
    moodAdditional = "Strong recovery patterns indicate sustained energy.";
    energyLevel = "high";
    energyDescription =
      "Expected productivity: high. Take advantage of peak performance.";
  } else if (sleep < 60 || stress > 70) {
    moodState = "Foggy";
    moodDescription =
      "You may experience some mental fog today, especially in the afternoon.";
    moodAdditional = "Mixed signals make prediction less certain.";
    energyLevel = "moderate";
    energyDescription =
      "Expected productivity: moderate. Focus on essential tasks and take breaks.";
  } else if (total < 50) {
    moodState = "Tired";
    moodDescription =
      "Lower energy levels suggest you may feel tired throughout the day.";
    moodAdditional = "Recovery patterns indicate need for rest.";
    energyLevel = "low";
    energyDescription =
      "Expected productivity: low. Prioritize rest and light activities.";
  } else if (activity >= 80 && sleep >= 70) {
    moodState = "Focused";
    moodDescription =
      "Good sleep and high activity suggest you're in a focused, productive state.";
    moodAdditional = "Optimal conditions for deep work.";
    energyLevel = "moderate to good";
    energyDescription =
      "Expected productivity: moderate to good. Schedule important tasks.";
  }

  return {
    mood: {
      state: moodState,
      description: moodDescription,
      additionalInfo: moodAdditional,
    },
    energyForecast: {
      level: energyLevel,
      description: energyDescription,
    },
  };
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
      gptSummary: insight || generateFallbackInsight(data), // Use insight as fallback for GPT summary
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
      gptSummary: insight || generateWeeklyFallbackInsight(data), // Use insight as fallback for GPT summary
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
    gptSummary: generateFallbackInsight(data), // Use insight as fallback for GPT summary
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
    gptSummary: generateWeeklyFallbackInsight(data), // Use insight as fallback for GPT summary
  };
}

function generateFallbackInsight(data: AIReportData): string {
  const { scores, fitbitData, gmailData, spotifyData, weatherData } = data;
  const total = scores.total;

  // Check what data is available
  const hasFitbit =
    fitbitData && (fitbitData.steps > 0 || fitbitData.heartRate);
  const hasGmail = gmailData && gmailData.totalEmails > 0;
  const hasSpotify =
    spotifyData && spotifyData.items && spotifyData.items.length > 0;
  const hasWeather = weatherData && weatherData.current;

  let dataContext = "";
  if (!hasFitbit && !hasGmail && !hasSpotify) {
    dataContext =
      " Since no integrations are connected, this is based on basic scoring. Consider connecting your Fitbit, Gmail, or Spotify for more personalized insights.";
  } else if (!hasFitbit) {
    dataContext =
      " Connect your Fitbit to get detailed activity and sleep insights.";
  } else if (!hasGmail) {
    dataContext = " Connect your Gmail to get work productivity insights.";
  } else if (!hasSpotify) {
    dataContext = " Connect your Spotify to get mood and music insights.";
  }

  if (total >= 90) {
    return `Exceptional day! You're operating at peak performance across all metrics. Keep this momentum going!${dataContext}`;
  } else if (total >= 80) {
    return `Great day! You're maintaining excellent habits and productivity. Minor optimizations could push you to exceptional.${dataContext}`;
  } else if (total >= 70) {
    return `Good day with room for improvement. Focus on your weakest area to boost overall performance.${dataContext}`;
  } else if (total >= 60) {
    return `Moderate day. Consider what's working well and what needs attention to improve tomorrow.${dataContext}`;
  } else {
    return `Challenging day. Tomorrow is a new opportunity to reset and focus on your key priorities.${dataContext}`;
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
  const { fitbitData, spotifyData } = data;
  let insight = "Your mood today reflects your overall wellness balance.";

  // Check if we have actual data or just fallback scores
  const hasRealData = fitbitData || spotifyData;

  if (!hasRealData) {
    insight =
      "Mood analysis requires connected integrations. Connect your Fitbit or Spotify for personalized mood insights based on your sleep, activity, and music patterns.";
    return insight;
  }

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

// ===== CODE.JS getMyMetricLogDaily() FUNCTION ADAPTED FOR NEXT.JS =====

export interface MyMetricLogDailyData {
  // Date information
  dateStr: string;
  fullDateStr: string;
  yesterday: Date;
  twoDaysAgo: Date;

  // Calendar data
  calEvents: any[];
  calendarAnalysis: any;
  calSummary: string;
  calendarIntelligence: any;

  // Email data
  emailStats: {
    received: number;
    sent: number;
    primary: number;
    noise: number;
    noisePercentage: number;
    promotions: number;
    social: number;
    totalReceived: number;
  };
  emailSummary: string;
  emailResponseAnalysis: any;

  // Tasks
  completedTasks: string;

  // Spotify data
  spotifyData: any;
  spotifySummary: string;
  audioFeatures: any;

  // Fitbit data
  fitbitActivity: string;
  fitbitActivityLog: any;
  fitbitSleep: string;
  fitbitHeart: string;
  fitbitHRV: string;
  peakHR: number | string;

  // Weather data
  weatherSummary: string;
  hourlyWeather: any;

  // Mood and context
  previousMood: string;
  moodInsight: string;
  dayContext: any;

  // Scores and analysis
  scores: any;
  stressRadar: any;
  recoveryQuotient: any;
  environmentalFactors: any;

  // Trends and anomalies
  trends: any;
  historicalData: any[];
  anomalies: any;
  deepInsights: any;

  // Badges
  badges: any[];
  streakBadges: any[];
  badgeNarrative: string;
  nearMisses: any[];

  // AI insights
  insight: string;
  mantra: string;

  // All data object
  allData: any;
}

export async function getMyMetricLogDaily(): Promise<MyMetricLogDailyData> {
  console.log("🧠 [MyMetricLog] Starting daily summary...");

  // Clean up old mood properties (if needed)
  // cleanupOldMoodProperties();

  const now = new Date();

  // IMPORTANT: Adjust all date ranges to be for yesterday
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const dateStr = yesterday.toISOString().split("T")[0]; // yyyy-MM-dd format
  const fullDateStr = yesterday.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calendar Summary - for yesterday
  // Note: This would need to be implemented with Google Calendar API
  const calEvents: any[] = []; // Placeholder - implement with Google Calendar API
  const calendarAnalysis = {}; // Placeholder - implement getAdvancedCalendarAnalysis
  const calSummary = ""; // Placeholder - implement formatCalendarAnalysis

  // NEW: Calendar Intelligence
  const calendarIntelligence = {}; // Placeholder - implement analyzeCalendarIntelligence

  // Email Summary - for yesterday with category breakdown
  // Note: This would need to be implemented with Gmail API
  const emailStats = {
    received: 0,
    sent: 0,
    primary: 0,
    noise: 0,
    noisePercentage: 0,
    promotions: 0,
    social: 0,
    totalReceived: 0,
  };
  const emailSummary = ""; // Placeholder - implement Gmail API integration
  const emailResponseAnalysis = {}; // Placeholder - implement analyzeEmailResponseTimes

  // Tasks - completed yesterday
  const completedTasks = ""; // Placeholder - implement getCompletedTasksForDate

  // Spotify - yesterday's listening
  const spotifyData = {}; // Placeholder - implement getSpotifyHistoryForYesterday
  const spotifySummary = "No Spotify listening data found."; // Placeholder
  const audioFeatures = null; // Placeholder - implement getSpotifyAudioFeatures

  // Fitbit - yesterday's data
  const fitbitActivity = ""; // Placeholder - implement getFitbitActivitySummaryForDate
  const fitbitActivityLog = {}; // Placeholder - implement getFitbitActivityLogForDate
  const fitbitSleep = ""; // Placeholder - implement getFitbitSleepSummaryForDate
  const fitbitHeart = ""; // Placeholder - implement getFitbitHeartSummaryForDate
  const fitbitHRV = ""; // Placeholder - implement getFitbitHRVForDate
  const peakHR = "N/A"; // Placeholder

  // Weather - yesterday's weather
  const weatherSummary = ""; // Placeholder - implement getWeatherSummary
  const hourlyWeather = {}; // Placeholder - implement getHourlyWeatherForecast

  // Mood from day before yesterday
  const previousMood = ""; // Placeholder - implement getMoodFromDayBefore
  const moodInsight = ""; // Placeholder - implement getPredictedMood

  // Get day context for yesterday
  const dayContext: any = {}; // Placeholder - implement getContextualDayAnalysis

  // Create allData object with all the data needed for weekend detection
  const allData = {
    fitbitHRV: fitbitHRV,
    dayContext: dayContext,
    calendarAnalysis: calendarAnalysis,
    emailStats: emailStats,
    emailResponseAnalysis: emailResponseAnalysis,
  };

  // Get scores using weighted system
  const scores = {}; // Placeholder - implement getMyMetricLogScoreBreakdown

  // ADD: Store calendar events in dayContext for later use
  dayContext.calendarData = calEvents;

  // Stress Detection
  const stressRadar = {}; // Placeholder - implement getStressRadar

  // Recovery Score
  const recoveryQuotient = {}; // Placeholder - implement getRecoveryQuotient

  // NEW: Environmental Factors
  const environmentalFactors = {}; // Placeholder - implement getSocialEnvironmentalFactors

  // NEW: Get historical data for anomaly detection
  const trends = {}; // Placeholder - implement getScoreTrends
  const historicalData: any[] = [];

  // NEW: Biometric Anomaly Detection
  const anomalies = { detected: [] }; // Placeholder - implement detectBiometricAnomalies

  // NEW: Deep AI Insights
  const deepInsights = { patterns: [] }; // Placeholder - implement generateDeepAIInsights

  // Calculate badges
  const badges: any[] = []; // Placeholder - implement calculateDailyBadges
  const streakBadges: any[] = []; // Placeholder - implement calculateStreakBadges

  // Check for combo badges
  const comboBadges: any[] = []; // Placeholder - implement checkComboBadges
  badges.push(...comboBadges);

  // Re-sort after adding combos
  const rarityOrder = ["legendary", "epic", "rare", "uncommon", "common"];
  badges.sort(
    (a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
  );

  // Check for personal records
  const recordBadges: any[] = []; // Placeholder - implement checkPersonalRecords
  badges.push(...recordBadges);

  // Check for milestones
  const milestoneBadges: any[] = []; // Placeholder - implement checkMilestoneBadges
  badges.push(...milestoneBadges);

  // Re-sort all badges
  badges.sort(
    (a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
  );

  // Generate narrative
  const badgeNarrative = ""; // Placeholder - implement generateBadgeNarrative

  // Get near misses
  const nearMisses: any[] = []; // Placeholder - implement getNearMissBadges

  // Generate AI insights using existing function
  const aiInsights = await generateDailyAIInsights({
    scores: scores as any,
    gmailData: emailStats,
    googleCalendarData: calEvents,
    fitbitData: {
      activity: fitbitActivity,
      sleep: fitbitSleep,
      heart: fitbitHeart,
    },
    spotifyData: spotifyData,
    weatherData: weatherSummary,
    completedTasks: completedTasks,
    date: dateStr,
    reportType: "daily",
  });

  const insight = aiInsights.insight;
  const mantra = aiInsights.mantra;

  // Return all data
  return {
    dateStr,
    fullDateStr,
    yesterday,
    twoDaysAgo,
    calEvents,
    calendarAnalysis,
    calSummary,
    calendarIntelligence,
    emailStats,
    emailSummary,
    emailResponseAnalysis,
    completedTasks,
    spotifyData,
    spotifySummary,
    audioFeatures,
    fitbitActivity,
    fitbitActivityLog,
    fitbitSleep,
    fitbitHeart,
    fitbitHRV,
    peakHR,
    weatherSummary,
    hourlyWeather,
    previousMood,
    moodInsight,
    dayContext,
    scores,
    stressRadar,
    recoveryQuotient,
    environmentalFactors,
    trends,
    historicalData,
    anomalies,
    deepInsights,
    badges,
    streakBadges,
    badgeNarrative,
    nearMisses,
    insight,
    mantra,
    allData,
  };
}
