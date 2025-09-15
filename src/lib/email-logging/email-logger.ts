import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

export interface EmailLogData {
  user_id: string;
  recipient_email: string;
  sender_email: string;
  email_type: "daily_report" | "weekly_report";
  subject: string;
  status: "pending" | "sent" | "failed";
  report_date: string;
  report_type: "daily" | "weekly";
  metadata?: any;
}

export interface EmailLogResult {
  success: boolean;
  logId?: string;
  error?: string;
}

export interface EmailLogsResult {
  success: boolean;
  logs?: any[];
  error?: string;
  message?: string;
}

export class EmailLogger {
  /**
   * Log an email attempt to the database
   */
  static async logEmail(logData: EmailLogData): Promise<EmailLogResult> {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      const { data, error } = await supabase
        .from("email_logs")
        .insert([
          {
            user_id: logData.user_id,
            recipient_email: logData.recipient_email,
            sender_email: logData.sender_email,
            email_type: logData.email_type,
            subject: logData.subject,
            status: logData.status,
            report_date: logData.report_date,
            report_type: logData.report_type,
            metadata: logData.metadata,
            created_at: new Date().toISOString(),
          },
        ])
        .select("id")
        .single();

      if (error) {
        console.error("❌ [EmailLogger] Error logging email:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        logId: data.id,
      };
    } catch (error) {
      console.error("❌ [EmailLogger] Error logging email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update email status
   */
  static async updateEmailStatus(
    logId: string,
    status: "sent" | "failed",
    errorMessage?: string
  ): Promise<EmailLogResult> {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "failed" && errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from("email_logs")
        .update(updateData)
        .eq("id", logId);

      if (error) {
        console.error("❌ [EmailLogger] Error updating email status:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ [EmailLogger] Error updating email status:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update email message ID
   */
  static async updateEmailMessageId(
    logId: string,
    messageId: string
  ): Promise<EmailLogResult> {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      const { error } = await supabase
        .from("email_logs")
        .update({
          message_id: messageId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", logId);

      if (error) {
        console.error("❌ [EmailLogger] Error updating message ID:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ [EmailLogger] Error updating message ID:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get email logs for a user
   */
  static async getUserEmailLogs(
    userId: string,
    limit: number = 50
  ): Promise<EmailLogsResult> {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("❌ [EmailLogger] Error fetching email logs:", error);
        return {
          success: false,
          error: error.message,
          message: "Failed to fetch email logs",
        };
      }

      return {
        success: true,
        logs: data || [],
        message: `Found ${data?.length || 0} email logs`,
      };
    } catch (error) {
      console.error("❌ [EmailLogger] Error fetching email logs:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch email logs",
      };
    }
  }
}
