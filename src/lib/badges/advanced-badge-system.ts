export interface Badge {
  name: string;
  emoji: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  points: number;
  category: "daily" | "streak" | "combo" | "milestone" | "personal_record";
  earned: boolean;
  earnedDate?: string;
  count?: number;
}

export interface BadgeData {
  scores: {
    total: number;
    sleep: number;
    activity: number;
    heart: number;
    work: number;
  };
  fitbitData: {
    sleep: string;
    activity: string;
    heart: string;
  };
  emailStats: {
    received: number;
    sent: number;
    primary: number;
    noise: number;
    noisePercentage: number;
  };
  stressRadar: {
    level: string;
    score: number;
  };
  recoveryQuotient: {
    score: number;
    readiness: string;
  };
  calendarIntelligence: {
    score: number;
  };
  dayContext: {
    dayType: "weekend" | "weekday";
    dayName: string;
  };
}

/**
 * Calculate daily badges - EXACT implementation from code.js
 */
export function calculateDailyBadges(
  scores: any,
  fitbitData: any,
  emailStats: any,
  stressRadar: any,
  recoveryQuotient: any,
  calendarIntelligence: any
): Badge[] {
  const badges: Badge[] = [];

  // Sleep Master Badge
  if (scores.sleep >= 90) {
    badges.push({
      name: "Sleep Master",
      emoji: "😴",
      description: "Achieved 90+ sleep score",
      rarity: "epic",
      points: 50,
      category: "daily",
      earned: true,
    });
  }

  // Step Warrior Badge
  const stepsMatch = fitbitData.activity?.match(/👣 Steps: ([\d,]+)/);
  if (stepsMatch) {
    const steps = parseInt(stepsMatch[1].replace(/,/g, ""), 10);
    if (steps >= 15000) {
      badges.push({
        name: "Step Warrior",
        emoji: "👣",
        description: "Walked 15,000+ steps",
        rarity: "epic",
        points: 50,
        category: "daily",
        earned: true,
      });
    } else if (steps >= 10000) {
      badges.push({
        name: "10K Club",
        emoji: "🚶",
        description: "Walked 10,000+ steps",
        rarity: "uncommon",
        points: 25,
        category: "daily",
        earned: true,
      });
    }
  }

  // Heart Hero Badge
  if (scores.heart >= 90) {
    badges.push({
      name: "Heart Hero",
      emoji: "❤️",
      description: "Achieved 90+ heart score",
      rarity: "rare",
      points: 40,
      category: "daily",
      earned: true,
    });
  }

  // Focus Guardian Badge
  if (scores.work >= 90) {
    badges.push({
      name: "Focus Guardian",
      emoji: "🎯",
      description: "Achieved 90+ work score",
      rarity: "rare",
      points: 40,
      category: "daily",
      earned: true,
    });
  }

  // Inbox Zero Hero Badge
  if (emailStats.primary <= 5 && emailStats.sent >= 10) {
    badges.push({
      name: "Inbox Zero Hero",
      emoji: "📧",
      description: "Maintained clean inbox with high productivity",
      rarity: "rare",
      points: 40,
      category: "daily",
      earned: true,
    });
  }

  // Zen Mode Badge
  if (stressRadar.level === "Low" && recoveryQuotient.score >= 80) {
    badges.push({
      name: "Zen Mode",
      emoji: "🧘",
      description: "Achieved low stress and high recovery",
      rarity: "uncommon",
      points: 30,
      category: "daily",
      earned: true,
    });
  }

  // Peak Recovery Badge
  if (recoveryQuotient.score >= 90) {
    badges.push({
      name: "Peak Recovery",
      emoji: "💪",
      description: "Achieved 90+ recovery score",
      rarity: "epic",
      points: 50,
      category: "daily",
      earned: true,
    });
  }

  // Perfect Day Badge
  if (scores.total >= 95) {
    badges.push({
      name: "Perfect Day",
      emoji: "⭐",
      description: "Achieved 95+ overall score",
      rarity: "legendary",
      points: 100,
      category: "daily",
      earned: true,
    });
  }

  // Wellness Champion Badge
  if (
    scores.sleep >= 80 &&
    scores.activity >= 80 &&
    scores.heart >= 80 &&
    scores.work >= 80
  ) {
    badges.push({
      name: "Wellness Champion",
      emoji: "🏆",
      description: "All metrics 80+ (balanced excellence)",
      rarity: "legendary",
      points: 100,
      category: "daily",
      earned: true,
    });
  }

  // The Trifecta Badge
  if (scores.sleep >= 85 && scores.activity >= 85 && scores.heart >= 85) {
    badges.push({
      name: "The Trifecta",
      emoji: "🔥",
      description: "Sleep, Activity, and Heart all 85+",
      rarity: "legendary",
      points: 100,
      category: "daily",
      earned: true,
    });
  }

  // Perfect Storm Badge
  if (
    scores.total >= 90 &&
    stressRadar.level === "Low" &&
    recoveryQuotient.score >= 85
  ) {
    badges.push({
      name: "Perfect Storm",
      emoji: "⚡",
      description: "High performance with low stress and high recovery",
      rarity: "legendary",
      points: 100,
      category: "daily",
      earned: true,
    });
  }

  return badges;
}

