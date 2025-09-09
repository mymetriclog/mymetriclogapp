export interface StressRadar {
  level: "Low" | "Medium" | "High" | "Critical";
  score: number;
  factors: {
    sleep: number;
    heart: number;
    calendar: number;
    email: number;
    music: number;
  };
  insights: string[];
  recommendations: string[];
}

/**
 * Get stress radar - EXACT implementation from code.js
 */
export function getStressRadar(
  fitbitData: any,
  calendarAnalysis: any,
  emailStats: any,
  spotifyData: any
): StressRadar {
  const factors = {
    sleep: 0,
    heart: 0,
    calendar: 0,
    email: 0,
    music: 0,
  };

  const insights: string[] = [];
  const recommendations: string[] = [];

  // Sleep stress factor (0-100)
  if (fitbitData.sleep) {
    const sleepMatch = fitbitData.sleep.match(/(\d+)h (\d+)m/);
    const efficiencyMatch = fitbitData.sleep.match(/😴 Efficiency: (\d+)%/);

    if (sleepMatch) {
      const h = parseInt(sleepMatch[1], 10);
      const m = parseInt(sleepMatch[2], 10);
      const totalSleepMin = h * 60 + m;

      if (totalSleepMin < 360) {
        // Less than 6 hours
        factors.sleep = 90;
        insights.push("Insufficient sleep (under 6 hours)");
        recommendations.push("Prioritize 7-8 hours of sleep tonight");
      } else if (totalSleepMin < 420) {
        // Less than 7 hours
        factors.sleep = 70;
        insights.push("Below optimal sleep duration");
        recommendations.push("Aim for 7+ hours of sleep");
      } else if (totalSleepMin < 480) {
        // Less than 8 hours
        factors.sleep = 40;
        insights.push("Good sleep duration");
      } else {
        factors.sleep = 20;
        insights.push("Excellent sleep duration");
      }
    }

    if (efficiencyMatch) {
      const efficiency = parseInt(efficiencyMatch[1]);
      if (efficiency < 70) {
        factors.sleep = Math.max(factors.sleep, 80);
        insights.push("Poor sleep efficiency");
        recommendations.push("Improve sleep environment (cool, dark, quiet)");
      } else if (efficiency < 80) {
        factors.sleep = Math.max(factors.sleep, 60);
        insights.push("Moderate sleep efficiency");
      }
    }
  }

  // Heart stress factor (0-100)
  if (fitbitData.heart) {
    const rhrMatch = fitbitData.heart.match(/❤️ Resting HR: (\d+)/);
    if (rhrMatch) {
      const rhr = parseInt(rhrMatch[1], 10);
      const baselineRHR = getBaselineRHR();

      if (rhr > baselineRHR + 10) {
        factors.heart = 90;
        insights.push("Elevated resting heart rate");
        recommendations.push("Consider stress management techniques");
      } else if (rhr > baselineRHR + 5) {
        factors.heart = 70;
        insights.push("Slightly elevated heart rate");
      } else if (rhr < baselineRHR - 5) {
        factors.heart = 20;
        insights.push("Excellent heart rate recovery");
      } else {
        factors.heart = 40;
        insights.push("Normal heart rate");
      }
    }
  }

  // Calendar stress factor (0-100)
  if (calendarAnalysis) {
    const events = calendarAnalysis.totalEvents || 0;
    const backToBack = calendarAnalysis.backToBackMeetings || 0;
    const eveningMeetings = calendarAnalysis.timeDistribution?.evening || 0;

    if (events > 8) {
      factors.calendar = 90;
      insights.push("Excessive meetings (8+)");
      recommendations.push("Consider declining non-essential meetings");
    } else if (events > 6) {
      factors.calendar = 70;
      insights.push("High meeting load");
    } else if (events > 4) {
      factors.calendar = 50;
      insights.push("Moderate meeting load");
    } else if (events > 0) {
      factors.calendar = 30;
      insights.push("Light meeting schedule");
    } else {
      factors.calendar = 10;
      insights.push("No meetings - great for focus");
    }

    if (backToBack > 3) {
      factors.calendar = Math.max(factors.calendar, 80);
      insights.push("Too many back-to-back meetings");
      recommendations.push("Add buffer time between meetings");
    }

    if (eveningMeetings > 2) {
      factors.calendar = Math.max(factors.calendar, 70);
      insights.push("Many evening meetings");
      recommendations.push("Protect evening time for recovery");
    }
  }

  // Email stress factor (0-100)
  if (emailStats) {
    const primary = emailStats.primary || 0;
    const sent = emailStats.sent || 0;
    const noisePercentage = emailStats.noisePercentage || 0;

    if (primary > 100) {
      factors.email = 90;
      insights.push("Email overload (100+ primary emails)");
      recommendations.push("Implement email triage system");
    } else if (primary > 50) {
      factors.email = 70;
      insights.push("High email volume");
    } else if (primary > 20) {
      factors.email = 50;
      insights.push("Moderate email volume");
    } else {
      factors.email = 20;
      insights.push("Manageable email volume");
    }

    if (noisePercentage > 80) {
      factors.email = Math.max(factors.email, 80);
      insights.push("High email noise (80%+ promotional)");
      recommendations.push("Unsubscribe from promotional emails");
    }

    if (sent < 5 && primary > 20) {
      factors.email = Math.max(factors.email, 70);
      insights.push("Email response backlog");
      recommendations.push("Block time for email responses");
    }
  }

  // Music stress factor (0-100)
  if (spotifyData) {
    // Analyze music listening patterns for stress indicators
    const recentTracks = spotifyData.items || [];
    let highEnergyCount = 0;
    let lowEnergyCount = 0;

    recentTracks.forEach((track: any) => {
      const energy = track.audio_features?.energy || 0.5;
      if (energy > 0.7) {
        highEnergyCount++;
      } else if (energy < 0.3) {
        lowEnergyCount++;
      }
    });

    const totalTracks = recentTracks.length;
    if (totalTracks > 0) {
      const highEnergyRatio = highEnergyCount / totalTracks;
      const lowEnergyRatio = lowEnergyCount / totalTracks;

      if (highEnergyRatio > 0.8) {
        factors.music = 80;
        insights.push("High-energy music preference (possible stress)");
        recommendations.push("Consider calming music for relaxation");
      } else if (lowEnergyRatio > 0.8) {
        factors.music = 30;
        insights.push("Calming music preference");
      } else {
        factors.music = 50;
        insights.push("Balanced music listening");
      }
    }
  }

  // Calculate overall stress score
  const totalFactors = Object.values(factors).filter((v) => v > 0);
  const avgStress =
    totalFactors.length > 0
      ? totalFactors.reduce((sum, val) => sum + val, 0) / totalFactors.length
      : 0;

  let level: "Low" | "Medium" | "High" | "Critical";
  if (avgStress >= 80) {
    level = "Critical";
  } else if (avgStress >= 60) {
    level = "High";
  } else if (avgStress >= 40) {
    level = "Medium";
  } else {
    level = "Low";
  }

  return {
    level,
    score: Math.round(avgStress),
    factors,
    insights,
    recommendations,
  };
}

