export interface WellnessScores {
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
}

export interface DataSources {
  fitbit: any;
  spotify: any;
  gmail: any;
  calendar: any;
  weather: any;
  historical: any[];
}

export class WellnessScoringService {
  /**
   * Calculate comprehensive daily wellness scores
   */
  async calculateDailyScores(data: DataSources): Promise<WellnessScores> {
    const sleepScore = this.calculateSleepScore(data.fitbit, data.historical);
    const activityScore = this.calculateActivityScore(
      data.fitbit,
      data.historical
    );
    const heartScore = this.calculateHeartScore(data.fitbit, data.historical);
    const workScore = this.calculateWorkScore(
      data.gmail,
      data.calendar,
      data.historical
    );

    const totalScore = Math.round(
      (sleepScore.score +
        activityScore.score +
        heartScore.score +
        workScore.score) /
        4
    );

    return {
      total: totalScore,
      sleep: sleepScore.score,
      activity: activityScore.score,
      heart: heartScore.score,
      work: workScore.score,
      explanations: {
        sleep: sleepScore.explanations,
        activity: activityScore.explanations,
        heart: heartScore.explanations,
        work: workScore.explanations,
      },
    };
  }

  /**
   * Calculate comprehensive weekly wellness scores
   */
  async calculateWeeklyScores(data: DataSources): Promise<WellnessScores> {
    // For weekly scores, we calculate averages and trends
    const sleepScore = this.calculateWeeklySleepScore(
      data.fitbit,
      data.historical
    );
    const activityScore = this.calculateWeeklyActivityScore(
      data.fitbit,
      data.historical
    );
    const heartScore = this.calculateWeeklyHeartScore(
      data.fitbit,
      data.historical
    );
    const workScore = this.calculateWeeklyWorkScore(
      data.gmail,
      data.calendar,
      data.historical
    );

    const totalScore = Math.round(
      (sleepScore.score +
        activityScore.score +
        heartScore.score +
        workScore.score) /
        4
    );

    return {
      total: totalScore,
      sleep: sleepScore.score,
      activity: activityScore.score,
      heart: heartScore.score,
      work: workScore.score,
      explanations: {
        sleep: sleepScore.explanations,
        activity: activityScore.explanations,
        heart: heartScore.explanations,
        work: workScore.explanations,
      },
    };
  }

  /**
   * Calculate sleep score based on Fitbit data
   */
  private calculateSleepScore(
    fitbitData: any,
    historicalData: any[]
  ): { score: number; explanations: string[] } {
    const explanations: string[] = [];
    let score = 0;
    let factors = 0;

    if (fitbitData?.sleep) {
      const sleep = fitbitData.sleep;

      // Duration scoring (0-40 points)
      if (sleep.duration) {
        const hours = sleep.duration / 60;
        if (hours >= 7 && hours <= 9) {
          score += 40;
          explanations.push("Excellent sleep duration (7-9 hours)");
        } else if (hours >= 6 && hours <= 10) {
          score += 30;
          explanations.push("Good sleep duration (6-10 hours)");
        } else if (hours >= 5 && hours <= 11) {
          score += 20;
          explanations.push("Moderate sleep duration (5-11 hours)");
        } else {
          score += 10;
          explanations.push("Sleep duration needs improvement");
        }
        factors++;
      }

      // Efficiency scoring (0-30 points)
      if (sleep.efficiency) {
        if (sleep.efficiency >= 90) {
          score += 30;
          explanations.push("Excellent sleep efficiency (90%+)");
        } else if (sleep.efficiency >= 80) {
          score += 25;
          explanations.push("Good sleep efficiency (80-89%)");
        } else if (sleep.efficiency >= 70) {
          score += 20;
          explanations.push("Moderate sleep efficiency (70-79%)");
        } else {
          score += 10;
          explanations.push("Sleep efficiency needs improvement");
        }
        factors++;
      }

      // Deep sleep scoring (0-20 points)
      if (sleep.deepSleep) {
        const deepSleepPercentage = (sleep.deepSleep / sleep.duration) * 100;
        if (deepSleepPercentage >= 20) {
          score += 20;
          explanations.push("Excellent deep sleep (20%+)");
        } else if (deepSleepPercentage >= 15) {
          score += 15;
          explanations.push("Good deep sleep (15-19%)");
        } else if (deepSleepPercentage >= 10) {
          score += 10;
          explanations.push("Moderate deep sleep (10-14%)");
        } else {
          score += 5;
          explanations.push("Deep sleep needs improvement");
        }
        factors++;
      }

      // REM sleep scoring (0-10 points)
      if (sleep.remSleep) {
        const remSleepPercentage = (sleep.remSleep / sleep.duration) * 100;
        if (remSleepPercentage >= 20) {
          score += 10;
          explanations.push("Excellent REM sleep (20%+)");
        } else if (remSleepPercentage >= 15) {
          score += 8;
          explanations.push("Good REM sleep (15-19%)");
        } else if (remSleepPercentage >= 10) {
          score += 5;
          explanations.push("Moderate REM sleep (10-14%)");
        } else {
          score += 2;
          explanations.push("REM sleep needs improvement");
        }
        factors++;
      }
    }

    // If no sleep data, use historical average or default
    if (factors === 0) {
      const historicalSleep = this.getHistoricalSleepAverage(historicalData);
      if (historicalSleep) {
        score = Math.round(historicalSleep);
        explanations.push("Using historical sleep data");
      } else {
        score = 50; // Default score
        explanations.push("No sleep data available - using default score");
      }
    } else {
      score = Math.round(score / factors);
    }

    return { score: Math.min(score, 100), explanations };
  }

