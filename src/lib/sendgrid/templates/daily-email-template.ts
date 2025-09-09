// Constants from code.js
const SAGE_IMAGES = {
  analysis: "https://i.ibb.co/RT990pVm/Sage-analysis.png",
  working: "https://i.ibb.co/QvT3v0XS/Sage-work.png",
  sleep: "https://i.ibb.co/4ZTBpSS0/Sage-sleep.png",
  active: "https://i.ibb.co/Q3vJSfjK/Sage-active.png",
  heart: "https://i.ibb.co/B2yFxMs1/Sage-heart.png",
  weather: "https://i.ibb.co/m5B8H8Gk/Sage-weather.png",
  meditation: "https://i.ibb.co/XkScD1Bn/Sage-meditation.png",
  music: "https://i.ibb.co/TMhvM4q5/Sage-music.png",
  recovery: "https://i.ibb.co/xVfP72M/Sage-recovery.png",
  greeting: "https://i.ibb.co/gbTdSHcx/Sage-hi.png",
  quickwin: "https://i.ibb.co/hJ2433Xh/Sage-quick-win.png",
};

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
}

export function generateDailyReportEmail(data: DailyReportData): string {
  // Parse sleep efficiency at the start
  const sleepEfficiencyMatch = (data.fitbitSleep || "").match(
    /😴 Efficiency: (\d+)%/
  );
  const sleepEfficiency = sleepEfficiencyMatch
    ? parseInt(sleepEfficiencyMatch[1])
    : 0;

  // Get all the data parsing (keep existing)
  const calEvents = data.dayContext?.calendarData || [];
  const trends = data.trends;
  const yesterday = new Date(data.date);
  const environmentalFactors = data.environmentalFactors;
  const historicalData = data.historicalData;

  const anomalies = data.anomalies;

  // Generate intraday visualization
  const intradayViz = generateIntradayVisualization(
    data.fitbitActivity,
    data.fitbitSleep,
    data.calSummary,
    data.dayContext
  );

  const deepInsights = data.deepInsights;

  const moodCard = generateMoodCard(data.moodInsight, data.scores);
  const quickWinBox = generateQuickWinBox(
    data.scores,
    data.stressRadar,
    data.recoveryQuotient,
    environmentalFactors,
    data.calendarIntelligence
  );
  const insightHeadline = generateInsightHeadline(
    data.scores,
    data.stressRadar,
    data.recoveryQuotient
  );

  // Parse email stats
  const emailSummaryText = (data.emailSummary || "").toString();
  const receivedMatch = emailSummaryText.match(/Primary Inbox: (\d+)/);
  const sentMatch = emailSummaryText.match(/Sent: (\d+)/);
  const emailStats = {
    received: receivedMatch ? parseInt(receivedMatch[1]) : 0,
    sent: sentMatch ? parseInt(sentMatch[1]) : 0,
  };

  const emailManagementInsight = generateEmailManagementInsight(emailStats);

  // Score trends
  let scoreTrend = "";
  if (
    trends &&
    trends.overall &&
    trends.overall.trend !== undefined &&
    trends.overall.trend !== 0
  ) {
    scoreTrend =
      " " +
      getTrendArrow(trends.overall.trend) +
      " " +
      (trends.overall.trend > 0 ? "+" : "") +
      trends.overall.trend;
  }

  // Color coding
  const scoreColor =
    data.scores.total >= 80
      ? "#0b8043"
      : data.scores.total >= 60
      ? "#fbbc04"
      : "#ea4335";
  const stressColor = getStressColor(data.stressRadar?.score || 0);
  const recoveryColor = getRecoveryColor(data.recoveryQuotient?.score || 0);

  // Generate the complete HTML email template exactly as in code.js
  const htmlBody = `
<div style='font-family:Helvetica,Arial,sans-serif; color:#333; max-width:600px; margin:auto;'>
  <!-- Logo -->
  <div style='text-align:center; margin:20px 0;'>
    <img src='https://i.ibb.co/9HwyVWzR/My-Metric-Log-Logo.png' alt='MyMetricLog Logo' style='max-width:300px; height:auto;'/>
  </div>
  
  <!-- Title -->
  <div style='text-align:center; margin:10px 0;'>
    <h1 style='font-size:28px; font-weight:600; color:#1a1a1a; margin:10px 0;'>Daily Summary</h1>
    <div style='font-size:18px; color:#555;'>${data.fullDateStr}</div>
  </div>
  
  <!-- Daily Score with status tag -->
  <div style='text-align:center; margin:30px 0;'>
    <div style='font-size:64px; font-weight:bold; color:${scoreColor};'>🧠 ${
    data.scores.total
  }</div>
    <div style='font-size:20px; color:#555; margin-bottom:5px;'><strong>Daily Score</strong>${scoreTrend}</div>
    <div style='margin-top:8px;'>${generateStatusTag(
      "Overall",
      data.scores.total,
      false,
      true
    )}</div>
  </div>
  
  <!-- Day at a Glance -->
  <div style='background:#e8f0fe; padding:20px; border-radius:8px; text-align:center; margin:20px 0;'>
    <strong style='font-size:18px;'>Day at a Glance</strong><br>
    <div style='margin-top:10px; font-size:16px; line-height:1.8;'>
      💤 ${extractSleepDuration(data.fitbitSleep)} | 
      👣 ${extractSteps(data.fitbitActivity)} | 
      ❤️ ${extractRHR(data.fitbitHeart)} bpm | 
      📧 ${emailStats.received} emails | 
      📅 ${extractMeetingCount(data.calSummary)} meetings
    </div>
  </div>
  
  <!-- Performance Grid -->
  ${generatePerformanceGrid(data.scores)}
  
  <!-- Sage's Analysis -->
  <div style='margin:20px 0; padding:20px; background:#fafafa; border:1px solid #ddd; border-radius:8px;'>
    <h3 style='font-size:22px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>
      <img src='${
        SAGE_IMAGES.analysis
      }' style='width:24px; height:24px; margin-right:8px; vertical-align:middle;'/>
      🦊 Sage's Analysis
    </h3>
    <div style='font-size:15px; line-height:1.8; color:#333;'>${convertAndFormatInsight(
      data.insight
    )}</div>
  </div>
  
  <!-- Mood Card -->
  ${moodCard}
  
  <!-- Quick Win Box -->
  ${quickWinBox}
  
  <!-- Badge Section -->
  ${generateBadgeSection(
    data.badges || [],
    data.streakBadges || [],
    data.badgeNarrative || ""
  )}
  
  <!-- Near Misses -->
  ${
    (data.nearMisses?.length || 0) > 0
      ? generateNearMissSection(data.nearMisses || [])
      : ""
  }
  
  <!-- Detailed Sections -->
  ${generateDetailedSections(data)}
  
  <!-- Footer -->
  <div style='margin-top:40px; padding-top:20px; border-top:1px solid #e0e0e0; text-align:center; color:#999; font-size:12px;'>
    MyMetricLog • Your Daily Wellness Intelligence<br>
    🦊 Tracking • 📊 Analyzing • 🎯 Growing Together
  </div>
</div>`;

  return htmlBody;
}

