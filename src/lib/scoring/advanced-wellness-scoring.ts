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
  const scores = {
    sleep: 0,
    activity: 0,
    heart: 0,
    work: 0,
    total: 0,
    explanations: {
      sleep: [] as string[],
      activity: [] as string[],
      heart: [] as string[],
      work: [] as string[],
    },
  };

  // Sleep Score (0-100, 30% weight) - EXACT from code.js
  const sleepMatch = sleep.match(/(\d+)h (\d+)m/);
  const efficiencyMatch = sleep.match(/😴 Efficiency: (\d+)%/);

  if (sleepMatch) {
    const h = parseInt(sleepMatch[1], 10);
    const m = parseInt(sleepMatch[2], 10);
    const totalSleepMin = h * 60 + m;

    // Duration component (60 points) - using actual sleep time
    let durationScore = 0;
    if (totalSleepMin >= 480) {
      durationScore = 60;
      scores.explanations.sleep.push(
        "Duration excellent (8+ hours actual sleep) = 60/60 points"
      );
    } else if (totalSleepMin >= 450) {
      durationScore = 55;
      scores.explanations.sleep.push(
        "Duration very good (7.5+ hours actual sleep) = 55/60 points"
      );
    } else if (totalSleepMin >= 420) {
      durationScore = 50;
      scores.explanations.sleep.push(
        "Duration good (7+ hours actual sleep) = 50/60 points"
      );
    } else if (totalSleepMin >= 390) {
      durationScore = 40;
      scores.explanations.sleep.push(
        "Duration adequate (6.5+ hours actual sleep) = 40/60 points"
      );
    } else if (totalSleepMin >= 360) {
      durationScore = 30;
      scores.explanations.sleep.push(
        "Duration suboptimal (6+ hours actual sleep) = 30/60 points"
      );
    } else if (totalSleepMin >= 300) {
      durationScore = 15;
      scores.explanations.sleep.push(
        "Duration poor (5+ hours actual sleep) = 15/60 points"
      );
    } else {
      durationScore = 5;
      scores.explanations.sleep.push(
        "Duration very poor (<5 hours actual sleep) = 5/60 points"
      );
    }

    // Efficiency component (40 points)
    let efficiencyScore = 0;
    if (efficiencyMatch) {
      const efficiency = parseInt(efficiencyMatch[1]);

      if (efficiency >= 90) {
        efficiencyScore = 40;
        scores.explanations.sleep.push(
          "Efficiency excellent (" + efficiency + "%) = 40/40 points"
        );
      } else if (efficiency >= 85) {
        efficiencyScore = 35;
        scores.explanations.sleep.push(
          "Efficiency very good (" + efficiency + "%) = 35/40 points"
        );
      } else if (efficiency >= 80) {
        efficiencyScore = 30;
        scores.explanations.sleep.push(
          "Efficiency good (" + efficiency + "%) = 30/40 points"
        );
      } else if (efficiency >= 75) {
        efficiencyScore = 25;
        scores.explanations.sleep.push(
          "Efficiency acceptable (" + efficiency + "%) = 25/40 points"
        );
      } else if (efficiency >= 70) {
        efficiencyScore = 20;
        scores.explanations.sleep.push(
          "Efficiency below target (" + efficiency + "%) = 20/40 points"
        );
      } else {
        efficiencyScore = 10;
        scores.explanations.sleep.push(
          "Efficiency poor (" + efficiency + "%) = 10/40 points"
        );
      }
    }

    scores.sleep = durationScore + efficiencyScore;
  }

  // Activity Score (0-100, 30% weight) - EXACT from code.js
  const stepsMatch = activity.match(/👣 Steps: ([\d,]+)/);
  const veryActiveMatch = activity.match(/💪 Very Active: (\d+) min/);
  const fairlyActiveMatch = activity.match(/🚶 Fairly Active: (\d+) min/);
  const sedentaryMatch = activity.match(/🪑 Sedentary: (\d+) min/);

  if (stepsMatch) {
    const steps = parseInt(stepsMatch[1].replace(/,/g, ""), 10);

    // Steps component (50 points)
    let stepScore = 0;
    if (steps >= 12000) {
      stepScore = 50;
      scores.explanations.activity.push(
        "Steps excellent (12k+) = 50/50 points"
      );
    } else if (steps >= 10000) {
      stepScore = 45;
      scores.explanations.activity.push("Steps great (10k+) = 45/50 points");
    } else if (steps >= 8000) {
      stepScore = 35;
      scores.explanations.activity.push("Steps good (8k+) = 35/50 points");
    } else if (steps >= 6000) {
      stepScore = 25;
      scores.explanations.activity.push("Steps moderate (6k+) = 25/50 points");
    } else if (steps >= 4000) {
      stepScore = 15;
      scores.explanations.activity.push("Steps low (4k+) = 15/50 points");
    } else {
      stepScore = 5;
      scores.explanations.activity.push("Steps very low (<4k) = 5/50 points");
    }

    // Active minutes component (50 points)
    let activeMinutes = 0;
    if (veryActiveMatch) activeMinutes += parseInt(veryActiveMatch[1], 10) * 2;
    if (fairlyActiveMatch) activeMinutes += parseInt(fairlyActiveMatch[1], 10);

    let activeScore = 0;
    if (activeMinutes >= 60) {
      activeScore = 50;
      scores.explanations.activity.push(
        "Active minutes excellent (60+) = 50/50 points"
      );
    } else if (activeMinutes >= 45) {
      activeScore = 40;
      scores.explanations.activity.push(
        "Active minutes good (45+) = 40/50 points"
      );
    } else if (activeMinutes >= 30) {
      activeScore = 30;
      scores.explanations.activity.push(
        "Active minutes moderate (30+) = 30/50 points"
      );
    } else if (activeMinutes >= 15) {
      activeScore = 20;
      scores.explanations.activity.push(
        "Active minutes low (15+) = 20/50 points"
      );
    } else {
      activeScore = 10;
      scores.explanations.activity.push(
        "Active minutes very low (<15) = 10/50 points"
      );
    }

    // Sedentary penalty
    if (sedentaryMatch) {
      const sedentaryMin = parseInt(sedentaryMatch[1]);
      if (sedentaryMin > 600) {
        activeScore = Math.max(0, activeScore - 10);
        scores.explanations.activity.push(
          "Sedentary penalty (10+ hours) = -10 points"
        );
      }
    }

    scores.activity = stepScore + activeScore;
  }

  // Heart Score (0-100, 20% weight) - EXACT from code.js
  const rhrMatch = heart.match(/❤️ Resting HR: (\d+)/);
  const zonesMatch = heart.match(/💓 Active zones: (.+?)(?=\n|$)/);

  if (rhrMatch) {
    const rhr = parseInt(rhrMatch[1], 10);

    // RHR component (50 points)
    let rhrScore = 0;
    if (rhr <= 48) {
      rhrScore = 50;
      scores.explanations.heart.push(
        "RHR elite athlete level (≤48) = 50/50 points"
      );
    } else if (rhr <= 52) {
      rhrScore = 45;
      scores.explanations.heart.push("RHR excellent (≤52) = 45/50 points");
    } else if (rhr <= 55) {
      rhrScore = 40;
      scores.explanations.heart.push("RHR very good (≤55) = 40/50 points");
    } else if (rhr <= 60) {
      rhrScore = 35;
      scores.explanations.heart.push("RHR good (≤60) = 35/50 points");
    } else if (rhr <= 65) {
      rhrScore = 30;
      scores.explanations.heart.push("RHR average (≤65) = 30/50 points");
    } else if (rhr <= 70) {
      rhrScore = 20;
      scores.explanations.heart.push("RHR below average (≤70) = 20/50 points");
    } else {
      rhrScore = 10;
      scores.explanations.heart.push("RHR elevated (>70) = 10/50 points");
    }

    // Heart rate zones component (30 points)
    let zonesScore = 0;
    if (zonesMatch) {
      const zonesText = zonesMatch[1];
      const cardioMatch = zonesText.match(/Cardio: (\d+)min/);
      const peakMatch = zonesText.match(/Peak: (\d+)min/);
      const fatBurnMatch = zonesText.match(/Fat Burn: (\d+)min/);

      const cardioMin = cardioMatch ? parseInt(cardioMatch[1]) : 0;
      const peakMin = peakMatch ? parseInt(peakMatch[1]) : 0;
      const fatBurnMin = fatBurnMatch ? parseInt(fatBurnMatch[1]) : 0;

      if (cardioMin >= 20 || peakMin >= 10) {
        zonesScore = 30;
        scores.explanations.heart.push(
          "Excellent cardio workout = 30/30 points"
        );
      } else if (cardioMin >= 10 || peakMin >= 5) {
        zonesScore = 25;
        scores.explanations.heart.push("Good cardio workout = 25/30 points");
      } else if (cardioMin > 0 || peakMin > 0) {
        zonesScore = 20;
        scores.explanations.heart.push("Some cardio activity = 20/30 points");
      } else if (fatBurnMin >= 30) {
        zonesScore = 15;
        scores.explanations.heart.push(
          "Fat burn zone activity only = 15/30 points"
        );
      } else if (fatBurnMin > 0) {
        zonesScore = 10;
        scores.explanations.heart.push("Minimal zone activity = 10/30 points");
      } else {
        zonesScore = 5;
        scores.explanations.heart.push(
          "No elevated heart rate activity = 5/30 points"
        );
      }
    }

    // HRV bonus (20 points) - if available
    let hrvScore = 0;
    if (allData && allData.fitbitHRV && allData.fitbitHRV.value) {
      const hrv = allData.fitbitHRV.value;
      if (hrv > 60) {
        hrvScore = 20;
        scores.explanations.heart.push("HRV excellent (>60ms) = 20/20 points");
      } else if (hrv > 50) {
        hrvScore = 15;
        scores.explanations.heart.push("HRV good (>50ms) = 15/20 points");
      } else if (hrv > 40) {
        hrvScore = 10;
        scores.explanations.heart.push("HRV fair (>40ms) = 10/20 points");
      } else {
        hrvScore = 5;
        scores.explanations.heart.push("HRV low (<40ms) = 5/20 points");
      }
    } else {
      rhrScore = Math.round(rhrScore * 1.2);
      zonesScore = Math.round(zonesScore * 1.2);
    }

    scores.heart = Math.min(100, rhrScore + zonesScore + hrvScore);
  }

  // Work Score (productivity/engagement, 20% weight) - EXACT from code.js
  const workComponents = {
    email: 0,
    calendar: 0,
    tasks: 0,
    focus: 0,
  };

  const isWeekend = dayContext && dayContext.dayType === "weekend";

  // Email component (25 points)
  const primaryEmails = emailStats.primary || emailStats.received;
  const sentEmails = emailStats.sent;

  if (isWeekend) {
    if (sentEmails < 5 && primaryEmails < 10) {
      workComponents.email = 25;
      scores.explanations.work.push(
        "Weekend work boundaries maintained = 25/25 points"
      );
    } else if (sentEmails < 10) {
      workComponents.email = 20;
      scores.explanations.work.push(
        "Some weekend work activity = 20/25 points"
      );
    } else {
      workComponents.email = 10;
      scores.explanations.work.push(
        "High weekend work activity = 10/25 points"
      );
    }
  } else {
    if (sentEmails >= 10 && sentEmails <= 25 && primaryEmails < 50) {
      workComponents.email = 25;
      scores.explanations.work.push(
        "Email management excellent = 25/25 points"
      );
    } else if (sentEmails >= 5 && sentEmails < 10) {
      workComponents.email = 20;
      scores.explanations.work.push("Email engagement moderate = 20/25 points");
    } else if (sentEmails > 25 && sentEmails <= 40) {
      workComponents.email = 15;
      scores.explanations.work.push(
        "Email volume high (reactive) = 15/25 points"
      );
    } else if (sentEmails < 5 && primaryEmails > 20) {
      workComponents.email = 10;
      scores.explanations.work.push("Email backlog building = 10/25 points");
    } else if (sentEmails > 40) {
      workComponents.email = 5;
      scores.explanations.work.push("Email overload detected = 5/25 points");
    } else {
      workComponents.email = 15;
      scores.explanations.work.push("Email activity normal = 15/25 points");
    }
  }

  // Noise penalty
  if (emailStats.noisePercentage > 80) {
    workComponents.email = Math.max(0, workComponents.email - 5);
    scores.explanations.work.push(
      "Email noise penalty (" + emailStats.noisePercentage + "%) = -5 points"
    );
  }

  // Calendar component (25 points)
  const eventsMatch = calSummary.match(/Events: (\d+)/);
  const focusMatch = calSummary.match(/Longest focus: (\d+) min/);

  if (eventsMatch) {
    const events = parseInt(eventsMatch[1], 10);

    if (isWeekend) {
      if (events === 0) {
        workComponents.calendar = 25;
        scores.explanations.work.push(
          "No weekend meetings = 25/25 points (excellent boundaries)"
        );
      } else if (events <= 2) {
        workComponents.calendar = 15;
        scores.explanations.work.push("Some weekend meetings = 15/25 points");
      } else {
        workComponents.calendar = 5;
        scores.explanations.work.push(
          "Too many weekend meetings = 5/25 points"
        );
      }
    } else {
      if (events === 0) {
        workComponents.calendar = 25;
        scores.explanations.work.push("No meetings scheduled = 25/25 points");
      } else if (events >= 1 && events <= 4) {
        workComponents.calendar = 25;
        scores.explanations.work.push("Meeting balance good = 25/25 points");
      } else if (events >= 5 && events <= 6) {
        workComponents.calendar = 20;
        scores.explanations.work.push("Meetings moderate = 20/25 points");
      } else if (events >= 7 && events <= 8) {
        workComponents.calendar = 15;
        scores.explanations.work.push("Meetings high = 15/25 points");
      } else {
        workComponents.calendar = 10;
        scores.explanations.work.push("Meetings excessive = 10/25 points");
      }
    }
  }

  // Tasks component (25 points)
  if (completedTasks && completedTasks.length > 5) {
    const taskCount = (completedTasks.match(/\n/g) || []).length + 1;
    if (taskCount >= 5) {
      workComponents.tasks = 25;
      scores.explanations.work.push(
        "Tasks completed excellent (" + taskCount + ") = 25/25 points"
      );
    } else if (taskCount >= 3) {
      workComponents.tasks = 20;
      scores.explanations.work.push(
        "Tasks completed good (" + taskCount + ") = 20/25 points"
      );
    } else if (taskCount >= 1) {
      workComponents.tasks = 15;
      scores.explanations.work.push(
        "Tasks completed moderate (" + taskCount + ") = 15/25 points"
      );
    } else {
      workComponents.tasks = 10;
      scores.explanations.work.push(
        "Tasks completed low (" + taskCount + ") = 10/25 points"
      );
    }
  } else {
    workComponents.tasks = 25;
    scores.explanations.work.push(
      "Task tracking not configured = 25/25 points"
    );
  }

  // Focus component (25 points)
  if (focusMatch) {
    const focusMin = parseInt(focusMatch[1], 10);
    if (focusMin >= 120) {
      workComponents.focus = 25;
      scores.explanations.work.push(
        "Focus time excellent (" + focusMin + "min) = 25/25 points"
      );
    } else if (focusMin >= 90) {
      workComponents.focus = 20;
      scores.explanations.work.push(
        "Focus time good (" + focusMin + "min) = 20/25 points"
      );
    } else if (focusMin >= 60) {
      workComponents.focus = 15;
      scores.explanations.work.push(
        "Focus time moderate (" + focusMin + "min) = 15/25 points"
      );
    } else if (focusMin >= 30) {
      workComponents.focus = 10;
      scores.explanations.work.push(
        "Focus time low (" + focusMin + "min) = 10/25 points"
      );
    } else {
      workComponents.focus = 5;
      scores.explanations.work.push(
        "Focus time very low (" + focusMin + "min) = 5/25 points"
      );
    }
  } else {
    workComponents.focus = 15;
    scores.explanations.work.push("No focus data available = 15/25 points");
  }

  scores.work =
    workComponents.email +
    workComponents.calendar +
    workComponents.tasks +
    workComponents.focus;

  // Calculate total score with weighted system (30% sleep, 30% activity, 20% heart, 20% work)
  scores.total = Math.round(
    scores.sleep * 0.3 +
      scores.activity * 0.3 +
      scores.heart * 0.2 +
      scores.work * 0.2
  );

  return {
    total: scores.total,
    sleep: scores.sleep,
    activity: scores.activity,
    heart: scores.heart,
    work: scores.work,
    scoreCount: 4,
    explanations: scores.explanations,
  };
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
