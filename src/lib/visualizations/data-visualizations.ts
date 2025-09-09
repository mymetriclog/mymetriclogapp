export interface SleepStages {
  deep: { minutes: number; percent: number };
  light: { minutes: number; percent: number };
  rem: { minutes: number; percent: number };
  awake: { minutes: number; percent: number };
}

export interface HeartRateZones {
  fatBurn: number;
  cardio: number;
  peak: number;
}

export interface ActivityZones {
  sedentary: number;
  lightlyActive: number;
  fairlyActive: number;
  veryActive: number;
}

/**
 * Generate sleep stages visualization - EXACT implementation from code.js
 */
export function generateSleepStagesVisualization(sleepData: string): string {
  // Parse sleep stages from the data
  const stagesMatch = sleepData.match(
    /Deep: (\d+)m \((\d+)%\).*Light: (\d+)m \((\d+)%\).*REM: (\d+)m \((\d+)%\).*Awake: (\d+)m/
  );

  if (!stagesMatch) {
    return ""; // No stages data available
  }

  const stages: SleepStages = {
    deep: {
      minutes: parseInt(stagesMatch[1]),
      percent: parseInt(stagesMatch[2]),
    },
    light: {
      minutes: parseInt(stagesMatch[3]),
      percent: parseInt(stagesMatch[4]),
    },
    rem: {
      minutes: parseInt(stagesMatch[5]),
      percent: parseInt(stagesMatch[6]),
    },
    awake: { minutes: parseInt(stagesMatch[7]), percent: 0 },
  };

  // Calculate awake percentage
  const totalMinutes =
    stages.deep.minutes +
    stages.light.minutes +
    stages.rem.minutes +
    stages.awake.minutes;
  stages.awake.percent = Math.round(
    (stages.awake.minutes / totalMinutes) * 100
  );

  let html =
    '<div style="margin-top: 16px; background: #f0fdf4; padding: 16px; border-radius: 8px;">';
  html +=
    '<h5 style="font-size: 14px; font-weight: 600; color: #5f27cd; margin: 0 0 12px 0;">Sleep Stages Distribution</h5>';

  // Create horizontal bar chart
  html +=
    '<div style="display: flex; align-items: center; background: white; border-radius: 6px; overflow: hidden; height: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';

  const colors = {
    deep: "#4a148c",
    light: "#9c88ff",
    rem: "#64b5f6",
    awake: "#ff6b6b",
  };

  const order = ["deep", "light", "rem", "awake"];

  order.forEach(function (stage) {
    if (stages[stage as keyof SleepStages].percent > 0) {
      html +=
        '<div style="width: ' +
        stages[stage as keyof SleepStages].percent +
        "%; height: 100%; background: " +
        colors[stage as keyof typeof colors] +
        "; " +
        'position: relative; color: white; font-size: 12px; font-weight: 600;">';
      if (stages[stage as keyof SleepStages].percent > 10) {
        html +=
          '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">' +
          stages[stage as keyof SleepStages].percent +
          "%</div>";
      }
      html += "</div>";
    }
  });

  html += "</div>";

  // Legend
  html +=
    '<div style="display: flex; justify-content: space-around; margin-top: 12px; flex-wrap: wrap;">';

  order.forEach(function (stage) {
    const label = stage.charAt(0).toUpperCase() + stage.slice(1);
    html += '<div style="display: flex; align-items: center; margin: 4px;">';
    html +=
      '<div style="width: 12px; height: 12px; background: ' +
      colors[stage as keyof typeof colors] +
      '; border-radius: 2px; margin-right: 6px;"></div>';
    html +=
      '<span style="font-size: 13px; color: #424242;">' +
      label +
      ": " +
      stages[stage as keyof SleepStages].minutes +
      "m</span>";
    html += "</div>";
  });

  html += "</div>";

  // Add sleep quality insights
  html +=
    '<div style="margin-top: 12px; padding: 8px; background: rgba(255,255,255,0.7); border-radius: 4px;">';

  if (stages.deep.percent >= 20) {
    html +=
      '<span style="color: #2e7d32; font-size: 12px;">✅ Excellent deep sleep</span>';
  } else if (stages.deep.percent >= 15) {
    html +=
      '<span style="color: #f57c00; font-size: 12px;">⚠️ Moderate deep sleep</span>';
  } else {
    html +=
      '<span style="color: #d32f2f; font-size: 12px;">❌ Low deep sleep</span>';
  }

  if (stages.awake.percent > 10) {
    html +=
      ' <span style="color: #d32f2f; font-size: 12px;">⚠️ High wake time</span>';
  }

  html += "</div></div>";

  return html;
}

/**
 * Generate heart rate zones visualization - EXACT implementation from code.js
 */