  /**
   * Calculate activity score based on Fitbit data
   */
  private calculateActivityScore(
    fitbitData: any,
    historicalData: any[]
  ): { score: number; explanations: string[] } {
    const explanations: string[] = [];
    let score = 0;
    let factors = 0;

    if (fitbitData?.activity) {
      const activity = fitbitData.activity;

      // Steps scoring (0-40 points)
      if (activity.steps) {
        if (activity.steps >= 10000) {
          score += 40;
          explanations.push("Excellent step count (10,000+)");
        } else if (activity.steps >= 8000) {
          score += 30;
          explanations.push("Good step count (8,000-9,999)");
        } else if (activity.steps >= 6000) {
          score += 20;
          explanations.push("Moderate step count (6,000-7,999)");
        } else if (activity.steps >= 4000) {
          score += 10;
          explanations.push("Low step count (4,000-5,999)");
        } else {
          score += 5;
          explanations.push("Very low step count - needs improvement");
        }
        factors++;
      }

      // Active minutes scoring (0-30 points)
      if (activity.activeMinutes) {
        if (activity.activeMinutes >= 30) {
          score += 30;
          explanations.push("Excellent active minutes (30+)");
        } else if (activity.activeMinutes >= 20) {
          score += 25;
          explanations.push("Good active minutes (20-29)");
        } else if (activity.activeMinutes >= 10) {
          score += 15;
          explanations.push("Moderate active minutes (10-19)");
        } else {
          score += 5;
          explanations.push("Low active minutes - needs improvement");
        }
        factors++;
      }

      // Calories burned scoring (0-20 points)
      if (activity.calories) {
        const baseCalories = 2000; // Base metabolic rate
        const calorieRatio = activity.calories / baseCalories;
        if (calorieRatio >= 1.2) {
          score += 20;
          explanations.push("Excellent calorie burn (120%+ of base)");
        } else if (calorieRatio >= 1.1) {
          score += 15;
          explanations.push("Good calorie burn (110-119% of base)");
        } else if (calorieRatio >= 1.0) {
          score += 10;
          explanations.push("Moderate calorie burn (100-109% of base)");
        } else {
          score += 5;
          explanations.push("Low calorie burn - needs improvement");
        }
        factors++;
      }

      // Distance scoring (0-10 points)
      if (activity.distance) {
        if (activity.distance >= 8) {
          score += 10;
          explanations.push("Excellent distance covered (8+ km)");
        } else if (activity.distance >= 6) {
          score += 8;
          explanations.push("Good distance covered (6-7.9 km)");
        } else if (activity.distance >= 4) {
          score += 5;
          explanations.push("Moderate distance covered (4-5.9 km)");
        } else {
          score += 2;
          explanations.push("Low distance covered - needs improvement");
        }
        factors++;
      }
    }

    // If no activity data, use historical average or default
    if (factors === 0) {
      const historicalActivity =
        this.getHistoricalActivityAverage(historicalData);
      if (historicalActivity) {
        score = Math.round(historicalActivity);
        explanations.push("Using historical activity data");
      } else {
        score = 50; // Default score
        explanations.push("No activity data available - using default score");
      }
    } else {
      score = Math.round(score / factors);
    }

    return { score: Math.min(score, 100), explanations };
  }