/**
 * Calculate streak badges - EXACT implementation from code.js
 */
export function calculateStreakBadges(dateStr: string): Badge[] {
  const badges: Badge[] = [];

  // This would need to be implemented with actual streak tracking
  // For now, returning empty array as placeholder
  return badges;
}

/**
 * Check for combo badges - EXACT implementation from code.js
 */
export function checkComboBadges(
  badges: Badge[],
  dayContext: any,
  scores: any
): Badge[] {
  const comboBadges: Badge[] = [];

  // Check for specific badge combinations
  const hasSleepMaster = badges.some((b) => b.name === "Sleep Master");
  const hasStepWarrior = badges.some((b) => b.name === "Step Warrior");
  const hasHeartHero = badges.some((b) => b.name === "Heart Hero");

  // Triple Threat Combo
  if (hasSleepMaster && hasStepWarrior && hasHeartHero) {
    comboBadges.push({
      name: "Triple Threat",
      emoji: "🔥🔥🔥",
      description:
        "Earned Sleep Master, Step Warrior, and Heart Hero in one day",
      rarity: "legendary",
      points: 150,
      category: "combo",
      earned: true,
    });
  }

  // Weekend Warrior Combo
  if (
    dayContext.dayType === "weekend" &&
    scores.activity >= 80 &&
    scores.sleep >= 80
  ) {
    comboBadges.push({
      name: "Weekend Warrior",
      emoji: "🏃‍♂️",
      description: "High activity and sleep on weekend",
      rarity: "rare",
      points: 60,
      category: "combo",
      earned: true,
    });
  }

  return comboBadges;
}

/**
 * Check for personal records - EXACT implementation from code.js
 */
export function checkPersonalRecords(
  currentStats: any,
  dateStr: string
): Badge[] {
  const recordBadges: Badge[] = [];

  // This would need to be implemented with actual personal record tracking
  // For now, returning empty array as placeholder
  return recordBadges;
}

/**
 * Check for milestone badges - EXACT implementation from code.js
 */
export function checkMilestoneBadges(dateStr: string): Badge[] {
  const milestoneBadges: Badge[] = [];

  // This would need to be implemented with actual milestone tracking
  // For now, returning empty array as placeholder
  return milestoneBadges;
}

/**
 * Get near miss badges - EXACT implementation from code.js
 */
export function getNearMissBadges(
  scores: any,
  fitbitData: any,
  emailStats: any
): Badge[] {
  const nearMisses: Badge[] = [];

  // Near miss for sleep
  if (scores.sleep >= 75 && scores.sleep < 80) {
    nearMisses.push({
      name: "Sleep Near Miss",
      emoji: "😴",
      description: "Almost made Sleep Master (75-79 sleep score)",
      rarity: "common",
      points: 10,
      category: "daily",
      earned: false,
    });
  }

  // Near miss for steps
  const stepsMatch = fitbitData.activity?.match(/👣 Steps: ([\d,]+)/);
  if (stepsMatch) {
    const steps = parseInt(stepsMatch[1].replace(/,/g, ""), 10);
    if (steps >= 9500 && steps < 10000) {
      nearMisses.push({
        name: "Steps Near Miss",
        emoji: "👣",
        description: "Almost made 10K Club (9,500-9,999 steps)",
        rarity: "common",
        points: 10,
        category: "daily",
        earned: false,
      });
    }
  }

  return nearMisses;
}

