// SendGrid Client
export { initializeSendGrid, sendEmail, verifyEmail } from "./client";

// Email Service
export { EmailService } from "./email-service";

// Email Templates
export {
  generateDailyReportEmail,
  type DailyReportData,
} from "./templates/daily-report";

export {
  generateWeeklyReportEmail,
  type WeeklyReportData,
} from "./templates/weekly-report";

// Test Panel Component
export { EmailTestPanel } from "../../components/reports/email-test-panel";
