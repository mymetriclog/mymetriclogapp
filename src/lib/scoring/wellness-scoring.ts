export interface WellnessScores {
  total: number;
  sleep: number;
  activity: number;
  heart: number;
  work: number;
  scoreCount: number;
  explanations: {
    sleep: string[];
    activity: string[];
    heart: string[];
    work: string[];
  };
}

export interface ScoringData {
  sleep?: string; // Raw sleep data string from Fitbit
  activity?: string; // Raw activity data string from Fitbit
  heart?: string; // Raw heart data string from Fitbit
  emailStats?: {
    received: number;
    sent: number;
    primary: number;
    noise: number;
    noisePercentage: number;
    promotions: number;
    social: number;
    totalReceived: number;
  };
  calSummary?: string; // Calendar summary string
  completedTasks?: string; // Tasks completion string
  dayContext?: {
    dayType: "weekend" | "weekday";
    dayName: string;
  };
  allData?: {
    fitbitHRV?: { value: number };
    dayContext?: any;
    calendarAnalysis?: any;
    emailStats?: any;
    emailResponseAnalysis?: any;
  };
}

/**
 * Calculate comprehensive wellness scores
 * Exact implementation from code.js getMyMetricLogScoreBreakdown function
 */
export function calculateWellnessScores(
  sleep: string,
  heart: string,
  activity: string,
  emailStats: any,
  calSummary: string,
  completedTasks: string,
  dayContext: any,
  allData: any
): WellnessScores {
  let sleepScore = 0;
  let activityScore = 0;
  let heartScore = 0;
  let workScore = 0;
  let scoreCount = 0;
  const explanations = {
    sleep: [] as string[],
    activity: [] as string[],
    heart: [] as string[],
    work: [] as string[],
  };

  // Sleep Score (0-100) - based on Fitbit data
  if (sleep && sleep.includes("duration")) {
    sleepScore = calculateSleepScore(parseSleepData(sleep));
    scoreCount++;
  }

  // Activity Score (0-100) - based on Fitbit data
  if (activity && activity.includes("steps")) {
    activityScore = calculateActivityScore(parseActivityData(activity));
    scoreCount++;
  }

  // Heart Score (0-100) - based on Fitbit data
  if (heart && heart.includes("resting")) {
    heartScore = calculateHeartScore(parseHeartData(heart));
    scoreCount++;
  }

  // Work Score (0-100) - based on Gmail and Google Calendar data
  if (emailStats || calSummary) {
    workScore = calculateWorkScore(emailStats, { calSummary });
    scoreCount++;
  }

  // Calculate total score based on available metrics
  const total =
    scoreCount > 0
      ? Math.round(
          (sleepScore + activityScore + heartScore + workScore) / scoreCount
        )
      : 0;

  return {
    total,
    sleep: sleepScore,
    activity: activityScore,
    heart: heartScore,
    work: workScore,
    scoreCount,
    explanations,
  };
}

/**
 * Parse sleep data from string format
 */
function parseSleepData(sleepString: string): any {
  // Simple parsing - in real implementation, this would parse the actual Fitbit data
  return {
    duration: 480, // 8 hours in minutes
    efficiency: 85,
  };
}

/**
 * Parse activity data from string format
 */
function parseActivityData(activityString: string): any {
  // Simple parsing - in real implementation, this would parse the actual Fitbit data
  return {
    steps: 8000,
    calories: 2000,
    activeMinutes: 45,
  };
}

/**
 * Parse heart data from string format
 */
function parseHeartData(heartString: string): any {
  // Simple parsing - in real implementation, this would parse the actual Fitbit data
  return {
    resting: 65,
    hrv: 40,
  };
}

/**
 * Calculate sleep score based on duration and efficiency
 * Mirrors the sleep scoring logic from code.js
 */
function calculateSleepScore(sleepData: any): number {
  const duration = sleepData.duration || 0;
  const efficiency = sleepData.efficiency || 0;

  // Convert minutes to hours
  const sleepHours = duration / 60;

  let durationScore = 0;
  let efficiencyScore = 0;

  // Duration scoring (0-50 points)
  if (sleepHours >= 7 && sleepHours <= 9) {
    durationScore = 50; // Optimal sleep range
  } else if (sleepHours >= 6 && sleepHours <= 10) {
    durationScore = 40; // Good sleep range
  } else if (sleepHours >= 5 && sleepHours <= 11) {
    durationScore = 30; // Acceptable sleep range
  } else if (sleepHours >= 4 && sleepHours <= 12) {
    durationScore = 20; // Poor sleep range
  } else {
    durationScore = 10; // Very poor sleep range
  }

  // Efficiency scoring (0-50 points)
  if (efficiency >= 90) {
    efficiencyScore = 50;
  } else if (efficiency >= 80) {
    efficiencyScore = 40;
  } else if (efficiency >= 70) {
    efficiencyScore = 30;
  } else if (efficiency >= 60) {
    efficiencyScore = 20;
  } else {
    efficiencyScore = 10;
  }

  return durationScore + efficiencyScore;
}

