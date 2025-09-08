import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

export interface ReconnectionInfo {
  provider: string;
  reconnectUrl: string;
  requestedAt: string;
}

export interface UserReconnectionData {
  userId: string;
  userEmail: string;
  integrations: ReconnectionInfo[];
  totalIntegrations: number;
}

export class AutoReconnectService {
  /**
   * Get all users who have integrations that need reconnection
   */
  static async getUsersNeedingReconnection(): Promise<UserReconnectionData[]> {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      // Get all integration tokens that need reconnection
      const { data: integrations, error } = await supabase
        .from("integration_tokens")
        .select(
          `
          user_id,
          provider,
          created_at,
          users!inner(email)
        `
        )
        .eq("needs_reconnection", true);

      if (error) {
        console.error(`❌ Error fetching users needing reconnection:`, error);
        return [];
      }

      if (!integrations || integrations.length === 0) {
        return [];
      }

      // Group by user
      const userMap = new Map<string, UserReconnectionData>();

      for (const integration of integrations) {
        const userId = integration.user_id;
        const userEmail = (integration.users as any)?.email;

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            userEmail,
            integrations: [],
            totalIntegrations: 0,
          });
        }

        const userData = userMap.get(userId)!;
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        userData.integrations.push({
          provider: integration.provider,
          reconnectUrl: `${baseUrl}/api/integrations/${integration.provider}/connect?returnTo=/integrations&autoReconnect=true`,
          requestedAt: integration.created_at,
        });
        userData.totalIntegrations++;
      }

      return Array.from(userMap.values());
    } catch (error) {
      console.error(`❌ Error in getUsersNeedingReconnection:`, error);
      return [];
    }
  }

  /**
   * Mark integrations as reconnected (clear the needs_reconnection flag)
   */
  static async markAsReconnected(
    userId: string,
    providers: string[]
  ): Promise<boolean> {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      const { error } = await supabase
        .from("integration_tokens")
        .update({
          needs_reconnection: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .in("provider", providers);

      if (error) {
        console.error(`❌ Error marking integrations as reconnected:`, error);
        return false;
      }

      console.log(
        `✅ Marked ${providers.join(", ")} as reconnected for user ${userId}`
      );
      return true;
    } catch (error) {
      console.error(`❌ Error in markAsReconnected:`, error);
      return false;
    }
  }

  /**
   * Send reconnection notification to a user
   */
  static async sendReconnectionNotification(
    userData: UserReconnectionData
  ): Promise<boolean> {
    try {
      console.log(
        `📧 Sending reconnection notification to ${userData.userEmail}`
      );
      console.log(
        `🔗 Integrations needing reconnection: ${userData.integrations
          .map((i) => i.provider)
          .join(", ")}`
      );

      // TODO: Implement actual email sending here
      // This would typically use your email service (SendGrid, etc.)
      // For now, we'll just log the notification details

      const emailContent = {
        to: userData.userEmail,
        subject: "Action Required: Reconnect Your Integrations",
        template: "reconnection-notification",
        data: {
          userName: userData.userEmail.split("@")[0],
          integrations: userData.integrations,
          totalIntegrations: userData.totalIntegrations,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        },
      };

      console.log(`📧 Email content prepared:`, emailContent);

      // Here you would call your email service
      // await emailService.send(emailContent);

      return true;
    } catch (error) {
      console.error(`❌ Error sending reconnection notification:`, error);
      return false;
    }
  }

  /**
   * Process all users needing reconnection and send notifications
   */
  static async processReconnectionNotifications(): Promise<{
    totalUsers: number;
    notificationsSent: number;
    errors: number;
  }> {
    try {
      console.log(`🔄 Processing reconnection notifications...`);

      const usersNeedingReconnection = await this.getUsersNeedingReconnection();

      if (usersNeedingReconnection.length === 0) {
        console.log(`✅ No users need reconnection notifications`);
        return { totalUsers: 0, notificationsSent: 0, errors: 0 };
      }

      console.log(
        `📊 Found ${usersNeedingReconnection.length} users needing reconnection`
      );

      let notificationsSent = 0;
      let errors = 0;

      for (const userData of usersNeedingReconnection) {
        try {
          const success = await this.sendReconnectionNotification(userData);
          if (success) {
            notificationsSent++;
          } else {
            errors++;
          }
        } catch (error) {
          console.error(
            `❌ Error processing notification for ${userData.userEmail}:`,
            error
          );
          errors++;
        }
      }

      console.log(
        `✅ Reconnection notifications processed: ${notificationsSent} sent, ${errors} errors`
      );

      return {
        totalUsers: usersNeedingReconnection.length,
        notificationsSent,
        errors,
      };
    } catch (error) {
      console.error(`❌ Error in processReconnectionNotifications:`, error);
      return { totalUsers: 0, notificationsSent: 0, errors: 1 };
    }
  }
}
