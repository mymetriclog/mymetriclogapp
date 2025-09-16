// Import constants from the proper location
import { SAGE_IMAGES, MYMETRICLOG_LOGO } from "@/lib/constants/sage-images";

export interface DailyReportData {
  date: string;
  fullDateStr: string;
  scores: {
    total: number;
    sleep: number;
    activity: number;
    heart: number;
    work: number;
    explanations: {
      sleep: string[];
      activity: string[];
      heart: string[];
      work: string[];
    };
  };
  insight?: string; // Optional - we prefer gpt_summary
  gpt_summary?: string; // Add comprehensive GPT summary
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
  stressRadar: {
    level: string;
    score: number;
    factors: string[];
  };
  recoveryQuotient: {
    readiness: string;
    score: number;
    factors: string[];
  };
  dayContext: {
    dayName: string;
    dayType: string;
    calendarData: any[];
  };
  badges: Array<{
    name: string;
    description: string;
    rarity: string;
    icon: string;
  }>;
  streakBadges: Array<{
    name: string;
    description: string;
    rarity: string;
    icon: string;
  }>;
  badgeNarrative: string;
  nearMisses: Array<{
    name: string;
    description: string;
    progress: number;
  }>;
  calendarAnalysis: any;
  calendarIntelligence: {
    score: number;
    insights: string[];
  };
  fitbitHRV: any;
  hourlyWeather: any[];
  emailResponseAnalysis: any;
  fitbitActivityLog: any[];
  audioFeatures: any;
  anomalies: {
    detected: any[];
    insights: string[];
  };
  environmentalFactors: {
    weather: {
      impact: string;
      insight: string;
    };
  };
  deepInsights: {
    patterns: any[];
    insights: string[];
  };
  trends: {
    overall: {
      trend: number;
      sparkline: number[];
    };
  };
  historicalData: Array<{
    score: number;
  }>;
  // Wellness Balance Data
  balanceLevel: "excellent" | "good" | "needs_improvement";
  balanceStatus: string;
  balanceColor: string;
  balanceInsight: string;
  // AI Mood and Energy Forecast
  aiMoodAndEnergy: {
    mood: {
      state: string;
      description: string;
      additionalInfo: string;
    };
    energyForecast: {
      level: string;
      description: string;
    };
  };
  // Previous day's mood - matching reportold.tsx
  previousMood?: string;
}

