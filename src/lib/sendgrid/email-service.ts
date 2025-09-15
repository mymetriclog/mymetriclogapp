import sgMail from "@sendgrid/mail";
import { SAGE_IMAGES, getSageImage } from "@/lib/constants/sage-images";

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
    const scores = reportData.scores;
    const aiInsights = reportData.aiInsights;
    const badges = reportData.badges;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MyMetricLog ${
          reportType === "daily" ? "Daily" : "Weekly"
        } Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 20px; margin: 30px 0; }
          .score-card { background: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #667eea; }
          .score-value { font-size: 32px; font-weight: 700; color: #667eea; margin: 0; }
          .score-label { font-size: 14px; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .insights { background: #f1f5f9; border-radius: 8px; padding: 25px; margin: 30px 0; }
          .insights h3 { margin: 0 0 15px 0; color: #1e293b; font-size: 20px; }
          .insights p { margin: 0; color: #475569; line-height: 1.7; }
          .badges { margin: 30px 0; }
          .badges h3 { margin: 0 0 15px 0; color: #1e293b; font-size: 20px; }
          .badge-list { display: flex; flex-wrap: wrap; gap: 10px; }
          .badge { background: #667eea; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${getSageImage(
              "greeting"
            )}" alt="Sage" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 50%;">
            <h1>📊 MyMetricLog</h1>
            <p>Your ${
              reportType === "daily" ? "Daily" : "Weekly"
            } Wellness Report</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName}! 👋</h2>
            <p>Here's your personalized wellness report for ${new Date().toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}.</p>

            <div class="score-grid">
              <div class="score-card">
                <img src="${getSageImage(
                  "analysis"
                )}" alt="Analysis" style="width: 40px; height: 40px; margin-bottom: 10px;">
                <div class="score-value">${scores?.total || 0}</div>
                <div class="score-label">Overall</div>
              </div>
              <div class="score-card">
                <img src="${getSageImage(
                  "sleep"
                )}" alt="Sleep" style="width: 40px; height: 40px; margin-bottom: 10px;">
                <div class="score-value">${scores?.sleep || 0}</div>
                <div class="score-label">Sleep</div>
              </div>
              <div class="score-card">
                <img src="${getSageImage(
                  "active"
                )}" alt="Activity" style="width: 40px; height: 40px; margin-bottom: 10px;">
                <div class="score-value">${scores?.activity || 0}</div>
                <div class="score-label">Activity</div>
              </div>
              <div class="score-card">
                <img src="${getSageImage(
                  "heart"
                )}" alt="Heart" style="width: 40px; height: 40px; margin-bottom: 10px;">
                <div class="score-value">${scores?.heart || 0}</div>
                <div class="score-label">Heart</div>
              </div>
              <div class="score-card">
                <img src="${getSageImage(
                  "working"
                )}" alt="Work" style="width: 40px; height: 40px; margin-bottom: 10px;">
                <div class="score-value">${scores?.work || 0}</div>
                <div class="score-label">Work</div>
              </div>
            </div>

            ${
              aiInsights?.summary
                ? `
              <div class="insights">
                <img src="${getSageImage(
                  "analysis"
                )}" alt="AI Analysis" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
                <h3 style="display: inline-block; margin: 0;">AI Insights</h3>
                <p>${aiInsights.summary}</p>
              </div>
            `
                : ""
            }

            ${
              badges?.daily && badges.daily.length > 0
                ? `
              <div class="badges">
                <img src="${getSageImage(
                  "quickwin"
                )}" alt="Badges" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 10px;">
                <h3 style="display: inline-block; margin: 0;">Badges Earned</h3>
                <div class="badge-list">
                  ${badges.daily
                    .map(
                      (badge: any) =>
                        `<span class="badge">${badge.emoji} ${badge.name}</span>`
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }

            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/dashboard" class="cta-button">
                View Full Dashboard
              </a>
            </div>
          </div>

          <div class="footer">
            <p>Keep up the great work on your wellness journey! 🌟</p>
            <p>MyMetricLog - Your Personal Wellness Companion</p>
          </div>
        </div>
      </body>
      </html>
    `;
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
}
