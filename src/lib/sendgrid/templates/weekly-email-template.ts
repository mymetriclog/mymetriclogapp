// Weekly email template - Complete implementation from code.js

export interface WeeklyReportData {
  startDate: string;
  endDate: string;
  weekStats: {
    avgScore: number;
    avgSleepScore: number;
    avgActivityScore: number;
    avgHeartScore: number;
    avgWorkScore: number;
    scoreTrend: number;
    avgSleepFormatted: string;
    avgSteps: number;
    totalActiveMin: number;
    avgRHR: number;
    totalEmails: number;
    totalMeetings: number;
    totalBadges: number;
    days10KSteps: number;
    challengingDay: { name: string; score: number };
    bestDay: { name: string; score: number };
  };
  insight: string;
  recommendations: string[];
  trends: any;
  badges: {
    totalBadges: number;
    badges: any[];
  };
  patterns: any[];
}

export function generateWeeklyReportEmail(data: WeeklyReportData): string {
  const {
    startDate,
    endDate,
    weekStats,
    insight,
    recommendations,
    trends,
    badges,
    patterns,
  } = data;

  const scoreColor =
    weekStats.avgScore >= 80
      ? "#0b8043"
      : weekStats.avgScore >= 60
      ? "#fbbc04"
      : "#ea4335";

  return `
    <div style='font-family:Helvetica,Arial,sans-serif; color:#333; max-width:600px; margin:auto;'>
      <!-- Logo -->
      <div style='text-align:center; margin:20px 0;'>
        <img src='https://i.ibb.co/9HwyVWzR/My-Metric-Log-Logo.png' 
             alt='MyMetricLog Logo' style='max-width:300px; height:auto;'/>
      </div>
      
      <!-- Title -->
      <div style='text-align:center; margin:10px 0;'>
        <h1 style='font-size:28px; font-weight:600; color:#1a1a1a; margin:10px 0;'>Weekly Summary</h1>
        <div style='font-size:18px; color:#555;'>
          ${formatDateRange(startDate, endDate)}
        </div>
      </div>
      
      <!-- Weekly Score -->
      <div style='text-align:center; margin:30px 0;'>
        <div style='font-size:64px; font-weight:bold; color:${scoreColor};'>
          🧠 ${weekStats.avgScore}
        </div>
        <div style='font-size:20px; color:#555; margin-bottom:5px;'>
          <strong>Average Weekly Score</strong> 
          ${getTrendArrow(weekStats.scoreTrend)} 
          ${weekStats.scoreTrend > 0 ? "+" : ""}${
    weekStats.scoreTrend
  } vs last week
        </div>
        <div style='margin-top:8px;'>
          ${generateStatusTag("Overall", weekStats.avgScore, false, true)}
        </div>
      </div>
      
      <!-- Week at a Glance -->
      <div style='background:#e8f0fe; padding:20px; border-radius:8px; text-align:center; margin:20px 0;'>
        <strong style='font-size:18px;'>Week at a Glance</strong><br>
        <div style='margin-top:10px; font-size:16px; line-height:1.8;'>
          💤 ${weekStats.avgSleepFormatted} avg sleep | 
          👣 ${formatNumberWithCommas(weekStats.avgSteps)} avg steps | 
          🏃 ${weekStats.totalActiveMin} active minutes<br>
          ❤️ ${weekStats.avgRHR} bpm avg RHR | 
          📧 ${weekStats.totalEmails} emails | 
          📅 ${weekStats.totalMeetings} meetings | 
          🏆 ${badges.totalBadges} badges earned
        </div>
      </div>
      
      <!-- Performance Grid -->
      ${generateWeeklyPerformanceGrid(weekStats)}
      
      <!-- Weekly Analysis -->
      <div style='margin:20px 0; padding:20px; background:#fafafa; border:1px solid #ddd; border-radius:8px;'>
        <h3 style='font-size:22px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>🧠 Weekly Analysis</h3>
        <div style='font-size:15px; line-height:1.8; color:#333;'>
          ${convertAndFormatInsight(insight)}
        </div>
      </div>
      
      <!-- Pattern Recognition -->
      ${patterns && patterns.length > 0 ? generateWeeklyPatterns(patterns) : ""}
      
      <!-- Badge Summary -->
      ${generateWeeklyBadgeSummary(badges)}
      
      <!-- Best & Challenging Days -->
      ${generateBestAndWorstDays(weekStats)}
      
      <!-- Weekly Habits Scorecard -->
      ${generateWeeklyHabitsScorecard(weekStats)}
      
      <!-- Quick Wins for Next Week -->
      <div style='background:linear-gradient(135deg, #e8f0fe 0%, #d2e3fc 100%); 
                  border:2px solid #1976d2; border-radius:12px; padding:20px; margin:20px 0;'>
        <h3 style='font-size:20px; font-weight:600; color:#1565c0; margin:0 0 12px 0;'>
          🎯 Quick Wins for Next Week
        </h3>
        ${generateWeeklyQuickWins(weekStats, patterns)}
      </div>
      
      <!-- Footer -->
      <div style='margin-top:40px; padding-top:20px; border-top:1px solid #e0e0e0; 
                  text-align:center; color:#999; font-size:12px;'>
        MyMetricLog • Your Weekly Wellness Intelligence<br>
        🦊 Tracking • 📊 Analyzing • 🎯 Growing Together
      </div>
    </div>
  `;
}

