import OpenAI from "openai";

export interface AIInsights {
  summary: string;
  mantra: string;
  moodInsight: string;
  stressRadar: any;
  recoveryQuotient: any;
  dayContext: any;
  anomalies: any;
  environmentalFactors: any;
  deepInsights: any;
  trends: any;
  balanceLevel: string;
  balanceStatus: string;
  balanceColor: string;
  balanceInsight: string;
  moodAndEnergy: any;
}

export interface DataSources {
  scores: any;
  fitbit: any;
  spotify: any;
  gmail: any;
  calendar: any;
  googleTasks: any;
  weather: any;
  historical: any[];
}

export class AIInsightsService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate comprehensive daily AI insights
   */
  async generateDailyInsights(data: DataSources): Promise<AIInsights> {
    try {
      const context = this.buildComprehensiveContext(data);

      // Generate main summary
      const summary = await this.generateMainSummary(context, data);

      // Generate daily mantra
      const mantra = await this.generateDailyMantra(context, data);

      // Generate mood insight using getPredictedMood
      const moodInsight = await this.getPredictedMood(
        data.fitbit?.sleep?.summary || "",
        data.fitbit?.heart?.summary || "",
        data.spotify?.summary || "",
        data.spotify?.audioFeatures
      );

      // Generate stress radar analysis
      const stressRadar = this.generateStressRadar(data);

      // Generate recovery quotient
      const recoveryQuotient = this.generateRecoveryQuotient(data);

      // Generate day context
      const dayContext = this.generateDayContext(data);

      // Detect anomalies
      const anomalies = this.detectAnomalies(data);

      // Analyze environmental factors
      const environmentalFactors = this.analyzeEnvironmentalFactors(data);

      // Generate deep insights
      const deepInsights = await this.generateDeepInsights(context, data);

      // Analyze trends
      const trends = this.analyzeTrends(data);

      // Calculate wellness balance
      const balance = this.calculateWellnessBalance(data.scores);

      // Generate mood and energy forecast
      const moodAndEnergy = await this.generateMoodAndEnergyForecast(
        context,
        data
      );

      return {
        summary,
        mantra,
        moodInsight,
        stressRadar,
        recoveryQuotient,
        dayContext,
        anomalies,
        environmentalFactors,
        deepInsights,
        trends,
        balanceLevel: balance.level,
        balanceStatus: balance.status,
        balanceColor: balance.color,
        balanceInsight: balance.insight,
        moodAndEnergy,
      };
    } catch (error) {
      console.error(
        "❌ [AIInsightsService] Error generating daily insights:",
        error
      );
      return this.generateFallbackInsights(data);
    }
  }

  /**
   * Generate comprehensive weekly AI insights
   */
  async generateWeeklyInsights(data: DataSources): Promise<AIInsights> {
    try {
      const context = this.buildWeeklyContext(data);

      // Generate weekly summary
      const summary = await this.generateWeeklySummary(context, data);

      // Generate weekly mantra
      const mantra = await this.generateWeeklyMantra(context, data);

      // Generate weekly mood insight
      const moodInsight = await this.generateWeeklyMoodInsight(context, data);

      // Generate weekly stress analysis
      const stressRadar = this.generateWeeklyStressRadar(data);

      // Generate weekly recovery analysis
      const recoveryQuotient = this.generateWeeklyRecoveryQuotient(data);

      // Generate weekly context
      const dayContext = this.generateWeeklyContext(data);

      // Detect weekly anomalies
      const anomalies = this.detectWeeklyAnomalies(data);

      // Analyze weekly environmental factors
      const environmentalFactors = this.analyzeWeeklyEnvironmentalFactors(data);

      // Generate weekly deep insights
      const deepInsights = await this.generateWeeklyDeepInsights(context, data);

      // Analyze weekly trends
      const trends = this.analyzeWeeklyTrends(data);

      // Calculate weekly wellness balance
      const balance = this.calculateWeeklyWellnessBalance(data.scores);

      // Generate weekly mood and energy forecast
      const moodAndEnergy = await this.generateWeeklyMoodAndEnergyForecast(
        context,
        data
      );

      return {
        summary,
        mantra,
        moodInsight,
        stressRadar,
        recoveryQuotient,
        dayContext,
        anomalies,
        environmentalFactors,
        deepInsights,
        trends,
        balanceLevel: balance.level,
        balanceStatus: balance.status,
        balanceColor: balance.color,
        balanceInsight: balance.insight,
        moodAndEnergy,
      };
    } catch (error) {
      console.error(
        "❌ [AIInsightsService] Error generating weekly insights:",
        error
      );
      return this.generateFallbackInsights(data);
    }
  }

  /**
   * Build comprehensive context for AI analysis
   */
  private buildComprehensiveContext(data: DataSources): string {
    const { scores, fitbit, spotify, gmail, calendar, weather, historical } =
      data;

    let context = `# Daily Wellness Analysis Context\n\n`;

    // Scores
    context += `## Current Scores\n`;
    context += `- Overall: ${scores.total}/100\n`;
    context += `- Sleep: ${scores.sleep}/100\n`;
    context += `- Activity: ${scores.activity}/100\n`;
    context += `- Heart: ${scores.heart}/100\n`;
    context += `- Work: ${scores.work}/100\n\n`;

    // Fitbit data
    if (fitbit) {
      context += `## Health Metrics\n`;
      if (fitbit.sleep) {
        context += `- Sleep: ${fitbit.sleep.summary || "No data"}\n`;
      }
      if (fitbit.activity) {
        context += `- Activity: ${fitbit.activity.summary || "No data"}\n`;
      }
      if (fitbit.heart) {
        context += `- Heart Rate: ${fitbit.heart.summary || "No data"}\n`;
      }
      context += `\n`;
    }

    // Spotify data
    if (spotify) {
      context += `## Music & Mood\n`;
      context += `- Listening Summary: ${spotify.summary || "No data"}\n`;
      if (spotify.audioFeatures) {
        context += `- Audio Features: ${JSON.stringify(
          spotify.audioFeatures
        )}\n`;
      }
      context += `\n`;
    }

    // Gmail data
    if (gmail) {
      context += `## Email Productivity\n`;
      context += `- Email Summary: ${gmail.summary || "No data"}\n`;
      if (gmail.stats) {
        context += `- Stats: ${JSON.stringify(gmail.stats)}\n`;
      }
      context += `\n`;
    }

    // Calendar data
    if (calendar) {
      context += `## Schedule Analysis\n`;
      context += `- Calendar Summary: ${calendar.summary || "No data"}\n`;
      if (calendar.analysis) {
        context += `- Analysis: ${JSON.stringify(calendar.analysis)}\n`;
      }
      context += `\n`;
    }

    // Weather data
    if (weather) {
      context += `## Weather Impact\n`;
      context += `- Weather: ${weather.summary || "No data"}\n`;
      context += `\n`;
    }

    // Historical trends
    if (historical && historical.length > 0) {
      context += `## Historical Context\n`;
      context += `- Previous ${historical.length} days of data available\n`;
      const avgScore =
        historical.reduce((sum, h) => sum + (h.score || 0), 0) /
        historical.length;
      context += `- Average historical score: ${Math.round(avgScore)}/100\n\n`;
    }

    return context;
  }

  /**
   * Build weekly context for AI analysis
   */
  private buildWeeklyContext(data: DataSources): string {
    const context = this.buildComprehensiveContext(data);
    return context.replace(
      "# Daily Wellness Analysis Context",
      "# Weekly Wellness Analysis Context"
    );
  }

  /**
   * Generate main summary using GPT
   */
  private async generateMainSummary(
    context: string,
    data: DataSources
  ): Promise<string> {
    try {
      const prompt = `Based on the following wellness data, provide a comprehensive, personalized daily summary (2-3 paragraphs) that:
1. Celebrates achievements and positive patterns
2. Identifies areas for improvement with specific, actionable advice
3. Connects different data points to tell a cohesive story
4. Uses an encouraging, supportive tone
5. Provides specific, actionable recommendations

${context}

Please respond with only the summary text, no additional formatting.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });

      return (
        response.choices[0]?.message?.content ||
        this.generateFallbackSummary(data)
      );
    } catch (error) {
      console.error(
        "❌ [AIInsightsService] Error generating main summary:",
        error
      );
      return this.generateFallbackSummary(data);
    }
  }

  /**
   * Generate daily mantra using GPT
   */
  private async generateDailyMantra(
    context: string,
    data: DataSources
  ): Promise<string> {
    try {
      const prompt = `Based on the following wellness data, create a short, inspiring daily mantra (1-2 sentences) that:
1. Reflects the user's current state and goals
2. Is motivational and positive
3. Is specific to their data patterns
4. Can be used as a daily affirmation

${context}

Please respond with only the mantra text, no additional formatting.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.8,
      });

      return (
        response.choices[0]?.message?.content ||
        this.generateFallbackMantra(data)
      );
    } catch (error) {
      console.error(
        "❌ [AIInsightsService] Error generating daily mantra:",
        error
      );
      return this.generateFallbackMantra(data);
    }
  }

  /**
   * Generate mood insight using GPT
   */
  private async generateMoodInsight(
    context: string,
    data: DataSources
  ): Promise<string> {
    try {
      const prompt = `Based on the following wellness data, analyze the user's mood and energy patterns and provide insight (2-3 sentences) that:
1. Connects their data to their emotional state
2. Explains what might be influencing their mood
3. Suggests how they can optimize their mood and energy

${context}

Please respond with only the mood insight text, no additional formatting.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      });

      return (
        response.choices[0]?.message?.content ||
        this.generateFallbackMoodInsight(data)
      );
    } catch (error) {
      console.error(
        "❌ [AIInsightsService] Error generating mood insight:",
        error
      );
      return this.generateFallbackMoodInsight(data);
    }
  }

  /**
   * Generate stress radar analysis
   */
  private generateStressRadar(data: DataSources): any {
    const { scores, fitbit, gmail, calendar, spotify } = data;
    const stressFactors = [];
    let stressScore = 0;

    // Sleep quality impact
    if (scores.sleep < 60) {
      stressFactors.push("Poor sleep quality");
      stressScore += 25;
    }

    // Heart rate variability
    if (fitbit?.heart?.hrv && fitbit.heart.hrv < 30) {
      stressFactors.push("Low HRV indicating stress");
      stressScore += 20;
    }

    // Email volume
    if (gmail?.stats?.totalReceived > 50) {
      stressFactors.push("High email volume");
      stressScore += 15;
    }

    // Calendar intensity
    if (
      calendar?.analysis?.intensity?.high > calendar?.analysis?.intensity?.low
    ) {
      stressFactors.push("High-intensity schedule");
      stressScore += 15;
    }

    // Music mood analysis
    if (spotify?.audioFeatures?.valence < 0.3) {
      stressFactors.push("Low mood music detected");
      stressScore += 10;
    }

    const level =
      stressScore < 20 ? "Low" : stressScore < 40 ? "Medium" : "High";

    return {
      level,
      score: Math.min(stressScore, 100),
      factors: stressFactors,
      recommendations: this.generateStressRecommendations(
        stressScore,
        stressFactors
      ),
    };
  }

  /**
   * Generate recovery quotient
   */
  private generateRecoveryQuotient(data: DataSources): any {
    const { scores, fitbit } = data;

    const sleepScore = this.calculateSleepRecoveryScore(fitbit?.sleep);
    const heartScore = this.calculateHeartRecoveryScore(fitbit?.heart);
    const activityScore = this.calculateActivityRecoveryScore(fitbit?.activity);

    const totalScore = (sleepScore + heartScore + activityScore) / 3;
    const readiness =
      totalScore >= 80
        ? "Excellent"
        : totalScore >= 60
        ? "Good"
        : totalScore >= 40
        ? "Fair"
        : "Poor";

    return {
      readiness,
      score: Math.round(totalScore),
      factors: [
        `Sleep recovery: ${sleepScore}/100`,
        `Heart recovery: ${heartScore}/100`,
        `Activity recovery: ${activityScore}/100`,
      ],
      recommendations: this.generateRecoveryRecommendations(totalScore),
    };
  }

  /**
   * Generate day context
   */
  private generateDayContext(data: DataSources): any {
    const { scores, calendar, weather } = data;
    const today = new Date();
    const dayName = today.toLocaleDateString("en-US", { weekday: "long" });

    return {
      dayName,
      dayType: this.getDayType(dayName, calendar),
      calendarData: calendar?.events || [],
      weatherImpact: this.analyzeWeatherImpact(weather),
      energyLevel: this.calculateEnergyLevel(scores),
      focusRecommendation: this.getFocusRecommendation(scores, calendar),
    };
  }

  /**
   * Detect anomalies in the data
   */
  private detectAnomalies(data: DataSources): any {
    const { scores, fitbit, historical } = data;
    const anomalies = [];

    // Compare with historical data
    if (historical && historical.length > 0) {
      const avgScore =
        historical.reduce((sum, h) => sum + (h.score || 0), 0) /
        historical.length;
      const scoreDeviation = Math.abs(scores.total - avgScore);

      if (scoreDeviation > 20) {
        anomalies.push({
          type: "Score Anomaly",
          description: `Current score (${
            scores.total
          }) differs significantly from average (${Math.round(avgScore)})`,
          severity: scoreDeviation > 30 ? "high" : "medium",
        });
      }
    }

    // Sleep anomalies
    if (fitbit?.sleep) {
      const sleepDuration = fitbit.sleep.duration / 60; // Convert to hours
      if (sleepDuration < 5 || sleepDuration > 10) {
        anomalies.push({
          type: "Sleep Duration Anomaly",
          description: `Unusual sleep duration: ${sleepDuration.toFixed(
            1
          )} hours`,
          severity: sleepDuration < 4 || sleepDuration > 11 ? "high" : "medium",
        });
      }
    }

    return {
      detected: anomalies,
      insights:
        anomalies.length > 0
          ? ["Significant deviations from normal patterns detected"]
          : ["No significant anomalies detected"],
    };
  }

  /**
   * Analyze environmental factors
   */
  private analyzeEnvironmentalFactors(data: DataSources): any {
    const { weather, calendar } = data;

    return {
      weather: {
        impact: this.analyzeWeatherImpact(weather),
        insight: this.generateWeatherInsight(weather),
      },
      social: {
        weekendEffect: this.getWeekendEffect(calendar),
        socialEngagement: this.analyzeSocialEngagement(calendar),
      },
      environmental: {
        season: this.getCurrentSeason(),
        daylight: this.analyzeDaylightHours(),
      },
    };
  }

  /**
   * Generate deep insights using GPT
   */
  private async generateDeepInsights(
    context: string,
    data: DataSources
  ): Promise<any> {
    try {
      const prompt = `Based on the following wellness data, provide deep insights (3-4 bullet points) that:
1. Identify hidden patterns and correlations
2. Predict potential future trends
3. Suggest personalized optimization strategies
4. Highlight unique behavioral insights

${context}

Please respond with a JSON object containing:
{
  "patterns": [{"type": "string", "description": "string", "confidence": number}],
  "insights": ["string"],
  "correlations": [{"metric1": "string", "metric2": "string", "strength": number}],
  "predictions": [{"metric": "string", "trend": "string", "confidence": number}]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.6,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          return this.generateFallbackDeepInsights(data);
        }
      }
    } catch (error) {
      console.error(
        "❌ [AIInsightsService] Error generating deep insights:",
        error
      );
    }

    return this.generateFallbackDeepInsights(data);
  }

  /**
   * Analyze trends
   */
  private analyzeTrends(data: DataSources): any {
    const { scores, historical } = data;

    if (!historical || historical.length < 3) {
      return { overall: { trend: 0, sparkline: [scores.total] } };
    }

    const recentScores = historical.slice(0, 7).map((h) => h.score || 0);
    const trend = this.calculateTrend(recentScores);

    return {
      overall: {
        trend,
        sparkline: recentScores,
      },
      sleep: this.calculateMetricTrend(historical, "sleep"),
      activity: this.calculateMetricTrend(historical, "activity"),
      heart: this.calculateMetricTrend(historical, "heart"),
      work: this.calculateMetricTrend(historical, "work"),
    };
  }

  /**
   * Calculate wellness balance
   */
  private calculateWellnessBalance(scores: any): any {
    const { sleep, activity, heart, work } = scores;
    const balance =
      Math.abs(sleep - activity) +
      Math.abs(activity - heart) +
      Math.abs(heart - work);
    const balanceScore = Math.max(0, 100 - balance);

    let level, status, color, insight;

    if (balanceScore >= 80) {
      level = "Excellent";
      status = "Well-balanced across all areas";
      color = "green";
      insight = "Your wellness metrics are beautifully balanced!";
    } else if (balanceScore >= 60) {
      level = "Good";
      status = "Mostly balanced with minor gaps";
      color = "blue";
      insight = "Good overall balance with room for minor improvements";
    } else if (balanceScore >= 40) {
      level = "Fair";
      status = "Some areas need attention";
      color = "yellow";
      insight = "Focus on bringing up your lower-scoring areas";
    } else {
      level = "Poor";
      status = "Significant imbalance detected";
      color = "red";
      insight = "Consider focusing on one area at a time for better balance";
    }

    return { level, status, color, insight };
  }

  /**
   * Generate mood and energy forecast
   */
  private async generateMoodAndEnergyForecast(
    context: string,
    data: DataSources
  ): Promise<any> {
    try {
      const prompt = `Based on the following wellness data, predict the user's mood and energy for tomorrow (2-3 sentences) that:
1. Analyzes current patterns to predict tomorrow's state
2. Considers sleep, activity, and stress factors
3. Provides actionable advice for optimization

${context}

Please respond with only the forecast text, no additional formatting.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });

      return {
        forecast:
          response.choices[0]?.message?.content ||
          this.generateFallbackMoodForecast(data),
        confidence: 0.8,
        factors: ["Sleep quality", "Activity level", "Stress indicators"],
      };
    } catch (error) {
      console.error(
        "❌ [AIInsightsService] Error generating mood forecast:",
        error
      );
      return {
        forecast: this.generateFallbackMoodForecast(data),
        confidence: 0.5,
        factors: ["Limited data available"],
      };
    }
  }

  // Helper methods
  private calculateSleepRecoveryScore(sleepData: any): number {
    if (!sleepData) return 50;

    let score = 50;
    if (sleepData.duration) {
      const hours = sleepData.duration / 60;
      if (hours >= 7 && hours <= 9) score += 30;
      else if (hours >= 6 && hours <= 10) score += 20;
      else if (hours >= 5 && hours <= 11) score += 10;
    }

    if (sleepData.efficiency) {
      if (sleepData.efficiency >= 90) score += 20;
      else if (sleepData.efficiency >= 80) score += 15;
      else if (sleepData.efficiency >= 70) score += 10;
    }

    return Math.min(score, 100);
  }

  private calculateHeartRecoveryScore(heartData: any): number {
    if (!heartData) return 50;

    let score = 50;
    if (heartData.restingHR) {
      if (heartData.restingHR <= 60) score += 30;
      else if (heartData.restingHR <= 70) score += 20;
      else if (heartData.restingHR <= 80) score += 10;
    }

    if (heartData.hrv) {
      if (heartData.hrv >= 50) score += 20;
      else if (heartData.hrv >= 40) score += 15;
      else if (heartData.hrv >= 30) score += 10;
    }

    return Math.min(score, 100);
  }

  private calculateActivityRecoveryScore(activityData: any): number {
    if (!activityData) return 50;

    let score = 50;
    if (activityData.steps) {
      if (activityData.steps >= 10000) score += 30;
      else if (activityData.steps >= 8000) score += 20;
      else if (activityData.steps >= 6000) score += 10;
    }

    if (activityData.activeMinutes) {
      if (activityData.activeMinutes >= 30) score += 20;
      else if (activityData.activeMinutes >= 20) score += 15;
      else if (activityData.activeMinutes >= 10) score += 10;
    }

    return Math.min(score, 100);
  }

  private generateStressRecommendations(
    stressScore: number,
    factors: string[]
  ): string[] {
    const recommendations = [];

    if (factors.includes("Poor sleep quality")) {
      recommendations.push(
        "Improve sleep hygiene with consistent bedtime routine"
      );
    }
    if (factors.includes("Low HRV indicating stress")) {
      recommendations.push(
        "Practice stress management - meditation or breathing exercises"
      );
    }
    if (factors.includes("High email volume")) {
      recommendations.push("Batch email processing to reduce interruptions");
    }
    if (factors.includes("High-intensity schedule")) {
      recommendations.push("Add buffer time between meetings for recovery");
    }

    return recommendations;
  }

  private generateRecoveryRecommendations(score: number): string[] {
    if (score < 40) {
      return [
        "Focus on sleep quality and stress reduction",
        "Consider light exercise or gentle movement",
      ];
    } else if (score < 60) {
      return [
        "Maintain current routine with minor improvements",
        "Add recovery activities like stretching or meditation",
      ];
    } else {
      return [
        "Continue current recovery practices",
        "Consider increasing activity intensity gradually",
      ];
    }
  }

  private getDayType(dayName: string, calendar: any): string {
    if (dayName === "Saturday" || dayName === "Sunday") return "Weekend";
    if (calendar?.analysis?.intensity?.high > 5) return "High-intensity";
    if (calendar?.analysis?.meetingTime > 4) return "Meeting-heavy";
    return "Regular";
  }

  private analyzeWeatherImpact(weather: any): string {
    if (!weather) return "neutral";
    const summary = weather.summary?.toLowerCase() || "";
    if (summary.includes("rain") || summary.includes("storm"))
      return "negative";
    if (summary.includes("sunny") || summary.includes("clear"))
      return "positive";
    return "neutral";
  }

  private calculateEnergyLevel(scores: any): string {
    const avgScore =
      (scores.sleep + scores.activity + scores.heart + scores.work) / 4;
    if (avgScore >= 80) return "High";
    if (avgScore >= 60) return "Medium";
    return "Low";
  }

  private getFocusRecommendation(scores: any, calendar: any): string {
    const lowestScore = Math.min(
      scores.sleep,
      scores.activity,
      scores.heart,
      scores.work
    );
    if (lowestScore === scores.sleep) return "Focus on improving sleep quality";
    if (lowestScore === scores.activity) return "Increase physical activity";
    if (lowestScore === scores.heart)
      return "Focus on heart health and stress management";
    return "Optimize work productivity and focus";
  }

  private getWeekendEffect(calendar: any): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6
      ? "Weekend relaxation mode"
      : "Workday intensity";
  }

  private analyzeSocialEngagement(calendar: any): string {
    const totalEvents = calendar?.analysis?.totalEvents || 0;
    if (totalEvents > 5) return "High social engagement";
    if (totalEvents > 2) return "Moderate social engagement";
    return "Low social engagement";
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "autumn";
    return "winter";
  }

  private analyzeDaylightHours(): string {
    const month = new Date().getMonth();
    if (month >= 4 && month <= 8) return "Long daylight hours";
    if (month >= 10 || month <= 1) return "Short daylight hours";
    return "Moderate daylight hours";
  }

  private generateWeatherInsight(weather: any): string {
    if (!weather) return "Weather data not available";
    const summary = weather.summary?.toLowerCase() || "";
    if (summary.includes("rain"))
      return "Rainy weather may affect mood and outdoor activity";
    if (summary.includes("sunny"))
      return "Sunny weather provides natural mood boost";
    return "Weather conditions are neutral";
  }

  private calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;
    const first = scores[0];
    const last = scores[scores.length - 1];
    return last > first ? 1 : last < first ? -1 : 0;
  }

  private calculateMetricTrend(historical: any[], metric: string): any {
    const scores = historical
      .map((h) => h.json?.scores?.[metric])
      .filter((s) => typeof s === "number");
    if (scores.length < 2) return { trend: 0, sparkline: [0] };

    const trend = this.calculateTrend(scores);
    return { trend, sparkline: scores };
  }

  // Fallback methods for when AI fails
  private generateFallbackInsights(data: DataSources): AIInsights {
    return {
      summary:
        "Your wellness data shows a balanced approach to health and productivity. Continue maintaining your current habits while focusing on areas that need improvement.",
      mantra:
        "Every day is a new opportunity to optimize your wellness and achieve your goals.",
      moodInsight:
        "Your current data patterns suggest a stable mood with room for optimization through better sleep and activity balance.",
      stressRadar: {
        level: "Medium",
        score: 50,
        factors: [],
        recommendations: [],
      },
      recoveryQuotient: {
        readiness: "Good",
        score: 70,
        factors: [],
        recommendations: [],
      },
      dayContext: {
        dayName: "Today",
        dayType: "Regular",
        calendarData: [],
        weatherImpact: "neutral",
        energyLevel: "Medium",
        focusRecommendation: "Focus on your priorities",
      },
      anomalies: {
        detected: [],
        insights: ["No significant anomalies detected"],
      },
      environmentalFactors: {
        weather: {
          impact: "neutral",
          insight: "Weather conditions are neutral",
        },
        social: { weekendEffect: "Regular day", socialEngagement: "Moderate" },
        environmental: { season: "current", daylight: "moderate" },
      },
      deepInsights: {
        patterns: [],
        insights: ["Continue monitoring your wellness patterns"],
        correlations: [],
        predictions: [],
      },
      trends: { overall: { trend: 0, sparkline: [data.scores.total] } },
      balanceLevel: "Good",
      balanceStatus: "Mostly balanced",
      balanceColor: "blue",
      balanceInsight: "Good overall balance with room for minor improvements",
      moodAndEnergy: {
        forecast:
          "Your mood and energy should remain stable with current patterns",
        confidence: 0.6,
        factors: ["Current data patterns"],
      },
    };
  }

  private generateFallbackSummary(data: DataSources): string {
    return `Your wellness score of ${data.scores.total}/100 shows ${
      data.scores.total >= 80
        ? "excellent"
        : data.scores.total >= 60
        ? "good"
        : "room for improvement in"
    } overall health and productivity. Focus on maintaining your strengths while addressing areas that need attention.`;
  }

  private generateFallbackMantra(data: DataSources): string {
    return "Every step forward is progress toward your wellness goals.";
  }

  private generateFallbackMoodInsight(data: DataSources): string {
    return "Your current data patterns suggest a stable emotional state with opportunities for optimization through better sleep and activity balance.";
  }

  private generateFallbackDeepInsights(data: DataSources): any {
    return {
      patterns: [],
      insights: [
        "Continue monitoring your wellness patterns for deeper insights",
      ],
      correlations: [],
      predictions: [],
    };
  }

  private generateFallbackMoodForecast(data: DataSources): string {
    return "Based on your current patterns, your mood and energy should remain stable tomorrow with opportunities for optimization.";
  }

  // Weekly-specific methods
  private async generateWeeklySummary(
    context: string,
    data: DataSources
  ): Promise<string> {
    return this.generateMainSummary(context, data).then((summary) =>
      summary.replace("daily", "weekly").replace("today", "this week")
    );
  }

  private async generateWeeklyMantra(
    context: string,
    data: DataSources
  ): Promise<string> {
    return this.generateDailyMantra(context, data).then((mantra) =>
      mantra.replace("day", "week").replace("today", "this week")
    );
  }

  private async generateWeeklyMoodInsight(
    context: string,
    data: DataSources
  ): Promise<string> {
    return this.generateMoodInsight(context, data).then((insight) =>
      insight.replace("current", "weekly").replace("today", "this week")
    );
  }

  private generateWeeklyStressRadar(data: DataSources): any {
    const dailyRadar = this.generateStressRadar(data);
    return {
      ...dailyRadar,
      level: dailyRadar.level + " (Weekly Average)",
      factors: [...dailyRadar.factors, "Weekly stress pattern analysis"],
    };
  }

  private generateWeeklyRecoveryQuotient(data: DataSources): any {
    const dailyQuotient = this.generateRecoveryQuotient(data);
    return {
      ...dailyQuotient,
      readiness: dailyQuotient.readiness + " (Weekly Average)",
      factors: [...dailyQuotient.factors, "Weekly recovery pattern analysis"],
    };
  }

  private generateWeeklyContext(data: DataSources): any {
    const dailyContext = this.generateDayContext(data);
    return {
      ...dailyContext,
      dayName: "This Week",
      dayType: "Weekly Analysis",
      calendarData: data.calendar?.events || [],
      weatherImpact: "weekly",
      energyLevel: this.calculateEnergyLevel(data.scores),
      focusRecommendation: "Review your weekly patterns and plan for next week",
    };
  }

  private detectWeeklyAnomalies(data: DataSources): any {
    const dailyAnomalies = this.detectAnomalies(data);
    return {
      ...dailyAnomalies,
      detected: [
        ...dailyAnomalies.detected,
        {
          type: "Weekly Pattern",
          description: "Weekly analysis completed",
          severity: "low",
        },
      ],
      insights: [
        ...dailyAnomalies.insights,
        "Weekly pattern analysis completed",
      ],
    };
  }

  private analyzeWeeklyEnvironmentalFactors(data: DataSources): any {
    const dailyFactors = this.analyzeEnvironmentalFactors(data);
    return {
      ...dailyFactors,
      environmental: {
        ...dailyFactors.environmental,
        season: this.getCurrentSeason(),
        daylight: this.analyzeDaylightHours(),
      },
    };
  }

  private async generateWeeklyDeepInsights(
    context: string,
    data: DataSources
  ): Promise<any> {
    const dailyInsights = await this.generateDeepInsights(context, data);
    return {
      ...dailyInsights,
      insights: [
        ...dailyInsights.insights,
        "Weekly pattern analysis provides deeper insights into your wellness journey",
      ],
    };
  }

  private analyzeWeeklyTrends(data: DataSources): any {
    const dailyTrends = this.analyzeTrends(data);
    return {
      ...dailyTrends,
      weekly: {
        trend: this.calculateTrend(
          data.historical?.slice(0, 7).map((h) => h.score) || []
        ),
        sparkline: data.historical?.slice(0, 7).map((h) => h.score) || [],
      },
    };
  }

  private calculateWeeklyWellnessBalance(scores: any): any {
    const dailyBalance = this.calculateWellnessBalance(scores);
    return {
      ...dailyBalance,
      level: dailyBalance.level + " (Weekly)",
      status: dailyBalance.status + " - Weekly Analysis",
      insight:
        dailyBalance.insight +
        " This weekly view shows your overall balance patterns.",
    };
  }

  private async generateWeeklyMoodAndEnergyForecast(
    context: string,
    data: DataSources
  ): Promise<any> {
    const dailyForecast = await this.generateMoodAndEnergyForecast(
      context,
      data
    );
    return {
      ...dailyForecast,
      forecast: dailyForecast.forecast.replace("tomorrow", "next week"),
      factors: [...dailyForecast.factors, "Weekly pattern analysis"],
    };
  }

  /**
   * Generate mood prediction based on sleep, heart rate, and music data
   * Adapted from newcode.tsx getPredictedMood function
   */
  async getPredictedMood(
    fitbitSleep: string,
    fitbitHeart: string,
    spotifyHistory: string,
    audioFeatures?: any
  ): Promise<string> {
    try {
      // Ensure parameters are strings and have fallback values
      const sleepData = typeof fitbitSleep === "string" ? fitbitSleep : "";
      const heartData = typeof fitbitHeart === "string" ? fitbitHeart : "";
      const musicData =
        typeof spotifyHistory === "string" ? spotifyHistory : "";

      // Parse sleep data
      const sleepMatch = sleepData.match(/(\d+)h (\d+)m/);
      const sleepHours = sleepMatch
        ? parseFloat(sleepMatch[1]) + parseFloat(sleepMatch[2]) / 60
        : 0;

      const efficiencyMatch = sleepData.match(/😴 Efficiency: (\d+)%/);
      const efficiency = efficiencyMatch ? parseInt(efficiencyMatch[1]) : 0;

      // Parse heart rate data
      const rhrMatch = heartData.match(/❤️ Resting HR: (\d+)/);
      const rhr = rhrMatch ? parseInt(rhrMatch[1]) : 65;

      // Analyze music patterns from audio features or history
      let musicEnergy = "moderate";
      if (audioFeatures) {
        // Use audio features if available
        const avgEnergy = audioFeatures.energy || 0.5;
        const avgValence = audioFeatures.valence || 0.5;

        if (avgEnergy < 0.3 && avgValence < 0.3) {
          musicEnergy = "calm";
        } else if (avgEnergy > 0.7 || avgValence > 0.7) {
          musicEnergy = "high";
        }
      } else if (musicData) {
        // Fallback to text analysis
        const history = musicData.toLowerCase();
        if (history.includes("classical") || history.includes("ambient")) {
          musicEnergy = "calm";
        } else if (history.includes("rock") || history.includes("dance")) {
          musicEnergy = "high";
        }
      }

      // Calculate mood based on data
      let mood = "";
      let confidence = "";
      let confidenceLevel = "likely"; // default

      // Calculate confidence based on data quality and extremity
      if (sleepHours > 0 && efficiency > 0 && rhr > 0) {
        // Very high confidence scenarios
        if (efficiency < 50 && sleepHours < 6) {
          confidenceLevel = "very likely";
          confidence =
            "Low sleep efficiency (" +
            efficiency +
            "%) with short duration strongly indicates fatigue.";
        } else if (efficiency > 90 && sleepHours >= 7.5) {
          confidenceLevel = "very likely";
          confidence =
            "Excellent sleep quality sets you up for peak performance.";
        }
        // Moderate confidence scenarios
        else if (efficiency > 80 && sleepHours >= 7) {
          confidenceLevel = "likely";
          confidence = "Good sleep metrics suggest stable energy levels.";
        } else if (efficiency < 70) {
          confidenceLevel = "may";
          confidence = "Sleep disruptions could affect afternoon energy.";
        }
        // Low confidence scenarios
        else {
          confidenceLevel = "might";
          confidence = "Mixed signals make prediction less certain.";
        }
      }

      // Determine mood with softer language
      if (sleepHours >= 7 && efficiency >= 85) {
        mood = "energized and focused";
      } else if (sleepHours >= 6.5 && efficiency >= 80) {
        mood = "balanced and steady";
      } else if (sleepHours < 6 || efficiency < 60) {
        mood = "some mental fog";
      } else if (efficiency < 75) {
        mood = "occasional fatigue";
      } else {
        mood = "moderate energy";
      }

      // Adjust based on heart data
      if (rhr > 65 && mood === "energized and focused") {
        mood = "alert but slightly tense";
        confidence =
          "Elevated resting heart rate (" +
          rhr +
          " bpm) may indicate mild stress.";
      } else if (rhr < 55 && mood !== "some mental fog") {
        mood = "calm and recovered";
        confidence =
          "Excellent resting heart rate (" +
          rhr +
          " bpm) shows strong recovery.";
      }

      // Build the response with appropriate confidence language
      let response = "";

      if (mood === "some mental fog" || mood === "occasional fatigue") {
        response =
          "You may experience " +
          mood +
          " today, especially in the afternoon. ";
      } else if (
        mood === "energized and focused" ||
        mood === "calm and recovered"
      ) {
        response =
          "You're " + confidenceLevel + " to feel " + mood + " today. ";
      } else {
        response = "You'll " + confidenceLevel + " have " + mood + " today. ";
      }

      response += confidence;

      // Music influence note
      if (musicEnergy === "calm" && mood.indexOf("tense") !== -1) {
        response +=
          " Your calming music choices suggest you're already managing this well.";
      } else if (musicEnergy === "high" && mood.indexOf("fog") !== -1) {
        response += " High-energy music might help counteract the fatigue.";
      }

      // Try to enhance with GPT if available
      try {
        const gptResponse = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are a wellness coach providing mood predictions. Use softer, probabilistic language. " +
                "Never say someone WILL feel something definitively. Use 'may', 'likely', 'might', or " +
                "'could' based on confidence. Always acknowledge uncertainty in predictions.",
            },
            {
              role: "user",
              content:
                "Based on this data, provide a mood prediction in ONE sentence that includes confidence level:\n" +
                "Sleep: " +
                sleepHours.toFixed(1) +
                " hours at " +
                efficiency +
                "% efficiency\n" +
                "Resting HR: " +
                rhr +
                " bpm\n" +
                "Music pattern: " +
                musicEnergy +
                "\n" +
                "Initial prediction: " +
                response +
                "\n\n" +
                "Keep it brief, conversational, and include why (based on the main factor affecting mood).",
            },
          ],
          temperature: 0.7,
          max_tokens: 100,
        });

        if (gptResponse.choices && gptResponse.choices.length > 0) {
          return gptResponse.choices[0].message.content?.trim() || response;
        }
      } catch (gptError) {
        console.log("❌ GPT mood prediction failed, using fallback:", gptError);
      }

      // Fallback to our calculated response
      return response;
    } catch (error) {
      console.error(
        "❌ [AIInsightsService] Error generating mood prediction:",
        error
      );
      return "Unable to predict mood due to insufficient data.";
    }
  }
}