/**
 * Get baseline resting heart rate - EXACT implementation from code.js
 */
export function getBaselineRHR(): number {
  // This would typically be calculated from historical data
  // For now, returning a reasonable baseline
  return 60;
}

/**
 * Format stress radar - EXACT implementation from code.js
 */
export function formatStressRadar(stress: StressRadar): string {
  const levelEmojis = {
    Low: "🟢",
    Medium: "🟡",
    High: "🟠",
    Critical: "🔴",
  };

  return `${levelEmojis[stress.level]} ${stress.level} (${stress.score}/100)`;
}

/**
 * Get stress level color - EXACT implementation from code.js
 */
export function getStressLevelColor(level: string): string {
  switch (level) {
    case "Low":
      return "#10b981"; // Green
    case "Medium":
      return "#f59e0b"; // Yellow
    case "High":
      return "#f97316"; // Orange
    case "Critical":
      return "#ef4444"; // Red
    default:
      return "#6b7280"; // Gray
  }
}

/**
 * Generate stress recommendations - EXACT implementation from code.js
 */
export function generateStressRecommendations(stress: StressRadar): string[] {
  const recommendations: string[] = [];

  if (stress.level === "Critical" || stress.level === "High") {
    recommendations.push("Take a 10-minute break right now");
    recommendations.push("Practice deep breathing for 5 minutes");
    recommendations.push("Consider a short walk outside");
  }

  if (stress.factors.sleep > 70) {
    recommendations.push("Set a consistent bedtime routine");
    recommendations.push("Avoid screens 1 hour before bed");
  }

  if (stress.factors.calendar > 70) {
    recommendations.push("Block 2+ hours for deep work");
    recommendations.push("Add 15-minute buffers between meetings");
  }

  if (stress.factors.email > 70) {
    recommendations.push("Implement email batching (check 3x daily)");
    recommendations.push("Use email filters to reduce noise");
  }

  if (stress.factors.heart > 70) {
    recommendations.push("Practice meditation or mindfulness");
    recommendations.push("Consider reducing caffeine intake");
  }

  return recommendations;
}