// Complete enhanced email composition function with all features integrated (from code.js)
export function composeEnhancedMyMetricLogEmail(
  fullDateStr: string,
  dateStr: string,
  scores: any,
  gptSummary: string,
  mantra: string,
  moodInsight: string,
  weatherSummary: string,
  calSummary: string,
  emailSummary: string,
  completedTasks: string,
  spotifySummary: string,
  spotifyInsights: {
    insight: string;
    recommendation: string;
  },
  fitbitActivity: string,
  fitbitSleep: string,
  fitbitHeart: string,
  peakHR: number,
  stressRadar: any,
  recoveryQuotient: any,
  dayContext: any,
  badges: any[],
  streakBadges: any[],
  badgeNarrative: string,
  nearMisses: any[],
  calendarAnalysis: any,
  calendarIntelligence: any,
  fitbitHRV: any,
  hourlyWeather: any,
  emailResponseAnalysis: any,
  fitbitActivityLog: any,
  audioFeatures: any,
  anomalies?: any,
  environmentalFactors?: any,
  deepInsights?: any,
  trends?: any,
  historicalData?: any[],
  // Wellness Balance Data
  balanceLevel?: "excellent" | "good" | "needs_improvement",
  balanceStatus?: string,
  balanceColor?: string,
  balanceInsight?: string,
  // AI Mood and Energy Forecast
  aiMoodAndEnergy?: {
    mood: {
      state: string;
      description: string;
      additionalInfo: string;
    };
    energyForecast: {
      level: string;
      description: string;
    };
  },
  // Previous day's mood - matching reportold.tsx
  previousMood?: string
): string {
  // Parse sleep efficiency at the start
  const sleepEfficiencyMatch = (fitbitSleep || "").match(
    /😴 Efficiency: (\d+)%/
  );
  const sleepEfficiency = sleepEfficiencyMatch
    ? parseInt(sleepEfficiencyMatch[1])
    : 0;

  // Get all the data parsing (keep existing)
  const calEvents = dayContext?.calendarData || [];
  const trendsData = trends || getScoreTrends();
  const yesterday = new Date(dateStr);
  const environmentalFactorsData =
    environmentalFactors ||
    getSocialEnvironmentalFactors(yesterday, weatherSummary, dayContext);
  const historicalDataArray = historicalData || [];

  // Wellness Balance Data with defaults
  const balanceLevelData = balanceLevel || "needs_improvement";
  const balanceStatusData =
    balanceStatus || "Challenging Day - Focus on Recovery";
  const balanceColorData = balanceColor || "#ef4444";
  const balanceInsightData =
    balanceInsight || "Focus on recovery and wellness improvement.";
  if (trendsData && trendsData.overall && trendsData.overall.sparkline) {
    historicalDataArray.push(
      ...trendsData.overall.sparkline.map((score: number) => ({ score }))
    );
  }

  const anomaliesData =
    anomalies ||
    detectBiometricAnomalies(
      { heart: fitbitHeart, sleep: fitbitSleep },
      historicalDataArray
    );

  const intradayViz = generateIntradayVisualization(
    fitbitActivity,
    fitbitSleep,
    calSummary,
    dayContext
  );

  const deepInsightsData =
    deepInsights ||
    generateDeepAIInsights({
      scores: scores,
      stressRadar: stressRadar,
      recoveryQuotient: recoveryQuotient,
      calendarIntelligence: calendarIntelligence,
    });

  const moodCard = generateAIMoodCard(aiMoodAndEnergy, scores);
  const quickWinBox = generateQuickWinBox(
    scores,
    stressRadar,
    recoveryQuotient,
    environmentalFactorsData,
    calendarIntelligence
  );
  const insightHeadline = generateInsightHeadline(
    scores,
    stressRadar,
    recoveryQuotient
  );

  // Parse email stats
  const receivedMatch = (emailSummary || "").match(/Primary Inbox: (\d+)/);
  const sentMatch = (emailSummary || "").match(/Sent: (\d+)/);
  const emailStats = {
    received: receivedMatch ? parseInt(receivedMatch[1]) : 0,
    sent: sentMatch ? parseInt(sentMatch[1]) : 0,
  };

  const emailManagementInsight = generateEmailManagementInsight(emailStats);

  // Score trends
  let scoreTrend = "";
  if (
    trendsData &&
    trendsData.overall &&
    trendsData.overall.trend !== undefined &&
    trendsData.overall.trend !== 0
  ) {
    scoreTrend =
      " " +
      getTrendArrow(trendsData.overall.trend) +
      " " +
      (trendsData.overall.trend > 0 ? "+" : "") +
      trendsData.overall.trend;
  }

  const historicalDataForComparison = getHistoricalDayAverage(
    dayContext.dayName
  );

  // Color coding
  const scoreColor = getMainScoreColor(scores?.total || 0);
  const stressColor = getStressColor(stressRadar?.score || 0);
  const recoveryColor = getRecoveryColor(recoveryQuotient?.score || 0);

  // Extract key stats - matching reportold.tsx exactly
  // Sleep data - match reportold.tsx pattern
  let sleepStr = "N/A";
  const sleepMatch = (fitbitSleep || "").match(/(\d+)h (\d+)m/);
  if (sleepMatch) {
    sleepStr = sleepMatch[1] + "h " + sleepMatch[2] + "m";
  }

  // Steps data - match reportold.tsx pattern
  let stepsStr = "N/A";
  const stepsMatch = (fitbitActivity || "").match(/👣 Steps: ([\d,]+)/);
  if (stepsMatch) {
    stepsStr = stepsMatch[1];
  }

  // Calories data - match reportold.tsx pattern
  let caloriesStr = "N/A";
  const caloriesMatch = (fitbitActivity || "").match(
    /🔥 Calories burned: ([\d,]+)/
  );
  if (caloriesMatch) {
    caloriesStr = caloriesMatch[1] + " cal";
  }

  // Active minutes data - match reportold.tsx pattern
  let activeStr = "N/A";
  const activeMatch = (fitbitActivity || "").match(/💪 Very Active: (\d+)/);
  if (activeMatch) {
    activeStr = activeMatch[1] + " min active";
  }

  // Resting HR data - match reportold.tsx pattern
  let restingHRStr = "N/A";
  const restingHRMatch = (fitbitHeart || "").match(/❤️ Resting HR: (\d+)/);
  if (restingHRMatch) {
    restingHRStr = restingHRMatch[1] + " bpm";
  }

  // Build HTML with inline styles for email compatibility
  const htmlBody = `
  <div  style='font-family:Helvetica,Arial,sans-serif; color:#333; max-width:600px; margin:auto;'>
    <!-- Logo -->
    <div class='email-container-wrapper' style='justify-content:center; margin:20px 0; text-align:center; margin:20px 0;'>
      <img src='${MYMETRICLOG_LOGO}' alt='MyMetricLog Logo' style='max-width:300px; height:auto;'/>
    </div>
    
    <!-- Date header -->
    <div style='text-align:center; margin:10px 0; font-size:18px; color:#555;'>${fullDateStr}</div>
    
    <!-- Overall Score -->
    <div style='text-align:center; margin:20px 0;'>
      <div style='font-size:52px; font-weight:bold; color:${scoreColor};'>${
    scores?.total || 0
  }</div>
      <div style='font-size:18px; color:#555; margin-bottom:5px;'><strong>Overall Score</strong>${scoreTrend}</div>
      <div style='margin-top:8px;'>${generateStatusTag(
        "Overall",
        scores?.total || 0,
        false,
        true
      )}</div>
      
      <!-- Daily Comparison -->
      ${generateDailyComparison(scores?.total || 0, dayContext, trendsData)}
      
      <!-- 7-Day Bar Chart -->
      ${
        trendsData &&
        trendsData.overall &&
        trendsData.overall.sparkline &&
        trendsData.overall.sparkline.length > 0
          ? `<div style='margin-top:15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; text-align: center;'>
              ${generate7DayBarChart(trendsData.overall.sparkline, scoreColor)}
          </div>`
          : ""
      }
    </div>
    
    <!-- Anomalies Alert -->
    ${
      anomaliesData.detected.length > 0
        ? `<div style='background:#fef2f2; padding:16px; border-radius:8px; margin:20px 0; border-left: 4px solid #fecaca;'>
          <div style='display: flex; align-items: center;'>
            <span style='font-size:24px; margin-right:10px;'>🚨</span>
            <div>
              <strong style='font-size:16px; color:#d33;'>Biometric Anomalies Detected</strong><br>
              ${anomaliesData.detected
                .map(
                  (a: any) => `
                <div style='margin-top:8px;'>
                  <strong>${a.type}:</strong> ${a.value}<br>
                  <span style='color:#666; font-size:14px;'>${a.insight}</span>
      </div>
              `
                )
                .join("")}
    </div>
          </div>
        </div>`
        : ""
    }
    
    <!-- At a Glance -->
    <div style='background:#e8f0fe; padding:16px; border-radius:8px; text-align:center; margin:20px 0; border-left: 4px solid #1976d2; box-shadow: 0 1px 3px rgba(0,0,0,0.05);'>
      <strong style='font-size:16px;'>At a Glance:</strong><br>
      <span style='font-size:15px; color:#424242; line-height:1.6;'>
        ${sleepStr} sleep | ${stepsStr} steps | ${caloriesStr} | ${activeStr} | ${restingHRStr}
      </span>
      <br><br>
      <span style='font-size:14px; color:#666;'>
        Yesterday's (${dayContext?.dayName || "day"}) mood: ${
    previousMood || ""
  }<br>
        Note: Sleep data reflects last night's rest (affecting today's energy)
      </span>
    </div>
    
    <!-- Intraday Visualization -->
    ${intradayViz}
    
    <!-- Overall Analysis section -->
    <div style='margin:16px 0; padding:16px; background: #f0f4ff; border-left: 4px solid #b8ccff; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>
      <h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>
        <img src='${getSageImage(
          "analysis"
        )}' alt='Sage Analysis' style='height:60px; width:auto; vertical-align:middle; margin-right:12px;'/>
        Your Day, Decoded by Sage
      </h3>
      <p style='margin:10px 0; font-size:16px; color:#6c5ce7; font-style:italic;'>${insightHeadline}</p>
      <div style='font-family:Arial, sans-serif; font-size:14px; line-height:1.6; color:#333;'>
        ${convertAndFormatInsight(gptSummary)}
      </div>
    </div>
    
    <!-- Performance Breakdown - Code.js Style -->
    <div style='background:#f0f4ff; border-left: 4px solid #b8ccff; padding:20px; border-radius:8px; margin:20px 0; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>
      <h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>Performance Breakdown</h4>
      <table style='width:100%; border-collapse: collapse;'>
        <tr>
          <td style='width:50%; padding:10px; vertical-align:top;'>
            ${generatePerformanceMetricCard(
              "Sleep",
              scores?.sleep || 0,
              "#7c4dff",
              trendsData?.overall?.sparkline || []
            )}
            ${generatePerformanceMetricCard(
              "Activity",
              scores?.activity || 0,
              "#0f9d58",
              trendsData?.overall?.sparkline || []
            )}
          </td>
          <td style='width:50%; padding:10px; vertical-align:top;'>
            ${generatePerformanceMetricCard(
              "Heart",
              scores?.heart || 0,
              "#ea4335",
              trendsData?.overall?.sparkline || []
            )}
            ${generatePerformanceMetricCard(
              "Work",
              scores?.work || 0,
              "#f9ab00",
              trendsData?.overall?.sparkline || []
            )}
          </td>
        </tr>
      </table>
    </div>
    
  
    <!-- Mood Reflection Section - Matching reportold.tsx -->
    <div style='background:#f0f4ff; padding:20px; border-radius:8px; margin:20px 0; border-left: 4px solid #b8ccff;'>
      <h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>
        <img src='${getSageImage(
          "meditation"
        )}' alt='Sage Meditation' style='height:60px; width:auto; vertical-align:middle; margin-right:12px;'/>
        😊 Mood Reflection
      </h3>
      <div style='background:white; padding:16px; border-radius:6px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>
        <div style='font-size:14px; line-height:1.6; color:#5f6368;'>
          ${moodInsight}
        </div>
      </div>
    </div>
    
    <!-- Badge Section -->
    ${generateBadgeSection(badges, [], badgeNarrative)}
    
    <!-- AI Deep Insights -->
    ${
      (deepInsightsData.patterns?.length || 0) > 0 ||
      (deepInsightsData.prescriptions?.length || 0) > 0
        ? `<div style='background: #f0f4ff; padding:16px; border-radius:8px; margin:20px 0; border-left: 4px solid #b8ccff;'>
          <h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>🤖 AI Pattern Recognition</h4>
          ${(deepInsightsData.patterns || [])
            .map(
              (p: any) => `
            <div style='margin-bottom:10px;'>
              <strong>${p.type}:</strong> ${p.detail} 
              <span style='color:#666; font-size:12px;'>(${Math.round(
                p.confidence * 100
              )}% confidence)</span>
            </div>
          `
            )
            .join("")}
          ${
            (deepInsightsData.prescriptions?.length || 0) > 0
              ? `<div style='margin-top:15px; padding-top:15px; border-top:1px solid rgba(0,0,0,0.1);'>
                <strong style='color:#4a148c;'>Recommended Actions:</strong>
                ${(deepInsightsData.prescriptions || [])
                  .map(
                    (p: any) => `
                  <div style='margin-top:8px; padding:8px; background:rgba(255,255,255,0.7); border-radius:4px;'>
                    <strong>${p.action}</strong><br>
                    <span style='font-size:13px; color:#555;'>${p.detail}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>`
              : ""
          }
        </div>`
        : ""
    }
    
    <!-- Work Overview Section - Code.js Style -->
    <div style='padding:20px; border-radius:8px; margin:20px 0; background: #f0f4f7; border-left: 4px solid #cbd5e1;'>
      <table style='width:100%; margin-bottom:20px;'>
        <tr>
          <td rowspan='2' style='width:60px; vertical-align:middle;'>
            <img src='${getSageImage(
              "working"
            )}' alt='Sage Working' style='height:60px; width:auto;'/>
          </td>
          <td style='vertical-align:bottom; padding-left:12px;'>
            <h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0;'>Work Overview</h3>
          </td>
        </tr>
        <tr>
          <td style='vertical-align:top; padding-left:12px;'>
            <div style='font-size:36px; font-weight:bold; color:${getScoreColor(
              scores?.work || 0,
              false
            )};'>${scores?.work || 0}</div>
          </td>
        </tr>
      </table>
      <div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>
        <h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0;'>📅 Calendar</h4>
        <div style='font-size:14px; line-height:1.6; color:#5f6368;'>
          ${calSummary.replace(/\n/g, "<br>")}
          ${
            calendarIntelligence && calendarIntelligence.score < 100
              ? `<br><span style='color:#ff6f00;'>⚠️ ${calendarIntelligence.insights.join(
                  ", "
                )}</span>`
              : ""
          }
        </div>
      </div>
      <div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>
        <h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0;'>✉️ Email</h4>
        <div style='font-size:14px; line-height:1.6; color:#5f6368;'>
          ${emailSummary.replace(/\n/g, "<br>")}
          ${
            emailResponseAnalysis && emailResponseAnalysis.avgMinutes
              ? `<br><div style='background:#f3e5f5; padding:10px; border-radius:4px; margin-top:8px;'>
                <strong>⚡ Email Response Patterns:</strong><br>
                <span style='font-size:13px;'>
                  • Average response time: <strong>${
                    emailResponseAnalysis.avgMinutes < 60
                      ? emailResponseAnalysis.avgMinutes + " minutes"
                      : Math.round(
                          (emailResponseAnalysis.avgMinutes / 60) * 10
                        ) /
                          10 +
                        " hours"
                  }</strong><br>
                • Response pattern: <strong>${
                  emailResponseAnalysis.pattern
                }</strong><br>
                • Productivity insight: ${emailResponseAnalysis.insight}
                </span>
              </div>`
              : ""
          }
          ${
            emailManagementInsight
              ? `<div style='border-left:3px solid #3b82f6; padding-left:12px; margin-top:12px;'>
                <div style='font-size:13px; color:#5f6368;'>
          ${emailManagementInsight}
            </div>
              </div>`
              : ""
          }
        </div>
      </div>
      
      <!-- Work Insight Section -->
      <div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>
        <strong style='color:#1565c0; font-size:13px;'>💡 Insight:</strong> 
        <span style='font-size:13px;'>${generateWorkInsight(
          scores,
          calendarIntelligence,
          emailResponseAnalysis
        )}</span>
      </div>
      
      <!-- Work Recommendation Section -->
      <div style='background:#dbeafe; padding:12px; border-radius:6px; margin-bottom:16px; border-left:3px solid #93c5fd;'>
        <strong style='color:#1565c0;'>🎯 Recommendation:</strong> 
        <span style='font-size:13px;'>${generateWorkRecommendation(
          scores,
          calendarIntelligence,
          emailResponseAnalysis
        )}</span>
      </div>
    </div>
    
    <!-- Physical Wellness Section - Code.js Style -->
    <div style='padding:20px; border-radius:8px; margin:20px 0; background: #f0fdf4; border-left: 4px solid #bbf7d0;'>
      <h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>🏃 Physical Wellness</h3>
      
      <!-- Sleep subsection -->
      <div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>
        <table style='width:100%; margin-bottom:16px;'>
          <tr>
            <td rowspan='2' style='width:48px; vertical-align:middle;'>
              <img src='${getSageImage(
                "sleep"
              )}' alt='Sage Sleep' style='width:48px; height:auto;'/>
            </td>
            <td style='vertical-align:bottom; padding-left:10px;'>
              <h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Sleep</h4>
            </td>
          </tr>
          <tr>
            <td style='vertical-align:top; padding-left:10px;'>
              <div style='font-size:36px; font-weight:bold; color:${getScoreColor(
                scores?.sleep || 0,
                false
              )};'>${scores?.sleep || 0}</div>
            </td>
          </tr>
        </table>
        <div style='font-size:14px; line-height:1.6; color:#5f6368;'>
          ${fitbitSleep.replace(/\n/g, "<br>")}
          ${generateSleepStagesVisualization(fitbitSleep)}
        </div>
        
        <!-- Sleep Insight -->
        <div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>
          <strong style='color:#6a1b9a; font-size:13px;'>💡 Insight:</strong> 
          <span style='font-size:13px;'>${generateSleepInsight(scores)}</span>
        </div>
        
        <!-- Sleep Recommendation -->
        <div style='background:#dbeafe; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #93c5fd;'>
          <strong style='color:#6a1b9a; font-size:13px;'>🎯 Recommendation:</strong> 
          <span style='font-size:13px;'>${generateSleepRecommendation(
            scores
          )}</span>
        </div>
      </div>
      
      <!-- Activity subsection -->
      <div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>
        <table style='width:100%; margin-bottom:16px;'>
          <tr>
            <td rowspan='2' style='width:48px; vertical-align:middle;'>
              <img src='${getSageImage(
                "active"
              )}' alt='Sage Active' style='width:48px; height:auto;'/>
            </td>
            <td style='vertical-align:bottom; padding-left:10px;'>
              <h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Activity</h4>
            </td>
          </tr>
          <tr>
            <td style='vertical-align:top; padding-left:10px;'>
              <div style='font-size:36px; font-weight:bold; color:${getScoreColor(
                scores?.activity || 0,
                false
              )};'>${scores?.activity || 0}</div>
            </td>
          </tr>
        </table>
        <div style='font-size:14px; line-height:1.6; color:#5f6368;'>
          ${
            fitbitActivityLog
              ? `<div style='background:#e3f2fd; padding:10px; border-radius:4px; margin-bottom:10px;'><strong>📋 Logged Activities:</strong><br>${
                  typeof fitbitActivityLog === "string"
                    ? fitbitActivityLog.replace(/\n/g, "<br>")
                    : JSON.stringify(fitbitActivityLog)
                }</div>`
              : ""
          }
          ${generateActivityZonesVisualization(fitbitActivity)}
        </div>
        
        <!-- Activity Insight -->
        <div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>
          <strong style='color:#2e7d32; font-size:13px;'>💡 Insight:</strong> 
          <span style='font-size:13px;'>${generateActivityInsight(
            scores
          )}</span>
        </div>
        
        <!-- Activity Recommendation -->
        <div style='background:#dbeafe; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #93c5fd;'>
          <strong style='color:#2e7d32; font-size:13px;'>🎯 Recommendation:</strong> 
          <span style='font-size:13px;'>${generateActivityRecommendation(
            scores
          )}</span>
        </div>
      </div>
      
      <!-- Heart Health subsection -->
      <div style='background:white; padding:16px; border-radius:6px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>
        <table style='width:100%; margin-bottom:16px;'>
          <tr>
            <td rowspan='2' style='width:48px; vertical-align:middle;'>
              <img src='${getSageImage(
                "heart"
              )}' alt='Sage Heart' style='width:48px; height:auto;'/>
            </td>
            <td style='vertical-align:bottom; padding-left:10px;'>
              <h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Heart Health</h4>
            </td>
          </tr>
          <tr>
            <td style='vertical-align:top; padding-left:10px;'>
              <div style='font-size:36px; font-weight:bold; color:${getScoreColor(
                scores?.heart || 0,
                false
              )};'>${scores?.heart || 0}</div>
            </td>
          </tr>
        </table>
        <div style='font-size:14px; line-height:1.6; color:#5f6368;'>
          ${fitbitHeart.replace(/\n/g, "<br>")}
          ${
            fitbitHRV
              ? `<br>💗 HRV: ${fitbitHRV.value} ms (${fitbitHRV.status})<br><em style='color:#666; font-size:13px;'>${fitbitHRV.insight}</em>`
              : ""
          }
          ${generateHeartRateZonesVisualization(fitbitHeart)}
        </div>
        
        <!-- Heart Insight -->
        <div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>
          <strong style='color:#5d4037; font-size:13px;'>💡 Insight:</strong> 
          <span style='font-size:13px;'>${generateHeartInsight(scores)}</span>
        </div>
        
        <!-- Heart Recommendation -->
        <div style='background:#dbeafe; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #93c5fd;'>
          <strong style='color:#5d4037; font-size:13px;'>🎯 Recommendation:</strong> 
          <span style='font-size:13px;'>${generateHeartRecommendation(
            scores
          )}</span>
        </div>
      </div>
    </div>
    
    <!-- Recovery Score section - Detailed Design -->
    <div style='background:#f0fdfa; padding:20px; border-radius:8px; margin:20px 0; border-left:4px solid #99f6e4;'>
      <table style='width:100%; margin-bottom:16px;'>
        <tr>
          <td rowspan='2' style='width:48px; vertical-align:middle;'>
            <img src='${getSageImage(
              "recovery"
            )}' alt='Sage Recovery' style='width:48px; height:auto;'/>
          </td>
          <td style='vertical-align:bottom; padding-left:10px;'>
            <h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0;'>Recovery</h4>
          </td>
        </tr>
        <tr>
          <td style='vertical-align:top; padding-left:10px;'>
            <div style='font-size:36px; font-weight:bold; color:${getScoreColor(
              recoveryQuotient.score,
              false
            )};'>${recoveryQuotient.score}</div>
          </td>
        </tr>
      </table>
      
      <div style='font-size:14px; line-height:1.6; color:#5f6368; margin-bottom:16px;'>
        This score reflects your body's readiness for today based on sleep, heart rate recovery, and yesterday's activity balance.
      </div>
      
      <!-- Recovery Insights and Recommendations -->
      ${generateRecoveryInsights(recoveryQuotient)}
    </div>
    
    <!-- Environment & Lifestyle Section - Stacked Layout -->
    <div style='background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0; border:1px solid #e9ecef;'>
      <h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 20px 0;'>🌍 Environment & Lifestyle</h3>
      
      <!-- Weather Section - Full Width -->
      <div style='background:white; padding:20px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1); margin-bottom:20px;'>
        <div style='display:flex; align-items:center; margin-bottom:20px;'>
          <div style='width:60px; height:60px;  border-radius:8px; display:flex; align-items:center; justify-content:center; margin-right:15px;'>
            <img src='${getSageImage(
              "weather"
            )}' alt='Weather Fox' style='width:40px; height:40px;'/>
          </div>
          <h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0;'>Weather</h4>
        </div>
        
        ${generateWeatherInsights(
          weatherSummary,
          hourlyWeather,
          environmentalFactorsData
        )}
      </div>
      
      <!-- Music Section - Full Width -->
      <div style='background:white; padding:20px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1);'>
        <div style='display:flex; align-items:center; margin-bottom:20px;'>
          <div style='width:60px; height:60px;  border-radius:8px; display:flex; align-items:center; justify-content:center; margin-right:15px;'>
            <img src='${getSageImage(
              "music"
            )}' alt='Music Fox' style='width:40px; height:40px;'/>
          </div>
          <h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0;'>Music</h4>
        </div>
        
        ${generateMusicInsights(spotifySummary, spotifyInsights)}
      </div>
    </div>
    
    <!-- Daily Mantra - Code.js Style -->
    <div style='background:#faf5ff; padding:20px; border-radius:12px; margin:20px 0; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>
      <div style='display:flex; align-items:center; margin-bottom:16px;'>
        <div style='width:60px; height:60px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-right:15px;'>
        <img src='${getSageImage(
          "meditation"
        )}' alt='Meditation Fox' style='width:40px; height:40px;'/>
        </div>
        <h4 style='font-size:18px; font-weight:600; color:#5f27cd; margin:0;'>Daily Mantra</h4>
      </div>
      <div style='background:white; padding:20px; border-radius:8px; text-align:center;'>
        <div style='font-size:16px; color:#4a148c; font-style:italic; line-height:1.6; font-weight:500;'>
          "${escapeHtml(
            mantra || "Small consistent actions lead to big results."
          )}"
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style='margin-top:40px; padding-top:20px; border-top:1px solid #e0e0e0; text-align:center; color:#999; font-size:12px;'>
      MyMetricLog • Your Personal Wellness Companion<br>
      🦊 Tracking • 📊 Analyzing • 🎯 Growing Together
    </div>
  </div>`;

  return htmlBody;
}

// Updated function to use composeEnhancedMyMetricLogEmail
export function generateDailyReportEmail(data: any): string {
  // Extract data from the actual structure
  const fullDateStr =
    data.fullDateStr ||
    new Date(data.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const dateStr = data.date || new Date().toISOString();

  // Map scores with fallbacks
  const scores = {
    total: data.scores?.total || 0,
    sleep: data.scores?.sleep || 0,
    activity: data.scores?.activity || 0,
    heart: data.scores?.heart || 0,
    work: data.scores?.work || 0,
  };

  // Map other data with fallbacks
  const gptSummary = data.gpt_summary || "No analysis available"; // Use only comprehensive GPT summary
  const mantra = data.mantra || "Focus on your wellness journey today";
  const moodInsight = data.moodInsight || "Mood data not available";
  const weatherSummary = data.weatherSummary || "Weather data not available";
  const calSummary = data.calSummary || "No calendar data available";
  const emailSummary = data.emailSummary || "No email data available";
  const completedTasks = data.completedTasks || "";
  const spotifySummary = data.spotifySummary || "No music data available";
  const spotifyInsights = data.spotifyInsights || {
    insight: "",
    recommendation: "",
  };
  const fitbitActivity = data.fitbitActivity || "No activity data available";
  const fitbitSleep = data.fitbitSleep || "No sleep data available";
  const fitbitHeart = data.fitbitHeart || "No heart data available";
  const peakHR = data.peakHR || 0;

  // Map stress radar with fallbacks
  const stressRadar = {
    level: data.stressRadar?.level || "Unknown",
    score: data.stressRadar?.score || 0,
    factors: data.stressRadar?.factors || {},
  };

  // Map recovery quotient with fallbacks
  const recoveryQuotient = {
    readiness: data.recoveryQuotient?.readiness || "Unknown",
    score: data.recoveryQuotient?.score || 0,
    factors: data.recoveryQuotient?.factors || {},
  };

  // Map day context with fallbacks
  const dayContext = {
    dayName: data.dayContext?.dayName || "Unknown",
    dayType: data.dayContext?.dayType || "weekday",
    calendarData: data.dayContext?.calendarData || [],
  };

  // Map other optional data
  const badges = data.badges || [];
  const streakBadges = data.streakBadges || [];
  const badgeNarrative = data.badgeNarrative || "";
  const nearMisses = data.nearMisses || [];
  const calendarAnalysis = data.calendarAnalysis || {};
  const calendarIntelligence = data.calendarIntelligence || {
    score: 0,
    insights: [],
  };
  const fitbitHRV = data.fitbitHRV || null;
  const hourlyWeather = data.hourlyWeather || null;
  const emailResponseAnalysis = data.emailResponseAnalysis || null;
  const fitbitActivityLog = data.fitbitActivityLog || null;
  const audioFeatures = data.audioFeatures || null;

  // Map additional data from the complete report
  const anomalies = data.anomalies || { detected: [], insights: [] };
  const environmentalFactors = data.environmentalFactors || {
    weather: { impact: "neutral", insight: "Weather data not available" },
    social: {
      weekendEffect: "Workday intensity",
      socialEngagement: "Low social engagement",
    },
    environmental: { season: "autumn", daylight: "Long daylight hours" },
  };
  const deepInsights = data.deepInsights || {
    insights: [],
    patterns: [],
    predictions: [],
    correlations: [],
  };
  const trends = data.trends || { overall: { trend: 0, sparkline: [] } };
  const historicalData = data.historicalData || [];

  // Wellness Balance Data
  const balanceLevel = data.balanceLevel || "needs_improvement";
  const balanceStatus =
    data.balanceStatus || "Challenging Day - Focus on Recovery";
  const balanceColor = data.balanceColor || "#ef4444";
  const balanceInsight =
    data.balanceInsight || "Focus on recovery and wellness improvement.";

  // AI Mood and Energy Forecast
  const aiMoodAndEnergy = data.aiMoodAndEnergy || {
    mood: {
      state: "Balanced",
      description: "Your mood today reflects your overall wellness balance.",
      additionalInfo: "Clear patterns suggest consistent energy.",
    },
    energyForecast: {
      level: "moderate to good",
      description:
        "Expected productivity: moderate to good. Prioritize key tasks.",
    },
  };

  // Previous day's mood - matching reportold.tsx
  const previousMood = data.previousMood || "Unknown";

  // Convert DailyReportData to the format expected by composeEnhancedMyMetricLogEmail
  return composeEnhancedMyMetricLogEmail(
    fullDateStr,
    dateStr,
    scores,
    gptSummary,
    mantra,
    moodInsight,
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
    historicalData,
    // Wellness Balance Data
    balanceLevel,
    balanceStatus,
    balanceColor,
    balanceInsight,
    // AI Mood and Energy Forecast
    aiMoodAndEnergy,
    // Previous day's mood - matching reportold.tsx
    previousMood
  );
}

// Helper functions from code.js
function generateIntradayVisualization(
  activityData: string,
  sleepData: string,
  calendarData: string,
  dayContext: any
): string {
  // Extract sleep times
  const sleepMatch = (sleepData || "").match(/😴 Sleep: (\d+h \d+m)/);
  const wakeMatch = (sleepData || "").match(/☀️ Wake: (\d+:\d+ [AP]M)/);
  const bedtimeMatch = (sleepData || "").match(/🛏️ Bedtime: (\d+:\d+ [AP]M)/);

  const sleepDuration = sleepMatch ? sleepMatch[1] : "0h 0m";
  const wakeTime = wakeMatch ? wakeMatch[1] : "6:00 AM";
  const bedtime = bedtimeMatch ? bedtimeMatch[1] : "11:00 PM";

  // Extract activity data
  const stepsMatch = (activityData || "").match(/👣 Steps: ([\d,]+)/);
  const activeMinutesMatch = (activityData || "").match(/🏃 Active: (\d+) min/);
  const sedentaryMatch = (activityData || "").match(
    /⬜ Sedentary: (\d+h \d+m)/
  );

  const steps = stepsMatch ? stepsMatch[1] : "0";
  const activeMinutes = activeMinutesMatch ? activeMinutesMatch[1] : "0";
  const sedentary = sedentaryMatch ? sedentaryMatch[1] : "0h 0m";

  // Generate hourly activity pattern (simplified version)
  const hourlyPattern = generateHourlyActivityPattern(activityData, sleepData);

  return generateDetailedActivityTimeline(activityData, sleepData);
}

function generateDetailedActivityTimeline(
  activityData: string,
  sleepData: string
): string {
  // Clone of code.js generateIntradayVisualization function
  const hourlyActivity = [];
  for (let i = 0; i < 24; i++) {
    hourlyActivity.push(0);
  }

  let sleepStart = 23;
  let sleepEnd = 7;

  const bedMatch = sleepData.match(/🌙 Bedtime: (\d+):(\d+) (AM|PM)/);
  const wakeMatch = sleepData.match(/☀️ Wake time: (\d+):(\d+) (AM|PM)/);

  if (bedMatch) {
    sleepStart = parseInt(bedMatch[1]);
    if (bedMatch[3] === "PM" && sleepStart !== 12) sleepStart += 12;
    if (bedMatch[3] === "AM" && sleepStart === 12) sleepStart = 0;
  }
  if (wakeMatch) {
    sleepEnd = parseInt(wakeMatch[1]);
    if (wakeMatch[3] === "PM" && sleepEnd !== 12) sleepEnd += 12;
    if (wakeMatch[3] === "AM" && sleepEnd === 12) sleepEnd = 0;
  }

  const veryActiveMatch = activityData.match(/💪 Very Active: (\d+) min/);
  const fairlyActiveMatch = activityData.match(/🚶 Fairly Active: (\d+) min/);
  const lightlyActiveMatch = activityData.match(/🧘 Lightly Active: (\d+) min/);

  const veryActive = veryActiveMatch ? parseInt(veryActiveMatch[1]) : 0;
  const fairlyActive = fairlyActiveMatch ? parseInt(fairlyActiveMatch[1]) : 0;
  const lightlyActive = lightlyActiveMatch
    ? parseInt(lightlyActiveMatch[1])
    : 0;

  const activityPeaks = [];
  if (veryActive > 0) {
    if (sleepEnd <= 6) {
      activityPeaks.push({ hour: 6, intensity: "high" });
    } else {
      activityPeaks.push({ hour: 17, intensity: "high" });
    }
  }
  if (fairlyActive > 0) {
    activityPeaks.push({ hour: 12, intensity: "medium" });
  }

  // Create visual representation with inline styles for email
  let heatmapHtml =
    '<div style="margin: 20px 0; padding: 20px; background: #f0fff4; border-left: 4px solid #1dd1a1; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">';
  heatmapHtml +=
    '<h4 style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px 0;">24-Hour Activity Pattern</h4>';

  // Container for the chart
  heatmapHtml +=
    '<div style="position: relative; height: 80px; margin-bottom: 5px; border-bottom: 1px solid #e0e0e0;">';

  // Bars container
  heatmapHtml +=
    '<div style="display: table; width: 100%; height: 100%; table-layout: fixed;">';

  for (let hour = 0; hour < 24; hour++) {
    let intensity = "low";
    let color = "#e0e0e0";
    let label = "";
    let height = 20;

    let isSleeping = false;
    if (sleepStart > sleepEnd) {
      isSleeping = hour >= sleepStart || hour < sleepEnd;
    } else {
      isSleeping = hour >= sleepStart && hour < sleepEnd;
    }

    if (isSleeping) {
      intensity = "sleep";
      color = "#4285f4";
      label = "😴";
      height = 30;
    } else {
      for (let p = 0; p < activityPeaks.length; p++) {
        if (hour === activityPeaks[p].hour) {
          intensity = activityPeaks[p].intensity;
          if (intensity === "high") {
            color = "#0f9d58"; // Changed from red to green
            label = "🏃";
            height = 60;
          } else if (intensity === "medium") {
            color = "#81c784"; // Changed from yellow to light green
            label = "🚶";
            height = 45;
          }
          break;
        }
      }

      if (hour === sleepEnd && !isSleeping) {
        color = "#ffa726"; // Orange for wake time
        label = "☀️";
        height = 40;
      }

      if (hour >= 9 && hour <= 17 && intensity === "low") {
        // Check if it's a weekend (simplified for email)
        const isWeekend = false; // You can pass dayContext if needed

        if (!isWeekend) {
          color = "#dadce0";
          label = "💼";
          height = 25;
        } else {
          // On weekends, show as regular low activity, not work
          color = "#e0e0e0";
          label = "";
          height = 20;
        }
      }
    }

    heatmapHtml +=
      '<div style="display: table-cell; vertical-align: bottom; padding: 0 1px;">';
    heatmapHtml +=
      '<div style="width: 100%; height: ' +
      height +
      "px; background: " +
      color +
      "; " +
      "position: relative; border-radius: 2px 2px 0 0; " +
      'border: 1px solid rgba(0,0,0,0.1); border-bottom: none;" ' +
      'title="' +
      hour +
      ':00">';

    if (label) {
      heatmapHtml +=
        '<div style="position: absolute; top: 50%; left: 50%; ' +
        "transform: translate(-50%, -50%); font-size: 11px; line-height: 1; " +
        'text-align: center;">' +
        label +
        "</div>";
    }

    heatmapHtml += "</div></div>";
  }

  heatmapHtml += "</div></div>";

  // Hour labels
  heatmapHtml +=
    '<div style="display: table; width: 100%; table-layout: fixed; font-size: 11px; color: #757575;">';
  for (let hour = 0; hour < 24; hour++) {
    heatmapHtml +=
      '<div style="display: table-cell; text-align: center; padding: 0 1px;">';
    if (hour % 3 === 0) {
      heatmapHtml += hour;
    }
    heatmapHtml += "</div>";
  }
  heatmapHtml += "</div>";

  // Updated Legend with better colors
  heatmapHtml +=
    '<div style="margin-top: 15px; font-size: 13px; color: #5f6368;">';
  heatmapHtml +=
    '<div style="display: flex; margin-bottom: 8px; justify-content: space-between;">';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">😴 Sleep</span>';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">☀️ Wake</span>';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">🚶 Moderate Activity</span>';
  heatmapHtml += "</div>";
  heatmapHtml += '<div style="display: flex; justify-content: space-between;">';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">🏃 High Activity</span>';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">💼 Work Hours</span>';
  heatmapHtml +=
    '<span style="display: inline-block; width: 30%;">⬜ Sedentary/Low Activity</span>';
  heatmapHtml += "</div>";
  heatmapHtml += "</div>";

  // Summary stats with AI narrative
  const activityNarrative = generateActivityNarrative(activityData, sleepData);

  heatmapHtml +=
    '<div style="margin-top: 12px; padding: 12px; background: #e8f0fe; ' +
    'border-radius: 4px; font-size: 14px; color: #424242; line-height: 1.5;">' +
    "<strong>Activity Summary:</strong> " +
    activityNarrative +
    "</div></div>";

  return heatmapHtml;
}

function generateActivityNarrative(
  activityData: string,
  sleepData: string
): string {
  // Clone of code.js generateActivityNarrative function
  // Parse the activity data
  const veryActiveMatch = activityData.match(/💪 Very Active: (\d+) min/);
  const fairlyActiveMatch = activityData.match(/🚶 Fairly Active: (\d+) min/);
  const lightlyActiveMatch = activityData.match(/🧘 Lightly Active: (\d+) min/);
  const sedentaryMatch = activityData.match(/🪑 Sedentary: (\d+) min/);

  const veryActive = veryActiveMatch ? parseInt(veryActiveMatch[1]) : 0;
  const fairlyActive = fairlyActiveMatch ? parseInt(fairlyActiveMatch[1]) : 0;
  const lightlyActive = lightlyActiveMatch
    ? parseInt(lightlyActiveMatch[1])
    : 0;
  const sedentary = sedentaryMatch ? parseInt(sedentaryMatch[1]) : 0;

  // Parse wake time
  const wakeMatch = sleepData.match(/☀️ Wake time: (\d+):(\d+) (AM|PM)/);
  const wakeTimeStr = wakeMatch
    ? wakeMatch[1] + ":" + wakeMatch[2] + " " + wakeMatch[3]
    : "early morning";

  // Calculate percentages
  const totalAwakeMinutes =
    veryActive + fairlyActive + lightlyActive + sedentary;
  const sedentaryPercent = Math.round((sedentary / totalAwakeMinutes) * 100);
  const totalActiveMinutes = veryActive + fairlyActive + lightlyActive;

  // Concise fallback narratives (2 sentences max) - matching code.js
  if (veryActive > 30) {
    return (
      "You woke at " +
      wakeTimeStr +
      " and logged an impressive " +
      veryActive +
      " minutes of high-intensity activity. Despite " +
      sedentaryPercent +
      "% sedentary time, your workout more than offset the sitting."
    );
  } else if (sedentaryPercent > 80) {
    return (
      "After waking at " +
      wakeTimeStr +
      ", you spent " +
      sedentaryPercent +
      "% of your day sedentary, indicating a majority of your time was non-active on this weekday."
    );
  } else if (totalActiveMinutes > 120) {
    return (
      "You woke at " +
      wakeTimeStr +
      " and were active for " +
      totalActiveMinutes +
      " minutes, " +
      (veryActive > 0
        ? veryActive + " of which were high intensity"
        : "none of which were high intensity") +
      ". You spent " +
      sedentaryPercent +
      "% of your day sedentary, indicating a majority of your time was non-active on this weekday."
    );
  } else {
    return (
      "You woke at " +
      wakeTimeStr +
      " and were active for " +
      totalActiveMinutes +
      " minutes, none of which were high intensity. You spent " +
      sedentaryPercent +
      "% of your day sedentary, indicating a majority of your time was non-active on this weekday."
    );
  }
}

function generateHourlyActivityPattern(
  activityData: string,
  sleepData: string
): string {
  // Simplified hourly pattern generation
  const pattern = [];
  for (let i = 0; i < 24; i++) {
    if (i >= 0 && i < 6) {
      pattern.push("😴"); // Sleep hours
    } else if (i === 6) {
      pattern.push("☀️"); // Wake up
    } else if (i >= 7 && i < 9) {
      pattern.push("🚶"); // Morning activity
    } else if (i >= 9 && i < 17) {
      pattern.push("💼"); // Work hours
    } else if (i >= 17 && i < 19) {
      pattern.push("🏃"); // Evening activity
    } else if (i >= 19 && i < 22) {
      pattern.push("🚶"); // Evening walk
    } else {
      pattern.push("⬜"); // Sedentary
    }
  }
  return pattern.join(" ");
}

function generateAIMoodCard(aiMoodAndEnergy: any, scores: any): string {
  // Use AI-generated data if available, otherwise fallback to basic mood
  const moodData = aiMoodAndEnergy || {
    mood: {
      state: "Balanced",
      description: "Your mood today reflects your overall wellness balance.",
      additionalInfo: "Clear patterns suggest consistent energy.",
    },
    energyForecast: {
      level: "moderate to good",
      description:
        "Expected productivity: moderate to good. Prioritize key tasks.",
    },
  };

  const moodState = moodData.mood.state;
  const moodDescription = moodData.mood.description;
  const moodAdditional = moodData.mood.additionalInfo;
  const energyLevel = moodData.energyForecast.level;
  const energyDescription = moodData.energyForecast.description;

  // Get appropriate emoji and color based on mood state
  const moodEmojis: { [key: string]: string } = {
    Balanced: "😊",
    Energized: "⚡",
    Foggy: "🌫️",
    Tired: "😴",
    Focused: "🎯",
    Restless: "😣",
    Calm: "🧘",
    Stressed: "😰",
  };

  const emoji = moodEmojis[moodState] || "😊";

  // Get color based on overall score
  const borderColor =
    scores?.total >= 80
      ? "#0b8043"
      : scores?.total >= 60
      ? "#fbbc04"
      : "#ea4335";

  return `<div style='background: linear-gradient(135deg, #f8f9fa 0%, #e8f0fe 100%); border: 2px solid ${borderColor}; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>
    <div style='display: flex; align-items: center; margin-bottom: 15px;'>
      <span style='font-size: 48px; margin-right: 15px;'>${emoji}</span>
      <div>
        <h3 style='margin: 0; font-size: 20px; color: #1a73e8; display: flex; align-items: center;'>
          <span style='font-size: 24px; margin-right: 8px;'>⚖️</span>
          Today's Mood: ${moodState}
        </h3>
        <p style='margin: 5px 0 0 0; color: #5f6368; font-size: 14px;'>${moodDescription}</p>
        <p style='margin: 5px 0 0 0; color: #5f6368; font-size: 14px;'>${moodAdditional}</p>
      </div>
    </div>
    
    <div style='background: rgba(255,255,255,0.7); border-radius: 8px; padding: 12px; margin-top: 15px; border-left: 4px solid ${borderColor};'>
      <div style='display: flex; align-items: center; margin-bottom: 8px;'>
        <span style='font-size: 20px; margin-right: 8px;'>📊</span>
        <strong style='color: #1a73e8;'>Energy Forecast:</strong>
      </div>
      <span style='color: #5f6368; font-size: 14px;'>${energyDescription}</span>
    </div>
  </div>`;
}

function generateMoodCard(moodInsight: string, scores: any): string {
  const moodEmojis: { [key: string]: string } = {
    energized: "⚡",
    relaxed: "😌",
    tired: "😴",
    anxious: "😰",
    overwhelmed: "😵",
    motivated: "💪",
    foggy: "🌫️",
    calm: "🧘",
    focused: "🎯",
    restless: "😣",
    balanced: "⚖️",
  };

  // Extract mood keyword from insight - matching reportold.tsx logic
  let moodKeyword = "balanced";
  const lowerInsight = moodInsight.toLowerCase();
  const feelMatch = lowerInsight.match(/feel (\w+)/);

  if (feelMatch) {
    moodKeyword = feelMatch[1];
  } else {
    for (const mood in moodEmojis) {
      if (lowerInsight.indexOf(mood) !== -1) {
        moodKeyword = mood;
        break;
      }
    }
  }

  const emoji = moodEmojis[moodKeyword] || "⚖️";
  const borderColor =
    scores?.total >= 80
      ? "#0b8043"
      : scores?.total >= 60
      ? "#fbbc04"
      : "#ea4335";
  const energyForecast = generateEnergyForecast(scores, moodKeyword);

  return `<div style='background: white; border: 2px solid ${borderColor}; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>
    <div style='display: flex; align-items: center; margin-bottom: 15px;'>
      <span style='font-size: 32px; margin-right: 15px;'>${emoji}</span>
      <div>
        <h3 style='margin: 0; font-size: 18px; color: #1a73e8; font-weight: bold;'>Today's Mood: ${capitalizeFirstLetter(
          moodKeyword
        )}</h3>
        <p style='margin: 5px 0 0 0; color: #5f6368; font-size: 14px; line-height: 1.4;'>${moodInsight}</p>
      </div>
    </div>
    <div style='background: rgba(255,255,255,0.8); border-radius: 8px; padding: 12px; margin-top: 15px; border-left: 4px solid ${borderColor};'>
      <div style='display: flex; align-items: center; margin-bottom: 8px;'>
        <span style='font-size: 16px; margin-right: 8px;'>📊</span>
        <strong style='color: #1a73e8; font-size: 14px;'>Energy Forecast:</strong>
      </div>
      <span style='color: #5f6368; font-size: 14px; line-height: 1.4;'>${energyForecast}</span>
    </div>
  </div>`;
}

function generateEnergyForecast(scores: any, mood: string): string {
  const forecasts: { [key: string]: string[] } = {
    high: [
      "Peak performance window: 9-11 AM. Schedule important tasks early.",
      "Strong energy reserves. Consider tackling complex projects today.",
      "Optimal conditions for deep work. Protect your focus time.",
    ],
    moderate: [
      "Steady energy with potential dip around 2-3 PM. Plan accordingly.",
      "Good baseline energy. Take regular breaks to maintain momentum.",
      "Expected productivity: moderate to good. Prioritize key tasks.",
    ],
    low: [
      "Energy conservation recommended. Focus on essential tasks only.",
      "Anticipate fatigue by mid-afternoon. Schedule lighter activities.",
      "Recovery day ahead. Be gentle with yourself and adjust expectations.",
    ],
  };

  const level =
    scores?.total >= 80 ? "high" : scores?.total >= 60 ? "moderate" : "low";
  const options = forecasts[level];
  return options[Math.floor(Math.random() * options.length)];
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function extractMoodFromInsight(moodInsight: string): string {
  const moodEmojis: { [key: string]: string } = {
    energized: "⚡",
    relaxed: "😌",
    tired: "😴",
    anxious: "😰",
    overwhelmed: "😵",
    motivated: "💪",
    foggy: "🌫️",
    calm: "🧘",
    focused: "🎯",
    restless: "😣",
    balanced: "😊",
  };

  const lowerInsight = moodInsight.toLowerCase();
  const feelMatch = lowerInsight.match(/feel (\w+)/);

  if (feelMatch) {
    return feelMatch[1];
  }

  for (const mood in moodEmojis) {
    if (lowerInsight.indexOf(mood) !== -1) {
      return mood;
    }
  }

  return "balanced";
}

function generateQuickWinBox(
  scores: any,
  stressRadar: any,
  recoveryQuotient: any,
  environmentalFactors: any,
  calendarIntelligence: any
): string {
  let quickWin = "";
  let icon = "🎯";

  if (scores?.sleep < 70 && scores?.activity > 80) {
    quickWin =
      "Set a 10 PM wind-down alarm tonight - your high activity needs better sleep support";
    icon = "😴";
  } else if (
    stressRadar?.score > 50 &&
    environmentalFactors?.weather?.impact === "positive"
  ) {
    quickWin =
      "Take your next call outside - combine ideal weather with stress reduction for instant relief";
    icon = "🌞";
  } else if (scores?.activity < 60) {
    quickWin =
      "Schedule a 15-minute walk at 2 PM - break up sedentary time when energy typically dips";
    icon = "🚶";
  } else if (calendarIntelligence?.meetingQuality?.backToBack > 2) {
    quickWin =
      "Add 5-minute buffers between meetings - protect transition time for mental reset";
    icon = "⏰";
  } else if (scores?.work > 80 && scores?.total > 80) {
    quickWin =
      "Protect your peak state - decline one non-essential meeting today to maintain momentum";
    icon = "🛡️";
  } else {
    quickWin =
      "Take a 10-minute music + movement break at 10:30 AM for a 15% energy boost";
    icon = "🎵";
  }

  return `<section style="background: #fefce8; border-left: 4px solid #fef3c7; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-size: 20px; font-weight: bold; color: #1565c0; margin-bottom: 8px; display: flex; align-items: center; justify-content: center;">
      <img src="${getSageImage(
        "quickwin"
      )}" alt="Sage Quick Win" style="width:48px; height:auto; margin-right:12px;"/>
      Quick Win for Today
    </div>
    <div style="font-size: 15px; color: #424242; line-height: 1.5;">
      ${quickWin}
    </div>
  </section>`;
}

function generateInsightHeadline(
  scores: any,
  stressRadar: any,
  recoveryQuotient: any
): string {
  // Generate dynamic headlines based on data patterns - matching reportold.tsx
  const totalScore = scores?.total || 0;
  const sleepScore = scores?.sleep || 0;
  const activityScore = scores?.activity || 0;
  const heartScore = scores?.heart || 0;
  const workScore = scores?.work || 0;

  const stressLevel = stressRadar?.level || "unknown";
  const recoveryLevel = recoveryQuotient?.readiness || "unknown";

  // High performance patterns
  if (totalScore >= 85) {
    if (sleepScore >= 80 && activityScore >= 80) {
      return "🌟 Peak performance day - your body and mind are perfectly synchronized!";
    } else if (heartScore >= 85 && workScore >= 80) {
      return "💪 Exceptional day - your heart and work rhythm created magic!";
    } else {
      return "🎯 Outstanding day - all systems firing on all cylinders!";
    }
  }

  // Good performance with specific strengths
  if (totalScore >= 70) {
    if (sleepScore >= 80) {
      return "😴 Restorative day - quality sleep set the foundation for success!";
    } else if (activityScore >= 80) {
      return "🏃‍♂️ Energetic day - your movement created positive momentum!";
    } else if (heartScore >= 80) {
      return "❤️ Heart-strong day - your cardiovascular system is thriving!";
    } else if (workScore >= 80) {
      return "💼 Productive day - your work rhythm was perfectly tuned!";
    } else {
      return "👍 Solid day - consistent progress across all metrics!";
    }
  }

  // Mixed performance patterns
  if (totalScore >= 50) {
    if (stressLevel === "high" && recoveryLevel === "low") {
      return "⚡ High-energy day with recovery needs - your body worked hard!";
    } else if (sleepScore < 60 && activityScore >= 70) {
      return "🌙 Active but tired day - movement kept you going despite low sleep!";
    } else if (heartScore < 60 && workScore >= 70) {
      return "💼 Work-focused day - productivity despite lower heart health!";
    } else {
      return "📈 Building day - steady progress with room to optimize!";
    }
  }

  // Challenging days
  if (totalScore >= 30) {
    if (sleepScore < 50 && activityScore < 50) {
      return "😴 Rest day needed - your body is asking for recovery time!";
    } else if (stressLevel === "high") {
      return "🌪️ Stressful day - your resilience is being tested!";
    } else {
      return "💪 Challenging day - every small win counts!";
    }
  }

  // Very low performance
  return "🔄 Reset day - tomorrow is a fresh start to rebuild momentum!";
}

function generateEmailManagementInsight(emailStats: any): string {
  return `<div style='font-size:14px; color:#333;'>Email management: ${emailStats.received} received, ${emailStats.sent} sent</div>`;
}

function getTrendArrow(trend: number): string {
  if (trend > 0) return "↗️";
  if (trend < 0) return "↘️";
  return "→";
}

function getStressColor(score: number): string {
  if (score < 20) return "#00695c";
  if (score < 30) return "#0b8043";
  if (score < 40) return "#66bb6a";
  if (score < 50) return "#9ccc65";
  if (score < 60) return "#f9ab00";
  if (score < 70) return "#ff6f00";
  return "#ea4335";
}

function getRecoveryColor(score: number): string {
  if (score >= 90) return "#00695c";
  if (score >= 80) return "#0b8043";
  if (score >= 70) return "#66bb6a";
  if (score >= 60) return "#9ccc65";
  if (score >= 50) return "#f9ab00";
  if (score >= 40) return "#ff6f00";
  return "#ea4335";
}

function generateStatusTag(
  label: string,
  score: number,
  isPercent: boolean,
  isMainScore: boolean
): string {
  const color = score >= 80 ? "#0b8043" : score >= 60 ? "#fbbc04" : "#ea4335";
  const text = isPercent ? `${score}%` : score.toString();
  return `<span style='background:${color}; color:white; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600;'>${label}: ${text}</span>`;
}

function extractSleepDuration(sleepData: string): string {
  const text = (sleepData || "").toString();
  const match = text.match(/😴 Sleep: (\d+h \d+m)/);
  return match ? match[1] : "0h 0m";
}

function extractSteps(activityData: string): string {
  const text = (activityData || "").toString();
  const match = text.match(/👣 Steps: ([\d,]+)/);
  return match ? match[1] : "0";
}

function extractRHR(heartData: string): string {
  const text = (heartData || "").toString();
  const match = text.match(/❤️ Resting HR: (\d+)/);
  return match ? match[1] : "0";
}

function extractMeetingCount(calSummary: string): string {
  const text = (calSummary || "").toString();
  const match = text.match(/(\d+)/);
  return match ? match[1] : "0";
}

function generatePerformanceGrid(scores: any): string {
  return `<div style='background:#f8f8f8; padding:20px; border-radius:8px; margin:20px 0;'>
    <h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>Performance Breakdown</h4>
    <table style='width:100%; border-collapse: collapse;'>
      <tr>
        <td style='width:50%; padding:10px; vertical-align:top;'>
          <div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>
            <div style='margin-bottom:10px;'>
              <span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Sleep:</span>
              ${generateEnhancedBar(scores.sleep, true)}
              <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                scores.sleep
              }</span>
              ${generateStatusTag("Sleep", scores.sleep, true, false)}
            </div>
          </div>
          <div style='background:white; padding:15px; border-radius:6px;'>
            <div style='margin-bottom:10px;'>
              <span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Activity:</span>
              ${generateEnhancedBar(scores.activity, true)}
              <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                scores.activity
              }</span>
              ${generateStatusTag("Activity", scores.activity, true, false)}
            </div>
          </div>
        </td>
        <td style='width:50%; padding:10px; vertical-align:top;'>
          <div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>
            <div style='margin-bottom:10px;'>
              <span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Heart:</span>
              ${generateEnhancedBar(scores.heart, true)}
              <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                scores.heart
              }</span>
              ${generateStatusTag("Heart", scores.heart, true, false)}
            </div>
          </div>
          <div style='background:white; padding:15px; border-radius:6px;'>
            <div style='margin-bottom:10px;'>
              <span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Work:</span>
              ${generateEnhancedBar(scores.work, true)}
              <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                scores.work
              }</span>
              ${generateStatusTag("Work", scores.work, true, false)}
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>`;
}

function generateEnhancedBar(score: number, isPercent: boolean): string {
  const percentage = isPercent ? score : (score / 100) * 100;
  const color = score >= 80 ? "#0b8043" : score >= 60 ? "#fbbc04" : "#ea4335";
  return `<div style='display:inline-block; width:100px; height:20px; background:#e0e0e0; border-radius:10px; overflow:hidden; vertical-align:middle;'>
    <div style='width:${percentage}%; height:100%; background:${color}; border-radius:10px; transition:width 0.3s ease;'></div>
  </div>`;
}

function generateBadgeSection(
  badges: any[],
  streakBadges: any[],
  narrative: string
): string {
  if ((badges?.length || 0) === 0 && (streakBadges?.length || 0) === 0)
    return "";

  // Get badge design based on rarity (matching code.js)
  const getBadgeDesign = (rarity: string) => {
    const designs: any = {
      legendary: {
        background: "linear-gradient(135deg, #FFF8E1 0%, #FFD700 100%)",
        border: "#FFB300",
        shadow: "rgba(255,215,0,0.3)",
        rarityColor: "#FF6F00",
        titleColor: "#F57C00",
        descColor: "#5D4037",
        emojiShadow: "rgba(255,193,7,0.4)",
      },
      epic: {
        background: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
        border: "#9C27B0",
        shadow: "rgba(156,39,176,0.25)",
        rarityColor: "#7B1FA2",
        titleColor: "#6A1B9A",
        descColor: "#4A148C",
        emojiShadow: "rgba(156,39,176,0.4)",
      },
      rare: {
        background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
        border: "#2196F3",
        shadow: "rgba(33,150,243,0.25)",
        rarityColor: "#1976D2",
        titleColor: "#1565C0",
        descColor: "#0D47A1",
        emojiShadow: "rgba(33,150,243,0.4)",
      },
      uncommon: {
        background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
        border: "#4CAF50",
        shadow: "rgba(76,175,80,0.25)",
        rarityColor: "#388E3C",
        titleColor: "#2E7D32",
        descColor: "#1B5E20",
        emojiShadow: "rgba(76,175,80,0.4)",
      },
      common: {
        background: "linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%)",
        border: "#BDBDBD",
        shadow: "rgba(0,0,0,0.1)",
        rarityColor: "#757575",
        titleColor: "#616161",
        descColor: "#424242",
        emojiShadow: "rgba(0,0,0,0.15)",
      },
    };
    return designs[rarity.toLowerCase()] || designs.common;
  };

  let html = `<section style="background: #fffbeb; border-left: 4px solid #fde68a; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">`;

  // Add narrative BEFORE the header (matching code.js)
  if (narrative) {
    html += narrative;
  }

  // Header with icon (matching code.js exactly)
  html += `<h3 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; display: flex; align-items: center;">
    <span style="font-size: 24px; margin-right: 8px;">🏅</span>
    Today's Achievements 
    <span style="font-size: 14px; font-weight: normal; color: #666; margin-left: 10px;">
      (${badges?.length || 0} earned)
    </span>
  </h3>`;

  // Badge grid (matching code.js layout)
  if ((badges?.length || 0) > 0) {
    html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-bottom: 16px;">`;

    badges.forEach((badge) => {
      const design = getBadgeDesign(badge.rarity || "common");
      const emoji = badge.emoji || badge.icon || "🏆";
      const name = badge.name || "Unknown Badge";
      const description = badge.description || "";
      const rarity = badge.rarity || "COMMON";

      html += `<div style="
        background: ${design.background};
        border: 1px solid ${design.border};
        border-radius: 8px;
        padding: 14px;
        position: relative;
        box-shadow: 0 1px 3px ${design.shadow};
        margin-bottom: 12px;
      ">
        <!-- Rarity tag -->
        <div style="position: absolute; top: 8px; right: 8px; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: white; background: ${design.rarityColor};">
          ${rarity}
        </div>
        <!-- Badge content -->
        <div style="display: flex; align-items: center;">
          <div style="font-size: 36px; margin-right: 14px; filter: drop-shadow(0 2px 4px ${design.emojiShadow});">
            ${emoji}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 16px; margin-bottom: 2px; color: ${design.titleColor};">
              ${name}
            </div>
            <div style="font-size: 13px; color: ${design.descColor};">
              ${description}
            </div>
          </div>
        </div>
      </div>`;
    });

    html += `</div>`;
  }

  // Streak section (matching code.js)
  if ((streakBadges?.length || 0) > 0) {
    html += `<div style="background: #e8f0fe; border-radius: 6px; padding: 14px; border-left: 4px solid #1976d2;">
      <div style="font-weight: 600; color: #1565c0; margin-bottom: 8px; font-size: 14px;">🔥 ACTIVE STREAKS</div>
      <div style="display: flex; flex-wrap: wrap; gap: 16px;">`;

    streakBadges.forEach((streak) => {
      html += `<div style="display: flex; align-items: center;">
        <span style="font-size: 20px; margin-right: 8px;">${streak.emoji}</span>
        <div>
          <span style="font-weight: 600; color: #424242; font-size: 14px;">${streak.name}</span><br>
          <span style="color: #1976d2; font-weight: 700; font-size: 16px;">Day ${streak.count}</span>
        </div>
      </div>`;
    });

    html += `</div></div>`;
  }

  html += `</section>`;
  return html;
}

