import { MoodPrediction } from "./mood-service";

export interface WellnessData {
  fitbitSleep?: string;
  fitbitHeart?: string;
  spotifySummary?: string;
  scores?: {
    sleep: number;
    activity: number;
    heart: number;
    work: number;
    total: number;
  };
  dayContext?: {
    dayType: "weekend" | "weekday";
    dayName: string;
  };
}

export class MoodPredictionService {
  /**
   * Predict mood based on wellness data - adapted from oldreport.tsx
   */
  static predictMood(data: WellnessData): MoodPrediction {
    // Parse sleep data
    const sleepData = this.parseSleepData(data.fitbitSleep || "");
    const heartData = this.parseHeartData(data.fitbitHeart || "");
    const musicData = this.parseMusicData(data.spotifySummary || "");

    // Calculate mood based on data
    let mood = "";
    let confidence = "";
    let confidenceLevel = "likely"; // default
    const factors: string[] = [];

    // Calculate confidence based on data quality and extremity
    if (sleepData.hours > 0 && sleepData.efficiency > 0 && heartData.rhr > 0) {
      // Very high confidence scenarios
      if (sleepData.efficiency < 50 && sleepData.hours < 6) {
        confidenceLevel = "very likely";
        confidence = `Low sleep efficiency (${sleepData.efficiency}%) with short duration strongly indicates fatigue.`;
        factors.push("poor_sleep_quality", "insufficient_sleep");
      } else if (sleepData.efficiency > 90 && sleepData.hours >= 7.5) {
        confidenceLevel = "very likely";
        confidence = "Excellent sleep quality sets you up for peak performance.";
        factors.push("excellent_sleep_quality", "sufficient_sleep");
      }
      // Moderate confidence scenarios
      else if (sleepData.efficiency > 80 && sleepData.hours >= 7) {
        confidenceLevel = "likely";
        confidence = "Good sleep metrics suggest stable energy levels.";
        factors.push("good_sleep_quality");
      } else if (sleepData.efficiency < 70) {
        confidenceLevel = "may";
        confidence = "Sleep disruptions could affect afternoon energy.";
        factors.push("sleep_disruptions");
      }
      // Low confidence scenarios
      else {
        confidenceLevel = "might";
        confidence = "Mixed signals make prediction less certain.";
        factors.push("mixed_signals");
      }
    }

    // Determine mood with softer language
    if (sleepData.hours >= 7 && sleepData.efficiency >= 85) {
      mood = "energized and focused";
      factors.push("optimal_sleep");
    } else if (sleepData.hours >= 6.5 && sleepData.efficiency >= 80) {
      mood = "balanced and steady";
      factors.push("good_sleep");
    } else if (sleepData.hours < 6 || sleepData.efficiency < 60) {
      mood = "some mental fog";
      factors.push("poor_sleep");
    } else if (sleepData.efficiency < 75) {
      mood = "occasional fatigue";
      factors.push("sleep_issues");
    } else {
      mood = "moderate energy";
      factors.push("average_sleep");
    }

    // Adjust based on heart data
    if (heartData.rhr > 65 && mood === "energized and focused") {
      mood = "alert but slightly tense";
      confidence = `Elevated resting heart rate (${heartData.rhr} bpm) may indicate mild stress.`;
      factors.push("elevated_hr", "stress_indicators");
    } else if (heartData.rhr < 55 && mood !== "some mental fog") {
      mood = "calm and recovered";
      confidence = `Excellent resting heart rate (${heartData.rhr} bpm) shows strong recovery.`;
      factors.push("low_hr", "strong_recovery");
    }

    // Music influence
    if (musicData.energy === "calm" && mood.indexOf("tense") !== -1) {
      confidence += " Your calming music choices suggest you're already managing this well.";
      factors.push("calming_music");
    } else if (musicData.energy === "high" && mood.indexOf("fog") !== -1) {
      confidence += " High-energy music might help counteract the fatigue.";
      factors.push("energetic_music");
    }

    // Add day context factors
    if (data.dayContext?.dayType === "weekend") {
      factors.push("weekend");
    } else {
      factors.push("weekday");
    }

    // Calculate confidence score (0-1)
    let confidenceScore = 0.5; // base score
    if (confidenceLevel === "very likely") confidenceScore = 0.9;
    else if (confidenceLevel === "likely") confidenceScore = 0.7;
    else if (confidenceLevel === "may") confidenceScore = 0.5;
    else if (confidenceLevel === "might") confidenceScore = 0.3;

    // Adjust based on data quality
    const dataQuality = this.calculateDataQuality(sleepData, heartData, musicData);
    confidenceScore = Math.min(0.95, confidenceScore * dataQuality);

    return {
      mood,
      confidence_score: confidenceScore,
      factors,
      reasoning: confidence,
    };
  }

