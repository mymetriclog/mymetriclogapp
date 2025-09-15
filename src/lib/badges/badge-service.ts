export interface Badge {
  name: string;
  description: string;
  emoji: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  category: "daily" | "streak" | "milestone" | "combo" | "near-miss";
  points: number;
  unlockedAt: string;
}

export interface StreakBadge {
  name: string;
  description: string;
  emoji: string;
  streak: number;
  category: "daily" | "weekly" | "monthly";
  points: number;
  unlockedAt: string;
}

export interface BadgeData {
  daily: Badge[];
  streak: StreakBadge[];
  narrative: string;
  nearMisses: any[];
}

export interface DataSources {
  scores: any;
  fitbit: any;
  spotify: any;
  gmail: any;
  calendar: any;
  googleTasks: any;
  historical: any[];
}

export class BadgeService {
  /**
   * Calculate daily badges based on current data
   */
  async calculateDailyBadges(data: DataSources): Promise<BadgeData> {
    const dailyBadges: Badge[] = [];
    const streakBadges: StreakBadge[] = [];
    const nearMisses: any[] = [];

    // Sleep badges
    dailyBadges.push(...this.calculateSleepBadges(data.fitbit, data.scores));

    // Activity badges
    dailyBadges.push(...this.calculateActivityBadges(data.fitbit, data.scores));

    // Heart health badges
    dailyBadges.push(...this.calculateHeartBadges(data.fitbit, data.scores));

    // Work productivity badges
    dailyBadges.push(
      ...this.calculateWorkBadges(data.gmail, data.calendar, data.scores)
    );

    // Music and mood badges
    dailyBadges.push(...this.calculateMusicBadges(data.spotify, data.scores));

    // Combo badges
    dailyBadges.push(...this.calculateComboBadges(dailyBadges, data));

    // Streak badges
    streakBadges.push(...(await this.calculateStreakBadges(data.historical)));

    // Near miss badges
    nearMisses.push(...this.calculateNearMissBadges(data));

    // Generate narrative
    const narrative = this.generateBadgeNarrative(
      dailyBadges,
      streakBadges,
      data.scores
    );

    return {
      daily: dailyBadges,
      streak: streakBadges,
      narrative,
      nearMisses,
    };
  }

  /**
   * Calculate weekly badges
   */
  async calculateWeeklyBadges(data: DataSources): Promise<BadgeData> {
    const dailyBadges: Badge[] = [];
    const streakBadges: StreakBadge[] = [];
    const nearMisses: any[] = [];

    // Weekly achievement badges
    dailyBadges.push(...this.calculateWeeklyAchievementBadges(data));

    // Consistency badges
    dailyBadges.push(...this.calculateConsistencyBadges(data));

    // Weekly streak badges
    streakBadges.push(
      ...(await this.calculateWeeklyStreakBadges(data.historical))
    );

    // Weekly near misses
    nearMisses.push(...this.calculateWeeklyNearMisses(data));

    const narrative = this.generateWeeklyBadgeNarrative(
      dailyBadges,
      streakBadges,
      data.scores
    );

    return {
      daily: dailyBadges,
      streak: streakBadges,
      narrative,
      nearMisses,
    };
  }

