import { EnhancedReportData } from "../../reports/enhanced-report-generator";
import {
  generateSleepStagesVisualization,
  generateHeartRateZonesVisualization,
  generateActivityZonesVisualization,
} from "../../visualizations/data-visualizations";

/**
 * Generate enhanced daily email template - EXACT implementation from code.js
 */
export function generateEnhancedDailyEmailTemplate(
  reportData: EnhancedReportData
): string {
  const {
    scores,
    badges,
    stressRadar,
    recoveryQuotient,
    environmentalFactors,
    calendarIntelligence,
    emailStats,
    emailInsights,
    calendarSummary,
    environmentalInsights,
    fitbitSleep,
    fitbitActivity,
    fitbitHeart,
    spotifyData,
    weatherData,
    completedTasks,
    dayContext,
  } = reportData;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyMetricLog Daily Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 30px; }
        .score-section { background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .main-score { text-align: center; margin-bottom: 24px; }
        .main-score-value { font-size: 48px; font-weight: 700; color: ${getScoreColor(
          scores.total
        )}; margin: 0; }
        .main-score-label { font-size: 16px; color: #64748b; margin: 8px 0 0 0; }
        .sub-scores { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .sub-score { text-align: center; padding: 16px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .sub-score-value { font-size: 24px; font-weight: 600; color: ${getScoreColor(
          scores.sleep
        )}; margin: 0; }
        .sub-score-label { font-size: 14px; color: #64748b; margin: 4px 0 0 0; }
        .badge-section { background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .badge-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 16px; }
        .badge { background: white; border-radius: 8px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .badge-emoji { font-size: 24px; margin-bottom: 8px; }
        .badge-name { font-weight: 600; color: #1f2937; margin: 0 0 4px 0; }
        .badge-description { font-size: 12px; color: #6b7280; margin: 0; }
        .insight-section { background: #f0f9ff; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .insight-text { font-size: 16px; line-height: 1.6; color: #1f2937; margin: 0; }
        .data-section { background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .data-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
        .data-card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-card h4 { margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #374151; }
        .data-card p { margin: 0; font-size: 13px; color: #6b7280; line-height: 1.4; }
        .footer { background: #1f2937; color: white; padding: 24px; text-align: center; }
        .footer p { margin: 0; font-size: 14px; opacity: 0.8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🦊 MyMetricLog Daily Report</h1>
            <p>${dayContext.dayName} • ${new Date().toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  )}</p>
        </div>
        
        <div class="content">
            <!-- Main Score Section -->
            <div class="score-section">
                <div class="main-score">
                    <h2 class="main-score-value">${scores.total}/100</h2>
                    <p class="main-score-label">Overall Wellness Score</p>
                </div>
                
                <div class="sub-scores">
                    <div class="sub-score">
                        <h3 class="sub-score-value" style="color: ${getScoreColor(
                          scores.sleep
                        )};">${scores.sleep}/100</h3>
                        <p class="sub-score-label">Sleep</p>
                    </div>
                    <div class="sub-score">
                        <h3 class="sub-score-value" style="color: ${getScoreColor(
                          scores.activity
                        )};">${scores.activity}/100</h3>
                        <p class="sub-score-label">Activity</p>
                    </div>
                    <div class="sub-score">
                        <h3 class="sub-score-value" style="color: ${getScoreColor(
                          scores.heart
                        )};">${scores.heart}/100</h3>
                        <p class="sub-score-label">Heart</p>
                    </div>
                    <div class="sub-score">
                        <h3 class="sub-score-value" style="color: ${getScoreColor(
                          scores.work
                        )};">${scores.work}/100</h3>
                        <p class="sub-score-label">Work</p>
                    </div>
                </div>
            </div>

            <!-- Badges Section -->
            ${
              badges.length > 0
                ? `
            <div class="badge-section">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #92400e;">🏅 Today's Achievements</h3>
                <div class="badge-grid">
                    ${badges
                      .map(
                        (badge) => `
                    <div class="badge">
                        <div class="badge-emoji">${badge.emoji}</div>
                        <h4 class="badge-name">${badge.name}</h4>
                        <p class="badge-description">${badge.description}</p>
                    </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
            `
                : ""
            }

            <!-- AI Insight Section -->
            <div class="insight-section">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1e40af;">🧠 Sage's Analysis</h3>
                <p class="insight-text">[AI Insight will be inserted here]</p>
            </div>

            <!-- Data Visualizations -->
            <div class="data-section">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #374151;">📊 Detailed Metrics</h3>
                
                <div class="data-grid">
                    <!-- Sleep Data -->
                    <div class="data-card">
                        <h4>😴 Sleep Analysis</h4>
                        <p>${fitbitSleep}</p>
                        ${generateSleepStagesVisualization(fitbitSleep)}
                    </div>
                    
                    <!-- Activity Data -->
                    <div class="data-card">
                        <h4>🏃‍♂️ Activity Analysis</h4>
                        <p>${fitbitActivity}</p>
                        ${generateActivityZonesVisualization(fitbitActivity)}
                    </div>
                    
                    <!-- Heart Data -->
                    <div class="data-card">
                        <h4>❤️ Heart Analysis</h4>
                        <p>${fitbitHeart}</p>
                        ${generateHeartRateZonesVisualization(fitbitHeart)}
                    </div>
                    
                    <!-- Work Data -->
                    <div class="data-card">
                        <h4>💼 Work Analysis</h4>
                        <p>${emailInsights}</p>
                        <p><strong>Calendar:</strong> ${calendarSummary}</p>
                        ${
                          completedTasks
                            ? `<p><strong>Tasks:</strong> ${completedTasks}</p>`
                            : ""
                        }
                    </div>
                </div>
            </div>

            <!-- Stress & Recovery -->
            <div class="data-section">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #374151;">⚡ Stress & Recovery</h3>
                
                <div class="data-grid">
                    <div class="data-card">
                        <h4>🌡️ Stress Level</h4>
                        <p style="color: ${getStressColor(
                          stressRadar.level
                        )}; font-weight: 600;">
                            ${stressRadar.level} (${stressRadar.score}/100)
                        </p>
                        ${
                          stressRadar.insights.length > 0
                            ? `
                        <ul style="margin: 8px 0 0 0; padding-left: 16px;">
                            ${stressRadar.insights
                              .map(
                                (insight) =>
                                  `<li style="font-size: 12px; color: #6b7280;">${insight}</li>`
                              )
                              .join("")}
                        </ul>
                        `
                            : ""
                        }
                    </div>
                    
                    <div class="data-card">
                        <h4>🔄 Recovery Status</h4>
                        <p style="color: ${getRecoveryColor(
                          recoveryQuotient.readiness
                        )}; font-weight: 600;">
                            ${recoveryQuotient.readiness} (${
    recoveryQuotient.score
  }/100)
                        </p>
                        ${
                          recoveryQuotient.insights.length > 0
                            ? `
                        <ul style="margin: 8px 0 0 0; padding-left: 16px;">
                            ${recoveryQuotient.insights
                              .map(
                                (insight) =>
                                  `<li style="font-size: 12px; color: #6b7280;">${insight}</li>`
                              )
                              .join("")}
                        </ul>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>

            <!-- Environmental Factors -->
            ${
              environmentalInsights
                ? `
            <div class="data-section">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #374151;">🌍 Environmental Factors</h3>
                <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">${environmentalInsights}</p>
            </div>
            `
                : ""
            }
        </div>
        
        <div class="footer">
            <p>Generated by MyMetricLog • Your personal wellness companion</p>
        </div>
    </div>
</body>
</html>`;

  return html;
}

/**
 * Get score color based on value
 */
function getScoreColor(score: number): string {
  if (score >= 90) return "#10b981"; // Green
  if (score >= 80) return "#059669"; // Dark green
  if (score >= 70) return "#f59e0b"; // Yellow
  if (score >= 60) return "#f97316"; // Orange
  if (score >= 50) return "#ef4444"; // Red
  return "#dc2626"; // Dark red
}

/**
 * Get stress level color
 */
function getStressColor(level: string): string {
  switch (level) {
    case "Low":
      return "#10b981";
    case "Medium":
      return "#f59e0b";
    case "High":
      return "#f97316";
    case "Critical":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

/**
 * Get recovery readiness color
 */
function getRecoveryColor(readiness: string): string {
  switch (readiness) {
    case "Excellent":
      return "#10b981";
    case "Good":
      return "#059669";
    case "Fair":
      return "#f59e0b";
    case "Poor":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}