  /**
   * Parse sleep data from Fitbit summary
   */
  private static parseSleepData(sleepSummary: string): {
    hours: number;
    efficiency: number;
  } {
    const sleepMatch = sleepSummary.match(/(\d+)h (\d+)m/);
    const hours = sleepMatch
      ? parseFloat(sleepMatch[1]) + parseFloat(sleepMatch[2]) / 60
      : 0;

    const efficiencyMatch = sleepSummary.match(/😴 Efficiency: (\d+)%/);
    const efficiency = efficiencyMatch ? parseInt(efficiencyMatch[1]) : 0;

    return { hours, efficiency };
  }

  /**
   * Parse heart data from Fitbit summary
   */
  private static parseHeartData(heartSummary: string): {
    rhr: number;
  } {
    const rhrMatch = heartSummary.match(/❤️ Resting HR: (\d+)/);
    const rhr = rhrMatch ? parseInt(rhrMatch[1]) : 65;

    return { rhr };
  }

  /**
   * Parse music data from Spotify summary
   */
  private static parseMusicData(spotifySummary: string): {
    energy: "calm" | "moderate" | "high";
  } {
    const summary = spotifySummary.toLowerCase();
    
    if (
      summary.indexOf("classical") !== -1 ||
      summary.indexOf("ambient") !== -1 ||
      summary.indexOf("jazz") !== -1
    ) {
      return { energy: "calm" };
    } else if (
      summary.indexOf("rock") !== -1 ||
      summary.indexOf("dance") !== -1 ||
      summary.indexOf("electronic") !== -1 ||
      summary.indexOf("pop") !== -1
    ) {
      return { energy: "high" };
    }
    
    return { energy: "moderate" };
  }

  /**
   * Calculate data quality score (0-1)
   */
  private static calculateDataQuality(
    sleepData: { hours: number; efficiency: number },
    heartData: { rhr: number },
    musicData: { energy: string }
  ): number {
    let quality = 0;
    let factors = 0;

    if (sleepData.hours > 0) {
      quality += 0.4;
      factors++;
    }
    if (sleepData.efficiency > 0) {
      quality += 0.3;
      factors++;
    }
    if (heartData.rhr > 0) {
      quality += 0.2;
      factors++;
    }
    if (musicData.energy !== "moderate") {
      quality += 0.1;
      factors++;
    }

    return factors > 0 ? quality : 0.1; // minimum quality if no data
  }

  /**
   * Generate mood insight text for reports
   */
  static generateMoodInsight(prediction: MoodPrediction, dayContext?: any): string {
    let response = "";

    if (prediction.mood === "some mental fog" || prediction.mood === "occasional fatigue") {
      response = `You may experience ${prediction.mood} today, especially in the afternoon. `;
    } else if (
      prediction.mood === "energized and focused" ||
      prediction.mood === "calm and recovered"
    ) {
      response = `You're likely to feel ${prediction.mood} today. `;
    } else {
      response = `You'll likely have ${prediction.mood} today. `;
    }

    response += prediction.reasoning;

    // Add day context
    if (dayContext?.dayType === "weekend") {
      response += " The weekend context may help you manage any challenges more easily.";
    } else if (dayContext?.dayType === "weekday") {
      response += " Consider pacing yourself throughout the workday.";
    }

    return response;
  }

  /**
   * Get mood color based on mood type
   */
  static getMoodColor(mood: string): string {
    if (mood.includes("energized") || mood.includes("focused")) return "text-green-600";
    if (mood.includes("calm") || mood.includes("recovered")) return "text-blue-600";
    if (mood.includes("balanced") || mood.includes("steady")) return "text-yellow-600";
    if (mood.includes("fog") || mood.includes("fatigue")) return "text-orange-600";
    if (mood.includes("tense") || mood.includes("stressed")) return "text-red-600";
    return "text-gray-600";
  }

  /**
   * Get mood emoji based on mood type
   */
  static getMoodEmoji(mood: string): string {
    if (mood.includes("energized") || mood.includes("focused")) return "⚡";
    if (mood.includes("calm") || mood.includes("recovered")) return "😌";
    if (mood.includes("balanced") || mood.includes("steady")) return "😊";
    if (mood.includes("fog") || mood.includes("fatigue")) return "😴";
    if (mood.includes("tense") || mood.includes("stressed")) return "😰";
    return "😐";
  }
}
