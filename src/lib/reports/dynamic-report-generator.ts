import { getServerSupabaseClient } from "@/lib/supabase/server";
import { EmailService } from "@/lib/sendgrid/email-service";
import { FitbitService } from "@/lib/integrations/fitbit";
import { SpotifyService } from "@/lib/integrations/spotify";
import { GmailService } from "@/lib/integrations/gmail";
import { GoogleCalendarService } from "@/lib/integrations/google-calendar";
import { WeatherService } from "@/lib/weather/weather-service";
import { WellnessScoringService } from "@/lib/scoring/wellness-scoring";
import { BadgeService } from "@/lib/badges/badge-service";
import { AIInsightsService } from "@/lib/ai/ai-insights-service";
import { getSageImage } from "@/lib/constants/sage-images";

export interface UserReportData {
  userId: string;
  userEmail: string;
  userName: string;
  date: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
}

export interface GeneratedReport {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  date: string;
  kind: "daily" | "weekly";
  score: number;
  html: string;
  json: any;
  ai_insights?: any;
  created_at: string;
  // Comprehensive data fields
  gpt_summary?: string;
  mantra?: string;
  moodInsight?: string;
  weatherSummary?: string;
  calSummary?: string;
  emailSummary?: string;
  completedTasks?: string;
  spotifySummary?: string;
  spotifyInsights?: any;
  fitbitActivity?: any;
  fitbitSleep?: any;
  fitbitHeart?: any;
  peakHR?: number;
  stressRadar?: any;
  recoveryQuotient?: any;
  dayContext?: any;
  badges?: any[];
  streakBadges?: any[];
  badgeNarrative?: string;
  nearMisses?: any[];
  calendarAnalysis?: any;
  calendarIntelligence?: any;
  fitbitHRV?: any;
  hourlyWeather?: any;
  emailResponseAnalysis?: any;
  fitbitActivityLog?: any;
  audioFeatures?: any;
  anomalies?: any;
  environmentalFactors?: any;
  deepInsights?: any;
  trends?: any;
  historicalData?: any[];
  balanceLevel?: string;
  balanceStatus?: string;
  balanceColor?: string;
  balanceInsight?: string;
  aiMoodAndEnergy?: any;
}

export class DynamicReportGenerator {
  private emailService: EmailService;
  private fitbitService: FitbitService;
  private spotifyService: SpotifyService;
  private gmailService: GmailService;
  private calendarService: GoogleCalendarService;
  private weatherService: WeatherService;
  private scoringService: WellnessScoringService;
  private badgeService: BadgeService;
  private aiService: AIInsightsService;

  constructor() {
    this.emailService = new EmailService();
    this.fitbitService = new FitbitService();
    this.spotifyService = new SpotifyService();
    this.gmailService = new GmailService();
    this.calendarService = new GoogleCalendarService();
    this.weatherService = new WeatherService();
    this.scoringService = new WellnessScoringService();
    this.badgeService = new BadgeService();
    this.aiService = new AIInsightsService();
  }