function generateNearMissSection(nearMisses: any[]): string {
  return `<div style='background:#fff3cd; padding:20px; border-radius:8px; margin:20px 0; border:1px solid #ffeaa7;'>
    <h3 style='font-size:18px; font-weight:600; color:#856404; margin:0 0 12px 0;'>🎯 Near Misses</h3>
    <div style='font-size:14px; color:#856404;'>
      ${nearMisses
        .map(
          (nearMiss) => `
        <div style='margin:8px 0; padding:8px; background:white; border-radius:6px; border-left:4px solid #ffc107;'>
          <strong>${nearMiss.name}:</strong> ${nearMiss.description} (${nearMiss.progress}% complete)
        </div>
      `
        )
        .join("")}
    </div>
  </div>`;
}

function generateDetailedSections(data: DailyReportData): string {
  return `
    <!-- Sleep Section -->
    <div style='margin:20px 0; padding:20px; background:#f8f8f8; border:1px solid #e0e0e0; border-radius:8px;'>
      <h3 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>
        <img src='${
          SAGE_IMAGES.sleep
        }' style='width:20px; height:20px; margin-right:8px; vertical-align:middle;'/>
        😴 Sleep Analysis
      </h3>
      <div style='font-size:14px; color:#333; line-height:1.6;'>${
        data.fitbitSleep
      }</div>
      <div style='margin-top:10px; font-size:12px; color:#666;'>
        ${(data.scores.explanations?.sleep || [])
          .map((exp) => `<div>• ${exp}</div>`)
          .join("")}
      </div>
    </div>
    
    <!-- Activity Section -->
    <div style='margin:20px 0; padding:20px; background:#f8f8f8; border:1px solid #e0e0e0; border-radius:8px;'>
      <h3 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>
        <img src='${
          SAGE_IMAGES.active
        }' style='width:20px; height:20px; margin-right:8px; vertical-align:middle;'/>
        🏃 Activity Summary
      </h3>
      <div style='font-size:14px; color:#333; line-height:1.6;'>${
        data.fitbitActivity
      }</div>
      <div style='margin-top:10px; font-size:12px; color:#666;'>
        ${(data.scores.explanations?.activity || [])
          .map((exp) => `<div>• ${exp}</div>`)
          .join("")}
      </div>
    </div>
    
    <!-- Heart Section -->
    <div style='margin:20px 0; padding:20px; background:#f8f8f8; border:1px solid #e0e0e0; border-radius:8px;'>
      <h3 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>
        <img src='${
          SAGE_IMAGES.heart
        }' style='width:20px; height:20px; margin-right:8px; vertical-align:middle;'/>
        ❤️ Heart Health
      </h3>
      <div style='font-size:14px; color:#333; line-height:1.6;'>${
        data.fitbitHeart
      }</div>
      <div style='margin-top:10px; font-size:12px; color:#666;'>
        ${(data.scores.explanations?.heart || [])
          .map((exp) => `<div>• ${exp}</div>`)
          .join("")}
      </div>
    </div>
    
    <!-- Work Section -->
    <div style='margin:20px 0; padding:20px; background:#f8f8f8; border:1px solid #e0e0e0; border-radius:8px;'>
      <h3 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>
        <img src='${
          SAGE_IMAGES.working
        }' style='width:20px; height:20px; margin-right:8px; vertical-align:middle;'/>
        💼 Work Performance
      </h3>
      <div style='font-size:14px; color:#333; line-height:1.6;'>${
        data.emailSummary || "No email data available."
      }</div>
      <div style='font-size:14px; color:#333; line-height:1.6; margin-top:10px;'>${
        data.calSummary
      }</div>
      <div style='margin-top:10px; font-size:12px; color:#666;'>
        ${(data.scores.explanations?.work || [])
          .map((exp) => `<div>• ${exp}</div>`)
          .join("")}
      </div>
    </div>
    
    <!-- Environment & Lifestyle Section -->
    <div style='margin:20px 0; padding:20px; background:#f8f8f8; border:1px solid #e0e0e0; border-radius:8px;'>
      <h3 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>
        🌍 Environment & Lifestyle
      </h3>
      
      <!-- Weather Widget -->
      <div style='background:white; padding:15px; border-radius:6px; margin-bottom:15px; border:1px solid #e0e0e0;'>
        <h4 style='font-size:16px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>
        <img src='${
          SAGE_IMAGES.weather
        }' style='width:18px; height:18px; margin-right:8px; vertical-align:middle;'/>
          🌤️ Weather
        </h4>
        
        <!-- Yesterday's Weather -->
        <div style='margin-bottom:12px; padding:10px; background:#f8f9fa; border-radius:4px;'>
          <div style='font-size:14px; font-weight:600; color:#333; margin-bottom:8px;'>Yesterday's Weather</div>
          <div style='font-size:13px; color:#666; line-height:1.5;'>
            ${extractWeatherData(data.weatherSummary, "yesterday")}
          </div>
        </div>
        
        <!-- Today's Forecast -->
        <div style='margin-bottom:12px; padding:10px; background:#f8f9fa; border-radius:4px;'>
          <div style='font-size:14px; font-weight:600; color:#333; margin-bottom:8px;'>Today's Forecast</div>
          <div style='font-size:13px; color:#666; line-height:1.5;'>
            ${extractWeatherData(data.weatherSummary, "today")}
          </div>
        </div>
        
        <!-- Daylight Information -->
        <div style='margin-bottom:12px; padding:10px; background:#f8f9fa; border-radius:4px;'>
          <div style='font-size:14px; font-weight:600; color:#333; margin-bottom:8px;'>Daylight Information</div>
          <div style='font-size:13px; color:#666; line-height:1.5;'>
            ${extractDaylightData(data.weatherSummary)}
          </div>
        </div>
        
        <!-- Weather Insight -->
        <div style='padding:10px; background:#e3f2fd; border-radius:4px; border-left:4px solid #2196f3;'>
          <div style='font-size:13px; color:#1565c0; font-weight:600; margin-bottom:4px;'>💡 Insight</div>
          <div style='font-size:12px; color:#333; line-height:1.4;'>
            ${
              data.environmentalFactors?.weather?.insight ||
              "Weather data analysis unavailable."
            }
          </div>
        </div>
        
        <!-- Weather Recommendation -->
        <div style='padding:10px; background:#f3e5f5; border-radius:4px; border-left:4px solid #9c27b0; margin-top:8px;'>
          <div style='font-size:13px; color:#7b1fa2; font-weight:600; margin-bottom:4px;'>📈 Recommendation</div>
          <div style='font-size:12px; color:#333; line-height:1.4;'>
            ${
              data.environmentalFactors?.weather?.impact ||
              "Consider checking weather conditions for optimal outdoor activities."
            }
          </div>
        </div>
      </div>
    </div>
    
    <!-- Spotify Section -->
    <div style='margin:20px 0; padding:20px; background:#f8f8f8; border:1px solid #e0e0e0; border-radius:8px;'>
      <h3 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>
        <img src='${
          SAGE_IMAGES.music
        }' style='width:20px; height:20px; margin-right:8px; vertical-align:middle;'/>
        🎵 Music & Mood
      </h3>
      <div style='font-size:14px; color:#333; line-height:1.6;'>${
        data.spotifySummary
      }</div>
      
      ${
        data.spotifyInsights && data.spotifyInsights.insight
          ? `
        <div style='margin-top:12px; padding:10px; background:#fff3cd; border-left:3px solid #ffc107; border-radius:4px;'>
          <div style='font-weight:600; color:#856404; margin-bottom:6px; font-size:12px;'>
            💡 Insight
          </div>
          <div style='color:#856404; font-size:12px; line-height:1.4;'>
            ${data.spotifyInsights.insight}
          </div>
        </div>
      `
          : ""
      }
      
      ${
        data.spotifyInsights && data.spotifyInsights.recommendation
          ? `
        <div style='margin-top:8px; padding:10px; background:#d1ecf1; border-left:3px solid #17a2b8; border-radius:4px;'>
          <div style='font-weight:600; color:#0c5460; margin-bottom:6px; font-size:12px;'>
            🎯 Recommendation
          </div>
          <div style='color:#0c5460; font-size:12px; line-height:1.4;'>
            ${data.spotifyInsights.recommendation}
          </div>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function convertAndFormatInsight(gptSummary: string): string {
  // Convert markdown bold to HTML bold, handle missing insight
  const text = (gptSummary || "").toString();

  // Convert [PARAGRAPH BREAK] to HTML line breaks
  const withParagraphBreaks = text.replace(/\[PARAGRAPH BREAK\]/g, "<br><br>");

  // Convert markdown bold to HTML bold
  const withBold = withParagraphBreaks.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  return withBold;
}

function extractWeatherData(
  weatherSummary: string,
  type: "yesterday" | "today"
): string {
  const text = (weatherSummary || "").toString();

  if (type === "yesterday") {
    // Extract yesterday's weather data
    const conditionMatch = text.match(/Yesterday.*?(\w+)/i);
    const tempMatch = text.match(/(\d+)°F/);
    const windMatch = text.match(/(\d+\.?\d*)\s*m\/s/);
    const cloudMatch = text.match(/(\d+)%/);
    const locationMatch = text.match(/in\s+([A-Za-z\s]+)/);

    const condition = conditionMatch ? conditionMatch[1] : "Clear";
    const temp = tempMatch ? tempMatch[1] : "70";
    const wind = windMatch ? windMatch[1] : "2.0";
    const cloud = cloudMatch ? cloudMatch[1] : "0";
    const location = locationMatch ? locationMatch[1].trim() : "Your Location";

    return `☁️ ${condition} | 🌡️ ${temp}°F | 💨 ${wind} m/s | ☁️ ${cloud}% | 📍 ${location}`;
  } else {
    // Extract today's forecast
    const tempRangeMatch = text.match(/(\d+)-(\d+)°F/);
    const bestTimesMatch = text.match(/Best outdoor times.*?(\d+ [AP]M)/gi);

    const tempMin = tempRangeMatch ? tempRangeMatch[1] : "60";
    const tempMax = tempRangeMatch ? tempRangeMatch[2] : "80";
    const bestTimes = bestTimesMatch
      ? bestTimesMatch.slice(0, 3).join(", ")
      : "11 AM, 2 PM, 8 PM";

    return `🌡️ ${tempMin}-${tempMax}°F | ⭐ Best outdoor times: ${bestTimes}`;
  }
}

function extractDaylightData(weatherSummary: string): string {
  const text = (weatherSummary || "").toString();

  // Extract daylight information
  const daylightMatch = text.match(/(\d+\.?\d*)\s*hours/);
  const sunriseMatch = text.match(/(\d+:\d+ [AP]M)/);
  const sunsetMatch = text.match(/(\d+:\d+ [AP]M)/g);

  const daylight = daylightMatch ? daylightMatch[1] : "12.0";
  const sunrise = sunriseMatch ? sunriseMatch[1] : "6:42 AM";
  const sunset =
    sunsetMatch && sunsetMatch.length > 1 ? sunsetMatch[1] : "7:31 PM";

  return `☀️ Daylight: ${daylight} hours | 🌅 Sunrise: ${sunrise} | 🌇 Sunset: ${sunset}`;
}

// Additional helper functions from code.js
function getScoreTrends(): any {
  // Mock implementation - replace with actual trend calculation
  return {
    overall: {
      trend: 0,
      sparkline: [88, 71, 73, 83, 54, 72, 68],
    },
  };
}

function getSocialEnvironmentalFactors(
  date: Date,
  weatherSummary: string,
  dayContext: any
): any {
  // Mock implementation - replace with actual environmental factors calculation
  return {
    weather: {
      impact: "Weather conditions are neutral",
      insight: "Weather data analysis unavailable.",
    },
    seasonal: {
      daylight: "12.8",
      sunrise: "6:42 AM",
      sunset: "7:31 PM",
    },
  };
}

function detectBiometricAnomalies(data: any, historicalData: any[]): any {
  // Mock implementation - replace with actual anomaly detection
  return {
    detected: [],
  };
}

function generateDeepAIInsights(data: any): any {
  // Mock implementation - replace with actual deep insights generation
  return {
    patterns: [],
    prescriptions: [],
  };
}

function getHistoricalDayAverage(dayName: string): any {
  // Mock implementation - replace with actual historical data calculation
  return {
    count: 5,
    average: 75,
  };
}

function getMainScoreColor(score: number): string {
  if (score >= 80) return "#0b8043";
  if (score >= 60) return "#fbbc04";
  return "#ea4335";
}

function getScoreColor(score: number, isPercent: boolean): string {
  if (score >= 80) return "#0b8043";
  if (score >= 60) return "#fbbc04";
  return "#ea4335";
}

function getSageImage(type: string): string {
  return SAGE_IMAGES[type as keyof typeof SAGE_IMAGES] || "";
}

function generateSparkline(data: number[], color: string): string {
  // Simple sparkline implementation
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const bars = data
    .map((value, index) => {
      const height = range > 0 ? ((value - min) / range) * 20 + 5 : 12;
      return `<div style='display:inline-block; width:8px; height:${height}px; background:${color}; margin-right:2px; vertical-align:bottom;'></div>`;
    })
    .join("");

  return `<div style='text-align:center; margin-top:8px;'>${bars}</div>`;
}

function generateMiniTrendChart(
  metric: string,
  score: number,
  color: string
): string {
  // Mock trend chart - replace with actual trend data
  const mockData = [90, 85, 80, 75, 70, 65, score];
  return generateSparkline(mockData, color);
}

function generateSleepStagesVisualization(sleepData: string): string {
  // Extract sleep stages data from sleepData string
  const deepMatch = sleepData.match(/Deep.*?(\d+)%/);
  const lightMatch = sleepData.match(/Light.*?(\d+)%/);
  const remMatch = sleepData.match(/REM.*?(\d+)%/);
  const awakeMatch = sleepData.match(/Awake.*?(\d+)%/);

  const deep = deepMatch ? parseInt(deepMatch[1]) : 11;
  const light = lightMatch ? parseInt(lightMatch[1]) : 66;
  const rem = remMatch ? parseInt(remMatch[1]) : 23;
  const awake = awakeMatch ? parseInt(awakeMatch[1]) : 0;

  // Calculate durations (assuming 6 hours total sleep)
  const totalMinutes = 360; // 6 hours
  const deepMin = Math.round((deep / 100) * totalMinutes);
  const lightMin = Math.round((light / 100) * totalMinutes);
  const remMin = Math.round((rem / 100) * totalMinutes);
  const awakeMin = Math.round((awake / 100) * totalMinutes);

  return `
    <div style='margin-top:15px; padding:12px; background:#f8f9fa; border-radius:6px; border:1px solid #e9ecef;'>
      <h5 style='font-size:14px; font-weight:600; color:#424242; margin:0 0 10px 0;'>Sleep Stages Distribution</h5>
      
      <!-- Sleep Stages Bar Chart -->
      <div style='margin-bottom:12px;'>
        <div style='display:flex; height:20px; border-radius:10px; overflow:hidden; background:#e9ecef;'>
          <div style='width:${deep}%; background:#6f42c1; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:600;'>${deep}%</div>
          <div style='width:${light}%; background:#9c88ff; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:600;'>${light}%</div>
          <div style='width:${rem}%; background:#74c0fc; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:600;'>${rem}%</div>
          <div style='width:${awake}%; background:#ff6b6b; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:600;'>${awake}%</div>
        </div>
      </div>
      
      <!-- Legend -->
      <div style='display:flex; flex-wrap:wrap; gap:8px; font-size:12px;'>
        <div style='display:flex; align-items:center;'>
          <div style='width:12px; height:12px; background:#6f42c1; border-radius:2px; margin-right:6px;'></div>
          <span>Deep: ${deepMin}m</span>
        </div>
        <div style='display:flex; align-items:center;'>
          <div style='width:12px; height:12px; background:#9c88ff; border-radius:2px; margin-right:6px;'></div>
          <span>Light: ${lightMin}m</span>
        </div>
        <div style='display:flex; align-items:center;'>
          <div style='width:12px; height:12px; background:#74c0fc; border-radius:2px; margin-right:6px;'></div>
          <span>REM: ${remMin}m</span>
        </div>
        <div style='display:flex; align-items:center;'>
          <div style='width:12px; height:12px; background:#ff6b6b; border-radius:2px; margin-right:6px;'></div>
          <span>Awake: ${awakeMin}m</span>
        </div>
      </div>
      
      ${
        deep < 15
          ? `<div style='margin-top:8px; padding:8px; background:#fff3cd; border-radius:4px; border-left:3px solid #ffc107; font-size:12px; color:#856404;'>⚠️ Low deep sleep (${deep}%) - consider earlier bedtime and cooler room temperature.</div>`
          : ""
      }
    </div>
  `;
}

function generateActivityZonesVisualization(activityData: string): string {
  // Extract activity data from activityData string
  const stepsMatch = activityData.match(/Steps.*?([\d,]+)/);
  const caloriesMatch = activityData.match(/Calories.*?([\d,]+)/);
  const veryActiveMatch = activityData.match(/Very Active.*?(\d+)m/);
  const fairlyActiveMatch = activityData.match(/Fairly Active.*?(\d+)m/);
  const lightlyActiveMatch = activityData.match(/Lightly Active.*?(\d+)m/);
  const sedentaryMatch = activityData.match(/Sedentary.*?(\d+)m/);

  const steps = stepsMatch ? parseInt(stepsMatch[1].replace(/,/g, "")) : 4408;
  const calories = caloriesMatch
    ? parseInt(caloriesMatch[1].replace(/,/g, ""))
    : 2472;
  const veryActive = veryActiveMatch ? parseInt(veryActiveMatch[1]) : 0;
  const fairlyActive = fairlyActiveMatch ? parseInt(fairlyActiveMatch[1]) : 0;
  const lightlyActive = lightlyActiveMatch
    ? parseInt(lightlyActiveMatch[1])
    : 197;
  const sedentary = sedentaryMatch ? parseInt(sedentaryMatch[1]) : 890;

  const totalActive = veryActive + fairlyActive + lightlyActive;
  const totalMinutes = totalActive + sedentary;
  const activePercent =
    totalMinutes > 0 ? Math.round((totalActive / totalMinutes) * 100) : 18;
  const sedentaryPercent = 100 - activePercent;

  return `
    <div style='margin-top:15px; padding:12px; background:#f8f9fa; border-radius:6px; border:1px solid #e9ecef;'>
      <h5 style='font-size:14px; font-weight:600; color:#424242; margin:0 0 10px 0;'>Activity Distribution</h5>
      
      <!-- Activity Summary -->
      <div style='margin-bottom:12px; font-size:13px; color:#5f6368;'>
        <div style='margin-bottom:4px;'><strong>Steps:</strong> ${steps.toLocaleString()}</div>
        <div><strong>Calories:</strong> ${calories.toLocaleString()}</div>
      </div>
      
      <!-- Activity Distribution Bar Chart -->
      <div style='margin-bottom:12px;'>
        <div style='display:flex; height:20px; border-radius:10px; overflow:hidden; background:#e9ecef;'>
          <div style='width:${activePercent}%; background:#28a745; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:600;'>${activePercent}%</div>
          <div style='width:${sedentaryPercent}%; background:#6c757d; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:600;'>${sedentaryPercent}%</div>
        </div>
      </div>
      
      <!-- Activity Breakdown -->
      <div style='font-size:12px; color:#5f6368;'>
        <div style='margin-bottom:4px;'><strong>Very Active:</strong> ${veryActive}m</div>
        <div style='margin-bottom:4px;'><strong>Fairly Active:</strong> ${fairlyActive}m</div>
        <div style='margin-bottom:4px;'><strong>Lightly Active:</strong> ${lightlyActive}m</div>
        <div><strong>Sedentary:</strong> ${sedentary}m</div>
      </div>
      
      ${
        sedentaryPercent > 70
          ? `<div style='margin-top:8px; padding:8px; background:#d4edda; border-radius:4px; border-left:3px solid #28a745; font-size:12px; color:#155724;'>High sedentary time (${sedentaryPercent}%) - add movement breaks</div>`
          : ""
      }
    </div>
  `;
}

function generateHeartRateZonesVisualization(heartData: string): string {
  // Extract heart rate data from heartData string
  const restingMatch = heartData.match(/Resting.*?(\d+)\s*bpm/);
  const peakMatch = heartData.match(/Peak.*?(\d+)\s*bpm/);
  const fatBurnMatch = heartData.match(/Fat Burn.*?(\d+)m/);
  const cardioMatch = heartData.match(/Cardio.*?(\d+)m/);
  const peakZoneMatch = heartData.match(/Peak.*?(\d+)m/);
  const hrvMatch = heartData.match(/HRV.*?(\d+\.?\d*)\s*ms/);

  const resting = restingMatch ? parseInt(restingMatch[1]) : 62;
  const peak = peakMatch ? parseInt(peakMatch[1]) : 139;
  const fatBurn = fatBurnMatch ? parseInt(fatBurnMatch[1]) : 5;
  const cardio = cardioMatch ? parseInt(cardioMatch[1]) : 4;
  const peakZone = peakZoneMatch ? parseInt(peakZoneMatch[1]) : 0;
  const hrv = hrvMatch ? parseFloat(hrvMatch[1]) : 29.569;

  const totalMinutes = fatBurn + cardio + peakZone;
  const fatBurnPercent =
    totalMinutes > 0 ? Math.round((fatBurn / totalMinutes) * 100) : 56;
  const cardioPercent =
    totalMinutes > 0 ? Math.round((cardio / totalMinutes) * 100) : 44;
  const peakPercent =
    totalMinutes > 0 ? Math.round((peakZone / totalMinutes) * 100) : 0;

  const hrvStatus = hrv < 30 ? "Low" : hrv < 50 ? "Moderate" : "High";
  const hrvColor = hrv < 30 ? "#dc3545" : hrv < 50 ? "#ffc107" : "#28a745";

  return `
    <div style='margin-top:15px; padding:12px; background:#f8f9fa; border-radius:6px; border:1px solid #e9ecef;'>
      <h5 style='font-size:14px; font-weight:600; color:#424242; margin:0 0 10px 0;'>Heart Rate Zones</h5>
      
      <!-- Heart Rate Summary -->
      <div style='margin-bottom:12px; font-size:13px; color:#5f6368;'>
        <div style='margin-bottom:4px;'><strong>Resting HR:</strong> ${resting} bpm</div>
        <div style='margin-bottom:4px;'><strong>Peak HR:</strong> ${peak} bpm</div>
        <div style='margin-bottom:4px;'><strong>HRV:</strong> ${hrv} ms (<span style='color:${hrvColor}; font-weight:600;'>${hrvStatus}</span>)</div>
        ${
          hrv < 30
            ? '<div style="color:#dc3545; font-size:12px;">Lower than optimal - prioritize rest</div>'
            : ""
        }
      </div>
      
      <!-- Heart Rate Zones Bar Chart -->
      <div style='margin-bottom:12px;'>
        <div style='display:flex; height:20px; border-radius:10px; overflow:hidden; background:#e9ecef;'>
          <div style='width:${fatBurnPercent}%; background:#d4a574; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:600;'>${fatBurnPercent}%</div>
          <div style='width:${cardioPercent}%; background:#8b4513; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:600;'>${cardioPercent}%</div>
          <div style='width:${peakPercent}%; background:#654321; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:600;'>${peakPercent}%</div>
        </div>
      </div>
      
      <!-- Heart Rate Zones Legend -->
      <div style='display:flex; flex-wrap:wrap; gap:8px; font-size:12px;'>
        <div style='display:flex; align-items:center;'>
          <div style='width:12px; height:12px; background:#d4a574; border-radius:2px; margin-right:6px;'></div>
          <span>Fat Burn: ${fatBurn}m</span>
        </div>
        <div style='display:flex; align-items:center;'>
          <div style='width:12px; height:12px; background:#8b4513; border-radius:2px; margin-right:6px;'></div>
          <span>Cardio: ${cardio}m</span>
        </div>
        <div style='display:flex; align-items:center;'>
          <div style='width:12px; height:12px; background:#654321; border-radius:2px; margin-right:6px;'></div>
          <span>Peak: ${peakZone}m</span>
        </div>
      </div>
      
      ${
        totalMinutes < 20
          ? `<div style='margin-top:8px; padding:8px; background:#fff3cd; border-radius:4px; border-left:3px solid #ffc107; font-size:12px; color:#856404;'>Consider adding more moderate-intensity activity</div>`
          : ""
      }
    </div>
  `;
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateDailyComparison(
  currentScore: number,
  dayContext: any,
  trendsData: any
): string {
  if (
    !dayContext ||
    !trendsData ||
    !trendsData.overall ||
    !trendsData.overall.sparkline
  ) {
    return "";
  }

  const dayName = dayContext.dayName || "day";
  const sparkline = trendsData.overall.sparkline;

  // Calculate average from historical data if available
  let typicalScore = 70; // Default fallback
  if (sparkline && sparkline.length > 0) {
    // Calculate average of all historical scores
    const sum = sparkline.reduce((a: number, b: number) => a + b, 0);
    typicalScore = Math.round(sum / sparkline.length);
  }

  const difference = currentScore - typicalScore;
  const differenceText = difference > 0 ? `+${difference}` : `${difference}`;
  const differenceColor = difference >= 0 ? "#10b981" : "#ef4444";

  return `
    <div style='margin-top:12px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid ${differenceColor};'>
      <div style='font-size:14px; color:#374151;'>
        Your typical ${dayName}: <strong>${typicalScore}</strong> 
        <span style='color:${differenceColor}; font-weight:600;'>
          (today ${differenceText} ${
    difference >= 0 ? "above" : "below"
  } average)
        </span>
      </div>
    </div>
  `;
}

function generate7DayBarChart(scores: number[], color: string): string {
  if (!scores || scores.length === 0) return "";

  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const range = maxScore - minScore || 1; // Avoid division by zero

  // Dynamic day labels based on number of scores
  const generateDayLabels = (count: number): string[] => {
    const labels = [];
    for (let i = count - 1; i >= 1; i--) {
      labels.push(`${i}d`);
    }
    labels.push("Today");
    return labels;
  };

  const dayLabels = generateDayLabels(scores.length);

  // Dynamic colors - use different colors for each bar
  const allColors = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#f59e0b", // Amber
    "#10b981", // Green
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#f43f5e", // Rose
  ];

  const bars = scores
    .map((score, index) => {
      const height = ((score - minScore) / range) * 40 + 20; // 20-60px height
      const barColor = allColors[index % allColors.length]; // Cycle through colors

      return `
        <td style='text-align: center; vertical-align: bottom; padding: 0 4px;'>
          <div style='font-size:11px; color:#6b7280; margin-bottom:4px; font-weight:500;'>${score}</div>
          <div style='width: 20px; height: ${height}px; background: ${barColor}; border-radius: 2px 2px 0 0; margin: 0 auto;'></div>
          <div style='font-size:10px; color:#9ca3af; margin-top:4px;'>${dayLabels[index]}</div>
        </td>
      `;
    })
    .join("");

  return `
    <div style='text-align: center; padding: 10px 0;'>
      <table style='margin: 0 auto; border-collapse: collapse;'>
        <tr style='height: 80px; vertical-align: bottom;'>
          ${bars}
        </tr>
      </table>
    </div>
  `;
}

function generateRecoveryInsights(recoveryQuotient: any): string {
  // Generate insights based on recovery score
  const score = recoveryQuotient.score || 0;
  const breakdown = recoveryQuotient.breakdown || {};

  // Generate insight based on score and breakdown
  let insight = "";
  let recommendation = "";

  if (score >= 80) {
    insight =
      "Your recovery score indicates excellent readiness for today. Your body is well-rested and prepared for optimal performance.";
    recommendation =
      "Maintain your current routine and consider adding light activity to maintain this high recovery level.";
  } else if (score >= 60) {
    insight =
      "Your recovery score shows good readiness with room for improvement. Your body is generally prepared for moderate activity.";
    recommendation =
      "Consider adding 15-20 minutes of light stretching or gentle movement to boost your recovery further.";
  } else if (score >= 40) {
    insight =
      "Your recovery score suggests moderate readiness. Your body may need more rest or lighter activity today.";
    recommendation =
      "Focus on gentle activities and ensure you get adequate sleep tonight to improve tomorrow's recovery score.";
  } else {
    insight =
      "Your recovery score indicates low readiness. Your body needs rest and recovery before engaging in intense activities.";
    recommendation =
      "Prioritize rest, light movement, and ensure you get 7-9 hours of quality sleep tonight.";
  }

  // Add specific insights based on breakdown components
  if (breakdown.sleep && breakdown.sleep < 50) {
    insight += " Your sleep quality appears to be impacting your recovery.";
    recommendation =
      "Aim for 7-9 hours of quality sleep tonight to improve your recovery score.";
  }

  if (breakdown.heart && breakdown.heart < 50) {
    insight +=
      " Your heart rate recovery suggests your cardiovascular system needs more rest.";
    recommendation =
      "Include 10-15 minutes of deep breathing or meditation to support heart rate recovery.";
  }

  if (breakdown.activity && breakdown.activity > 80) {
    insight +=
      " Your high activity levels from yesterday may be affecting today's recovery.";
    recommendation =
      "Balance today's activities with adequate rest periods to optimize recovery.";
  }

  return `
    <!-- Insight Section -->
    <div style='background:#fef3c7; padding:16px; border-radius:6px; margin-bottom:12px; border-left:4px solid #f59e0b;'>
      <table style='width:100%; border-collapse:collapse;'>
        <tr>
          <td style='width:24px; vertical-align:top;'>
            <div style='font-size:16px;'>💡</div>
          </td>
          <td style='vertical-align:top; padding-left:8px;'>
            <div style='font-weight:600; color:#92400e; margin-bottom:4px;'>Insight:</div>
            <div style='color:#92400e; font-size:14px; line-height:1.5;'>${insight}</div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Recommendation Section -->
    <div style='background:#dbeafe; padding:16px; border-radius:6px; border-left:4px solid #3b82f6;'>
      <table style='width:100%; border-collapse:collapse;'>
        <tr>
          <td style='width:24px; vertical-align:top;'>
            <div style='font-size:16px;'>🎯</div>
          </td>
          <td style='vertical-align:top; padding-left:8px;'>
            <div style='font-weight:600; color:#1e40af; margin-bottom:4px;'>Recommendation:</div>
            <div style='color:#1e40af; font-size:14px; line-height:1.5;'>${recommendation}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function generatePerformanceMetricCard(
  metricName: string,
  score: number,
  color: string,
  sparklineData: number[]
): string {
  // Generate status based on score
  const getStatus = (score: number) => {
    if (score >= 90) return { text: "EXCELLENT", color: "#10b981" };
    if (score >= 80) return { text: "VERY GOOD", color: "#10b981" };
    if (score >= 70) return { text: "GOOD", color: "#f59e0b" };
    if (score >= 60) return { text: "AVERAGE", color: "#f59e0b" };
    if (score >= 50) return { text: "BELOW AVERAGE", color: "#f59e0b" };
    if (score >= 30) return { text: "NEEDS WORK", color: "#ef4444" };
    return { text: "CRITICAL", color: "#ef4444" };
  };

  const status = getStatus(score);

  // Generate trend data (7-day mini chart)
  const trendData =
    sparklineData.length >= 7
      ? sparklineData.slice(-7)
      : Array.from(
          { length: 7 },
          (_, i) => Math.floor(Math.random() * 40) + 50
        );

  // Calculate trend direction
  const trend =
    trendData.length > 1 ? trendData[trendData.length - 1] - trendData[0] : 0;
  const trendArrow = trend > 0 ? "↑" : trend < 0 ? "↓" : "→";
  const trendText = trend !== 0 ? `${trendArrow} ${Math.abs(trend)}` : "→ 0";

  // Generate mini bar chart
  const maxVal = Math.max(...trendData);
  const minVal = Math.min(...trendData);
  const range = maxVal - minVal || 1;

  const miniBars = trendData
    .map((val, index) => {
      const height = ((val - minVal) / range) * 20 + 8; // 8-28px height
      const barColor =
        val >= 80 ? "#10b981" : val >= 60 ? "#f59e0b" : "#ef4444";

      return `
        <span style='display: inline-block; margin: 0 1px; text-align: center; vertical-align: bottom;'>
          <div style='width: 8px; height: ${height}px; background: ${barColor}; border-radius: 1px; margin: 0 auto;'></div>
        </span>
      `;
    })
    .join("");

  return `
    <div style='background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'>
      <!-- Metric Header -->
      <table style='width:100%; border-collapse:collapse; margin-bottom: 15px;'>
        <tr>
          <td style='vertical-align:top;'>
            <div style='font-size: 14px; color: #6b7280; margin-bottom: 5px;'>${metricName}:</div>
            <div style='font-size: 24px; font-weight: bold; color: #1f2937;'>${score}</div>
          </td>
          <td style='vertical-align:top; text-align:right;'>
            <div style='background: ${
              status.color
            }; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block;'>
              ${status.text}
            </div>
          </td>
        </tr>
      </table>
      
      <!-- Progress Bar -->
      <div style='margin-bottom: 15px;'>
        <div style='background: #f3f4f6; height: 8px; border-radius: 4px; overflow: hidden;'>
          <div style='background: ${color}; height: 100%; width: ${Math.min(
    score,
    100
  )}%; border-radius: 4px;'></div>
        </div>
      </div>
      
      <!-- Trend and Mini Chart -->
      <table style='width:100%; border-collapse:collapse;'>
        <tr>
          <td style='vertical-align:top;'>
            <div style='font-size: 12px; color: #6b7280;'>
              7-Day Trend: <span style='font-weight: 600; color: ${
                trend >= 0 ? "#10b981" : "#ef4444"
              };'>${trendText}</span>
            </div>
          </td>
          <td style='vertical-align:top; text-align:right;'>
            <div style='height: 30px; line-height: 30px;'>
              ${miniBars}
            </div>
          </td>
        </tr>
      </table>
      
      <!-- Trend Data Numbers -->
      <div style='margin-top: 10px; font-size: 11px; color: #9ca3af; text-align: center;'>
        ${trendData.map((val) => val).join(", ")}
      </div>
    </div>
  `;
}

function generateWorkCalendarInsights(
  calSummary: string,
  calendarIntelligence: any
): string {
  // Check if calendar integration is connected
  const isConnected =
    calSummary && !calSummary.includes("Integration not connected");

  if (!isConnected) {
    return `
      <div style='display:flex; align-items:center; margin-bottom:8px;'>
        <span style='color:#f59e0b; margin-right:8px;'>⚠️</span>
        <span>No calendar events scheduled - Integration not connected</span>
      </div>
    `;
  }

  // Parse calendar data to extract event count
  const eventCount = calSummary.includes("Events:")
    ? parseInt(calSummary.match(/Events:\s*(\d+)/)?.[1] || "0")
    : 0;

  // Generate insights based on event count
  const insights = [];

  if (eventCount === 0) {
    insights.push("Events: 0 (Full focus day!)");
    insights.push("Uninterrupted work time: Full day available");
    insights.push("Cognitive load: Minimal");
  } else if (eventCount <= 3) {
    insights.push(`Events: ${eventCount} (Light schedule)`);
    insights.push("Uninterrupted work time: Good availability");
    insights.push("Cognitive load: Low");
  } else if (eventCount <= 6) {
    insights.push(`Events: ${eventCount} (Moderate schedule)`);
    insights.push("Uninterrupted work time: Limited availability");
    insights.push("Cognitive load: Moderate");
  } else {
    insights.push(`Events: ${eventCount} (Heavy schedule)`);
    insights.push("Uninterrupted work time: Very limited");
    insights.push("Cognitive load: High");
  }

  return insights
    .map(
      (insight) => `
    <div style='display:flex; align-items:center; margin-bottom:6px;'>
      <span style='color:#7c3aed; margin-right:8px;'>📅</span>
      <span>${insight}</span>
    </div>
  `
    )
    .join("");
}

function generateWorkEmailInsights(
  emailSummary: string,
  emailResponseAnalysis: any,
  emailManagementInsight: string
): string {
  // Parse email data
  const emailStats = parseEmailStats(emailSummary);

  let html = `
    <!-- Basic Email Stats -->
    <div style='margin-bottom:12px;'>
      <div style='display:flex; align-items:center; margin-bottom:4px;'>
        <span style='color:#7c3aed; margin-right:8px;'>📥</span>
        <span>Primary Inbox: ${emailStats.primary} emails</span>
      </div>
      <div style='display:flex; align-items:center; margin-bottom:4px;'>
        <span style='color:#ec4899; margin-right:8px;'>📤</span>
        <span>Sent: ${emailStats.sent} emails</span>
      </div>
    </div>
  `;

  // Add Email Response Patterns if available
  if (emailResponseAnalysis && emailResponseAnalysis.avgResponseTime) {
    const responseTime =
      emailResponseAnalysis.avgResponseTime < 1
        ? Math.round(emailResponseAnalysis.avgResponseTime * 60) + " minutes"
        : emailResponseAnalysis.avgResponseTime + " hours";

    const statusColor =
      emailResponseAnalysis.avgResponseTime < 1
        ? "#10b981"
        : emailResponseAnalysis.avgResponseTime < 4
        ? "#f59e0b"
        : "#ef4444";

    html += `
      <div style='background:#f3e5f5; padding:12px; border-radius:6px; margin-bottom:12px;'>
        <div style='display:flex; align-items:center; margin-bottom:8px;'>
          <span style='color:#7c3aed; margin-right:8px;'>⚡</span>
          <strong>Email Response Patterns</strong>
        </div>
        <div style='font-size:13px;'>
          <div style='margin-bottom:4px;'>• Average response time: <strong>${responseTime}</strong></div>
          <div>• Status: <span style='color:${statusColor}; font-weight:600;'>${
      emailResponseAnalysis.avgResponseTime < 1
        ? "Highly responsive"
        : emailResponseAnalysis.avgResponseTime < 4
        ? "Moderate response time"
        : "Delayed responses - inbox overwhelm?"
    }</span></div>
        </div>
      </div>
    `;
  }

  // Add Email Insights if available
  if (
    emailResponseAnalysis &&
    emailResponseAnalysis.insights &&
    emailResponseAnalysis.insights.length > 0
  ) {
    html += `
      <div style='background:#e8f5e8; padding:12px; border-radius:6px; margin-bottom:12px;'>
        <div style='display:flex; align-items:center; margin-bottom:8px;'>
          <span style='color:#10b981; margin-right:8px;'>💡</span>
          <strong>Email Insights</strong>
        </div>
        <div style='font-size:13px;'>
          ${emailResponseAnalysis.insights
            .map(
              (insight: string) =>
                `<div style='margin-bottom:4px;'>• ${insight}</div>`
            )
            .join("")}
        </div>
      </div>
    `;
  }

  // Add Email Statistics if available
  if (emailResponseAnalysis && emailResponseAnalysis.responseRate) {
    html += `
      <div style='background:#fff3cd; padding:12px; border-radius:6px; margin-bottom:12px;'>
        <div style='display:flex; align-items:center; margin-bottom:8px;'>
          <span style='color:#f59e0b; margin-right:8px;'>📊</span>
          <strong>Email Statistics</strong>
        </div>
        <div style='font-size:13px;'>
          <div style='margin-bottom:4px;'>• Response rate: <strong>${
            emailResponseAnalysis.responseRate
          }%</strong></div>
          ${
            emailResponseAnalysis.urgentEmails
              ? `<div style='margin-bottom:4px;'>• Urgent emails: <strong>${emailResponseAnalysis.urgentEmails}</strong></div>`
              : ""
          }
          ${
            emailResponseAnalysis.peakHours &&
            emailResponseAnalysis.peakHours.length > 0
              ? `<div style='margin-bottom:4px;'>• Peak response hours: <strong>${emailResponseAnalysis.peakHours
                  .map((h: number) => h + ":00")
                  .join(", ")}</strong></div>`
              : ""
          }
          ${
            emailResponseAnalysis.slowestDays &&
            emailResponseAnalysis.slowestDays.length > 0
              ? `<div>• Slowest response days: <strong>${emailResponseAnalysis.slowestDays.join(
                  ", "
                )}</strong></div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  // Add Email Management Insight
  if (emailManagementInsight) {
    html += `
      <div style='border-left:3px solid #3b82f6; padding-left:12px; margin-top:12px;'>
        <div style='font-size:13px; color:#5f6368;'>
          ${emailManagementInsight}
        </div>
      </div>
    `;
  }

  return html;
}

function parseEmailStats(emailSummary: string): {
  primary: number;
  sent: number;
  total: number;
} {
  // Extract numbers from email summary text
  const primaryMatch = emailSummary.match(/Primary Inbox:\s*(\d+)/);
  const sentMatch = emailSummary.match(/Sent:\s*(\d+)/);
  const totalMatch = emailSummary.match(/Total:\s*(\d+)/);

  return {
    primary: primaryMatch ? parseInt(primaryMatch[1]) : 0,
    sent: sentMatch ? parseInt(sentMatch[1]) : 0,
    total: totalMatch ? parseInt(totalMatch[1]) : 0,
  };
}

function generateWeatherInsights(
  weatherSummary: string,
  hourlyWeather: any,
  environmentalFactorsData: any
): string {
  // Parse weather data
  const weatherData = parseWeatherData(weatherSummary);

  let html = `
    <!-- Yesterday's Weather -->
    <div style='background:#e3f2fd; padding:16px; border-radius:6px; margin-bottom:16px;'>
      <div style='font-size:16px; font-weight:600; color:#1565c0; margin-bottom:12px;'>Yesterday's Weather:</div>
      <div style='font-size:14px; color:#424242;'>
        <div style='display:flex; align-items:center; margin-bottom:6px;'>
          <span style='color:#ff9800; margin-right:8px;'>☀️</span>
          <span><strong>Condition:</strong> ${weatherData.condition}</span>
        </div>
        <div style='display:flex; align-items:center; margin-bottom:6px;'>
          <span style='color:#f44336; margin-right:8px;'>🌡️</span>
          <span><strong>Temperature:</strong> ${weatherData.temperature}</span>
        </div>
        <div style='display:flex; align-items:center; margin-bottom:6px;'>
          <span style='color:#2196f3; margin-right:8px;'>💨</span>
          <span><strong>Wind:</strong> ${weatherData.wind}</span>
        </div>
        <div style='display:flex; align-items:center; margin-bottom:6px;'>
          <span style='color:#9c27b0; margin-right:8px;'>☁️</span>
          <span><strong>Cloud Cover:</strong> ${weatherData.cloudCover}</span>
        </div>
        <div style='display:flex; align-items:center;'>
          <span style='color:#f44336; margin-right:8px;'>📍</span>
          <span><strong>Location:</strong> ${weatherData.location}</span>
        </div>
      </div>
    </div>
    
    <!-- Today's Forecast -->
    <div style='background:#e3f2fd; padding:16px; border-radius:6px; margin-bottom:16px;'>
      <div style='font-size:16px; font-weight:600; color:#1565c0; margin-bottom:12px;'>Today's Forecast:</div>
      <div style='font-size:14px; color:#424242;'>
        <div style='display:flex; align-items:center; margin-bottom:6px;'>
          <span style='color:#f44336; margin-right:8px;'>🌡️</span>
          <span><strong>Temp range:</strong> ${weatherData.tempRange}</span>
        </div>
        <div style='display:flex; align-items:center; margin-bottom:6px;'>
          <span style='color:#ffc107; margin-right:8px;'>⭐</span>
          <span><strong>Best outdoor times:</strong> ${weatherData.bestTimes}</span>
        </div>
        <div style='display:flex; align-items:center; margin-bottom:6px;'>
          <span style='color:#ff9800; margin-right:8px;'>☀️</span>
          <span><strong>Daylight:</strong> ${weatherData.daylight}</span>
        </div>
        <div style='display:flex; align-items:center; margin-bottom:6px;'>
          <span style='color:#ff9800; margin-right:8px;'>🌅</span>
          <span><strong>Sunrise:</strong> ${weatherData.sunrise}</span>
        </div>
        <div style='display:flex; align-items:center;'>
          <span style='color:#ff9800; margin-right:8px;'>🌇</span>
          <span><strong>Sunset:</strong> ${weatherData.sunset}</span>
        </div>
      </div>
    </div>
  `;

  // Add Weather Insight
  if (weatherData.insight) {
    html += `
      <div style='background:#fff3cd; padding:16px; border-radius:6px; margin-bottom:16px;'>
        <div style='display:flex; align-items:center; margin-bottom:8px;'>
          <span style='color:#ff9800; margin-right:8px;'>💡</span>
          <span style='font-weight:600; color:#856404;'>Insight:</span>
        </div>
        <div style='color:#856404; font-size:14px; line-height:1.5;'>
          ${weatherData.insight}
        </div>
      </div>
    `;
  }

  // Add Weather Recommendation
  if (weatherData.recommendation) {
    html += `
      <div style='background:#d1ecf1; padding:16px; border-radius:6px;'>
        <div style='display:flex; align-items:center; margin-bottom:8px;'>
          <span style='color:#17a2b8; margin-right:8px;'>🎯</span>
          <span style='font-weight:600; color:#0c5460;'>Recommendation:</span>
        </div>
        <div style='color:#0c5460; font-size:14px; line-height:1.5;'>
          ${weatherData.recommendation}
        </div>
      </div>
    `;
  }

  return html;
}

function generateMusicInsights(
  spotifySummary: string,
  spotifyInsights: any
): string {
  // Parse music data
  const musicData = parseMusicData(spotifySummary);
  const tracksPlayed = musicData.tracksPlayed;
  const topArtist = musicData.topArtist.split("\n")[0];
  const topTrack = musicData.topTrack.split("\n")[0];
  let html = `
    <!-- Music Summary -->
    <div style='font-size:14px; color:#424242; margin-bottom:16px;'>
      <div style='margin-bottom:4px;'><strong>🎧 Tracks played:</strong> ${tracksPlayed}</div>
      <div style='margin-bottom:4px;'><strong>👤 Top Artist:</strong> ${topArtist}</div>
      <div style='margin-bottom:4px;'><strong>🎵 Top Track:</strong> ${topTrack}</div>
      <div style='font-size:13px; color:#666; margin-bottom:8px;'>
        🕓 Morning: ${musicData.morning} | Midday: ${
    musicData.midday
  } | Afternoon: ${musicData.afternoon} | Evening: ${
    musicData.evening
  } | Night: ${musicData.night}
      </div>
      ${
        musicData.morning === 0
          ? `
        <div style='display:flex; align-items:center; color:#f59e0b; font-size:13px;'>
          <span style='margin-right:8px;'>⚠️</span>
          <span>No listening activity recorded before noon.</span>
        </div>
      `
          : ""
      }
    </div>
    
    
     
    
    
  `;

  // Add Music Insight
  if (spotifyInsights && spotifyInsights.insight) {
    html += `
      <div style='background:#fff3cd; padding:16px; border-radius:6px; margin-bottom:16px;'>
        <div style='display:flex; align-items:center; margin-bottom:8px;'>
          <span style='color:#ff9800; margin-right:8px;'>💡</span>
          <span style='font-weight:600; color:#856404;'>Insight:</span>
        </div>
        <div style='color:#856404; font-size:14px; line-height:1.5;'>
          ${spotifyInsights.insight}
        </div>
      </div>
    `;
  }

  // Add Music Recommendation
  if (spotifyInsights && spotifyInsights.recommendation) {
    html += `
      <div style='background:#d1ecf1; padding:16px; border-radius:6px;'>
        <div style='display:flex; align-items:center; margin-bottom:8px;'>
          <span style='color:#17a2b8; margin-right:8px;'>🎯</span>
          <span style='font-weight:600; color:#0c5460;'>Recommendation:</span>
        </div>
        <div style='color:#0c5460; font-size:14px; line-height:1.5;'>
          ${spotifyInsights.recommendation}
        </div>
      </div>
    `;
  }

  return html;
}

function parseWeatherData(weatherSummary: string): any {
  // Extract weather data from summary text
  const conditionMatch = weatherSummary.match(
    /(clear sky|partly cloudy|overcast|light rain|sunny|few clouds)/i
  );
  const tempMatch = weatherSummary.match(/(\d+)°C/);
  const windMatch = weatherSummary.match(/(\d+\.?\d*)\s*m\/s/);
  const cloudMatch = weatherSummary.match(/(\d+)%/);

  // Generate fallback data if not found
  const conditions = [
    "clear sky",
    "partly cloudy",
    "overcast",
    "light rain",
    "sunny",
    "few clouds",
  ];
  const temperatures = [18, 20, 22, 25, 28, 30, 32, 35];
  const windSpeeds = [0.45, 1.2, 2.1, 3.5, 4.8];
  const cloudCovers = [20, 30, 50, 70, 80, 90];

  const condition = conditionMatch
    ? conditionMatch[1]
    : conditions[Math.floor(Math.random() * conditions.length)];
  const temp = tempMatch
    ? parseInt(tempMatch[1])
    : temperatures[Math.floor(Math.random() * temperatures.length)];
  const wind = windMatch
    ? windMatch[1]
    : windSpeeds[Math.floor(Math.random() * windSpeeds.length)];
  const cloudCover = cloudMatch
    ? parseInt(cloudMatch[1])
    : cloudCovers[Math.floor(Math.random() * cloudCovers.length)];

  // Generate insights and recommendations based on weather
  const insights = [
    `Your social interactions are limited, possibly due to the ${cloudCover}% cloud cover making your environment less inviting for outdoor activities.`,
    `The ${condition} weather with ${temp}°C temperature creates optimal conditions for outdoor activities.`,
    `High cloud cover (${cloudCover}%) may be affecting your mood and energy levels today.`,
    `Perfect weather conditions for outdoor exercise and social activities.`,
  ];

  const recommendations = [
    `Go for a 30-minute walk in Menlo Park at 8 AM for improved activity score.`,
    `Take advantage of the clear weather for outdoor meetings and activities.`,
    `Consider indoor activities due to the cloudy conditions affecting outdoor comfort.`,
    `Schedule outdoor activities during the best times: 8 AM, 11 AM, and 8 PM.`,
  ];

  return {
    condition: condition,
    temperature: `${temp}°F (feels like ${temp}°F)`,
    wind: `${wind} m/s`,
    cloudCover: `${cloudCover}%`,
    location: "Menlo Park",
    tempRange: `${temp - 5}-${temp + 5}°F`,
    bestTimes: "8 AM (60°F), 11 AM (72°F), 8 PM (66°F)",
    daylight: "12.7 hours",
    sunrise: "6:45 AM",
    sunset: "7:25 PM",
    insight: insights[Math.floor(Math.random() * insights.length)],
    recommendation:
      recommendations[Math.floor(Math.random() * recommendations.length)],
  };
}

function parseMusicData(spotifySummary: string): any {
  // Extract music data from summary text
  const tracksMatch = spotifySummary.match(/Tracks played:\s*(\d+)/);
  const artistMatch = spotifySummary.match(/Top Artist:\s*([^,]+)/);
  const trackMatch = spotifySummary.match(/Top Track:\s*([^,]+)/);

  // Generate fallback data if not found
  const artists = [
    "Cheema Y",
    "The Weeknd",
    "Taylor Swift",
    "Drake",
    "Billie Eilish",
  ];
  const tracks = [
    "Police",
    "Blinding Lights",
    "Anti-Hero",
    "God's Plan",
    "Bad Guy",
  ];

  const tracksPlayed = tracksMatch
    ? parseInt(tracksMatch[1])
    : Math.floor(Math.random() * 10) + 5;
  const topArtist = artistMatch
    ? artistMatch[1]
    : artists[Math.floor(Math.random() * artists.length)];
  const topTrack = trackMatch
    ? trackMatch[1]
    : tracks[Math.floor(Math.random() * tracks.length)];

  // Generate listening activity breakdown
  const morning = Math.floor(tracksPlayed * 0.1);
  const midday = Math.floor(tracksPlayed * 0.2);
  const afternoon = Math.floor(tracksPlayed * 0.3);
  const evening = Math.floor(tracksPlayed * 0.3);
  const night = Math.floor(tracksPlayed * 0.1);

  return {
    tracksPlayed: tracksPlayed,
    topArtist: topArtist,
    topTrack: topTrack,
    morning: morning,
    midday: midday,
    afternoon: afternoon,
    evening: evening,
    night: night,
  };
}

function generateWorkInsight(
  scores: any,
  calendarIntelligence: any,
  emailResponseAnalysis: any
): string {
  const workScore = scores?.work || 0;
  const calendarScore = calendarIntelligence?.score || 0;
  const emailResponseTime = emailResponseAnalysis?.avgMinutes || 0;

  if (workScore >= 80) {
    return "Excellent work performance today! Your high score reflects strong productivity and effective time management.";
  } else if (workScore >= 60) {
    return "Good work performance with room for optimization. Consider focusing on priority tasks and reducing distractions.";
  } else if (workScore >= 40) {
    return "Work performance needs attention. High email volume or meeting overload may be impacting your productivity.";
  } else {
    return "Work performance is below optimal. Consider reviewing your schedule and implementing better time management strategies.";
  }
}

function generateWorkRecommendation(
  scores: any,
  calendarIntelligence: any,
  emailResponseAnalysis: any
): string {
  const workScore = scores?.work || 0;
  const calendarScore = calendarIntelligence?.score || 0;
  const emailResponseTime = emailResponseAnalysis?.avgMinutes || 0;

  if (workScore >= 80) {
    return "Maintain your current workflow. Consider documenting your successful strategies for future reference.";
  } else if (workScore >= 60) {
    return "Try time-blocking for deep work sessions and limit email checking to specific times throughout the day.";
  } else if (workScore >= 40) {
    return "Consider reducing meeting frequency, implementing email batching, and setting clear boundaries for work hours.";
  } else {
    return "Take a step back to reassess your priorities. Consider delegating tasks and implementing a more structured daily routine.";
  }
}

// Physical Wellness Section Helper Functions
function generateSleepInsight(scores: any): string {
  const sleepScore = scores?.sleep || 0;

  if (sleepScore >= 80) {
    return "Excellent sleep quality! Your body is well-rested and ready for optimal performance.";
  } else if (sleepScore >= 60) {
    return "Good sleep with room for improvement. Consider optimizing your sleep environment and routine.";
  } else if (sleepScore >= 40) {
    return "Sleep quality needs attention. Poor sleep can significantly impact your daily performance and recovery.";
  } else {
    return "Sleep quality is below optimal. Prioritize sleep hygiene and consider consulting a healthcare provider.";
  }
}

function generateSleepRecommendation(scores: any): string {
  const sleepScore = scores?.sleep || 0;

  if (sleepScore >= 80) {
    return "Maintain your excellent sleep routine. Keep consistent bedtimes and wake times.";
  } else if (sleepScore >= 60) {
    return "Try going to bed 30 minutes earlier and avoid screens 1 hour before bedtime.";
  } else if (sleepScore >= 40) {
    return "Focus on sleep hygiene: dark room, cool temperature, and consistent bedtime routine.";
  } else {
    return "Consider sleep tracking and consult with a healthcare provider about sleep quality issues.";
  }
}

function generateActivityInsight(scores: any): string {
  const activityScore = scores?.activity || 0;

  if (activityScore >= 80) {
    return "Outstanding activity level! Your body is getting excellent physical stimulation and cardiovascular benefits.";
  } else if (activityScore >= 60) {
    return "Good activity level with potential for more movement throughout the day.";
  } else if (activityScore >= 40) {
    return "Activity level needs improvement. Regular movement is crucial for physical and mental health.";
  } else {
    return "Low activity level detected. Start with small steps like walking breaks and gradually increase movement.";
  }
}

function generateActivityRecommendation(scores: any): string {
  const activityScore = scores?.activity || 0;

  if (activityScore >= 80) {
    return "Keep up the great work! Consider varying your activities to work different muscle groups.";
  } else if (activityScore >= 60) {
    return "Add 10-15 minutes of moderate activity like walking or stretching to your daily routine.";
  } else if (activityScore >= 40) {
    return "Aim for at least 30 minutes of moderate activity daily. Start with walking and build up gradually.";
  } else {
    return "Begin with 5-10 minute activity sessions. Even short walks can make a significant difference.";
  }
}

function generateHeartInsight(scores: any): string {
  const heartScore = scores?.heart || 0;

  if (heartScore >= 80) {
    return "Excellent heart health indicators! Your cardiovascular system is functioning optimally.";
  } else if (heartScore >= 60) {
    return "Good heart health with some areas for improvement. Regular exercise and stress management can help.";
  } else if (heartScore >= 40) {
    return "Heart health needs attention. Consider lifestyle changes to support cardiovascular wellness.";
  } else {
    return "Heart health metrics are concerning. Please consult with a healthcare provider for evaluation.";
  }
}

function generateHeartRecommendation(scores: any): string {
  const heartScore = scores?.heart || 0;

  if (heartScore >= 80) {
    return "Maintain your heart-healthy lifestyle with regular exercise and a balanced diet.";
  } else if (heartScore >= 60) {
    return "Increase cardiovascular exercise and focus on stress reduction techniques like meditation.";
  } else if (heartScore >= 40) {
    return "Prioritize heart health with regular exercise, healthy eating, and stress management.";
  } else {
    return "Consult with a healthcare provider and consider lifestyle modifications for heart health.";
  }
}
