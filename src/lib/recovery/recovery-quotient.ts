export interface RecoveryQuotient {
  score: number;
  readiness: "Poor" | "Fair" | "Good" | "Excellent";
  factors: {
    sleep: number;
    heart: number;
    activity: number;
    consistency: number;
  };
  insights: string[];
  recommendations: string[];
}

/**
 * Get recovery quotient - EXACT implementation from code.js
 */
export function getRecoveryQuotient(
  sleepData: string,
  heartData: string,
  activityData: string,
  previousDayData: any
): RecoveryQuotient {
  const factors = {
    sleep: 0,
    heart: 0,
    activity: 0,
    consistency: 0,
  };

  const insights: string[] = [];
  const recommendations: string[] = [];

  // Sleep recovery score (0-100)
  factors.sleep = calculateSleepRecoveryScore(sleepData);

  if (factors.sleep >= 80) {
    insights.push("Excellent sleep recovery");
  } else if (factors.sleep >= 60) {
    insights.push("Good sleep recovery");
  } else if (factors.sleep >= 40) {
    insights.push("Moderate sleep recovery");
  } else {
    insights.push("Poor sleep recovery");
    recommendations.push("Prioritize 7-8 hours of quality sleep");
  }

  // Heart recovery score (0-100)
  factors.heart = calculateHRRecoveryScore(heartData, previousDayData);

  if (factors.heart >= 80) {
    insights.push("Excellent heart recovery");
  } else if (factors.heart >= 60) {
    insights.push("Good heart recovery");
  } else if (factors.heart >= 40) {
    insights.push("Moderate heart recovery");
  } else {
    insights.push("Poor heart recovery");
    recommendations.push("Consider stress management and rest");
  }

  // Activity recovery score (0-100)
  factors.activity = calculateActiveRecoveryScore(activityData);

  if (factors.activity >= 80) {
    insights.push("Excellent activity recovery");
  } else if (factors.activity >= 60) {
    insights.push("Good activity recovery");
  } else if (factors.activity >= 40) {
    insights.push("Moderate activity recovery");
  } else {
    insights.push("Poor activity recovery");
    recommendations.push("Include light movement and stretching");
  }

  // Consistency score (0-100)
  factors.consistency = calculateConsistencyScore();

  if (factors.consistency >= 80) {
    insights.push("Excellent consistency");
  } else if (factors.consistency >= 60) {
    insights.push("Good consistency");
  } else if (factors.consistency >= 40) {
    insights.push("Moderate consistency");
  } else {
    insights.push("Poor consistency");
    recommendations.push("Focus on building consistent habits");
  }

  // Calculate overall recovery score
  const totalScore = Math.round(
    factors.sleep * 0.4 +
      factors.heart * 0.3 +
      factors.activity * 0.2 +
      factors.consistency * 0.1
  );

  let readiness: "Poor" | "Fair" | "Good" | "Excellent";
  if (totalScore >= 80) {
    readiness = "Excellent";
  } else if (totalScore >= 60) {
    readiness = "Good";
  } else if (totalScore >= 40) {
    readiness = "Fair";
  } else {
    readiness = "Poor";
  }

  // Store recovery score for tomorrow's comparison
  storePreviousRecoveryScore(totalScore);

  return {
    score: totalScore,
    readiness,
    factors,
    insights,
    recommendations,
  };
}

/**
 * Calculate sleep recovery score - EXACT implementation from code.js
 */