  /**
   * Calculate heart score based on Fitbit data
   */
  private calculateHeartScore(
    fitbitData: any,
    historicalData: any[]
  ): { score: number; explanations: string[] } {
    const explanations: string[] = [];
    let score = 0;
    let factors = 0;

    if (fitbitData?.heart) {
      const heart = fitbitData.heart;

      // Resting heart rate scoring (0-40 points)
      if (heart.restingHR) {
        if (heart.restingHR <= 50) {
          score += 40;
          explanations.push("Excellent resting heart rate (≤50 bpm)");
        } else if (heart.restingHR <= 60) {
          score += 35;
          explanations.push("Very good resting heart rate (51-60 bpm)");
        } else if (heart.restingHR <= 70) {
          score += 25;
          explanations.push("Good resting heart rate (61-70 bpm)");
        } else if (heart.restingHR <= 80) {
          score += 15;
          explanations.push("Moderate resting heart rate (71-80 bpm)");
        } else {
          score += 5;
          explanations.push("High resting heart rate - needs improvement");
        }
        factors++;
      }

      // Heart rate variability scoring (0-30 points)
      if (heart.hrv) {
        if (heart.hrv >= 60) {
          score += 30;
          explanations.push("Excellent HRV (60+ ms)");
        } else if (heart.hrv >= 50) {
          score += 25;
          explanations.push("Very good HRV (50-59 ms)");
        } else if (heart.hrv >= 40) {
          score += 20;
          explanations.push("Good HRV (40-49 ms)");
        } else if (heart.hrv >= 30) {
          score += 10;
          explanations.push("Moderate HRV (30-39 ms)");
        } else {
          score += 5;
          explanations.push("Low HRV - needs improvement");
        }
        factors++;
      }

      // Peak heart rate scoring (0-20 points)
      if (heart.peakHR) {
        const age = 30; // This should be calculated from user profile
        const maxHR = 220 - age;
        const peakHRPercentage = (heart.peakHR / maxHR) * 100;

        if (peakHRPercentage >= 90) {
          score += 20;
          explanations.push("Excellent peak heart rate (90%+ of max)");
        } else if (peakHRPercentage >= 80) {
          score += 15;
          explanations.push("Good peak heart rate (80-89% of max)");
        } else if (peakHRPercentage >= 70) {
          score += 10;
          explanations.push("Moderate peak heart rate (70-79% of max)");
        } else {
          score += 5;
          explanations.push("Low peak heart rate - needs improvement");
        }
        factors++;
      }

      // Heart rate zones scoring (0-10 points)
      if (heart.zones) {
        const timeInZone2 = heart.zones.timeInZone2 || 0;
        const timeInZone3 = heart.zones.timeInZone3 || 0;
        const totalTime = timeInZone2 + timeInZone3;

        if (totalTime >= 30) {
          score += 10;
          explanations.push("Excellent time in aerobic zones (30+ min)");
        } else if (totalTime >= 20) {
          score += 8;
          explanations.push("Good time in aerobic zones (20-29 min)");
        } else if (totalTime >= 10) {
          score += 5;
          explanations.push("Moderate time in aerobic zones (10-19 min)");
        } else {
          score += 2;
          explanations.push("Low time in aerobic zones - needs improvement");
        }
        factors++;
      }
    }

    // If no heart data, use historical average or default
    if (factors === 0) {
      const historicalHeart = this.getHistoricalHeartAverage(historicalData);
      if (historicalHeart) {
        score = Math.round(historicalHeart);
        explanations.push("Using historical heart data");
      } else {
        score = 50; // Default score
        explanations.push("No heart data available - using default score");
      }
    } else {
      score = Math.round(score / factors);
    }

    return { score: Math.min(score, 100), explanations };
  }

