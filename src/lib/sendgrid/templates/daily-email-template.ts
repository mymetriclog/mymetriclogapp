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
  }
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

  // Extract key stats with improved pattern matching
  // Sleep data - try multiple patterns
  let sleepStr = "N/A";
  const sleepMatch1 = (fitbitSleep || "").match(/(\d+)h (\d+)m/);
  const sleepMatch2 = (fitbitSleep || "").match(/Sleep: (\d+h \d+m)/);
  const sleepMatch3 = (fitbitSleep || "").match(/(\d+)h (\d+)m \(/);

  if (sleepMatch1) {
    sleepStr = sleepMatch1[1] + "h " + sleepMatch1[2] + "m";
  } else if (sleepMatch2) {
    sleepStr = sleepMatch2[1];
  } else if (sleepMatch3) {
    sleepStr = sleepMatch3[1] + "h " + sleepMatch3[2] + "m";
  }

  // Steps data - try multiple patterns
  let stepsStr = "N/A";
  const stepsMatch1 = (fitbitActivity || "").match(/👣 Steps: ([\d,]+)/);
  const stepsMatch2 = (fitbitActivity || "").match(/Steps: ([\d,]+)/);

  if (stepsMatch1) {
    stepsStr = stepsMatch1[1];
  } else if (stepsMatch2) {
    stepsStr = stepsMatch2[1];
  }

  // Calories data - try multiple patterns
  let caloriesStr = "N/A";
  const caloriesMatch1 = (fitbitActivity || "").match(
    /🔥 Calories burned: ([\d,]+)/
  );
  const caloriesMatch2 = (fitbitActivity || "").match(/Calories: ([\d,]+)/);

  if (caloriesMatch1) {
    caloriesStr = caloriesMatch1[1] + " cal";
  } else if (caloriesMatch2) {
    caloriesStr = caloriesMatch2[1] + " cal";
  }

  // Active minutes data - try multiple patterns
  let activeStr = "N/A";
  const activeMatch1 = (fitbitActivity || "").match(/💪 Very Active: (\d+)/);
  const activeMatch2 = (fitbitActivity || "").match(/Very Active: (\d+)/);
  const activeMatch3 = (fitbitActivity || "").match(/Active: (\d+)/);

  if (activeMatch1) {
    activeStr = activeMatch1[1] + " min active";
  } else if (activeMatch2) {
    activeStr = activeMatch2[1] + " min active";
  } else if (activeMatch3) {
    activeStr = activeMatch3[1] + " min active";
  }

  // Resting HR data - try multiple patterns
  let restingHRStr = "N/A";
  const restingHRMatch1 = (fitbitHeart || "").match(/❤️ Resting HR: (\d+)/);
  const restingHRMatch2 = (fitbitHeart || "").match(/Resting HR: (\d+)/);
  const restingHRMatch3 = (fitbitHeart || "").match(/Resting: (\d+)/);

  if (restingHRMatch1) {
    restingHRStr = restingHRMatch1[1] + " bpm";
  } else if (restingHRMatch2) {
    restingHRStr = restingHRMatch2[1] + " bpm";
  } else if (restingHRMatch3) {
    restingHRStr = restingHRMatch3[1] + " bpm";
  }

  // Build HTML with inline styles for email compatibility
  const htmlBody = `
<div style='font-family:Helvetica,Arial,sans-serif; color:#333; max-width:600px; margin:auto;'>
  <!-- Logo -->
  <div style='text-align:center; margin:20px 0;'>
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
    
    <!-- Historical comparison -->
    ${
      historicalDataForComparison && historicalDataForComparison.count >= 3
        ? `<div style='margin-top:10px; font-size:14px; color:#666; background:#f8f9fa; padding:8px 16px; border-radius:20px; display:inline-block;'>
          Your typical ${dayContext?.dayName || "day"}: <strong>${
            historicalDataForComparison.average
          }</strong> 
          (today ${
            (scores?.total || 0) > historicalDataForComparison.average
              ? `<span style='color:#0b8043;'>+${
                  (scores?.total || 0) - historicalDataForComparison.average
                } above</span>`
              : (scores?.total || 0) < historicalDataForComparison.average
              ? `<span style='color:#ea4335;'>${
                  (scores?.total || 0) - historicalDataForComparison.average
                } below</span>`
              : "matches"
          } average)
        </div>`
        : ""
    }
    
    <!-- Sparkline chart -->
    ${
      trendsData &&
      trendsData.overall &&
      trendsData.overall.sparkline &&
      trendsData.overall.sparkline.length > 0
        ? `<div style='margin-top:15px; padding: 10px; background: rgba(0,0,0,0.03); border-radius: 6px;'>
          ${generateSparkline(trendsData.overall.sparkline, scoreColor)}
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
  
  <!-- Performance Breakdown -->
  <div style='background:#f0f4ff; border-left: 4px solid #b8ccff; padding:20px; border-radius:8px; margin:20px 0; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>
    <h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>Performance Breakdown</h4>
    <table style='width:100%; border-collapse: collapse;'>
      <tr>
        <td style='width:50%; padding:10px; vertical-align:top;'>
          <div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>
            <div style='margin-bottom:10px;'>
              <span style='display:inline-block; width:70px; vertical-align:middle;'>Sleep:</span>
              ${generateEnhancedBar(scores?.sleep || 0, true)}
              <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                scores?.sleep || 0
              }</span>
              ${generateStatusTag("Sleep", scores?.sleep || 0, true, false)}
            </div>
            ${generateMiniTrendChart("Sleep", scores?.sleep || 0, "#7c4dff")}
          </div>
          <div style='background:white; padding:15px; border-radius:6px;'>
            <div style='margin-bottom:10px;'>
              <span style='display:inline-block; width:70px; vertical-align:middle;'>Activity:</span>
              ${generateEnhancedBar(scores?.activity || 0, true)}
              <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                scores?.activity || 0
              }</span>
              ${generateStatusTag(
                "Activity",
                scores?.activity || 0,
                true,
                false
              )}
            </div>
            ${generateMiniTrendChart(
              "Activity",
              scores?.activity || 0,
              "#0f9d58"
            )}
          </div>
        </td>
        <td style='width:50%; padding:10px; vertical-align:top;'>
          <div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>
            <div style='margin-bottom:10px;'>
              <span style='display:inline-block; width:70px; vertical-align:middle;'>Heart:</span>
              ${generateEnhancedBar(scores?.heart || 0, true)}
              <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                scores?.heart || 0
              }</span>
              ${generateStatusTag("Heart", scores?.heart || 0, true, false)}
            </div>
            ${generateMiniTrendChart("Heart", scores?.heart || 0, "#ea4335")}
          </div>
          <div style='background:white; padding:15px; border-radius:6px;'>
            <div style='margin-bottom:10px;'>
              <span style='display:inline-block; width:70px; vertical-align:middle;'>Work:</span>
              ${generateEnhancedBar(scores?.work || 0, true)}
              <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                scores?.work || 0
              }</span>
              ${generateStatusTag("Work", scores?.work || 0, true, false)}
            </div>
            ${generateMiniTrendChart("Work", scores?.work || 0, "#f9ab00")}
          </div>
        </td>
      </tr>
    </table>
  </div>
  

  <!-- AI-Generated Mood Card with Energy Forecast -->
  ${moodCard}
  
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
  
  <!-- Work Overview Section -->
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
        ${String(calSummary || "").replace(/\n/g, "<br>")}
        ${
          calendarIntelligence && calendarIntelligence.score < 100
            ? `<br><span style='color:#ff6f00;'>⚠️ ${(
                calendarIntelligence.insights || []
              ).join(", ")}</span>`
            : ""
        }
      </div>
    </div>
    
    <div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>
      <h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0;'>✉️ Email</h4>
      <div style='font-size:14px; line-height:1.6; color:#5f6368;'>
        ${String(emailSummary || "").replace(/\n/g, "<br>")}
        ${
          emailResponseAnalysis && emailResponseAnalysis.avgResponseTime
            ? `<br><div style='background:#f3e5f5; padding:10px; border-radius:4px; margin-top:8px;'>
              <strong>⚡ Email Response Patterns:</strong><br>
              <span style='font-size:13px;'>
                • Average response time: <strong>${
                  emailResponseAnalysis.avgResponseTime < 1
                    ? Math.round(emailResponseAnalysis.avgResponseTime * 60) +
                      " minutes"
                    : emailResponseAnalysis.avgResponseTime + " hours"
                }</strong><br>
                ${
                  emailResponseAnalysis.avgResponseTime < 1
                    ? "• Status: <span style='color:#43a047;'>Highly responsive</span>"
                    : emailResponseAnalysis.avgResponseTime < 4
                    ? "• Status: <span style='color:#ff9800;'>Moderate response time</span>"
                    : "• Status: <span style='color:#ea4335;'>Delayed responses - inbox overwhelm?</span>"
                }
              </span>
            </div>`
            : ""
        }
        ${
          emailResponseAnalysis &&
          emailResponseAnalysis.insights &&
          emailResponseAnalysis.insights.length > 0
            ? `<br><div style='background:#e8f5e8; padding:10px; border-radius:4px; margin-top:8px;'>
              <strong>💡 Email Insights:</strong><br>
              <span style='font-size:13px;'>
                ${emailResponseAnalysis.insights
                  .map((insight: string) => `• ${insight}`)
                  .join("<br>")}
              </span>
            </div>`
            : ""
        }
        ${
          emailResponseAnalysis && emailResponseAnalysis.responseRate
            ? `<br><div style='background:#fff3cd; padding:10px; border-radius:4px; margin-top:8px;'>
              <strong>📊 Email Statistics:</strong><br>
              <span style='font-size:13px;'>
                • Response rate: <strong>${
                  emailResponseAnalysis.responseRate
                }%</strong><br>
                ${
                  emailResponseAnalysis.urgentEmails
                    ? `• Urgent emails: <strong>${emailResponseAnalysis.urgentEmails}</strong><br>`
                    : ""
                }
                ${
                  emailResponseAnalysis.peakHours &&
                  emailResponseAnalysis.peakHours.length > 0
                    ? `• Peak response hours: <strong>${emailResponseAnalysis.peakHours
                        .map((h: number) => h + ":00")
                        .join(", ")}</strong><br>`
                    : ""
                }
                ${
                  emailResponseAnalysis.slowestDays &&
                  emailResponseAnalysis.slowestDays.length > 0
                    ? `• Slowest response days: <strong>${emailResponseAnalysis.slowestDays.join(
                        ", "
                      )}</strong>`
                    : ""
                }
              </span>
            </div>`
            : ""
        }
        ${emailManagementInsight}
      </div>
    </div>
    
    ${
      completedTasks
        ? `<div style='background:white; padding:16px; border-radius:6px;'>
          <h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0;'>✅ Tasks</h4>
          <div style='font-size:14px; line-height:1.6; color:#5f6368;'>
            ${String(completedTasks || "").replace(/\n/g, "<br>")}
          </div>
        </div>`
        : ""
    }
  </div>
  
  <!-- Physical Wellness Section -->
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
        ${(fitbitSleep || "")
          .split("\n")
          .filter((line: string) => line.indexOf("Sleep stages:") === -1)
          .join("<br>")}
        ${generateSleepStagesVisualization(fitbitSleep)}
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
          fitbitActivityLog &&
          Array.isArray(fitbitActivityLog) &&
          fitbitActivityLog.length > 0
            ? `<div style='background:#e3f2fd; padding:10px; border-radius:4px; margin-bottom:10px;'>
              <strong>📋 Logged Activities:</strong><br>
              ${fitbitActivityLog
                .map((activity) =>
                  typeof activity === "string"
                    ? activity
                    : JSON.stringify(activity)
                )
                .join("<br>")}
            </div>`
            : ""
        }
        ${generateActivityZonesVisualization(fitbitActivity)}
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
        ${String(fitbitHeart || "").replace(/\n/g, "<br>")}
        ${
          fitbitHRV
            ? `<br>💗 HRV: ${fitbitHRV.value} ms (${fitbitHRV.status})<br>
             <em style='color:#666; font-size:13px;'>${fitbitHRV.insight}</em>`
            : ""
        }
        ${generateHeartRateZonesVisualization(fitbitHeart)}
      </div>
    </div>
  </div>
  
  <!-- Recovery Score section -->
  <div style='background:#f0fdfa; padding:16px; border-radius:8px; margin:20px 0; border-left:3px solid #99f6e4;'>
    <table style='width:100%; margin-bottom:16px;'>
      <tr>
        <td rowspan='2' style='width:48px; vertical-align:middle;'>
          <img src='${getSageImage(
            "recovery"
          )}' alt='Sage Recovery' style='width:48px; height:auto;'/>
        </td>
        <td style='vertical-align:bottom; padding-left:10px;'>
          <h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Recovery</h4>
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
    <div style='font-size:14px; line-height:1.6; color:#5f6368; margin-bottom:12px;'>
      This score reflects your body's readiness for today based on sleep, heart rate recovery, and yesterday's activity balance.
    </div>
  </div>
  
  <!-- Environment & Lifestyle Section -->
  <div style='background:#fff7ed; padding:20px; border-radius:8px; margin:20px 0; border-left: 4px solid #fed7aa; box-shadow: 0 1px 3px rgba(0,0,0,0.05); box-sizing: border-box;'>
    <h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>🌍 Environment & Lifestyle</h3>
    <div style='display:grid; grid-template-columns:1fr 1fr; gap:12px; box-sizing:border-box; max-width:100%;'>
      <!-- Weather section -->
      <div style='background:white; padding:16px; border-radius:6px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05); overflow:hidden; word-wrap:break-word;'>
        <h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0; display:flex; align-items:center;'>
          <img src='${getSageImage(
            "weather"
          )}' alt='Sage Weather' style='width:48px; height:auto; margin-right:10px; vertical-align:middle;'/>
          <span style='line-height:48px;'>Weather</span>
        </h4>
        <div style='font-size:14px; line-height:1.6; color:#5f6368;'>
          <div style='background:#f0f9ff; padding:12px; border-radius:6px; margin-bottom:12px;'>
            <strong style='color:#1565c0;'>Yesterday's Weather:</strong><br>
            ${String(weatherSummary || "").replace(/\n/g, "<br>")}
          </div>
          ${
            hourlyWeather &&
            Array.isArray(hourlyWeather) &&
            hourlyWeather.length > 0
              ? `<div style='background:#e3f2fd; padding:10px; border-radius:4px;'>
                <strong>Today's Forecast:</strong><br>
                <span style='font-size:13px;'>${hourlyWeather
                  .map(
                    (weather) =>
                      `${weather.hour}: ${weather.temp}°C, ${weather.weather}`
                  )
                  .join("<br>")}</span>
                ${
                  environmentalFactorsData.seasonal?.daylight
                    ? `<br><br>☀️ <strong>Daylight:</strong> ${environmentalFactorsData.seasonal.daylight} hours`
                    : ""
                }
                ${
                  environmentalFactorsData.seasonal?.sunrise &&
                  environmentalFactorsData.seasonal?.sunset
                    ? `<br>🌅 <strong>Sunrise:</strong> ${environmentalFactorsData.seasonal.sunrise} | 🌇 <strong>Sunset:</strong> ${environmentalFactorsData.seasonal.sunset}`
                    : ""
                }
              </div>`
              : ""
          }
        </div>
      </div>
      
      <!-- Music section -->
      <div style='background:white; padding:16px; border-radius:6px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>
        <h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0; display:flex; align-items:center;'>
          <img src='${getSageImage(
            "music"
          )}' alt='Sage Music' style='width:48px; height:auto; margin-right:10px; vertical-align:middle;'/>
          <span style='line-height:48px;'>Music</span>
        </h4>
      <div style='font-size:14px; line-height:1.6; color:#5f6368;'>
        ${String(spotifySummary || "").replace(/\n/g, "<br>")}
      </div>
      
      ${
        spotifyInsights && spotifyInsights.insight
          ? `
        <div style='margin-top:16px; padding:12px; background:#fff3cd; border-left:4px solid #ffc107; border-radius:4px;'>
          <div style='font-weight:600; color:#856404; margin-bottom:8px; display:flex; align-items:center;'>
            💡 Insight
          </div>
          <div style='color:#856404; font-size:13px; line-height:1.5;'>
            ${spotifyInsights.insight}
          </div>
        </div>
      `
          : ""
      }
      
      ${
        spotifyInsights && spotifyInsights.recommendation
          ? `
        <div style='margin-top:12px; padding:12px; background:#d1ecf1; border-left:4px solid #17a2b8; border-radius:4px;'>
          <div style='font-weight:600; color:#0c5460; margin-bottom:8px; display:flex; align-items:center;'>
            🎯 Recommendation
          </div>
          <div style='color:#0c5460; font-size:13px; line-height:1.5;'>
            ${spotifyInsights.recommendation}
          </div>
        </div>
      `
          : ""
      }
      </div>
    </div>
  </div>
  
  <!-- Daily Mantra -->
  <div style='background:#faf5ff; padding:20px; border-radius:12px; margin:20px 0; border-left:4px solid #e9d5ff; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>
    <h4 style='font-size:18px; font-weight:600; color:#5f27cd; margin:0 0 12px 0; display:flex; align-items:center;'>
      <img src='${getSageImage(
        "meditation"
      )}' alt='Sage Meditation' style='width:48px; height:auto; margin-right:10px; vertical-align:middle;'/>
      <span style='line-height:48px;'>Daily Mantra</span>
    </h4>
    <div style='background:rgba(255,255,255,0.7); padding:16px; border-radius:8px;'>
      <div style='font-size:17px; color:#4a148c; font-style:italic; line-height:1.6; text-align:center; word-wrap:break-word;'>
        ${escapeHtml(mantra || "")}
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
    aiMoodAndEnergy
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

  return `<div style='background:#f8f8f8; padding:20px; border-radius:8px; margin:20px 0;'>
    <h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>24-Hour Activity Pattern</h4>
    <div style='background:white; border-radius:6px; padding:15px; margin-bottom:15px;'>
      <div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;'>
        <div style='font-size:14px; color:#666;'>${hourlyPattern}</div>
      </div>
      <div style='font-size:12px; color:#999; text-align:center; margin-top:5px;'>
        0 3 6 9 12 15 18 21
      </div>
    </div>
    <div style='font-size:14px; color:#333; line-height:1.6;'>
      <div style='margin-bottom:8px;'>😴 Sleep: ${sleepDuration} | ☀️ Wake: ${wakeTime} | 🛏️ Bedtime: ${bedtime}</div>
      <div style='margin-bottom:8px;'>👣 Steps: ${steps} | 🏃 Active: ${activeMinutes} min | ⬜ Sedentary: ${sedentary}</div>
      <div style='font-size:12px; color:#666;'>
        😴 Sleep | ☀️ Wake | 🚶 Moderate Activity | 🏃 High Activity | 💼 Work Hours | ⬜ Sedentary/Low Activity
      </div>
    </div>
  </div>`;
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
    balanced: "😊",
  };

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

  const emoji = moodEmojis[moodKeyword] || "😊";
  const borderColor =
    scores?.total >= 80
      ? "#0b8043"
      : scores?.total >= 60
      ? "#fbbc04"
      : "#ea4335";
  const energyForecast = generateEnergyForecast(scores, moodKeyword);

  return `<div style='background: linear-gradient(135deg, #f8f9fa 0%, #e8f0fe 100%); border: 2px solid ${borderColor}; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>
    <div style='display: flex; align-items: center; margin-bottom: 10px;'>
      <span style='font-size: 48px; margin-right: 15px;'>${emoji}</span>
      <div>
        <h3 style='margin: 0; font-size: 20px; color: #1a73e8;'>Today's Mood: ${capitalizeFirstLetter(
          moodKeyword
        )}</h3>
        <p style='margin: 5px 0 0 0; color: #5f6368; font-size: 14px;'>${moodInsight}</p>
      </div>
    </div>
    <div style='background: rgba(255,255,255,0.7); border-radius: 8px; padding: 12px; margin-top: 15px; border-left: 4px solid ${borderColor};'>
      <strong style='color: #1a73e8;'>📊 Energy Forecast:</strong><br>
      <span style='color: #5f6368; font-size: 14px;'>${energyForecast}</span>
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
  return `<div style='font-size:18px; font-weight:600; color:#1a1a1a; margin:20px 0; text-align:center;'>
    ${
      (scores?.total || 0) >= 80
        ? "🌟 Excellent day!"
        : (scores?.total || 0) >= 60
        ? "👍 Good progress!"
        : "💪 Room for improvement!"
    }
  </div>`;
}

function generateEmailManagementInsight(emailStats: any): string {
  return `<div style='background:white; padding:15px; border-radius:6px; margin:10px 0; border-left:4px solid #3b82f6;'>
    <div style='font-size:14px; color:#333;'>Email management: ${emailStats.received} received, ${emailStats.sent} sent</div>
  </div>`;
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

  // Header with icon (matching code.js)
  html += `<h3 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; display: flex; align-items: center;">
    🏅 Today's Achievements 
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

  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
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
  // Mock sleep stages visualization
  return `<div style='margin-top:10px; padding:8px; background:#f0f0f0; border-radius:4px; font-size:12px; color:#666;'>
    Sleep Stages: Deep 14%, Light 63%, REM 23%
  </div>`;
}

function generateActivityZonesVisualization(activityData: string): string {
  // Mock activity zones visualization
  return `<div style='margin-top:10px; padding:8px; background:#f0f0f0; border-radius:4px; font-size:12px; color:#666;'>
    Activity Zones: Cardio 45min, Peak 0min, Fat Burn 219min
  </div>`;
}

function generateHeartRateZonesVisualization(heartData: string): string {
  // Mock heart rate zones visualization
  return `<div style='margin-top:10px; padding:8px; background:#f0f0f0; border-radius:4px; font-size:12px; color:#666;'>
    Heart Rate Zones: Resting 62bpm, Active 155bpm, HRV 35ms
  </div>`;
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