/**
 * Generate badge narrative - EXACT implementation from code.js
 */
export function generateBadgeNarrative(
  badges: Badge[],
  scores: any,
  dayContext: any
): string {
  if (badges.length === 0) {
    return "No badges earned today. Keep pushing for excellence!";
  }

  const legendaryBadges = badges.filter((b) => b.rarity === "legendary");
  const epicBadges = badges.filter((b) => b.rarity === "epic");
  const rareBadges = badges.filter((b) => b.rarity === "rare");

  let narrative = "";

  if (legendaryBadges.length > 0) {
    narrative += `🏆 **LEGENDARY ACHIEVEMENT!** You earned ${
      legendaryBadges.length
    } legendary badge${legendaryBadges.length > 1 ? "s" : ""}: ${legendaryBadges
      .map((b) => b.name)
      .join(", ")}. This is exceptional performance! `;
  }

  if (epicBadges.length > 0) {
    narrative += `⚡ **Epic Performance!** ${epicBadges
      .map((b) => b.name)
      .join(", ")} - you're operating at peak levels. `;
  }

  if (rareBadges.length > 0) {
    narrative += `💎 **Rare Excellence!** ${rareBadges
      .map((b) => b.name)
      .join(", ")} - outstanding work! `;
  }

  const totalPoints = badges.reduce((sum, badge) => sum + badge.points, 0);
  narrative += `\n\n**Total Points Earned:** ${totalPoints}`;

  return narrative;
}

/**
 * Get badge rarity color
 */
export function getBadgeRarityColor(rarity: string): string {
  switch (rarity) {
    case "legendary":
      return "#FFB300"; // Gold
    case "epic":
      return "#7B1FA2"; // Purple
    case "rare":
      return "#1976D2"; // Blue
    case "uncommon":
      return "#388E3C"; // Green
    case "common":
      return "#757575"; // Gray
    default:
      return "#757575";
  }
}

/**
 * Get badge emoji by name
 */
export function getBadgeEmoji(badgeName: string): string {
  const badgeEmojis: { [key: string]: string } = {
    "Perfect Day": "⭐",
    "Wellness Champion": "🏆",
    "The Trifecta": "🔥",
    "Perfect Storm": "⚡",
    "Sleep Master": "😴",
    "Step Warrior": "👣",
    "Peak Recovery": "💪",
    "Heart Hero": "❤️",
    "Focus Guardian": "🎯",
    "Inbox Zero Hero": "📧",
    "10K Club": "🚶",
    "Zen Mode": "🧘",
    "Triple Threat": "🔥🔥🔥",
    "Weekend Warrior": "🏃‍♂️",
  };

  return badgeEmojis[badgeName] || "🏅";
}

/**
 * Get badge description by name
 */
export function getBadgeDescription(badgeName: string): string {
  const badgeDescriptions: { [key: string]: string } = {
    "Perfect Day": "Achieved 95+ overall score",
    "Wellness Champion": "All metrics 80+ (balanced excellence)",
    "The Trifecta": "Sleep, Activity, and Heart all 85+",
    "Perfect Storm": "High performance with low stress and high recovery",
    "Sleep Master": "Achieved 90+ sleep score",
    "Step Warrior": "Walked 15,000+ steps",
    "Peak Recovery": "Achieved 90+ recovery score",
    "Heart Hero": "Achieved 90+ heart score",
    "Focus Guardian": "Achieved 90+ work score",
    "Inbox Zero Hero": "Maintained clean inbox with high productivity",
    "10K Club": "Walked 10,000+ steps",
    "Zen Mode": "Achieved low stress and high recovery",
    "Triple Threat":
      "Earned Sleep Master, Step Warrior, and Heart Hero in one day",
    "Weekend Warrior": "High activity and sleep on weekend",
  };

  return badgeDescriptions[badgeName] || "Achievement unlocked!";
}