export function generateHeartRateZonesVisualization(heartData: string): string {
  const zonesMatch = heartData.match(/💓 Active zones: (.+?)(?=\n|$)/);

  if (!zonesMatch) {
    return "";
  }

  const zonesText = zonesMatch[1];
  const fatBurnMatch = zonesText.match(/Fat Burn: (\d+)min/);
  const cardioMatch = zonesText.match(/Cardio: (\d+)min/);
  const peakMatch = zonesText.match(/Peak: (\d+)min/);

  const zones: HeartRateZones = {
    fatBurn: fatBurnMatch ? parseInt(fatBurnMatch[1]) : 0,
    cardio: cardioMatch ? parseInt(cardioMatch[1]) : 0,
    peak: peakMatch ? parseInt(peakMatch[1]) : 0,
  };

  const totalMinutes = zones.fatBurn + zones.cardio + zones.peak;

  if (totalMinutes === 0) {
    return "";
  }

  let html =
    '<div style="margin-top: 16px; background: #fef2f2; padding: 16px; border-radius: 8px;">';
  html +=
    '<h5 style="font-size: 14px; font-weight: 600; color: #dc2626; margin: 0 0 12px 0;">Heart Rate Zones</h5>';

  // Create horizontal bar chart
  html +=
    '<div style="display: flex; align-items: center; background: white; border-radius: 6px; overflow: hidden; height: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';

  const colors = {
    fatBurn: "#fbbf24",
    cardio: "#f97316",
    peak: "#dc2626",
  };

  const order = ["fatBurn", "cardio", "peak"];

  order.forEach(function (zone) {
    const minutes = zones[zone as keyof HeartRateZones];
    const percent = Math.round((minutes / totalMinutes) * 100);

    if (percent > 0) {
      html +=
        '<div style="width: ' +
        percent +
        "%; height: 100%; background: " +
        colors[zone as keyof typeof colors] +
        "; " +
        'position: relative; color: white; font-size: 12px; font-weight: 600;">';
      if (percent > 15) {
        html +=
          '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">' +
          minutes +
          "m</div>";
      }
      html += "</div>";
    }
  });

  html += "</div>";

  // Legend
  html +=
    '<div style="display: flex; justify-content: space-around; margin-top: 12px; flex-wrap: wrap;">';

  order.forEach(function (zone) {
    const minutes = zones[zone as keyof HeartRateZones];
    if (minutes > 0) {
      const label =
        zone === "fatBurn" ? "Fat Burn" : zone === "cardio" ? "Cardio" : "Peak";
      html += '<div style="display: flex; align-items: center; margin: 4px;">';
      html +=
        '<div style="width: 12px; height: 12px; background: ' +
        colors[zone as keyof typeof colors] +
        '; border-radius: 2px; margin-right: 6px;"></div>';
      html +=
        '<span style="font-size: 13px; color: #424242;">' +
        label +
        ": " +
        minutes +
        "m</span>";
      html += "</div>";
    }
  });

  html += "</div></div>";

  return html;
}

/**
 * Generate activity zones visualization - EXACT implementation from code.js
 */
export function generateActivityZonesVisualization(
  activityData: string
): string {
  const veryActiveMatch = activityData.match(/💪 Very Active: (\d+) min/);
  const fairlyActiveMatch = activityData.match(/🚶 Fairly Active: (\d+) min/);
  const lightlyActiveMatch = activityData.match(/🚶 Lightly Active: (\d+) min/);
  const sedentaryMatch = activityData.match(/🪑 Sedentary: (\d+) min/);

  const zones: ActivityZones = {
    sedentary: sedentaryMatch ? parseInt(sedentaryMatch[1]) : 0,
    lightlyActive: lightlyActiveMatch ? parseInt(lightlyActiveMatch[1]) : 0,
    fairlyActive: fairlyActiveMatch ? parseInt(fairlyActiveMatch[1]) : 0,
    veryActive: veryActiveMatch ? parseInt(veryActiveMatch[1]) : 0,
  };

  const totalMinutes =
    zones.sedentary +
    zones.lightlyActive +
    zones.fairlyActive +
    zones.veryActive;

  if (totalMinutes === 0) {
    return "";
  }

  let html =
    '<div style="margin-top: 16px; background: #f0f9ff; padding: 16px; border-radius: 8px;">';
  html +=
    '<h5 style="font-size: 14px; font-weight: 600; color: #0369a1; margin: 0 0 12px 0;">Activity Zones</h5>';

  // Create horizontal bar chart
  html +=
    '<div style="display: flex; align-items: center; background: white; border-radius: 6px; overflow: hidden; height: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';

  const colors = {
    sedentary: "#94a3b8",
    lightlyActive: "#60a5fa",
    fairlyActive: "#3b82f6",
    veryActive: "#1d4ed8",
  };

  const order = ["veryActive", "fairlyActive", "lightlyActive", "sedentary"];

  order.forEach(function (zone) {
    const minutes = zones[zone as keyof ActivityZones];
    const percent = Math.round((minutes / totalMinutes) * 100);

    if (percent > 0) {
      html +=
        '<div style="width: ' +
        percent +
        "%; height: 100%; background: " +
        colors[zone as keyof typeof colors] +
        "; " +
        'position: relative; color: white; font-size: 12px; font-weight: 600;">';
      if (percent > 10) {
        html +=
          '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">' +
          Math.round((minutes / 60) * 10) / 10 +
          "h</div>";
      }
      html += "</div>";
    }
  });

  html += "</div>";

  // Legend
  html +=
    '<div style="display: flex; justify-content: space-around; margin-top: 12px; flex-wrap: wrap;">';

  order.forEach(function (zone) {
    const minutes = zones[zone as keyof ActivityZones];
    if (minutes > 0) {
      const label =
        zone === "sedentary"
          ? "Sedentary"
          : zone === "lightlyActive"
          ? "Light"
          : zone === "fairlyActive"
          ? "Moderate"
          : "Very Active";
      html += '<div style="display: flex; align-items: center; margin: 4px;">';
      html +=
        '<div style="width: 12px; height: 12px; background: ' +
        colors[zone as keyof typeof colors] +
        '; border-radius: 2px; margin-right: 6px;"></div>';
      html +=
        '<span style="font-size: 13px; color: #424242;">' +
        label +
        ": " +
        Math.round((minutes / 60) * 10) / 10 +
        "h</span>";
      html += "</div>";
    }
  });

  html += "</div></div>";

  return html;
}