  /**
   * Calculate work score based on Gmail and Calendar data
   */
  private calculateWorkScore(
    gmailData: any,
    calendarData: any,
    historicalData: any[]
  ): { score: number; explanations: string[] } {
    const explanations: string[] = [];
    let score = 0;
    let factors = 0;

    // Email productivity scoring (0-40 points)
    if (gmailData?.stats) {
      const stats = gmailData.stats;

      // Response time scoring
      if (stats.avgResponseTime) {
        if (stats.avgResponseTime <= 2) {
          score += 20;
          explanations.push("Excellent email response time (≤2 hours)");
        } else if (stats.avgResponseTime <= 4) {
          score += 15;
          explanations.push("Good email response time (2-4 hours)");
        } else if (stats.avgResponseTime <= 8) {
          score += 10;
          explanations.push("Moderate email response time (4-8 hours)");
        } else {
          score += 5;
          explanations.push("Slow email response time - needs improvement");
        }
        factors++;
      }

      // Email volume management scoring
      if (stats.primary && stats.noise) {
        const noisePercentage =
          (stats.noise / (stats.primary + stats.noise)) * 100;
        if (noisePercentage <= 20) {
          score += 20;
          explanations.push("Excellent email organization (≤20% noise)");
        } else if (noisePercentage <= 40) {
          score += 15;
          explanations.push("Good email organization (20-40% noise)");
        } else if (noisePercentage <= 60) {
          score += 10;
          explanations.push("Moderate email organization (40-60% noise)");
        } else {
          score += 5;
          explanations.push("Poor email organization - needs improvement");
        }
        factors++;
      }
    }

    // Calendar efficiency scoring (0-40 points)
    if (calendarData?.analysis) {
      const analysis = calendarData.analysis;

      // Meeting efficiency scoring
      if (analysis.meetingEfficiency !== undefined) {
        if (analysis.meetingEfficiency >= 80) {
          score += 20;
          explanations.push("Excellent meeting efficiency (80%+)");
        } else if (analysis.meetingEfficiency >= 60) {
          score += 15;
          explanations.push("Good meeting efficiency (60-79%)");
        } else if (analysis.meetingEfficiency >= 40) {
          score += 10;
          explanations.push("Moderate meeting efficiency (40-59%)");
        } else {
          score += 5;
          explanations.push("Poor meeting efficiency - needs improvement");
        }
        factors++;
      }

      // Focus time scoring
      if (analysis.focusTime !== undefined) {
        if (analysis.focusTime >= 30) {
          score += 20;
          explanations.push("Excellent focus time (30%+)");
        } else if (analysis.focusTime >= 20) {
          score += 15;
          explanations.push("Good focus time (20-29%)");
        } else if (analysis.focusTime >= 10) {
          score += 10;
          explanations.push("Moderate focus time (10-19%)");
        } else {
          score += 5;
          explanations.push("Low focus time - needs improvement");
        }
        factors++;
      }
    }

    // Task completion scoring (0-20 points)
    if (gmailData?.completedTasks) {
      const completedTasks = gmailData.completedTasks;
      if (completedTasks.length >= 5) {
        score += 20;
        explanations.push("Excellent task completion (5+ tasks)");
      } else if (completedTasks.length >= 3) {
        score += 15;
        explanations.push("Good task completion (3-4 tasks)");
      } else if (completedTasks.length >= 1) {
        score += 10;
        explanations.push("Moderate task completion (1-2 tasks)");
      } else {
        score += 5;
        explanations.push("Low task completion - needs improvement");
      }
      factors++;
    }

    // If no work data, use historical average or default
    if (factors === 0) {
      const historicalWork = this.getHistoricalWorkAverage(historicalData);
      if (historicalWork) {
        score = Math.round(historicalWork);
        explanations.push("Using historical work data");
      } else {
        score = 50; // Default score
        explanations.push("No work data available - using default score");
      }
    } else {
      score = Math.round(score / factors);
    }

    return { score: Math.min(score, 100), explanations };
  }

