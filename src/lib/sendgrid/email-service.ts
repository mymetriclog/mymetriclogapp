import sgMail from "@sendgrid/mail";
import { SAGE_IMAGES, getSageImage } from "@/lib/constants/sage-images";
import { generateDailyReportEmail } from "./templates/daily-email-template";
import { generateWeeklyReportEmail } from "./templates/weekly-email-template";

export interface ReportEmailData {
  to: string;
  userName: string;
  reportType: "daily" | "weekly";
  reportData: any;
  reportId: string;
}

export class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async sendReportEmail(emailData: ReportEmailData): Promise<void> {
    try {
      const { to, userName, reportType, reportData, reportId } = emailData;

      const subject = this.generateSubject(reportType, userName);
      const htmlContent = this.generateHTMLContent(
        reportType,
        reportData,
        userName
      );
      const textContent = this.generateTextContent(
        reportType,
        reportData,
        userName
      );

      const msg = {
        to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || "noreply@mymetriclog.com",
          name: "MyMetricLog",
        },
        subject,
        text: textContent,
        html: htmlContent,
        customArgs: {
          reportId,
          reportType,
        },
      };

      await sgMail.send(msg);
      console.log(`✅ [EmailService] Report email sent successfully to ${to}`);
    } catch (error) {
      console.error("❌ [EmailService] Error sending report email:", error);
      throw new Error(
        `Failed to send report email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    try {
      const subject = `Welcome to MyMetricLog, ${userName}! 🎉`;
      const htmlContent = this.generateWelcomeHTML(userName);
      const textContent = this.generateWelcomeText(userName);

      const msg = {
        to: userEmail,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || "noreply@mymetriclog.com",
          name: "MyMetricLog",
        },
        subject,
        text: textContent,
        html: htmlContent,
      };

      await sgMail.send(msg);
      console.log(
        `✅ [EmailService] Welcome email sent successfully to ${userEmail}`
      );
    } catch (error) {
      console.error("❌ [EmailService] Error sending welcome email:", error);
      throw new Error(
        `Failed to send welcome email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private generateSubject(
    reportType: "daily" | "weekly",
    userName: string
  ): string {
    const date = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (reportType === "daily") {
      return `📊 Your Daily Wellness Report - ${date}`;
    } else {
      return `📈 Your Weekly Wellness Report - ${date}`;
    }
  }

  private generateHTMLContent(
    reportType: "daily" | "weekly",
    reportData: any,
    userName: string
  ): string {
    if (reportType === "daily") {
      return generateDailyReportEmail(
        reportData.fullDateStr ||
          new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        reportData.dateStr || new Date().toISOString().split("T")[0],
        reportData.scores,
        reportData.insight || reportData.aiInsights?.summary || "",
        reportData.mantra || reportData.aiInsights?.mantra || "",
        reportData.moodInsight || reportData.aiInsights?.moodInsight || "",
        reportData.weatherSummary || reportData.weather?.summary || "",
        reportData.calSummary || reportData.calendar?.summary || "",
        reportData.emailSummary || reportData.gmail?.summary || "",
        reportData.completedTasks || "",
        reportData.spotifySummary || reportData.spotify?.summary || "",
        reportData.fitbitActivity || reportData.fitbit?.activity?.summary || "",
        reportData.fitbitSleep || reportData.fitbit?.sleep?.summary || "",
        reportData.fitbitHeart || reportData.fitbit?.heart?.summary || "",
        reportData.peakHR || "",
        reportData.stressRadar || { score: 0 },
        reportData.recoveryQuotient || { score: 0 },
        reportData.dayContext || { dayName: "Today" },
        reportData.badges || { daily: [] },
        reportData.streakBadges || [],
        reportData.badgeNarrative || "",
        reportData.nearMisses || [],
        reportData.calendarAnalysis || {},
        reportData.calendarIntelligence || {},
        reportData.fitbitHRV || null,
        reportData.hourlyWeather || null,
        reportData.emailResponseAnalysis || null,
        reportData.fitbitActivityLog || "",
        reportData.audioFeatures || null
      );
    } else {
      return generateWeeklyReportEmail(
        reportData.startDate || "",
        reportData.endDate || "",
        reportData.weekStats || {},
        reportData.insight || "",
        reportData.recommendations || {},
        reportData.trends || {},
        reportData.badges || {},
        reportData.patterns || {}
      );
    }
  }

  private generateTextContent(
    reportType: "daily" | "weekly",
    reportData: any,
    userName: string
  ): string {
    const scores = reportData.scores;
    const aiInsights = reportData.aiInsights;
    const badges = reportData.badges;

    let text = `MyMetricLog ${
      reportType === "daily" ? "Daily" : "Weekly"
    } Wellness Report\n\n`;
    text += `Hello ${userName}!\n\n`;
    text += `Here's your personalized wellness report for ${new Date().toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    )}.\n\n`;

    text += `SCORES:\n`;
    text += `Overall: ${scores?.total || 0}/100\n`;
    text += `Sleep: ${scores?.sleep || 0}/100\n`;
    text += `Activity: ${scores?.activity || 0}/100\n`;
    text += `Heart: ${scores?.heart || 0}/100\n`;
    text += `Work: ${scores?.work || 0}/100\n\n`;

    if (aiInsights?.summary) {
      text += `AI INSIGHTS:\n${aiInsights.summary}\n\n`;
    }

    if (badges?.daily && badges.daily.length > 0) {
      text += `BADGES EARNED:\n`;
      badges.daily.forEach((badge: any) => {
        text += `${badge.emoji} ${badge.name}\n`;
      });
      text += `\n`;
    }

    text += `View your full dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\n`;
    text += `Keep up the great work on your wellness journey! 🌟\n`;
    text += `MyMetricLog - Your Personal Wellness Companion`;

    return text;
  }

  private generateWelcomeHTML(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to MyMetricLog</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .content { padding: 40px; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${getSageImage(
              "greeting"
            )}" alt="Sage Welcome" style="width: 100px; height: 100px; margin-bottom: 20px; border-radius: 50%;">
            <h1>🎉 Welcome to MyMetricLog!</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Welcome to MyMetricLog, your personal wellness companion! We're excited to help you track and optimize your daily wellness journey.</p>
            
            <p>With MyMetricLog, you can:</p>
            <ul>
              <li>📊 Track your daily wellness scores across sleep, activity, heart health, and work productivity</li>
              <li>🤖 Get AI-powered insights and personalized recommendations</li>
              <li>🏆 Earn badges and achievements for your wellness milestones</li>
              <li>📈 Monitor trends and patterns in your wellness data</li>
              <li>📧 Receive daily and weekly wellness reports via email</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/dashboard" class="cta-button">
                Get Started
              </a>
            </div>

            <p>Ready to start your wellness journey? Let's begin by connecting your first integration!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeText(userName: string): string {
    return `Welcome to MyMetricLog!

Hello ${userName}!

Welcome to MyMetricLog, your personal wellness companion! We're excited to help you track and optimize your daily wellness journey.

With MyMetricLog, you can:
- Track your daily wellness scores across sleep, activity, heart health, and work productivity
- Get AI-powered insights and personalized recommendations
- Earn badges and achievements for your wellness milestones
- Monitor trends and patterns in your wellness data
- Receive daily and weekly wellness reports via email

Get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Ready to start your wellness journey? Let's begin by connecting your first integration!

MyMetricLog - Your Personal Wellness Companion`;
  }

  // Helper methods for detailed email generation (like newcode.tsx)
  private getMainScoreColor(score: number): string {
    if (score >= 90) return "#0f9d58"; // Green
    if (score >= 80) return "#f9ab00"; // Yellow
    if (score >= 70) return "#ff9800"; // Orange
    if (score >= 60) return "#f44336"; // Red
    return "#9e9e9e"; // Gray
  }

  private generateEnhancedBar(
    score: number,
    isInverted: boolean = false
  ): string {
    const percentage = Math.min(Math.max(score, 0), 100);
    const color = this.getMainScoreColor(score);

    return `
      <div style="display:inline-block; width:100px; height:8px; background:#e0e0e0; border-radius:4px; margin:0 8px; vertical-align:middle; overflow:hidden;">
        <div style="width:${percentage}%; height:100%; background:${color}; border-radius:4px; transition:width 0.3s ease;"></div>
      </div>
    `;
  }

  private generateStatusTag(
    label: string,
    score: number,
    isPercent: boolean = false
  ): string {
    let status = "";
    let color = "#666";

    if (score >= 95) {
      status = "AMAZING";
      color = "#0f9d58";
    } else if (score >= 90) {
      status = "EXCELLENT";
      color = "#0f9d58";
    } else if (score >= 80) {
      status = "GOOD";
      color = "#f9ab00";
    } else if (score >= 70) {
      status = "FAIR";
      color = "#ff9800";
    } else if (score >= 60) {
      status = "NEEDS WORK";
      color = "#f44336";
    } else {
      status = "POOR";
      color = "#f44336";
    }

    return `
      <span style="background:${color}; color:white; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600; margin-left:8px; vertical-align:middle;">
        ${status}
      </span>
    `;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