export function calculateSleepRecoveryScore(sleepData: string): number {
  const sleepMatch = sleepData.match(/(\d+)h (\d+)m/);
  const efficiencyMatch = sleepData.match(/😴 Efficiency: (\d+)%/);

  if (!sleepMatch) return 0;

  const h = parseInt(sleepMatch[1], 10);
  const m = parseInt(sleepMatch[2], 10);
  const totalSleepMin = h * 60 + m;
  const efficiency = efficiencyMatch ? parseInt(efficiencyMatch[1]) : 80;

  let score = 0;

  // Duration component (60 points)
  if (totalSleepMin >= 480) {
    // 8+ hours
    score += 60;
  } else if (totalSleepMin >= 420) {
    // 7+ hours
    score += 50;
  } else if (totalSleepMin >= 360) {
    // 6+ hours
    score += 35;
  } else if (totalSleepMin >= 300) {
    // 5+ hours
    score += 20;
  } else {
    score += 10;
  }

  // Efficiency component (40 points)
  if (efficiency >= 90) {
    score += 40;
  } else if (efficiency >= 80) {
    score += 35;
  } else if (efficiency >= 70) {
    score += 25;
  } else if (efficiency >= 60) {
    score += 15;
  } else {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Calculate heart recovery score - EXACT implementation from code.js
 */
export function calculateHRRecoveryScore(
  heartData: string,
  previousDayData: any
): number {
  const rhrMatch = heartData.match(/❤️ Resting HR: (\d+)/);
  const zonesMatch = heartData.match(/💓 Active zones: (.+?)(?=\n|$)/);

  if (!rhrMatch) return 0;

  const rhr = parseInt(rhrMatch[1], 10);
  const baselineRHR = getBaselineRHR();

  let score = 0;

  // RHR component (70 points)
  if (rhr <= baselineRHR - 5) {
    score += 70; // Excellent recovery
  } else if (rhr <= baselineRHR) {
    score += 60; // Good recovery
  } else if (rhr <= baselineRHR + 5) {
    score += 40; // Moderate recovery
  } else if (rhr <= baselineRHR + 10) {
    score += 20; // Poor recovery
  } else {
    score += 10; // Very poor recovery
  }

  // Heart rate zones component (30 points)
  if (zonesMatch) {
    const zonesText = zonesMatch[1];
    const cardioMatch = zonesText.match(/Cardio: (\d+)min/);
    const peakMatch = zonesText.match(/Peak: (\d+)min/);

    const cardioMin = cardioMatch ? parseInt(cardioMatch[1]) : 0;
    const peakMin = peakMatch ? parseInt(peakMatch[1]) : 0;

    if (cardioMin >= 20 || peakMin >= 10) {
      score += 30; // Excellent cardiovascular work
    } else if (cardioMin >= 10 || peakMin >= 5) {
      score += 25; // Good cardiovascular work
    } else if (cardioMin > 0 || peakMin > 0) {
      score += 15; // Some cardiovascular work
    } else {
      score += 5; // No cardiovascular work
    }
  }

  return Math.min(100, score);
}

/**
 * Calculate active recovery score - EXACT implementation from code.js
 */
export function calculateActiveRecoveryScore(activityData: string): number {
  const stepsMatch = activityData.match(/👣 Steps: ([\d,]+)/);
  const veryActiveMatch = activityData.match(/💪 Very Active: (\d+) min/);
  const fairlyActiveMatch = activityData.match(/🚶 Fairly Active: (\d+) min/);
  const sedentaryMatch = activityData.match(/🪑 Sedentary: (\d+) min/);

  if (!stepsMatch) return 0;

  const steps = parseInt(stepsMatch[1].replace(/,/g, ""), 10);
  const veryActive = veryActiveMatch ? parseInt(veryActiveMatch[1], 10) : 0;
  const fairlyActive = fairlyActiveMatch
    ? parseInt(fairlyActiveMatch[1], 10)
    : 0;
  const sedentary = sedentaryMatch ? parseInt(sedentaryMatch[1], 10) : 0;

  let score = 0;

  // Steps component (40 points)
  if (steps >= 10000) {
    score += 40;
  } else if (steps >= 8000) {
    score += 35;
  } else if (steps >= 6000) {
    score += 25;
  } else if (steps >= 4000) {
    score += 15;
  } else {
    score += 5;
  }

  // Active minutes component (40 points)
  const activeMinutes = veryActive + fairlyActive;
  if (activeMinutes >= 60) {
    score += 40;
  } else if (activeMinutes >= 45) {
    score += 35;
  } else if (activeMinutes >= 30) {
    score += 25;
  } else if (activeMinutes >= 15) {
    score += 15;
  } else {
    score += 5;
  }

  // Sedentary penalty (20 points)
  if (sedentary > 600) {
    // More than 10 hours
    score -= 20;
  } else if (sedentary > 480) {
    // More than 8 hours
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate consistency score - EXACT implementation from code.js
 */
export function calculateConsistencyScore(): number {
  // This would typically be calculated from historical data
  // For now, returning a reasonable baseline
  return 70;
}

/**
 * Get baseline resting heart rate
 */
function getBaselineRHR(): number {
  return 60; // This would typically be calculated from historical data
}

/**
 * Store previous recovery score for comparison
 */
function storePreviousRecoveryScore(score: number): void {
  // This would typically store in a database or cache
  // For now, just a placeholder
  console.log(`Storing recovery score: ${score}`);
}

/**
 * Get previous recovery score for comparison
 */
function getPreviousRecoveryScore(): number {
  // This would typically retrieve from a database or cache
  // For now, returning a reasonable baseline
  return 70;
}

/**
 * Format recovery quotient - EXACT implementation from code.js
 */
export function formatRecoveryQuotient(recovery: RecoveryQuotient): string {
  const readinessEmojis = {
    Poor: "🔴",
    Fair: "🟡",
    Good: "🟢",
    Excellent: "⭐",
  };

  return `${readinessEmojis[recovery.readiness]} ${recovery.readiness} (${
    recovery.score
  }/100)`;
}

/**
 * Get recovery readiness color - EXACT implementation from code.js
 */
export function getRecoveryReadinessColor(readiness: string): string {
  switch (readiness) {
    case "Excellent":
      return "#10b981"; // Green
    case "Good":
      return "#059669"; // Dark green
    case "Fair":
      return "#f59e0b"; // Yellow
    case "Poor":
      return "#ef4444"; // Red
    default:
      return "#6b7280"; // Gray
  }
}
