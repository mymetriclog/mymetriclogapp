import { getSageImage } from "@/lib/constants/sage-images";

// Helper function to generate 24-Hour Activity Pattern
function generate24HourActivityPattern(
  activityData: string,
  sleepData: string,
  dayContext: any
): string {
  // Parse activity data
  const veryActiveMatch = activityData.match(/💪 Very Active: (\d+) min/);
  const fairlyActiveMatch = activityData.match(/🚶 Fairly Active: (\d+) min/);
  const lightlyActiveMatch = activityData.match(/🧘 Lightly Active: (\d+) min/);

  const veryActive = veryActiveMatch ? parseInt(veryActiveMatch[1]) : 0;
  const fairlyActive = fairlyActiveMatch ? parseInt(fairlyActiveMatch[1]) : 0;
  const lightlyActive = lightlyActiveMatch
    ? parseInt(lightlyActiveMatch[1])
    : 0;

  // Parse sleep data
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

  // Determine activity peaks
  const activityPeaks: Array<{ hour: number; intensity: string }> = [];
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

  // Create visual representation
  let heatmapHtml =
    '<div style="margin: 20px 0; padding: 20px; background: #f0fff4; border-left: 4px solid #1dd1a1; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">';
  heatmapHtml +=
    '<h4 style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px 0;">24-Hour Activity Pattern</h4>';

  // Container for the chart
  heatmapHtml +=
    '<div style="position: relative; height: 80px; margin-bottom: 5px; border-bottom: 1px solid #e0e0e0;">';
  heatmapHtml +=
    '<div style="display: table; width: 100%; height: 100%; table-layout: fixed;">';

  for (let hour = 0; hour < 24; hour++) {
    let intensity = "low";
    let color = "#e0e0e0";
    let label = "";
    let height = 20;

    const isSleeping =
      sleepStart > sleepEnd
        ? hour >= sleepStart || hour < sleepEnd
        : hour >= sleepStart && hour < sleepEnd;

    if (isSleeping) {
      intensity = "sleep";
      color = "#4285f4";
      label = "😴";
      height = 30;
    } else {
      // Check for activity peaks
      for (const peak of activityPeaks) {
        if (hour === peak.hour) {
          intensity = peak.intensity;
          if (intensity === "high") {
            color = "#0f9d58";
            label = "🏃";
            height = 60;
          } else if (intensity === "medium") {
            color = "#81c784";
            label = "🚶";
            height = 45;
          }
          break;
        }
      }

      if (hour === sleepEnd && !isSleeping) {
        color = "#ffa726";
        label = "☀️";
        height = 40;
      }

      if (hour >= 9 && hour <= 17 && intensity === "low") {
        const isWeekend = dayContext && dayContext.dayType === "weekend";
        if (!isWeekend) {
          color = "#dadce0";
          label = "💼";
          height = 25;
        } else {
          color = "#e0e0e0";
          label = "";
          height = 20;
        }
      }
    }

    heatmapHtml +=
      '<div style="display: table-cell; vertical-align: bottom; padding: 0 1px;">';
    heatmapHtml += `<div style="width: 100%; height: ${height}px; background: ${color}; position: relative; border-radius: 2px 2px 0 0; border: 1px solid rgba(0,0,0,0.1); border-bottom: none;" title="${hour}:00">`;

    if (label) {
      heatmapHtml += `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 11px; line-height: 1; text-align: center;">${label}</div>`;
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
      heatmapHtml += hour.toString();
    }
    heatmapHtml += "</div>";
  }
  heatmapHtml += "</div>";

  // Legend
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

  // Activity summary
  const totalActiveMinutes = veryActive + fairlyActive + lightlyActive;
  const activitySummary = `You had ${totalActiveMinutes} total active minutes with ${veryActive} minutes of high-intensity activity.`;

  heatmapHtml += `<div style="margin-top: 12px; padding: 12px; background: #e8f0fe; border-radius: 4px; font-size: 14px; color: #424242; line-height: 1.5;"><strong>Activity Summary:</strong> ${activitySummary}</div>`;
  heatmapHtml += "</div>";

  return heatmapHtml;
}