  /**
   * Generate a comprehensive daily report for a user
   */
  async generateDailyReport(
    userData: UserReportData
  ): Promise<GeneratedReport> {
    try {
      console.log(
        `🧠 [DynamicReportGenerator] Starting daily report for user: ${userData.userEmail}`
      );

      const {
        userId,
        userEmail,
        userName,
        date,
        timezone,
        latitude,
        longitude,
      } = userData;
      const reportDate = new Date(date);
      const yesterday = new Date(reportDate.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(reportDate.getTime() - 48 * 60 * 60 * 1000);

      // Fetch data from all integrations concurrently
      const [
        fitbitData,
        spotifyData,
        gmailData,
        calendarData,
        weatherData,
        historicalData,
      ] = await Promise.all([
        this.fetchFitbitData(userId, yesterday),
        this.fetchSpotifyData(userId, yesterday),
        this.fetchGmailData(userId, twoDaysAgo, yesterday),
        this.fetchCalendarData(userId, twoDaysAgo, yesterday),
        this.fetchWeatherData(latitude, longitude, timezone, yesterday),
        this.fetchHistoricalData(userId, 30), // Last 30 days
      ]);

      // Calculate comprehensive scores
      const scores = await this.scoringService.calculateDailyScores({
        fitbit: fitbitData,
        spotify: spotifyData,
        gmail: gmailData,
        calendar: calendarData,
        weather: weatherData,
        historical: historicalData,
      });

      // Generate AI insights
      const aiInsights = await this.aiService.generateDailyInsights({
        scores,
        fitbit: fitbitData,
        spotify: spotifyData,
        gmail: gmailData,
        calendar: calendarData,
        weather: weatherData,
        historical: historicalData,
      });

      // Calculate badges and achievements
      const badges = await this.badgeService.calculateDailyBadges({
        scores,
        fitbit: fitbitData,
        spotify: spotifyData,
        gmail: gmailData,
        calendar: calendarData,
        historical: historicalData,
      });

      // Generate comprehensive report data
      const reportData = {
        id: `daily-${userId}-${date}`,
        userId,
        userEmail,
        userName,
        date,
        kind: "daily" as const,
        score: scores.total,
        html: this.generateHTMLReport(scores, aiInsights, badges),
        json: {
          scores,
          aiInsights,
          badges,
          fitbit: fitbitData,
          spotify: spotifyData,
          gmail: gmailData,
          calendar: calendarData,
          weather: weatherData,
          historical: historicalData,
        },
        ai_insights: aiInsights,
        created_at: new Date().toISOString(),
        // Comprehensive data fields
        gpt_summary: aiInsights.summary,
        mantra: aiInsights.mantra,
        moodInsight: aiInsights.moodInsight,
        weatherSummary: weatherData.summary,
        calSummary: calendarData.summary,
        emailSummary: gmailData.summary,
        completedTasks: Array.isArray(gmailData.completedTasks)
          ? gmailData.completedTasks.join(", ")
          : gmailData.completedTasks || "",
        spotifySummary: spotifyData.summary,
        spotifyInsights: spotifyData.insights,
        fitbitActivity: fitbitData.activity,
        fitbitSleep: fitbitData.sleep,
        fitbitHeart: fitbitData.heart,
        peakHR: (fitbitData as any).peakHR || 0,
        stressRadar: aiInsights.stressRadar,
        recoveryQuotient: aiInsights.recoveryQuotient,
        dayContext: aiInsights.dayContext,
        badges: badges.daily,
        streakBadges: badges.streak,
        badgeNarrative: badges.narrative,
        nearMisses: badges.nearMisses,
        calendarAnalysis: calendarData.analysis,
        calendarIntelligence: calendarData.intelligence,
        fitbitHRV: fitbitData.hrv,
        hourlyWeather: weatherData.hourly,
        emailResponseAnalysis: gmailData.responseAnalysis,
        fitbitActivityLog: fitbitData.activityLog,
        audioFeatures: spotifyData.audioFeatures,
        anomalies: aiInsights.anomalies,
        environmentalFactors: aiInsights.environmentalFactors,
        deepInsights: aiInsights.deepInsights,
        trends: aiInsights.trends,
        historicalData: historicalData,
        balanceLevel: aiInsights.balanceLevel,
        balanceStatus: aiInsights.balanceStatus,
        balanceColor: aiInsights.balanceColor,
        balanceInsight: aiInsights.balanceInsight,
        aiMoodAndEnergy: aiInsights.moodAndEnergy,
      };

      // Save report to database
      await this.saveReportToDatabase(reportData);

      // Send email notification
      await this.sendReportEmail(userData, reportData);

      console.log(
        `✅ [DynamicReportGenerator] Daily report generated successfully for ${userEmail}`
      );
      return reportData;
    } catch (error) {
      console.error(
        `❌ [DynamicReportGenerator] Error generating daily report:`,
        error
      );
      throw new Error(
        `Failed to generate daily report: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate a comprehensive weekly report for a user
   */
  async generateWeeklyReport(
    userData: UserReportData
  ): Promise<GeneratedReport> {
    try {
      console.log(
        `🧠 [DynamicReportGenerator] Starting weekly report for user: ${userData.userEmail}`
      );

      const {
        userId,
        userEmail,
        userName,
        date,
        timezone,
        latitude,
        longitude,
      } = userData;
      const reportDate = new Date(date);
      const weekStart = new Date(reportDate);
      weekStart.setDate(reportDate.getDate() - 7);
      const weekEnd = new Date(reportDate);

      // Fetch weekly data from all integrations
      const [
        fitbitData,
        spotifyData,
        gmailData,
        calendarData,
        weatherData,
        historicalData,
      ] = await Promise.all([
        this.fetchFitbitWeeklyData(userId, weekStart, weekEnd),
        this.fetchSpotifyWeeklyData(userId, weekStart, weekEnd),
        this.fetchGmailWeeklyData(userId, weekStart, weekEnd),
        this.fetchCalendarWeeklyData(userId, weekStart, weekEnd),
        this.fetchWeatherWeeklyData(
          latitude,
          longitude,
          timezone,
          weekStart,
          weekEnd
        ),
        this.fetchHistoricalData(userId, 90), // Last 90 days for weekly analysis
      ]);

      // Calculate weekly scores and trends
      const scores = await this.scoringService.calculateWeeklyScores({
        fitbit: fitbitData,
        spotify: spotifyData,
        gmail: gmailData,
        calendar: calendarData,
        weather: weatherData,
        historical: historicalData,
      });

      // Generate weekly AI insights
      const aiInsights = await this.aiService.generateWeeklyInsights({
        scores,
        fitbit: fitbitData,
        spotify: spotifyData,
        gmail: gmailData,
        calendar: calendarData,
        weather: weatherData,
        historical: historicalData,
      });

      // Calculate weekly badges
      const badges = await this.badgeService.calculateWeeklyBadges({
        scores,
        fitbit: fitbitData,
        spotify: spotifyData,
        gmail: gmailData,
        calendar: calendarData,
        historical: historicalData,
      });

      // Generate comprehensive weekly report data
      const reportData = {
        id: `weekly-${userId}-${date}`,
        userId,
        userEmail,
        userName,
        date,
        kind: "weekly" as const,
        score: scores.total,
        html: this.generateWeeklyHTMLReport(scores, aiInsights, badges),
        json: {
          scores,
          aiInsights,
          badges,
          fitbit: fitbitData,
          spotify: spotifyData,
          gmail: gmailData,
          calendar: calendarData,
          weather: weatherData,
          historical: historicalData,
        },
        ai_insights: aiInsights,
        created_at: new Date().toISOString(),
        // Weekly-specific fields
        gpt_summary: aiInsights.summary,
        mantra: aiInsights.mantra,
        moodInsight: aiInsights.moodInsight,
        weatherSummary: weatherData.summary,
        calSummary: calendarData.summary,
        emailSummary: gmailData.summary,
        completedTasks: Array.isArray(gmailData.completedTasks)
          ? gmailData.completedTasks.join(", ")
          : gmailData.completedTasks || "",
        spotifySummary: spotifyData.summary,
        spotifyInsights: spotifyData.insights,
        fitbitActivity: fitbitData.activity,
        fitbitSleep: fitbitData.sleep,
        fitbitHeart: fitbitData.heart,
        peakHR: (fitbitData as any).peakHR || 0,
        stressRadar: aiInsights.stressRadar,
        recoveryQuotient: aiInsights.recoveryQuotient,
        dayContext: aiInsights.dayContext,
        badges: badges.daily,
        streakBadges: badges.streak,
        badgeNarrative: badges.narrative,
        nearMisses: badges.nearMisses,
        calendarAnalysis: calendarData.analysis,
        calendarIntelligence: calendarData.intelligence,
        fitbitHRV: fitbitData.hrv,
        hourlyWeather: weatherData.hourly,
        emailResponseAnalysis: gmailData.responseAnalysis,
        fitbitActivityLog: fitbitData.activityLog,
        audioFeatures: spotifyData.audioFeatures,
        anomalies: aiInsights.anomalies,
        environmentalFactors: aiInsights.environmentalFactors,
        deepInsights: aiInsights.deepInsights,
        trends: aiInsights.trends,
        historicalData: historicalData,
        balanceLevel: aiInsights.balanceLevel,
        balanceStatus: aiInsights.balanceStatus,
        balanceColor: aiInsights.balanceColor,
        balanceInsight: aiInsights.balanceInsight,
        aiMoodAndEnergy: aiInsights.moodAndEnergy,
      };

      // Save report to database
      await this.saveReportToDatabase(reportData);

      // Send email notification
      await this.sendReportEmail(userData, reportData);

      console.log(
        `✅ [DynamicReportGenerator] Weekly report generated successfully for ${userEmail}`
      );
      return reportData;
    } catch (error) {
      console.error(
        `❌ [DynamicReportGenerator] Error generating weekly report:`,
        error
      );
      throw new Error(
        `Failed to generate weekly report: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Private helper methods for data fetching
  private async fetchFitbitData(userId: string, date: Date) {
    return await this.fitbitService.getDailyData(userId, date);
  }

  private async fetchSpotifyData(userId: string, date: Date) {
    return await this.spotifyService.getDailyData(userId, date);
  }

  private async fetchGmailData(userId: string, startDate: Date, endDate: Date) {
    return await this.gmailService.getDailyData(userId, startDate, endDate);
  }

  private async fetchCalendarData(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await this.calendarService.getDailyData(userId, startDate, endDate);
  }

  private async fetchWeatherData(
    lat: number | undefined,
    lon: number | undefined,
    timezone: string,
    date: Date
  ) {
    return await this.weatherService.getDailyData(lat, lon, timezone, date);
  }

  private async fetchHistoricalData(userId: string, days: number) {
    const supabase = await getServerSupabaseClient();
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .gte(
        "created_at",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("created_at", { ascending: false });

    return data || [];
  }

  // Weekly data fetching methods
  private async fetchFitbitWeeklyData(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await this.fitbitService.getWeeklyData(userId, startDate, endDate);
  }

  private async fetchSpotifyWeeklyData(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await this.spotifyService.getWeeklyData(userId, startDate, endDate);
  }

  private async fetchGmailWeeklyData(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await this.gmailService.getWeeklyData(userId, startDate, endDate);
  }

  private async fetchCalendarWeeklyData(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await this.calendarService.getWeeklyData(userId, startDate, endDate);
  }

  private async fetchWeatherWeeklyData(
    lat: number | undefined,
    lon: number | undefined,
    timezone: string,
    startDate: Date,
    endDate: Date
  ) {
    return await this.weatherService.getWeeklyData(
      lat,
      lon,
      timezone,
      startDate,
      endDate
    );
  }

  // Database operations
  private async saveReportToDatabase(reportData: GeneratedReport) {
    const supabase = await getServerSupabaseClient();

    const { error } = await supabase.from("reports").upsert({
      id: reportData.id,
      user_id: reportData.userId,
      user_email: reportData.userEmail,
      user_name: reportData.userName,
      report_date: reportData.date,
      report_type: reportData.kind,
      score: reportData.score,
      html: reportData.html,
      report_data: reportData.json,
      ai_insights: reportData.ai_insights,
      created_at: reportData.created_at,
    });

    if (error) {
      throw new Error(`Failed to save report to database: ${error.message}`);
    }
  }

  // Email operations
  private async sendReportEmail(
    userData: UserReportData,
    reportData: GeneratedReport
  ) {
    try {
      await this.emailService.sendReportEmail({
        to: userData.userEmail,
        userName: userData.userName,
        reportType: reportData.kind,
        reportData: reportData.json,
        reportId: reportData.id,
      });
    } catch (error) {
      console.error(`❌ [DynamicReportGenerator] Failed to send email:`, error);
      // Don't throw error here as report generation should still succeed
    }
  }

  // HTML generation methods
  private generateHTMLReport(
    scores: any,
    aiInsights: any,
    badges: any
  ): string {
    // This would use the existing HTML generation logic from newcode.tsx
    // For now, return a basic HTML structure with SAGE_IMAGES
    return `
      <div class="report-container">
        <div class="header">
          <img src="${getSageImage(
            "greeting"
          )}" alt="Sage" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 50%;">
          <h1>Daily Wellness Report</h1>
        </div>
        <div class="scores">
          <div class="score-item">
            <img src="${getSageImage(
              "analysis"
            )}" alt="Analysis" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
            Overall: ${scores.total}/100
          </div>
          <div class="score-item">
            <img src="${getSageImage(
              "sleep"
            )}" alt="Sleep" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
            Sleep: ${scores.sleep}/100
          </div>
          <div class="score-item">
            <img src="${getSageImage(
              "active"
            )}" alt="Activity" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
            Activity: ${scores.activity}/100
          </div>
          <div class="score-item">
            <img src="${getSageImage(
              "heart"
            )}" alt="Heart" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
            Heart: ${scores.heart}/100
          </div>
          <div class="score-item">
            <img src="${getSageImage(
              "working"
            )}" alt="Work" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
            Work: ${scores.work}/100
          </div>
        </div>
        <div class="insights">
          <img src="${getSageImage(
            "analysis"
          )}" alt="AI Analysis" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
          <h2>AI Insights</h2>
          <p>${aiInsights.summary}</p>
        </div>
        <div class="badges">
          <img src="${getSageImage(
            "quickwin"
          )}" alt="Badges" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
          <h2>Badges Earned</h2>
          <div class="badge-list">
            ${badges.daily
              .map((badge: any) => `<span class="badge">${badge.name}</span>`)
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  private generateWeeklyHTMLReport(
    scores: any,
    aiInsights: any,
    badges: any
  ): string {
    // Similar to daily but with weekly-specific content and SAGE_IMAGES
    return `
      <div class="report-container">
        <div class="header">
          <img src="${getSageImage(
            "greeting"
          )}" alt="Sage" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 50%;">
          <h1>Weekly Wellness Report</h1>
        </div>
        <div class="scores">
          <div class="score-item">
            <img src="${getSageImage(
              "analysis"
            )}" alt="Analysis" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
            Overall: ${scores.total}/100
          </div>
          <div class="score-item">
            <img src="${getSageImage(
              "sleep"
            )}" alt="Sleep" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
            Sleep: ${scores.sleep}/100
          </div>
          <div class="score-item">
            <img src="${getSageImage(
              "active"
            )}" alt="Activity" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
            Activity: ${scores.activity}/100
          </div>
          <div class="score-item">
            <img src="${getSageImage(
              "heart"
            )}" alt="Heart" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
            Heart: ${scores.heart}/100
          </div>
          <div class="score-item">
            <img src="${getSageImage(
              "working"
            )}" alt="Work" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
            Work: ${scores.work}/100
          </div>
        </div>
        <div class="insights">
          <img src="${getSageImage(
            "analysis"
          )}" alt="AI Analysis" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
          <h2>Weekly AI Insights</h2>
          <p>${aiInsights.summary}</p>
        </div>
        <div class="badges">
          <img src="${getSageImage(
            "quickwin"
          )}" alt="Badges" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
          <h2>Weekly Badges</h2>
          <div class="badge-list">
            ${badges.daily
              .map((badge: any) => `<span class="badge">${badge.name}</span>`)
              .join("")}
          </div>
        </div>
      </div>
    `;
  }
}