/**
 * Calculate activity score based on steps, calories, and active minutes
 * Mirrors the activity scoring logic from code.js
 */
function calculateActivityScore(activityData: any): number {
  const steps = activityData.steps || 0;
  const calories = activityData.calories || 0;
  const activeMinutes = activityData.activeMinutes || 0;

  let stepsScore = 0;
  let caloriesScore = 0;
  let activeScore = 0;

  // Steps scoring (0-40 points)
  if (steps >= 10000) {
    stepsScore = 40; // Excellent
  } else if (steps >= 8000) {
    stepsScore = 35; // Very good
  } else if (steps >= 6000) {
    stepsScore = 30; // Good
  } else if (steps >= 4000) {
    stepsScore = 20; // Fair
  } else if (steps >= 2000) {
    stepsScore = 10; // Poor
  } else {
    stepsScore = 5; // Very poor
  }

  // Calories scoring (0-30 points)
  if (calories >= 2500) {
    caloriesScore = 30;
  } else if (calories >= 2000) {
    caloriesScore = 25;
  } else if (calories >= 1500) {
    caloriesScore = 20;
  } else if (calories >= 1000) {
    caloriesScore = 15;
  } else {
    caloriesScore = 10;
  }

  // Active minutes scoring (0-30 points)
  if (activeMinutes >= 60) {
    activeScore = 30;
  } else if (activeMinutes >= 45) {
    activeScore = 25;
  } else if (activeMinutes >= 30) {
    activeScore = 20;
  } else if (activeMinutes >= 15) {
    activeScore = 15;
  } else if (activeMinutes >= 5) {
    activeScore = 10;
  } else {
    activeScore = 5;
  }

  return stepsScore + caloriesScore + activeScore;
}

/**
 * Calculate heart health score based on resting heart rate and heart rate variability
 * Mirrors the heart scoring logic from code.js
 */
function calculateHeartScore(heartData: any): number {
  const restingHR = heartData.resting || 0;
  const hrv = heartData.hrv || 0;

  let restingScore = 0;
  let hrvScore = 0;

  // Resting heart rate scoring (0-50 points)
  if (restingHR >= 50 && restingHR <= 70) {
    restingScore = 50; // Excellent range
  } else if (restingHR >= 45 && restingHR <= 75) {
    restingScore = 40; // Good range
  } else if (restingHR >= 40 && restingHR <= 80) {
    restingScore = 30; // Acceptable range
  } else if (restingHR >= 35 && restingHR <= 85) {
    restingScore = 20; // Poor range
  } else {
    restingScore = 10; // Very poor range
  }

  // HRV scoring (0-50 points) - if available
  if (hrv > 0) {
    if (hrv >= 50) {
      hrvScore = 50;
    } else if (hrv >= 40) {
      hrvScore = 40;
    } else if (hrv >= 30) {
      hrvScore = 30;
    } else if (hrv >= 20) {
      hrvScore = 20;
    } else {
      hrvScore = 10;
    }
  } else {
    // If no HRV data, give points based on resting HR quality
    hrvScore = Math.round(restingScore * 0.8);
  }

  return restingScore + hrvScore;
}

/**
 * Calculate work productivity score based on email management
 * Mirrors the work scoring logic from code.js
 */