/**
 * Generate mini trend chart - EXACT implementation from code.js
 */
export function generateMiniTrendChart(
  metricName: string,
  currentScore: number,
  color: string
): string {
  // Generate sample trend data (in real implementation, this would come from historical data)
  const trendData = generateSampleTrend();
  const avgValue = Math.round(
    trendData.reduce((a, b) => a + b, 0) / trendData.length
  );

  let html = `<div style="margin-bottom: 24px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-weight: 600; color: #424242;">${metricName}</span>
      <span style="font-size: 16px; color: ${color}; font-weight: 600;">
        Avg: ${avgValue}
      </span>
    </div>`;

  // Simple line chart using divs
  html +=
    '<div style="position: relative; height: 60px; border-left: 1px solid #ddd; border-bottom: 1px solid #ddd;">';

  const maxVal = Math.max.apply(null, trendData);
  const minVal = Math.min.apply(null, trendData);
  const range = maxVal - minVal || 1;

  trendData.forEach(function (value, i) {
    const x = (i / (trendData.length - 1)) * 100;
    const y = 100 - ((value - minVal) / range) * 100;

    // Point
    html += `<div style="position: absolute; width: 8px; height: 8px; background: ${color}; 
       border-radius: 50%; left: ${x}%; top: ${y}%; transform: translate(-50%, -50%);" 
       title="Day ${i + 1}: ${value}"></div>`;

    // Line (simplified)
    if (i < trendData.length - 1) {
      const nextX = ((i + 1) / (trendData.length - 1)) * 100;
      const nextY = 100 - ((trendData[i + 1] - minVal) / range) * 100;
      const angle = (Math.atan2(nextY - y, nextX - x) * 180) / Math.PI;
      const length = Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextY - y, 2));

      html += `<div style="position: absolute; height: 2px; background: ${color}; 
         left: ${x}%; top: ${y}%; width: ${length}%; 
         transform-origin: 0 0; transform: rotate(${angle}deg);"></div>`;
    }
  });

  html += "</div></div>";
  return html;
}

/**
 * Generate sample trend data
 */
function generateSampleTrend(): number[] {
  const data = [];
  for (let i = 0; i < 7; i++) {
    data.push(Math.floor(Math.random() * 40) + 60); // Random values between 60-100
  }
  return data;
}

/**
 * Generate sparkline - EXACT implementation from code.js
 */
export function generateSparkline(values: number[], baseColor: string): string {
  if (values.length === 0) return "";

  const maxVal = Math.max.apply(null, values);
  const minVal = Math.min.apply(null, values);
  const range = maxVal - minVal || 1;

  let html =
    '<div style="display: inline-block; width: 100px; height: 20px; position: relative;">';
  html +=
    '<svg width="100" height="20" style="position: absolute; top: 0; left: 0;">';
  html +=
    '<polyline fill="none" stroke="' +
    baseColor +
    '" stroke-width="2" points="';

  values.forEach((value, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 20 - ((value - minVal) / range) * 20;
    html += x + "," + y + " ";
  });

  html += '"/></svg></div>';
  return html;
}