// Helper functions

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${startStr} - ${endStr}`;
}

function getTrendArrow(trend: number): string {
  if (trend > 0) return "📈";
  if (trend < 0) return "📉";
  return "➡️";
}

function generateStatusTag(
  label: string,
  score: number,
  isPercent: boolean,
  isMainScore: boolean
): string {
  let color = "#ea4335"; // red
  let status = "Needs Attention";

  if (score >= 85) {
    color = "#0b8043"; // green
    status = "Excellent";
  } else if (score >= 70) {
    color = "#fbbc04"; // yellow
    status = "Good";
  } else if (score >= 60) {
    color = "#ff9800"; // orange
    status = "Fair";
  }

  const fontSize = isMainScore ? "16px" : "12px";
  const padding = isMainScore ? "8px 16px" : "4px 8px";

  return `
    <span style='background:${color}; color:white; padding:${padding}; 
                 border-radius:4px; font-size:${fontSize}; font-weight:600; margin-left:8px;'>
      ${status}
    </span>
  `;
}

function generateWeeklyPerformanceGrid(weekStats: any): string {
  return `
    <div style='background:#f8f8f8; padding:20px; border-radius:8px; margin:20px 0;'>
      <h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>Performance Breakdown</h4>
      <table style='width:100%; border-collapse: collapse;'>
        <tr>
          <td style='width:50%; padding:10px; vertical-align:top;'>
            <div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>
              <div style='margin-bottom:10px;'>
                <span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Sleep:</span>
                ${generateEnhancedBar(weekStats.avgSleepScore, true)}
                <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                  weekStats.avgSleepScore
                }</span>
                ${generateStatusTag(
                  "Sleep",
                  weekStats.avgSleepScore,
                  true,
                  false
                )}
              </div>
            </div>
            <div style='background:white; padding:15px; border-radius:6px;'>
              <div style='margin-bottom:10px;'>
                <span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Activity:</span>
                ${generateEnhancedBar(weekStats.avgActivityScore, true)}
                <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                  weekStats.avgActivityScore
                }</span>
                ${generateStatusTag(
                  "Activity",
                  weekStats.avgActivityScore,
                  true,
                  false
                )}
              </div>
            </div>
          </td>
          <td style='width:50%; padding:10px; vertical-align:top;'>
            <div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>
              <div style='margin-bottom:10px;'>
                <span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Heart:</span>
                ${generateEnhancedBar(weekStats.avgHeartScore, true)}
                <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                  weekStats.avgHeartScore
                }</span>
                ${generateStatusTag(
                  "Heart",
                  weekStats.avgHeartScore,
                  true,
                  false
                )}
              </div>
            </div>
            <div style='background:white; padding:15px; border-radius:6px;'>
              <div style='margin-bottom:10px;'>
                <span style='display:inline-block; width:70px; vertical-align:middle; font-weight:600; font-size:16px;'>Work:</span>
                ${generateEnhancedBar(weekStats.avgWorkScore, true)}
                <span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>${
                  weekStats.avgWorkScore
                }</span>
                ${generateStatusTag(
                  "Work",
                  weekStats.avgWorkScore,
                  true,
                  false
                )}
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function generateEnhancedBar(score: number, isGradient: boolean): string {
  const percentage = Math.min(score, 100);
  const color =
    score >= 85
      ? "#0b8043"
      : score >= 70
      ? "#fbbc04"
      : score >= 60
      ? "#ff9800"
      : "#ea4335";

  return `
    <div style='display:inline-block; width:120px; height:8px; background:#e0e0e0; border-radius:4px; margin-right:8px; vertical-align:middle;'>
      <div style='width:${percentage}%; height:100%; background:${color}; border-radius:4px; transition:width 0.3s ease;'></div>
    </div>
  `;
}