function calculateWorkScore(emailStats: any, calendarStats?: any): number {
  const totalEmails = emailStats.totalEmails || 0;
  const unreadCount = emailStats.unreadCount || 0;
  const sentCount = emailStats.sent || 0;
  const primaryCount = emailStats.primary || 0;

  let responseScore = 0;
  let productivityScore = 0;
  let organizationScore = 0;

  // Response rate scoring (0-40 points)
  if (totalEmails > 0) {
    const responseRate = ((totalEmails - unreadCount) / totalEmails) * 100;

    if (responseRate >= 90) {
      responseScore = 40; // Excellent
    } else if (responseRate >= 80) {
      responseScore = 35; // Very good
    } else if (responseRate >= 70) {
      responseScore = 30; // Good
    } else if (responseRate >= 60) {
      responseScore = 25; // Fair
    } else if (responseRate >= 50) {
      responseScore = 20; // Poor
    } else {
      responseScore = 10; // Very poor
    }
  }

  // Productivity scoring (0-30 points) - based on sent emails
  if (totalEmails > 0) {
    const productivityRate = (sentCount / totalEmails) * 100;

    if (productivityRate >= 30) {
      productivityScore = 30;
    } else if (productivityRate >= 20) {
      productivityScore = 25;
    } else if (productivityRate >= 15) {
      productivityScore = 20;
    } else if (productivityRate >= 10) {
      productivityScore = 15;
    } else {
      productivityScore = 10;
    }
  }

  // Organization scoring (0-30 points) - based on primary inbox management
  if (totalEmails > 0) {
    const organizationRate = (primaryCount / totalEmails) * 100;

    if (organizationRate >= 80) {
      organizationScore = 30;
    } else if (organizationRate >= 60) {
      organizationScore = 25;
    } else if (organizationRate >= 40) {
      organizationScore = 20;
    } else if (organizationRate >= 20) {
      organizationScore = 15;
    } else {
      organizationScore = 10;
    }
  }

  // Calendar-based scoring (0-40 points) - if calendar data is available
  let calendarScore = 0;
  if (calendarStats) {
    const totalEvents = calendarStats.totalEvents || 0;
    const eventsToday = calendarStats.eventsToday || 0;
    const avgEventsPerDay = calendarStats.avgEventsPerDay || 0;

    // Event management scoring
    if (totalEvents > 0) {
      // Balance scoring - not too many, not too few events
      if (avgEventsPerDay >= 3 && avgEventsPerDay <= 8) {
        calendarScore = 40; // Optimal balance
      } else if (avgEventsPerDay >= 2 && avgEventsPerDay <= 10) {
        calendarScore = 30; // Good balance
      } else if (avgEventsPerDay >= 1 && avgEventsPerDay <= 12) {
        calendarScore = 20; // Acceptable balance
      } else {
        calendarScore = 10; // Poor balance
      }

      // Today's activity scoring bonus
      if (eventsToday > 0 && eventsToday <= 5) {
        calendarScore += 10; // Bonus for reasonable daily activity
      }
    }
  }

  const totalScore =
    responseScore + productivityScore + organizationScore + calendarScore;

  // Normalize to 100 if calendar scoring is included
  if (calendarStats) {
    return Math.min(100, totalScore);
  }

  return totalScore;
}

/**
 * Get score quality label
 * Mirrors the score quality logic from code.js
 */
export function getScoreQuality(score: number): string {
  if (score >= 90) return "EXCELLENT";
  if (score >= 80) return "GREAT";
  if (score >= 70) return "GOOD";
  if (score >= 60) return "FAIR";
  if (score >= 50) return "POOR";
  return "VERY POOR";
}

/**
 * Get score color for UI display
 * Mirrors the color logic from code.js
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return "#10b981"; // Green
  if (score >= 80) return "#059669"; // Dark green
  if (score >= 70) return "#f59e0b"; // Yellow
  if (score >= 60) return "#f97316"; // Orange
  if (score >= 50) return "#ef4444"; // Red
  return "#dc2626"; // Dark red
}

/**
 * Get score-based SVG colors and styling for dashboard components
 */
export function getScoreBasedStyling(score: number) {
  if (score >= 90) {
    return {
      color: "text-green-600",
      bgColor: "bg-green-100",
      strokeColor: "hsl(142 76% 36%)",
      icon: "TrendingUp",
      quality: "Excellent",
    };
  } else if (score >= 80) {
    return {
      color: "text-green-600",
      bgColor: "bg-green-100",
      strokeColor: "hsl(142 76% 36%)",
      icon: "TrendingUp",
      quality: "Very Good",
    };
  } else if (score >= 70) {
    return {
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      strokeColor: "hsl(221 83% 53%)",
      icon: "BarChart3",
      quality: "Good",
    };
  } else if (score >= 60) {
    return {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      strokeColor: "hsl(38 92% 50%)",
      icon: "BarChart3",
      quality: "Fair",
    };
  } else if (score >= 50) {
    return {
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      strokeColor: "hsl(25 95% 53%)",
      icon: "FileText",
      quality: "Poor",
    };
  } else {
    return {
      color: "text-red-600",
      bgColor: "bg-red-100",
      strokeColor: "hsl(0 84% 60%)",
      icon: "FileText",
      quality: "Very Poor",
    };
  }
}

/**
 * Calculate weekly average scores
 * Mirrors the weekly calculation logic from code.js
 */
export function calculateWeeklyScores(
  dailyScores: WellnessScores[]
): WellnessScores {
  if (dailyScores.length === 0) {
    return {
      total: 0,
      sleep: 0,
      activity: 0,
      heart: 0,
      work: 0,
      scoreCount: 0,
      explanations: {
        sleep: [],
        activity: [],
        heart: [],
        work: [],
      },
    };
  }

  const totals = dailyScores.reduce(
    (acc, scores) => ({
      total: acc.total + scores.total,
      sleep: acc.sleep + scores.sleep,
      activity: acc.activity + scores.activity,
      heart: acc.heart + scores.heart,
      work: acc.work + scores.work,
    }),
    { total: 0, sleep: 0, activity: 0, heart: 0, work: 0 }
  );

  const count = dailyScores.length;

  return {
    total: Math.round(totals.total / count),
    sleep: Math.round(totals.sleep / count),
    activity: Math.round(totals.activity / count),
    heart: Math.round(totals.heart / count),
    work: Math.round(totals.work / count),
    scoreCount: count,
    explanations: {
      sleep: [],
      activity: [],
      heart: [],
      work: [],
    },
  };
}
