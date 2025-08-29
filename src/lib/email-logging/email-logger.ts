import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

export interface EmailLogData {
  user_id: string;
  recipient_email: string;
  sender_email: string;
  email_type: "daily_report" | "weekly_report" | "verification" | "custom";
  subject: string;
  message_id?: string;
  status: "pending" | "sent" | "delivered" | "failed" | "bounced";
  report_date?: string;
  report_type?: "daily" | "weekly";
  failure_reason?: string;
  metadata?: any;
}

export class EmailLogger {
  /**
   * Log email activity to database
   */
  static async logEmail(logData: EmailLogData) {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      const { data, error } = await supabase
        .from("email_logs")
        .insert([logData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to log email: ${error.message}`);
      }

      return {
        success: true,
        logId: data.id,
        message: "Email logged successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to log email",
      };
    }
  }

  /**
   * Update email status
   */
  static async updateEmailStatus(
    logId: string,
    status: "sent" | "delivered" | "failed" | "bounced",
    failure_reason?: string
  ) {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === "failed" || status === "bounced") {
        updateData.failed_at = new Date().toISOString();
        updateData.failure_reason = failure_reason;
      }

      const { data, error } = await supabase
        .from("email_logs")
        .update(updateData)
        .eq("id", logId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update email status: ${error.message}`);
      }

      return {
        success: true,
        message: "Email status updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to update email status",
      };
    }
  }

  /**
   * Update email with message ID
   */
  static async updateEmailMessageId(logId: string, messageId: string) {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      const { data, error } = await supabase
        .from("email_logs")
        .update({
          message_id: messageId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", logId)
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to update message ID in database:`, error);
        throw new Error(`Failed to update message ID: ${error.message}`);
      }

      console.log(`✅ Message ID updated successfully: ${messageId}`);
      return {
        success: true,
        message: "Message ID updated successfully",
      };
    } catch (error) {
      console.error(`❌ Message ID update failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to update message ID",
      };
    }
  }

  /**
   * Get email logs for a user
   */
  static async getUserEmailLogs(userId: string, limit: number = 50) {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .eq("user_id", userId)
        .order("sent_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch email logs: ${error.message}`);
      }

      return {
        success: true,
        logs: data || [],
        message: "Email logs fetched successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch email logs",
      };
    }
  }

  /**
   * Get email statistics for a user
   */
  static async getUserEmailStats(userId: string) {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      const { data, error } = await supabase
        .from("email_logs")
        .select("status, email_type, sent_at")
        .eq("user_id", userId);

      if (error) {
        throw new Error(`Failed to fetch email stats: ${error.message}`);
      }

      const stats = {
        total: data?.length || 0,
        sent: data?.filter((log: any) => log.status === "sent").length || 0,
        delivered:
          data?.filter((log: any) => log.status === "delivered").length || 0,
        failed: data?.filter((log: any) => log.status === "failed").length || 0,
        bounced:
          data?.filter((log: any) => log.status === "bounced").length || 0,
        dailyReports:
          data?.filter((log: any) => log.email_type === "daily_report")
            .length || 0,
        weeklyReports:
          data?.filter((log: any) => log.email_type === "weekly_report")
            .length || 0,
        verifications:
          data?.filter((log: any) => log.email_type === "verification")
            .length || 0,
      };

      return {
        success: true,
        stats,
        message: "Email statistics fetched successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch email statistics",
      };
    }
  }
}