  // Weekly scoring methods (similar to daily but with trend analysis)
  private calculateWeeklySleepScore(
    fitbitData: any,
    historicalData: any[]
  ): { score: number; explanations: string[] } {
    // Similar to daily but with weekly averages and trends
    const dailyScore = this.calculateSleepScore(fitbitData, historicalData);
    return {
      score: dailyScore.score,
      explanations: [...dailyScore.explanations, "Weekly average sleep score"],
    };
  }

  private calculateWeeklyActivityScore(
    fitbitData: any,
    historicalData: any[]
  ): { score: number; explanations: string[] } {
    const dailyScore = this.calculateActivityScore(fitbitData, historicalData);
    return {
      score: dailyScore.score,
      explanations: [
        ...dailyScore.explanations,
        "Weekly average activity score",
      ],
    };
  }

  private calculateWeeklyHeartScore(
    fitbitData: any,
    historicalData: any[]
  ): { score: number; explanations: string[] } {
    const dailyScore = this.calculateHeartScore(fitbitData, historicalData);
    return {
      score: dailyScore.score,
      explanations: [...dailyScore.explanations, "Weekly average heart score"],
    };
  }

  private calculateWeeklyWorkScore(
    gmailData: any,
    calendarData: any,
    historicalData: any[]
  ): { score: number; explanations: string[] } {
    const dailyScore = this.calculateWorkScore(
      gmailData,
      calendarData,
      historicalData
    );
    return {
      score: dailyScore.score,
      explanations: [...dailyScore.explanations, "Weekly average work score"],
    };
  }

  // Helper methods for historical data
  private getHistoricalSleepAverage(historicalData: any[]): number | null {
    const sleepScores = historicalData
      .map((data) => data.json?.scores?.sleep)
      .filter((score) => typeof score === "number");

    if (sleepScores.length === 0) return null;
    return (
      sleepScores.reduce((sum, score) => sum + score, 0) / sleepScores.length
    );
  }

  private getHistoricalActivityAverage(historicalData: any[]): number | null {
    const activityScores = historicalData
      .map((data) => data.json?.scores?.activity)
      .filter((score) => typeof score === "number");

    if (activityScores.length === 0) return null;
    return (
      activityScores.reduce((sum, score) => sum + score, 0) /
      activityScores.length
    );
  }

  private getHistoricalHeartAverage(historicalData: any[]): number | null {
    const heartScores = historicalData
      .map((data) => data.json?.scores?.heart)
      .filter((score) => typeof score === "number");

    if (heartScores.length === 0) return null;
    return (
      heartScores.reduce((sum, score) => sum + score, 0) / heartScores.length
    );
  }

  private getHistoricalWorkAverage(historicalData: any[]): number | null {
    const workScores = historicalData
      .map((data) => data.json?.scores?.work)
      .filter((score) => typeof score === "number");

    if (workScores.length === 0) return null;
    return (
      workScores.reduce((sum, score) => sum + score, 0) / workScores.length
    );
  }
}

// Export utility function for score-based styling
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
      color: "text-green-500",
      bgColor: "bg-green-50",
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
      strokeColor: "hsl(45 93% 47%)",
      icon: "BarChart3",
      quality: "Fair",
    };
  } else if (score >= 50) {
    return {
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      strokeColor: "hsl(25 95% 53%)",
      icon: "FileText",
      quality: "Needs Improvement",
    };
  } else {
    return {
      color: "text-red-600",
      bgColor: "bg-red-100",
      strokeColor: "hsl(0 84% 60%)",
      icon: "FileText",
      quality: "Poor",
    };
  }
}
