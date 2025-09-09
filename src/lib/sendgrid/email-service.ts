import {
  sendEmail,
  initializeSendGrid,
  testSendGridConnection,
} from "./client";

// Re-export sendEmail for direct use
export { sendEmail };
import {
  generateDailyReportEmail,
  DailyReportData,
} from "./templates/daily-email-template";

// Initialize SendGrid when this module is imported
try {
  initializeSendGrid();
} catch (error) {
  // SendGrid not initialized
}

export class EmailService {
  /**
   * Send a daily report email
   */
  static async sendDailyReport(
    to: string,
    data: DailyReportData,
    subject?: string
  ) {
    try {
      const htmlContent = generateDailyReportEmail(data);
      const emailSubject = subject || `Daily Wellness Report - ${data.date}`;

      const result = await sendEmail(to, emailSubject, htmlContent);

      return {
        success: true,
        messageId: result.messageId,
        message: "Daily report email sent successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to send daily report email",
      };
    }
  }

  /**
   * Test SendGrid connection
   */
  static async testConnection() {
    try {
      const result = await testSendGridConnection();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to test SendGrid connection",
      };
    }
  }
}