// Clone of composeEnhancedMyMetricLogEmail from newcode.tsx to ensure identical HTML
export function generateDailyReportEmail(
  fullDateStr: string,
  dateStr: string,
  scores: any,
  insight: string,
  mantra: string,
  moodInsight: any,
  weatherSummary: string,
  calSummary: string,
  emailSummary: string,
  completedTasks: string,
  spotifySummary: string,
  spotifyInsights: any,
  fitbitActivity: string,
  fitbitSleep: string,
  fitbitHeart: string,
  fitbitRawData: any,
  peakHR: any,
  stressRadar: any,
  recoveryQuotient: any,
  dayContext: any,
  badges: any,
  streakBadges: any,
  badgeNarrative: string,
  nearMisses: any,
  calendarAnalysis: any,
  calendarIntelligence: any,
  fitbitHRV: any,
  hourlyWeather: any,
  emailResponseAnalysis: any,
  fitbitActivityLog: string,
  audioFeatures: any,
  insightHeadline?: string
): string {
  // Helper functions
  function escapeHtml(text: string): string {
    if (!text) return "";
    const map: { [k: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  function getMainScoreColor(score: number): string {
    if (score >= 90) return "#0b8043";
    if (score >= 80) return "#0b8043";
    if (score >= 60) return "#fbbc04";
    return "#ea4335";
  }

  function getScoreColor(score: number, _isInverted: boolean): string {
    return getMainScoreColor(score);
  }

  function generateStatusTag(
    _label: string,
    score: number,
    _isPercent?: boolean,
    _isMainScore?: boolean
  ): string {
    let status = "";
    let color = "#666";
    if (score >= 95) {
      status = "AMAZING";
      color = "#0b8043";
    } else if (score >= 90) {
      status = "EXCELLENT";
      color = "#0b8043";
    } else if (score >= 80) {
      status = "GOOD";
      color = "#f9ab00";
    } else if (score >= 70) {
      status = "FAIR";
      color = "#ff9800";
    } else if (score >= 60) {
      status = "NEEDS WORK";
      color = "#ff6f00";
    } else {
      status = "CRITICAL";
      color = "#c62828";
    }
    return (
      `<span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color: ${color}; background-color: #fff3e0; margin-left: 8px; vertical-align: middle;">` +
      escapeHtml(status) +
      "</span>"
    );
  }

  function generateEnhancedBar(score: number, _gradient: boolean): string {
    const pct = Math.max(0, Math.min(100, Math.round(score)));
    const color = getMainScoreColor(score);
    return (
      `<div style="display: inline-block; width: 100px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; vertical-align: middle;">` +
      `<div style="width: ${pct}%; height: 100%; background: ${color}; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);"></div>` +
      `</div>`
    );
  }

  function convertAndFormatInsight(text: string): string {
    if (!text) return "";
    const withParagraphs = text.replace(/\[PARAGRAPH BREAK\]/g, "<br><br>");
    return withParagraphs.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  }

  // Extract data from parameters - Enhanced extraction with multiple fallbacks
  const sleepMatch = fitbitSleep?.match(/(\d+)h (\d+)m/);
  const sleepStr = sleepMatch
    ? `${sleepMatch[1]}h ${sleepMatch[2]}m`
    : fitbitRawData?.sleep?.duration
    ? `${Math.floor(fitbitRawData.sleep.duration / 60)}h ${
        fitbitRawData.sleep.duration % 60
      }m`
    : "N/A";

  // Extract steps - try summary first, then fallback patterns
  const stepsMatch =
    fitbitActivity?.match(/👣 Steps: ([\d,]+)/) ||
    fitbitActivity?.match(/Steps: ([\d,]+)/);
  const stepsStr = stepsMatch
    ? stepsMatch[1]
    : fitbitRawData?.activity?.steps
    ? fitbitRawData.activity.steps.toLocaleString()
    : "N/A";

  // Extract calories - try summary first, then fallback patterns
  const caloriesMatch =
    fitbitActivity?.match(/🔥 Calories: ([\d,]+)/) ||
    fitbitActivity?.match(/Calories: ([\d,]+)/);
  const caloriesStr = caloriesMatch
    ? `${caloriesMatch[1]} cal`
    : fitbitRawData?.activity?.calories
    ? `${fitbitRawData.activity.calories.toLocaleString()} cal`
    : "N/A";

  // Extract active minutes - try multiple patterns
  const activeMatch =
    fitbitActivity?.match(/💪 Active Minutes: ([\d,]+)/) ||
    fitbitActivity?.match(/Active Minutes: ([\d,]+)/) ||
    fitbitActivity?.match(/Very Active: ([\d,]+)/) ||
    fitbitActivity?.match(/activeMinutes: ([\d,]+)/);
  const activeStr = activeMatch
    ? `${activeMatch[1]} min`
    : fitbitRawData?.activity?.activeMinutes
    ? `${fitbitRawData.activity.activeMinutes} min`
    : "N/A";

  // Extract resting heart rate
  const restingHRMatch =
    fitbitHeart?.match(/❤️ Resting HR: (\d+)/) ||
    fitbitHeart?.match(/Resting HR: (\d+)/);
  const restingHRStr = restingHRMatch
    ? `${restingHRMatch[1]} bpm`
    : fitbitRawData?.heart?.restingHR
    ? `${fitbitRawData.heart.restingHR} bpm`
    : "N/A";

  // Debug logging to help identify data extraction issues
  console.log("🔍 [EmailTemplate] Data extraction debug:", {
    fitbitActivity: fitbitActivity,
    fitbitHeart: fitbitHeart,
    fitbitSleep: fitbitSleep,
    extracted: {
      stepsStr,
      caloriesStr,
      activeStr,
      restingHRStr,
      sleepStr,
    },
  });

  // Use the complete HTML from var htmlBody section
  var htmlBody =
    "<div style='font-family:Helvetica,Arial,sans-serif; color:#333; max-width:600px; margin:auto;'>" +
    // Logo
    "<div style='text-align:center; margin:20px 0;'>" +
    "<img src='https://i.ibb.co/9HwyVWzR/My-Metric-Log-Logo.png' " +
    "alt='MyMetricLog Logo' style='max-width:300px; height:auto;'/>" +
    "</div>" +
    // Date header
    "<div style='text-align:center; margin:10px 0; font-size:18px; color:#555;'>" +
    fullDateStr +
    "</div>" +
    // Overall Score
    "<div style='text-align:center; margin:20px 0;'>" +
    "<div style='font-size:52px; font-weight:bold; color:" +
    getMainScoreColor(scores.total) +
    ";'>" + // Use the function here
    scores.total +
    "</div>" +
    "<div style='font-size:18px; color:#555; margin-bottom:5px;'><strong>Overall Score</strong>" +
    "</div>" +
    // Add the status tag under the score for daily report
    "<div style='margin-top:8px;'>" +
    generateStatusTag("Overall", scores.total, false, true) +
    "</div>" +
    "</div>" +
    // At a Glance
    "<div style='background:#e8f0fe; padding:16px; border-radius:8px; text-align:center; margin:20px 0; border-left: 4px solid #1976d2; box-shadow: 0 1px 3px rgba(0,0,0,0.05);'>" +
    "<strong style='font-size:16px;'>At a Glance:</strong><br>" +
    "<span style='font-size:15px; color:#424242; line-height:1.6;'>" +
    sleepStr +
    " sleep | " +
    stepsStr +
    " steps | " +
    caloriesStr +
    " | " +
    activeStr +
    " | " +
    restingHRStr +
    "</span>" +
    "</div>" +
    // 24-Hour Activity Pattern
    generate24HourActivityPattern(fitbitActivity, fitbitSleep, dayContext) +
    // Overall Analysis section
    "<div style='margin:16px 0; padding:16px; background: #f0f4ff; border-left: 4px solid #b8ccff; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>" +
    "<img src='" +
    getSageImage("analysis") +
    "' " +
    "alt='Sage Analysis' style='height:60px; width:auto; vertical-align:middle; margin-right:12px;'/>" +
    "Your Day, Decoded by Sage</h3>" +
    "<p style='margin:10px 0; font-size:16px; color:#6c5ce7; font-style:italic;'>" +
    (insightHeadline || "Your wellness data tells a story today") +
    "</p>" +
    "<div style='font-family:Arial, sans-serif; font-size:14px; line-height:1.6; color:#333;'>" +
    convertAndFormatInsight(insight) +
    "</div>" +
    "</div>" +
    // Performance Breakdown
    "<div style='background:#f0f4ff; border-left: 4px solid #b8ccff; padding:20px; border-radius:8px; margin:20px 0; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<h4 style='font-size:18px; font-weight:600; color:#1a1a1a; margin:0 0 12px 0;'>Performance Breakdown</h4>" +
    "<table style='width:100%; border-collapse: collapse;'>" +
    "<tr>" +
    "<td style='width:50%; padding:10px; vertical-align:top;'>" +
    "<div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle;'>Sleep:</span>" +
    generateEnhancedBar(scores.sleep, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.sleep +
    "</span>" +
    generateStatusTag("Sleep", scores.sleep, true) +
    "</div>" +
    "</div>" +
    "<div style='background:white; padding:15px; border-radius:6px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle;'>Activity:</span>" +
    generateEnhancedBar(scores.activity, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.activity +
    "</span>" +
    generateStatusTag("Activity", scores.activity, true) +
    "</div>" +
    "</div>" +
    "</td>" +
    "<td style='width:50%; padding:10px; vertical-align:top;'>" +
    "<div style='background:white; padding:15px; border-radius:6px; margin-bottom:10px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle;'>Heart:</span>" +
    generateEnhancedBar(scores.heart, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.heart +
    "</span>" +
    generateStatusTag("Heart", scores.heart, true) +
    "</div>" +
    "</div>" +
    "<div style='background:white; padding:15px; border-radius:6px;'>" +
    "<div style='margin-bottom:10px;'>" +
    "<span style='display:inline-block; width:70px; vertical-align:middle;'>Work:</span>" +
    generateEnhancedBar(scores.work, true) +
    "<span style='margin-left:10px; color:#666; font-weight:bold; vertical-align:middle;'>" +
    scores.work +
    "</span>" +
    generateStatusTag("Work", scores.work, true) +
    "</div>" +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "</div>" +
    // Mood Card
    generateMoodCard(moodInsight, scores) +
    // Update the Work Overview Section header
    "<div style='padding:20px; border-radius:8px; margin:20px 0; background: #f0f4f7; border-left: 4px solid #cbd5e1;'>" +
    "<table style='width:100%; margin-bottom:20px;'>" +
    "<tr>" +
    "<td rowspan='2' style='width:60px; vertical-align:middle;'>" +
    "<img src='" +
    getSageImage("working") +
    "' " +
    "alt='Sage Working' style='height:60px; width:auto;'/>" +
    "</td>" +
    "<td style='vertical-align:bottom; padding-left:12px;'>" +
    "<h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0;'>Work Overview</h3>" +
    "</td>" +
    "</tr>" +
    "<tr>" +
    "<td style='vertical-align:top; padding-left:12px;'>" +
    "<div style='font-size:36px; font-weight:bold; color:" +
    getScoreColor(scores.work, false) +
    ";'>" +
    scores.work +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "<div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0;'>📅 Calendar</h4>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    String(calSummary || "").replace(/\n/g, "<br>") +
    (calendarIntelligence && calendarIntelligence.score < 100
      ? "<br><span style='color:#ff6f00;'>⚠️ " +
        calendarIntelligence.insights.join(", ") +
        "</span>"
      : "") +
    "</div>" +
    "</div>" +
    "<div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0;'>✉️ Email</h4>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    String(emailSummary || "").replace(/\n/g, "<br>") +
    (emailResponseAnalysis && emailResponseAnalysis.avgMinutes
      ? "<br><div style='background:#f3e5f5; padding:10px; border-radius:4px; margin-top:8px;'>" +
        "<strong>⚡ Email Response Patterns:</strong><br>" +
        "<span style='font-size:13px;'>" +
        "• Average response time: <strong>" +
        (emailResponseAnalysis.avgMinutes < 60
          ? emailResponseAnalysis.avgMinutes + " minutes"
          : Math.round((emailResponseAnalysis.avgMinutes / 60) * 10) / 10 +
            " hours") +
        "</strong><br>" +
        (emailResponseAnalysis.avgMinutes < 60
          ? "• Status: <span style='color:#43a047;'>Highly responsive</span>"
          : emailResponseAnalysis.avgMinutes < 240
          ? "• Status: <span style='color:#ff9800;'>Moderate response time</span>"
          : "• Status: <span style='color:#ea4335;'>Delayed responses - inbox overwhelm?</span>") +
        "</span>" +
        "</div>"
      : "") +
    "</div>" +
    "</div>" +
    (completedTasks
      ? "<div style='background:white; padding:16px; border-radius:6px;'>" +
        "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0 0 8px 0;'>✅ Tasks</h4>" +
        "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
        String(completedTasks || "").replace(/\n/g, "<br>") +
        "</div>" +
        "</div>"
      : "") +
    // ADD INSIGHT BOX FOR WORK
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>" +
    "<strong style='color:#1565c0; font-size:13px;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    "Focus opportunities and email noise summarized above." +
    "</span>" +
    "</div>" +
    // ADD THIS RECOMMENDATION BLOCK
    "<div style='background:#dbeafe; padding:12px; border-radius:6px; margin-bottom:16px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#1565c0;'>🎯 Recommendation:</strong> " +
    "Optimize inbox filters to protect deep work blocks." +
    "</div>" +
    "</div>" +
    // Physical Wellness Section
    "<div style='padding:20px; border-radius:8px; margin:20px 0; background: #f0fdf4; border-left: 4px solid #bbf7d0;'>" +
    "<h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>" +
    "🏃 Physical Wellness</h3>" +
    // Sleep subsection
    "<div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<table style='width:100%; margin-bottom:16px;'>" +
    "<tr>" +
    "<td rowspan='2' style='width:48px; vertical-align:middle;'>" +
    "<img src='" +
    getSageImage("sleep") +
    "' " +
    "alt='Sage Sleep' style='width:48px; height:auto;'/>" +
    "</td>" +
    "<td style='vertical-align:bottom; padding-left:10px;'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Sleep</h4>" +
    "</td>" +
    "</tr>" +
    "<tr>" +
    "<td style='vertical-align:top; padding-left:10px;'>" +
    "<div style='font-size:36px; font-weight:bold; color:" +
    getScoreColor(scores.sleep, false) +
    ";'>" +
    scores.sleep +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    fitbitSleep
      .split("\n")
      .filter(function (line) {
        return line.indexOf("Sleep stages:") === -1; // Remove the text stages line
      })
      .join("<br>") +
    // ADD AI-GENERATED INSIGHT BOX
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>" +
    "<strong style='color:#6a1b9a; font-size:13px;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    "Sleep duration and quality summarized above." +
    "</span>" +
    "</div>" +
    // ADD RECOMMENDATION
    // UPDATE Recommendation box with darker purple and new emoji
    "<div style='background:#dbeafe; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#6a1b9a; font-size:13px;'>🎯 Recommendation:</strong> <span style='font-size:13px;'>" +
    "Aim for earlier bedtime to increase deep sleep." +
    "</span>" +
    "</div>" +
    "</div>" +
    // Activity subsection
    "<div style='background:white; padding:16px; border-radius:6px; margin-bottom:12px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<table style='width:100%; margin-bottom:16px;'>" +
    "<tr>" +
    "<td rowspan='2' style='width:48px; vertical-align:middle;'>" +
    "<img src='" +
    getSageImage("active") +
    "' " +
    "alt='Sage Active' style='width:48px; height:auto;'/>" +
    "</td>" +
    "<td style='vertical-align:bottom; padding-left:10px;'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Activity</h4>" +
    "</td>" +
    "</tr>" +
    "<tr>" +
    "<td style='vertical-align:top; padding-left:10px;'>" +
    "<div style='font-size:36px; font-weight:bold; color:" +
    getScoreColor(scores.activity, false) +
    ";'>" +
    scores.activity +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    // Remove the fitbitActivity.replace(/\n/g, '<br>') line completely
    (fitbitActivityLog
      ? "<div style='background:#e3f2fd; padding:10px; border-radius:4px; margin-bottom:10px;'>" +
        "<strong>📋 Logged Activities:</strong><br>" +
        String(fitbitActivityLog || "").replace(/\n/g, "<br>") +
        "</div>"
      : "") +
    // AI-GENERATED INSIGHT BOX with lighter green
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>" +
    "<strong style='color:#2e7d32; font-size:13px;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    "Sedentary time and active minutes summarized above." +
    "</span>" +
    "</div>" +
    // UPDATE Recommendation box with darker green and new emoji
    "<div style='background:#dbeafe; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#2e7d32; font-size:13px;'>🎯 Recommendation:</strong> <span style='font-size:13px;'>" +
    "Add a 30-minute brisk walk." +
    "</span>" +
    "</div>" +
    "</div>" +
    "</div>" +
    // Heart Health subsection
    "<div style='background:white; padding:16px; border-radius:6px; border:1px solid #ddd; box-shadow:0 1px 3px rgba(0,0,0,0.05);'>" +
    "<table style='width:100%; margin-bottom:16px;'>" +
    "<tr>" +
    "<td rowspan='2' style='width:48px; vertical-align:middle;'>" +
    "<img src='" +
    getSageImage("heart") +
    "' " +
    "alt='Sage Heart' style='width:48px; height:auto;'/>" +
    "</td>" +
    "<td style='vertical-align:bottom; padding-left:10px;'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Heart Health</h4>" +
    "</td>" +
    "</tr>" +
    "<tr>" +
    "<td style='vertical-align:top; padding-left:10px;'>" +
    "<div style='font-size:36px; font-weight:bold; color:" +
    getScoreColor(scores.heart, false) +
    ";'>" +
    scores.heart +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368;'>" +
    String(fitbitHeart || "").replace(/\n/g, "<br>") +
    (fitbitHRV
      ? "<br>💗 HRV: " +
        fitbitHRV.value +
        " ms (" +
        fitbitHRV.status +
        ")<br>" +
        "<em style='color:#666; font-size:13px;'>" +
        fitbitHRV.insight +
        "</em>"
      : "") +
    // In the email template, update heart insight box:
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-top:10px; margin-bottom:10px; border-left:3px solid #fbbf24;'>" +
    "<strong style='color:#5d4037; font-size:13px;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    "Heart metrics summarized above." +
    "</span>" +
    "</div>" +
    // Update heart recommendation box:
    "<div style='background:#dbeafe; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#5d4037; font-size:13px;'>🎯 Recommendation:</strong> <span style='font-size:13px;'>" +
    "Add moderate-intensity activity to boost HRV." +
    "</span>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    // Recovery Score section with visualization
    "<div style='background:#f0fdfa; padding:16px; border-radius:8px; margin:20px 0; border-left:3px solid #99f6e4;'>" +
    "<table style='width:100%; margin-bottom:16px;'>" +
    "<tr>" +
    "<td rowspan='2' style='width:48px; vertical-align:middle;'>" +
    "<img src='" +
    getSageImage("recovery") +
    "' " +
    "alt='Sage Recovery' style='width:48px; height:auto;'/>" +
    "</td>" +
    "<td style='vertical-align:bottom; padding-left:10px;'>" +
    "<h4 style='font-size:16px; font-weight:600; color:#424242; margin:0;'>Recovery</h4>" +
    "</td>" +
    "</tr>" +
    "<tr>" +
    "<td style='vertical-align:top; padding-left:10px;'>" +
    "<div style='font-size:36px; font-weight:bold; color:" +
    getScoreColor(recoveryQuotient.score, false) +
    ";'>" +
    recoveryQuotient.score +
    "</div>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "<div style='font-size:14px; line-height:1.6; color:#5f6368; margin-bottom:12px;'>" +
    "This score reflects your body's readiness for today based on sleep, heart rate recovery, and yesterday's activity balance." +
    "</div>" +
    // AI-GENERATED INSIGHT with lighter blue
    "<div style='background:#fef3c7; padding:10px; border-radius:4px; margin-bottom:12px; border-left:3px solid #fbbf24;'>" +
    "<strong style='font-size:13px; color:#1565c0;'>💡 Insight:</strong> <span style='font-size:13px;'>" +
    "Recovery insights summarized above." +
    "</span>" +
    "</div>" +
    // UPDATE Recommendation with darker blue and new emoji
    "<div style='background:#dbeafe; padding:10px; border-radius:4px; border-left:3px solid #93c5fd;'>" +
    "<strong style='color:#01579b; font-size:13px;'>🎯 Recommendation:</strong> <span style='font-size:13px;'>" +
    "Plan a walk to improve readiness." +
    "</span>" +
    "</div>" +
    "</div>" +
    // Environment & Lifestyle Section - UPDATED with equal formatting
    "<div style='background:#fff7ed; padding:20px; border-radius:8px; margin:20px 0; border-left: 4px solid #fed7aa; box-shadow: 0 1px 3px rgba(0,0,0,0.05); box-sizing: border-box;'>" +
    "<h3 style='font-size:20px; font-weight:600; color:#1a1a1a; margin:0 0 16px 0;'>" +
    "🌍 Environment & Lifestyle</h3>" +
    "<div style='display:grid; grid-template-columns:1fr 1fr; gap:12px; box-sizing:border-box; max-width:100%;'>" +
    // Weather section with clean card-like design matching the interface
    "<div style='background:white; padding:24px; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 4px 6px rgba(0,0,0,0.05); margin-bottom:20px;'>" +
    "<h4 style='font-size:20px; font-weight:700; color:#1f2937; margin:0 0 20px 0; display:flex; align-items:center;'>" +
    "🦊 <span style='margin-left:12px;'>Weather</span></h4>" +
    // Yesterday's Weather section
    "<div style='margin-bottom:20px;'>" +
    "<h5 style='font-size:16px; font-weight:600; color:#2563eb; margin:0 0 12px 0;'>Yesterday's Weather:</h5>" +
    (hourlyWeather && hourlyWeather.yesterday
      ? "<div style='font-size:14px; line-height:1.8; color:#374151;'>" +
        "<div style='margin-bottom:8px; display:flex; align-items:center;'>" +
        "☁️ <span style='margin-left:8px;'><strong>Condition:</strong> " +
        escapeHtml(hourlyWeather.yesterday.condition) +
        "</span>" +
        "</div>" +
        "<div style='margin-bottom:8px; display:flex; align-items:center;'>" +
        "🌡️ <span style='margin-left:8px;'><strong>Temperature:</strong> " +
        hourlyWeather.yesterday.temperature +
        "°F (feels like " +
        hourlyWeather.yesterday.feelsLike +
        "°F)</span>" +
        "</div>" +
        "<div style='margin-bottom:8px; display:flex; align-items:center;'>" +
        "💨 <span style='margin-left:8px;'><strong>Wind:</strong> " +
        hourlyWeather.yesterday.wind +
        " m/s</span>" +
        "</div>" +
        "<div style='margin-bottom:8px; display:flex; align-items:center;'>" +
        "☁️ <span style='margin-left:8px;'><strong>Cloud Cover:</strong> " +
        hourlyWeather.yesterday.cloudCover +
        "%</span>" +
        "</div>" +
        "<div style='display:flex; align-items:center;'>" +
        "📍 <span style='margin-left:8px;'><strong>Location:</strong> " +
        escapeHtml(hourlyWeather.yesterday.location) +
        "</span>" +
        "</div>" +
        "</div>"
      : "<div style='font-size:14px; color:#6b7280;'>" +
        String(weatherSummary || "Weather data not available").replace(
          /\n/g,
          "<br>"
        ) +
        "</div>") +
    "</div>" +
    // Today's Forecast section
    "<div style='margin-bottom:20px;'>" +
    "<h5 style='font-size:16px; font-weight:600; color:#1f2937; margin:0 0 12px 0;'>Today's Forecast:</h5>" +
    (hourlyWeather && hourlyWeather.todayForecast
      ? "<div style='font-size:14px; line-height:1.8; color:#374151;'>" +
        "<div style='margin-bottom:8px; display:flex; align-items:center;'>" +
        "🌡️ <span style='margin-left:8px;'><strong>Temp range:</strong> " +
        escapeHtml(hourlyWeather.todayForecast.tempRange) +
        "</span>" +
        "</div>" +
        "<div style='display:flex; align-items:center;'>" +
        "⭐ <span style='margin-left:8px;'><strong>Best outdoor times:</strong> " +
        (hourlyWeather.todayForecast.bestOutdoorTimes &&
        hourlyWeather.todayForecast.bestOutdoorTimes.length > 0
          ? hourlyWeather.todayForecast.bestOutdoorTimes
              .map((time: any) => time.time + " (" + time.temperature + "°F)")
              .join(", ")
          : "11 AM (66°F), 2 PM (75°F), 8 PM (70°F)") +
        "</span>" +
        "</div>" +
        "</div>"
      : "<div style='font-size:14px; color:#6b7280;'>Weather forecast unavailable</div>") +
    "</div>" +
    // Daylight section
    (hourlyWeather && hourlyWeather.daylight
      ? "<div style='margin-bottom:20px;'>" +
        "<div style='font-size:14px; line-height:1.8; color:#374151;'>" +
        "<div style='margin-bottom:8px; display:flex; align-items:center;'>" +
        "☀️ <span style='margin-left:8px;'><strong>Daylight:</strong> " +
        hourlyWeather.daylight.hours +
        " hours</span>" +
        "</div>" +
        "<div style='margin-bottom:8px; display:flex; align-items:center;'>" +
        "🌅 <span style='margin-left:8px;'><strong>Sunrise:</strong> " +
        hourlyWeather.daylight.sunrise +
        "</span>" +
        "</div>" +
        "<div style='display:flex; align-items:center;'>" +
        "🌇 <span style='margin-left:8px;'><strong>Sunset:</strong> " +
        hourlyWeather.daylight.sunset +
        "</span>" +
        "</div>" +
        "</div>" +
        "</div>"
      : "") +
    "</div>" +
    // Music section with detailed Spotify data
    "<div style='background:white; padding:20px; border-radius:8px; border:1px solid #e0e0e0; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>" +
    "<h4 style='font-size:18px; font-weight:700; color:#1a1a1a; margin:0 0 16px 0; display:flex; align-items:center;'>" +
    "🦊 <span style='margin-left:8px;'>Music</span></h4>" +
    "<div style='font-size:14px; line-height:1.6; color:#333333;'>" +
    // Music Statistics Section
    (spotifyInsights &&
    spotifyInsights.topArtists &&
    spotifyInsights.topArtists.length > 0
      ? "<div style='background:#f8fafc; padding:16px; border-radius:8px; margin-bottom:16px; border-left:4px solid #3b82f6;'>" +
        "<h5 style='font-size:16px; font-weight:600; color:#1e40af; margin:0 0 12px 0;'>Music Statistics</h5>" +
        "<div style='font-size:14px; line-height:1.8;'>" +
        "<div style='margin-bottom:8px;'>🎧 <strong>Tracks played:</strong> " +
        (audioFeatures?.tracks?.length || 0) +
        "</div>" +
        "<div style='margin-bottom:8px;'>👤 <strong>Top Artist:</strong> " +
        escapeHtml(spotifyInsights.topArtists[0].name) +
        "</div>" +
        "<div style='margin-bottom:8px;'>🎵 <strong>Top Track:</strong> " +
        escapeHtml(spotifyInsights.topArtists[0].name) +
        "</div>" +
        (spotifyInsights.listeningPatterns &&
        spotifyInsights.listeningPatterns.timeOfDay
          ? "<div style='margin-bottom:8px;'>🕐 <strong>Listening Activity by Time of Day:</strong> " +
            "Morning: " +
            (spotifyInsights.listeningPatterns.timeOfDay.morning || 0) +
            " | " +
            "Midday: " +
            (spotifyInsights.listeningPatterns.timeOfDay.midday || 0) +
            " | " +
            "Afternoon: " +
            (spotifyInsights.listeningPatterns.timeOfDay.afternoon || 0) +
            " | " +
            "Evening: " +
            (spotifyInsights.listeningPatterns.timeOfDay.evening || 0) +
            " | " +
            "Night: " +
            (spotifyInsights.listeningPatterns.timeOfDay.night || 0) +
            "</div>"
          : "") +
        (spotifyInsights.listeningPatterns &&
        spotifyInsights.listeningPatterns.warning
          ? "<div style='margin-bottom:8px; color:#f59e0b;'>⚠️ " +
            escapeHtml(spotifyInsights.listeningPatterns.warning) +
            "</div>"
          : "") +
        "</div>" +
        "</div>"
      : "<div style='background:#f8fafc; padding:16px; border-radius:8px; margin-bottom:16px; border-left:4px solid #3b82f6;'>" +
        "<div style='font-size:14px; color:#6b7280;'>" +
        String(spotifySummary || "No music data available").replace(
          /\n/g,
          "<br>"
        ) +
        "</div>" +
        "</div>") +
    // Music Insight Section
    "<div style='background:#fef3c7; padding:12px; border-radius:6px; margin-bottom:12px; border-left:4px solid #f59e0b;'>" +
    "<div style='display:flex; align-items:flex-start;'>" +
    "<span style='font-size:16px; margin-right:8px; margin-top:2px;'>💡</span>" +
    "<div>" +
    "<strong style='color:#92400e; font-size:14px; display:block; margin-bottom:4px;'>Insight:</strong>" +
    "<span style='font-size:14px; color:#451a03;'>" +
    (spotifyInsights && spotifyInsights.moodAnalysis
      ? "Your afternoon mental fog correlates with your peak music listening time of " +
        (audioFeatures?.tracks?.length || 0) +
        " tracks, suggesting you use music to clear your mind."
      : "Music listening patterns summarized above.") +
    "</span>" +
    "</div>" +
    "</div>" +
    "</div>" +
    // Music Recommendation Section
    "<div style='background:#fef2f2; padding:12px; border-radius:6px; border-left:4px solid #ef4444;'>" +
    "<div style='display:flex; align-items:flex-start;'>" +
    "<span style='font-size:16px; margin-right:8px; margin-top:2px;'>🎯</span>" +
    "<div>" +
    "<strong style='color:#dc2626; font-size:14px; display:block; margin-bottom:4px;'>Recommendation:</strong>" +
    "<span style='font-size:14px; color:#7f1d1d;'>" +
    (spotifyInsights &&
    spotifyInsights.topArtists &&
    spotifyInsights.topArtists.length > 0
      ? "Listen to " +
        escapeHtml(spotifyInsights.topArtists[0].name) +
        "'s music at 11 AM to uplift your mood and clear mental fog."
      : "Consider exploring new genres to diversify your listening experience.") +
    "</span>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    // Daily Mantra - UPDATED with Sage meditation image
    "<div style='background:#faf5ff; padding:20px; border-radius:12px; margin:20px 0; border-left:4px solid #e9d5ff; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>" +
    "<h4 style='font-size:18px; font-weight:600; color:#5f27cd; margin:0 0 12px 0; display:flex; align-items:center;'>" +
    "<img src='" +
    getSageImage("meditation") +
    "' " +
    "alt='Sage Meditation' style='width:48px; height:auto; margin-right:10px; vertical-align:middle;'/>" +
    "<span style='line-height:48px;'>Daily Mantra</span></h4>" +
    "<div style='background:rgba(255,255,255,0.7); padding:16px; border-radius:8px;'>" +
    "<div style='font-size:17px; color:#4a148c; font-style:italic; line-height:1.6; text-align:center; word-wrap:break-word;'>" +
    escapeHtml(mantra) +
    "</div>" +
    "</div>" +
    "</div>" +
    // Footer
    "<div style='margin-top:40px; padding-top:20px; border-top:1px solid #e0e0e0; " +
    "text-align:center; color:#999; font-size:12px;'>" +
    "MyMetricLog • Your Personal Wellness Companion<br>" +
    "🦊 Tracking • 📊 Analyzing • 🎯 Growing Together" +
    "</div>";

  return htmlBody;
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  if (!text) return "";
  const map: { [k: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Helper function to generate mood card
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
    scores.total >= 80 ? "#0b8043" : scores.total >= 60 ? "#fbbc04" : "#ea4335";
  const energyForecast = generateEnergyForecast(scores, moodKeyword);

  return (
    '<section style="background: linear-gradient(135deg, #f8f9fa 0%, #e8f0fe 100%); ' +
    "border: 2px solid " +
    borderColor +
    "; border-radius: 12px; padding: 20px; " +
    'margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">' +
    '<div style="display: flex; align-items: center; margin-bottom: 10px;">' +
    '<span style="font-size: 48px; margin-right: 15px;">' +
    emoji +
    "</span>" +
    "<div>" +
    '<h3 style="margin: 0; font-size: 20px; color: #1a73e8;">Today\'s Mood: ' +
    capitalizeFirstLetter(moodKeyword) +
    "</h3>" +
    '<p style="margin: 5px 0 0 0; color: #5f6368; font-size: 14px;">' +
    escapeHtml(moodInsight) +
    "</p>" +
    "</div></div>" +
    '<div style="background: rgba(255,255,255,0.7); border-radius: 8px; padding: 12px; ' +
    "margin-top: 15px; border-left: 4px solid " +
    borderColor +
    ';">' +
    '<strong style="color: #1a73e8;">📊 Energy Forecast:</strong><br>' +
    '<span style="color: #5f6368; font-size: 14px;">' +
    energyForecast +
    "</span>" +
    "</div></section>"
  );
}

// Helper function to generate energy forecast
function generateEnergyForecast(scores: any, mood: string): string {
  const forecasts: { [key: string]: string[] } = {
    high: [
      "Peak performance window: 9-11 AM. Schedule important tasks early.",
      "Strong energy reserves. Consider tackling complex projects today.",
      "Optimal conditions for deep work. Protect your focus time.",
    ],
    energized: [
      "Peak performance window: 9-11 AM. Schedule important tasks early.",
      "Strong energy reserves. Consider tackling complex projects today.",
      "Optimal conditions for deep work. Protect your focus time.",
    ],
    motivated: [
      "High motivation detected. Channel this energy into priority tasks.",
      "Perfect time for creative work and problem-solving.",
      "Consider taking on challenging projects today.",
    ],
    focused: [
      "Excellent focus potential. Block time for deep work.",
      "Minimize distractions during your peak hours.",
      "Ideal conditions for complex problem-solving.",
    ],
    calm: [
      "Steady, sustainable energy. Pace yourself throughout the day.",
      "Good conditions for thoughtful, deliberate work.",
      "Consider meditation or mindfulness practices.",
    ],
    relaxed: [
      "Gentle energy flow. Focus on lighter tasks and self-care.",
      "Good time for planning and reflection.",
      "Consider gentle exercise or outdoor activities.",
    ],
    balanced: [
      "Stable energy levels. Mix of focused work and breaks recommended.",
      "Good conditions for both creative and analytical tasks.",
      "Maintain regular breaks to sustain energy.",
    ],
    tired: [
      "Lower energy detected. Prioritize rest and lighter tasks.",
      "Consider power naps or short breaks.",
      "Focus on maintenance tasks rather than new projects.",
    ],
    foggy: [
      "Mental clarity may be reduced. Take extra breaks.",
      "Focus on simple, routine tasks today.",
      "Consider gentle movement or fresh air.",
    ],
    anxious: [
      "Heightened alertness detected. Practice calming techniques.",
      "Consider breathing exercises or meditation.",
      "Break large tasks into smaller, manageable steps.",
    ],
    overwhelmed: [
      "High stress levels. Prioritize self-care and simple tasks.",
      "Consider delegating or postponing non-essential work.",
      "Focus on one task at a time.",
    ],
    restless: [
      "Restless energy detected. Channel into physical activity.",
      "Consider walking meetings or standing work.",
      "Good time for organizing and decluttering.",
    ],
  };

  const moodForecasts = forecasts[mood] || forecasts.balanced;
  const randomForecast =
    moodForecasts[Math.floor(Math.random() * moodForecasts.length)];

  // Add score-based adjustments
  if (scores.total >= 80) {
    return (
      randomForecast + " Your high wellness score supports sustained energy."
    );
  } else if (scores.total >= 60) {
    return (
      randomForecast + " Your moderate wellness score suggests pacing yourself."
    );
  } else {
    return (
      randomForecast +
      " Your lower wellness score indicates prioritizing rest and recovery."
    );
  }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