  /**
   * Calculate sleep-related badges
   */
  private calculateSleepBadges(fitbitData: any, scores: any): Badge[] {
    const badges: Badge[] = [];

    if (!fitbitData?.sleep) return badges;

    const sleep = fitbitData.sleep;
    const sleepScore = scores.sleep;

    // Sleep duration badges
    if (sleep.duration) {
      const hours = sleep.duration / 60;

      if (hours >= 8 && hours <= 9) {
        badges.push({
          name: "Perfect Sleep",
          description: "Got the ideal 8-9 hours of sleep",
          emoji: "😴",
          rarity: "rare",
          category: "daily",
          points: 50,
          unlockedAt: new Date().toISOString(),
        });
      } else if (hours >= 7 && hours <= 10) {
        badges.push({
          name: "Good Night's Rest",
          description: "Got 7-10 hours of quality sleep",
          emoji: "🌙",
          rarity: "uncommon",
          category: "daily",
          points: 30,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // Sleep efficiency badges
    if (sleep.efficiency) {
      if (sleep.efficiency >= 90) {
        badges.push({
          name: "Sleep Master",
          description: "Achieved 90%+ sleep efficiency",
          emoji: "⭐",
          rarity: "epic",
          category: "daily",
          points: 75,
          unlockedAt: new Date().toISOString(),
        });
      } else if (sleep.efficiency >= 85) {
        badges.push({
          name: "Efficient Sleeper",
          description: "Achieved 85%+ sleep efficiency",
          emoji: "💤",
          rarity: "rare",
          category: "daily",
          points: 40,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // Deep sleep badges
    if (sleep.deepSleep && sleep.duration) {
      const deepSleepPercentage = (sleep.deepSleep / sleep.duration) * 100;

      if (deepSleepPercentage >= 20) {
        badges.push({
          name: "Deep Sleep Champion",
          description: "Got 20%+ deep sleep",
          emoji: "🛌",
          rarity: "epic",
          category: "daily",
          points: 60,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // REM sleep badges
    if (sleep.remSleep && sleep.duration) {
      const remSleepPercentage = (sleep.remSleep / sleep.duration) * 100;

      if (remSleepPercentage >= 20) {
        badges.push({
          name: "Dream Weaver",
          description: "Got 20%+ REM sleep",
          emoji: "🌌",
          rarity: "rare",
          category: "daily",
          points: 45,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // High sleep score badge
    if (sleepScore >= 90) {
      badges.push({
        name: "Sleep Perfectionist",
        description: "Achieved 90+ sleep score",
        emoji: "🏆",
        rarity: "legendary",
        category: "daily",
        points: 100,
        unlockedAt: new Date().toISOString(),
      });
    }

    return badges;
  }

  /**
   * Calculate activity-related badges
   */
  private calculateActivityBadges(fitbitData: any, scores: any): Badge[] {
    const badges: Badge[] = [];

    if (!fitbitData?.activity) return badges;

    const activity = fitbitData.activity;
    const activityScore = scores.activity;

    // Steps badges
    if (activity.steps) {
      if (activity.steps >= 15000) {
        badges.push({
          name: "Step Master",
          description: "Walked 15,000+ steps",
          emoji: "🚶‍♂️",
          rarity: "epic",
          category: "daily",
          points: 80,
          unlockedAt: new Date().toISOString(),
        });
      } else if (activity.steps >= 12000) {
        badges.push({
          name: "Step Champion",
          description: "Walked 12,000+ steps",
          emoji: "👟",
          rarity: "rare",
          category: "daily",
          points: 60,
          unlockedAt: new Date().toISOString(),
        });
      } else if (activity.steps >= 10000) {
        badges.push({
          name: "Step Achiever",
          description: "Walked 10,000+ steps",
          emoji: "🚶",
          rarity: "uncommon",
          category: "daily",
          points: 40,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // Active minutes badges
    if (activity.activeMinutes) {
      if (activity.activeMinutes >= 60) {
        badges.push({
          name: "Active Hour",
          description: "Had 60+ active minutes",
          emoji: "⚡",
          rarity: "epic",
          category: "daily",
          points: 70,
          unlockedAt: new Date().toISOString(),
        });
      } else if (activity.activeMinutes >= 30) {
        badges.push({
          name: "Active Half Hour",
          description: "Had 30+ active minutes",
          emoji: "💪",
          rarity: "rare",
          category: "daily",
          points: 50,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // Distance badges
    if (activity.distance) {
      if (activity.distance >= 10) {
        badges.push({
          name: "Distance Runner",
          description: "Covered 10+ km",
          emoji: "🏃‍♂️",
          rarity: "epic",
          category: "daily",
          points: 75,
          unlockedAt: new Date().toISOString(),
        });
      } else if (activity.distance >= 8) {
        badges.push({
          name: "Long Walker",
          description: "Covered 8+ km",
          emoji: "🚶‍♀️",
          rarity: "rare",
          category: "daily",
          points: 55,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // High activity score badge
    if (activityScore >= 90) {
      badges.push({
        name: "Activity Perfectionist",
        description: "Achieved 90+ activity score",
        emoji: "🏅",
        rarity: "legendary",
        category: "daily",
        points: 100,
        unlockedAt: new Date().toISOString(),
      });
    }

    return badges;
  }

  /**
   * Calculate heart health badges
   */
  private calculateHeartBadges(fitbitData: any, scores: any): Badge[] {
    const badges: Badge[] = [];

    if (!fitbitData?.heart) return badges;

    const heart = fitbitData.heart;
    const heartScore = scores.heart;

    // Resting heart rate badges
    if (heart.restingHR) {
      if (heart.restingHR <= 50) {
        badges.push({
          name: "Athlete's Heart",
          description: "Resting HR ≤50 bpm",
          emoji: "❤️",
          rarity: "legendary",
          category: "daily",
          points: 100,
          unlockedAt: new Date().toISOString(),
        });
      } else if (heart.restingHR <= 60) {
        badges.push({
          name: "Healthy Heart",
          description: "Resting HR ≤60 bpm",
          emoji: "💓",
          rarity: "epic",
          category: "daily",
          points: 75,
          unlockedAt: new Date().toISOString(),
        });
      } else if (heart.restingHR <= 70) {
        badges.push({
          name: "Good Heart Rate",
          description: "Resting HR ≤70 bpm",
          emoji: "💗",
          rarity: "rare",
          category: "daily",
          points: 50,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // HRV badges
    if (heart.hrv) {
      if (heart.hrv >= 60) {
        badges.push({
          name: "HRV Master",
          description: "HRV ≥60 ms",
          emoji: "📈",
          rarity: "epic",
          category: "daily",
          points: 80,
          unlockedAt: new Date().toISOString(),
        });
      } else if (heart.hrv >= 50) {
        badges.push({
          name: "HRV Champion",
          description: "HRV ≥50 ms",
          emoji: "📊",
          rarity: "rare",
          category: "daily",
          points: 60,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // Peak heart rate badges
    if (heart.peakHR) {
      const age = 30; // This should come from user profile
      const maxHR = 220 - age;
      const peakHRPercentage = (heart.peakHR / maxHR) * 100;

      if (peakHRPercentage >= 90) {
        badges.push({
          name: "Peak Performer",
          description: "Peak HR ≥90% of max",
          emoji: "🔥",
          rarity: "epic",
          category: "daily",
          points: 70,
          unlockedAt: new Date().toISOString(),
        });
      } else if (peakHRPercentage >= 80) {
        badges.push({
          name: "High Intensity",
          description: "Peak HR ≥80% of max",
          emoji: "⚡",
          rarity: "rare",
          category: "daily",
          points: 50,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // High heart score badge
    if (heartScore >= 90) {
      badges.push({
        name: "Heart Perfectionist",
        description: "Achieved 90+ heart score",
        emoji: "💎",
        rarity: "legendary",
        category: "daily",
        points: 100,
        unlockedAt: new Date().toISOString(),
      });
    }

    return badges;
  }

  /**
   * Calculate work productivity badges
   */
  private calculateWorkBadges(
    gmailData: any,
    calendarData: any,
    scores: any
  ): Badge[] {
    const badges: Badge[] = [];

    // Email productivity badges
    if (gmailData?.stats) {
      const stats = gmailData.stats;

      // Response time badges
      if (stats.avgResponseTime) {
        if (stats.avgResponseTime <= 1) {
          badges.push({
            name: "Lightning Responder",
            description: "Average response time ≤1 hour",
            emoji: "⚡",
            rarity: "epic",
            category: "daily",
            points: 80,
            unlockedAt: new Date().toISOString(),
          });
        } else if (stats.avgResponseTime <= 2) {
          badges.push({
            name: "Quick Responder",
            description: "Average response time ≤2 hours",
            emoji: "📧",
            rarity: "rare",
            category: "daily",
            points: 60,
            unlockedAt: new Date().toISOString(),
          });
        }
      }

      // Email organization badges
      if (stats.primary && stats.noise) {
        const noisePercentage =
          (stats.noise / (stats.primary + stats.noise)) * 100;

        if (noisePercentage <= 10) {
          badges.push({
            name: "Email Organizer",
            description: "≤10% noise in emails",
            emoji: "📁",
            rarity: "epic",
            category: "daily",
            points: 70,
            unlockedAt: new Date().toISOString(),
          });
        } else if (noisePercentage <= 20) {
          badges.push({
            name: "Email Master",
            description: "≤20% noise in emails",
            emoji: "📬",
            rarity: "rare",
            category: "daily",
            points: 50,
            unlockedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Calendar efficiency badges
    if (calendarData?.analysis) {
      const analysis = calendarData.analysis;

      // Meeting efficiency badges
      if (analysis.meetingEfficiency !== undefined) {
        if (analysis.meetingEfficiency >= 80) {
          badges.push({
            name: "Meeting Master",
            description: "80%+ meeting efficiency",
            emoji: "📅",
            rarity: "epic",
            category: "daily",
            points: 75,
            unlockedAt: new Date().toISOString(),
          });
        } else if (analysis.meetingEfficiency >= 60) {
          badges.push({
            name: "Efficient Scheduler",
            description: "60%+ meeting efficiency",
            emoji: "⏰",
            rarity: "rare",
            category: "daily",
            points: 55,
            unlockedAt: new Date().toISOString(),
          });
        }
      }

      // Focus time badges
      if (analysis.focusTime !== undefined) {
        if (analysis.focusTime >= 40) {
          badges.push({
            name: "Focus Master",
            description: "40%+ focus time",
            emoji: "🎯",
            rarity: "epic",
            category: "daily",
            points: 80,
            unlockedAt: new Date().toISOString(),
          });
        } else if (analysis.focusTime >= 30) {
          badges.push({
            name: "Deep Worker",
            description: "30%+ focus time",
            emoji: "🧠",
            rarity: "rare",
            category: "daily",
            points: 60,
            unlockedAt: new Date().toISOString(),
          });
        }
      }
    }

    // High work score badge
    if (scores.work >= 90) {
      badges.push({
        name: "Work Perfectionist",
        description: "Achieved 90+ work score",
        emoji: "💼",
        rarity: "legendary",
        category: "daily",
        points: 100,
        unlockedAt: new Date().toISOString(),
      });
    }

    return badges;
  }

  /**
   * Calculate music and mood badges
   */
  private calculateMusicBadges(spotifyData: any, scores: any): Badge[] {
    const badges: Badge[] = [];

    if (!spotifyData) return badges;

    // Listening time badges
    if (spotifyData.totalListeningTime) {
      const hours = spotifyData.totalListeningTime / 60;

      if (hours >= 4) {
        badges.push({
          name: "Music Lover",
          description: "Listened to music for 4+ hours",
          emoji: "🎵",
          rarity: "rare",
          category: "daily",
          points: 40,
          unlockedAt: new Date().toISOString(),
        });
      } else if (hours >= 2) {
        badges.push({
          name: "Music Enthusiast",
          description: "Listened to music for 2+ hours",
          emoji: "🎶",
          rarity: "uncommon",
          category: "daily",
          points: 25,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // Audio features badges
    if (spotifyData.audioFeatures) {
      const features = spotifyData.audioFeatures;

      // High energy music
      if (features.energy >= 0.8) {
        badges.push({
          name: "High Energy",
          description: "Listened to high-energy music",
          emoji: "⚡",
          rarity: "uncommon",
          category: "daily",
          points: 30,
          unlockedAt: new Date().toISOString(),
        });
      }

      // Positive mood music
      if (features.valence >= 0.7) {
        badges.push({
          name: "Positive Vibes",
          description: "Listened to positive mood music",
          emoji: "😊",
          rarity: "uncommon",
          category: "daily",
          points: 30,
          unlockedAt: new Date().toISOString(),
        });
      }

      // Danceable music
      if (features.danceability >= 0.8) {
        badges.push({
          name: "Dance Floor",
          description: "Listened to highly danceable music",
          emoji: "💃",
          rarity: "uncommon",
          category: "daily",
          points: 25,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    return badges;
  }

  /**
   * Calculate combo badges
   */
  private calculateComboBadges(
    dailyBadges: Badge[],
    data: DataSources
  ): Badge[] {
    const badges: Badge[] = [];

    // Check for perfect day combo
    const hasSleepBadge = dailyBadges.some((b) =>
      b.name.includes("Perfect Sleep")
    );
    const hasActivityBadge = dailyBadges.some((b) =>
      b.name.includes("Step Achiever")
    );
    const hasHeartBadge = dailyBadges.some((b) =>
      b.name.includes("Good Heart Rate")
    );
    const hasWorkBadge = dailyBadges.some((b) =>
      b.name.includes("Quick Responder")
    );

    if (hasSleepBadge && hasActivityBadge && hasHeartBadge && hasWorkBadge) {
      badges.push({
        name: "Perfect Day",
        description: "Achieved excellence in all areas",
        emoji: "🌟",
        rarity: "legendary",
        category: "combo",
        points: 200,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Check for high score combo
    if (data.scores.total >= 85) {
      badges.push({
        name: "High Achiever",
        description: "Achieved 85+ overall score",
        emoji: "🏆",
        rarity: "epic",
        category: "combo",
        points: 150,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Check for balanced day combo
    const scoreVariance = this.calculateScoreVariance(data.scores);
    if (scoreVariance <= 10) {
      badges.push({
        name: "Balanced Day",
        description: "All scores within 10 points of each other",
        emoji: "⚖️",
        rarity: "rare",
        category: "combo",
        points: 100,
        unlockedAt: new Date().toISOString(),
      });
    }

    return badges;
  }

  /**
   * Calculate streak badges
   */
  private async calculateStreakBadges(
    historicalData: any[]
  ): Promise<StreakBadge[]> {
    const badges: StreakBadge[] = [];

    if (!historicalData || historicalData.length < 2) return badges;

    // Calculate daily streaks
    const dailyStreaks = this.calculateDailyStreaks(historicalData);
    badges.push(...dailyStreaks);

    // Calculate weekly streaks
    const weeklyStreaks = this.calculateWeeklyStreaks(historicalData);
    badges.push(...weeklyStreaks);

    return badges;
  }

  /**
   * Calculate near miss badges
   */
  private calculateNearMissBadges(data: DataSources): any[] {
    const nearMisses: any[] = [];

    // Check for near misses in each category
    if (data.scores.sleep >= 75 && data.scores.sleep < 80) {
      nearMisses.push({
        type: "Sleep Near Miss",
        description: "Almost achieved excellent sleep score",
        currentScore: data.scores.sleep,
        targetScore: 80,
        suggestion: "Try going to bed 30 minutes earlier",
      });
    }

    if (data.scores.activity >= 75 && data.scores.activity < 80) {
      nearMisses.push({
        type: "Activity Near Miss",
        description: "Almost achieved excellent activity score",
        currentScore: data.scores.activity,
        targetScore: 80,
        suggestion: "Take a 10-minute walk to reach your goal",
      });
    }

    if (data.scores.heart >= 75 && data.scores.heart < 80) {
      nearMisses.push({
        type: "Heart Near Miss",
        description: "Almost achieved excellent heart score",
        currentScore: data.scores.heart,
        targetScore: 80,
        suggestion: "Try 5 minutes of deep breathing exercises",
      });
    }

    if (data.scores.work >= 75 && data.scores.work < 80) {
      nearMisses.push({
        type: "Work Near Miss",
        description: "Almost achieved excellent work score",
        currentScore: data.scores.work,
        targetScore: 80,
        suggestion: "Batch your emails for better efficiency",
      });
    }

    return nearMisses;
  }

  /**
   * Generate badge narrative
   */
  private generateBadgeNarrative(
    dailyBadges: Badge[],
    streakBadges: StreakBadge[],
    scores: any
  ): string {
    const totalBadges = dailyBadges.length + streakBadges.length;
    const totalPoints =
      dailyBadges.reduce((sum, badge) => sum + badge.points, 0) +
      streakBadges.reduce((sum, badge) => sum + badge.points, 0);

    if (totalBadges === 0) {
      return "No badges earned today, but every day is a new opportunity to achieve your wellness goals!";
    }

    const rareBadges = dailyBadges.filter(
      (b) =>
        b.rarity === "rare" || b.rarity === "epic" || b.rarity === "legendary"
    );
    const comboBadges = dailyBadges.filter((b) => b.category === "combo");

    let narrative = `Congratulations! You earned ${totalBadges} badge${
      totalBadges > 1 ? "s" : ""
    } today, totaling ${totalPoints} points. `;

    if (rareBadges.length > 0) {
      narrative += `You achieved ${rareBadges.length} rare badge${
        rareBadges.length > 1 ? "s" : ""
      }, showing exceptional dedication to your wellness journey. `;
    }

    if (comboBadges.length > 0) {
      narrative += `Your combo badges demonstrate excellent balance across all areas of your life. `;
    }

    if (scores.total >= 80) {
      narrative += `With an overall score of ${scores.total}, you're maintaining excellent wellness habits!`;
    } else if (scores.total >= 60) {
      narrative += `With an overall score of ${scores.total}, you're making good progress on your wellness journey!`;
    } else {
      narrative += `Keep working on improving your overall score of ${scores.total} - every small step counts!`;
    }

    return narrative;
  }

  // Helper methods
  private calculateScoreVariance(scores: any): number {
    const scoreValues = [
      scores.sleep,
      scores.activity,
      scores.heart,
      scores.work,
    ];
    const mean =
      scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
    const variance =
      scoreValues.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
      scoreValues.length;
    return Math.sqrt(variance);
  }

  private calculateDailyStreaks(historicalData: any[]): StreakBadge[] {
    const badges: StreakBadge[] = [];

    // This would implement streak calculation logic
    // For now, return empty array
    return badges;
  }

  private calculateWeeklyStreaks(historicalData: any[]): StreakBadge[] {
    const badges: StreakBadge[] = [];

    // This would implement weekly streak calculation logic
    // For now, return empty array
    return badges;
  }

  // Weekly badge methods
  private calculateWeeklyAchievementBadges(data: DataSources): Badge[] {
    const badges: Badge[] = [];

    // Weekly high score badge
    if (data.scores.total >= 80) {
      badges.push({
        name: "Weekly High Achiever",
        description: "Achieved 80+ overall score for the week",
        emoji: "📈",
        rarity: "epic",
        category: "daily",
        points: 150,
        unlockedAt: new Date().toISOString(),
      });
    }

    return badges;
  }

  private calculateConsistencyBadges(data: DataSources): Badge[] {
    const badges: Badge[] = [];

    // This would implement consistency calculation logic
    // For now, return empty array
    return badges;
  }

  private async calculateWeeklyStreakBadges(
    historicalData: any[]
  ): Promise<StreakBadge[]> {
    const badges: StreakBadge[] = [];

    // This would implement weekly streak calculation logic
    // For now, return empty array
    return badges;
  }

  private calculateWeeklyNearMisses(data: DataSources): any[] {
    const nearMisses: any[] = [];

    // This would implement weekly near miss calculation logic
    // For now, return empty array
    return nearMisses;
  }

  private generateWeeklyBadgeNarrative(
    dailyBadges: Badge[],
    streakBadges: StreakBadge[],
    scores: any
  ): string {
    const totalBadges = dailyBadges.length + streakBadges.length;
    const totalPoints =
      dailyBadges.reduce((sum, badge) => sum + badge.points, 0) +
      streakBadges.reduce((sum, badge) => sum + badge.points, 0);

    if (totalBadges === 0) {
      return "No weekly badges earned this week, but consistency is key to long-term wellness success!";
    }

    let narrative = `Outstanding week! You earned ${totalBadges} badge${
      totalBadges > 1 ? "s" : ""
    } this week, totaling ${totalPoints} points. `;

    if (scores.total >= 75) {
      narrative += `Your weekly average score of ${scores.total} shows excellent consistency in your wellness journey!`;
    } else if (scores.total >= 60) {
      narrative += `Your weekly average score of ${scores.total} shows good progress - keep up the great work!`;
    } else {
      narrative += `Your weekly average score of ${scores.total} shows room for improvement - every week is a fresh start!`;
    }

    return narrative;
  }
}