function convertAndFormatInsight(insight: string): string {
  return insight
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function generateWeeklyPatterns(patterns: any[]): string {
  if (!patterns || patterns.length === 0) return "";

  return `
    <div style='margin:20px 0; padding:20px; background:#f0f8ff; border:1px solid #b3d9ff; border-radius:8px;'>
      <h3 style='font-size:20px; font-weight:600; color:#1565c0; margin:0 0 12px 0;'>🔍 Pattern Recognition</h3>
      <div style='font-size:15px; line-height:1.8; color:#333;'>
        ${patterns
          .map(
            (pattern) => `
          <div style='margin-bottom:8px;'>
            <strong>${pattern.type}:</strong> ${pattern.description}
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

function generateWeeklyBadgeSummary(badges: any): string {
  if (!badges || badges.totalBadges === 0) return "";

  return `
    <div style='margin:20px 0; padding:20px; background:#fff3e0; border:1px solid #ffcc02; border-radius:8px;'>
      <h3 style='font-size:20px; font-weight:600; color:#e65100; margin:0 0 12px 0;'>🏆 Badge Summary</h3>
      <div style='font-size:15px; line-height:1.8; color:#333;'>
        <strong>Total Badges Earned:</strong> ${badges.totalBadges}<br>
        ${badges.badges
          .map(
            (badge: any) => `
          <div style='margin:4px 0;'>
            ${badge.emoji || "🏆"} <strong>${badge.name}</strong> 
            ${badge.count ? `(${badge.count}x)` : ""} - ${badge.description}
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

function generateBestAndWorstDays(weekStats: any): string {
  return `
    <div style='margin:20px 0; padding:20px; background:#f5f5f5; border-radius:8px;'>
      <h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>📊 Best & Challenging Days</h3>
      <div style='display:flex; gap:20px;'>
        <div style='flex:1; text-align:center; padding:15px; background:white; border-radius:6px;'>
          <div style='font-size:24px; color:#0b8043; font-weight:bold;'>${weekStats.bestDay.score}</div>
          <div style='font-size:16px; color:#666;'>Best: ${weekStats.bestDay.name}</div>
        </div>
        <div style='flex:1; text-align:center; padding:15px; background:white; border-radius:6px;'>
          <div style='font-size:24px; color:#ea4335; font-weight:bold;'>${weekStats.challengingDay.score}</div>
          <div style='font-size:16px; color:#666;'>Challenging: ${weekStats.challengingDay.name}</div>
        </div>
      </div>
    </div>
  `;
}

function generateWeeklyHabitsScorecard(weekStats: any): string {
  return `
    <div style='margin:20px 0; padding:20px; background:#e8f5e8; border:1px solid #4caf50; border-radius:8px;'>
      <h3 style='font-size:20px; font-weight:600; color:#2e7d32; margin:0 0 12px 0;'>📋 Habits Scorecard</h3>
      <div style='font-size:15px; line-height:1.8; color:#333;'>
        <div style='margin:8px 0;'>
          <strong>10K Steps Days:</strong> ${weekStats.days10KSteps}/7 days 
          ${
            weekStats.days10KSteps >= 5
              ? "✅"
              : weekStats.days10KSteps >= 3
              ? "⚠️"
              : "❌"
          }
        </div>
        <div style='margin:8px 0;'>
          <strong>Average Sleep:</strong> ${weekStats.avgSleepFormatted} 
          ${
            weekStats.avgSleepScore >= 80
              ? "✅"
              : weekStats.avgSleepScore >= 60
              ? "⚠️"
              : "❌"
          }
        </div>
        <div style='margin:8px 0;'>
          <strong>Active Minutes:</strong> ${weekStats.totalActiveMin} total 
          ${
            weekStats.totalActiveMin >= 300
              ? "✅"
              : weekStats.totalActiveMin >= 150
              ? "⚠️"
              : "❌"
          }
        </div>
      </div>
    </div>
  `;
}

function generateWeeklyQuickWins(weekStats: any, patterns: any[]): string {
  const quickWins = [];

  if (weekStats.avgSleepScore < 80) {
    quickWins.push(
      "**Sunday 9:30 PM:** Set wind-down alarm for consistent sleep schedule"
    );
  }

  if (weekStats.days10KSteps < 5) {
    quickWins.push(
      "**Daily 2:00 PM:** 15-minute walk break (adds ~2,000 steps)"
    );
  }

  if (weekStats.avgWorkScore < 75) {
    quickWins.push("**Monday & Wednesday:** Block 9-11 AM for deep focus work");
  }

  if (weekStats.challengingDay.name === "Monday") {
    quickWins.push(
      "**Monday morning:** Start with 10-min meditation to set positive tone"
    );
  }

  if (quickWins.length === 0) {
    quickWins.push(
      "**Maintain momentum:** You're doing great! Document what worked this week"
    );
  }

  return `
    <div style='font-size:15px; line-height:1.8;'>
      ${quickWins
        .map(
          (win, index) => `
        <div style='margin-bottom:10px;'>${index + 1}. ${win.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
          )}</div>
      `
        )
        .join("")}
    </div>
  `;
}

function formatNumberWithCommas(num: number): string {
  return num.toLocaleString();
}
