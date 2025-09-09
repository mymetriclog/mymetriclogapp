// SendGrid Client
export { initializeSendGrid, sendEmail, verifyEmail } from "./client";

// Email Service
export { EmailService } from "./email-service";

// Email Templates
export {
  generateDailyReportEmail,
  type DailyReportData,
} from "./templates/daily-email-template";

export {
  generateWeeklyReportEmail,
  type WeeklyReportData,
} from "./templates/weekly-email-template";

// Test Panel Component
export { EmailTestPanel } from "../../components/reports/email-test-panel";