// Helper functions from code.js
function generateIntradayVisualization(
  activityData: string,
  sleepData: string,
  calendarData: string,
  dayContext: any
): string {
  // Implementation from code.js
  return `<div style='background:#f8f8f8; padding:20px; border-radius:8px; margin:20px 0;'>
    <h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>24-Hour Activity Pattern</h4>
    <div style='height:100px; background:white; border-radius:6px; padding:10px;'>
      <!-- Activity pattern visualization -->
    </div>
  </div>`;
}

function generateMoodCard(moodInsight: string, scores: any): string {
  return `<div style='background:linear-gradient(135deg, #e8f0fe 0%, #d2e3fc 100%); border:2px solid #1976d2; border-radius:12px; padding:20px; margin:20px 0;'>
    <h3 style='font-size:20px; font-weight:600; color:#1565c0; margin:0 0 12px 0;'>😊 Mood Insight</h3>
    <div style='font-size:15px; line-height:1.8; color:#333;'>${moodInsight}</div>
  </div>`;
}

function generateQuickWinBox(
  scores: any,
  stressRadar: any,
  recoveryQuotient: any,
  environmentalFactors: any,
  calendarIntelligence: any
): string {
  return `<div style='background:linear-gradient(135deg, #e8f0fe 0%, #d2e3fc 100%); border:2px solid #1976d2; border-radius:12px; padding:20px; margin:20px 0;'>
    <h3 style='font-size:20px; font-weight:600; color:#1565c0; margin:0 0 12px 0;'>
      <img src='${SAGE_IMAGES.quickwin}' style='width:24px; height:24px; margin-right:8px; vertical-align:middle;'/>
      🎯 Today's Quick Win
    </h3>
    <div style='font-size:15px; line-height:1.8; color:#333;'>Focus on getting 8 hours of quality sleep tonight for better recovery.</div>
  </div>`;
}

function generateInsightHeadline(
  scores: any,
  stressRadar: any,
  recoveryQuotient: any
): string {
  return `<div style='font-size:18px; font-weight:600; color:#1a1a1a; margin:20px 0; text-align:center;'>
    ${
      scores.total >= 80
        ? "🌟 Excellent day!"
        : scores.total >= 60
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

  return `<div style='background:#f8f8f8; padding:20px; border-radius:8px; margin:20px 0;'>
    <h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>🏆 Achievements</h3>
    <div style='display:flex; flex-wrap:wrap; gap:10px; margin-bottom:15px;'>
      ${[...(badges || []), ...(streakBadges || [])]
        .map(
          (badge) => `
        <div style='background:white; padding:10px; border-radius:8px; border:1px solid #e0e0e0; text-align:center; min-width:80px;'>
          <div style='font-size:24px; margin-bottom:5px;'>${badge.icon}</div>
          <div style='font-size:12px; font-weight:600; color:#333;'>${badge.name}</div>
        </div>
      `
        )
        .join("")}
    </div>
    ${
      narrative
        ? `<div style='font-size:14px; color:#666; font-style:italic;'>${narrative}</div>`
        : ""
    }
  </div>`;
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
    
    <!-- Weather Section -->
    <div style='margin:20px 0; padding:20px; background:#f8f8f8; border:1px solid #e0e0e0; border-radius:8px;'>
      <h3 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>
        <img src='${
          SAGE_IMAGES.weather
        }' style='width:20px; height:20px; margin-right:8px; vertical-align:middle;'/>
        🌤️ Weather Impact
      </h3>
      <div style='font-size:14px; color:#333; line-height:1.6;'>${
        data.weatherSummary
      }</div>
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
    </div>
  `;
}

function convertAndFormatInsight(insight: string): string {
  // Convert markdown bold to HTML bold, handle missing insight
  const text = (insight || "").toString();
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}
