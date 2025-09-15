import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Check if a report already exists for a user on a specific date
 * @param userId - The user ID to check
 * @param date - The date to check (YYYY-MM-DD format)
 * @param reportType - The type of report (daily/weekly)
 * @returns Promise<boolean> - true if report already exists, false otherwise
 */
export async function reportExists(
  userId: string,
  date: string,
  reportType: "daily" | "weekly"
): Promise<boolean> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data, error } = await supabase
      .from("reports")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .eq("kind", reportType)
      .limit(1);

    if (error) {
      console.error(`❌ Error checking for existing report:`, error);
      return false; // If error, allow generation to proceed
    }

    const exists = data && data.length > 0;
    if (exists) {
      console.log(
        `⚠️ Report already exists for user ${userId} on ${date} (${reportType})`
      );
    }

    return exists;
  } catch (error) {
    console.error(`❌ Error checking for existing report:`, error);
    return false; // If error, allow generation to proceed
  }
}

/**
 * Check if an email was already sent for a user on a specific date
 * @param userId - The user ID to check
 * @param date - The date to check (YYYY-MM-DD format)
 * @param reportType - The type of report (daily/weekly)
 * @returns Promise<boolean> - true if email was already sent, false otherwise
 */
export async function emailAlreadySent(
  userId: string,
  date: string,
  reportType: "daily" | "weekly"
): Promise<boolean> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data, error } = await supabase
      .from("reports")
      .select("id, email_sent")
      .eq("user_id", userId)
      .eq("date", date)
      .eq("kind", reportType)
      .eq("email_sent", true)
      .limit(1);

    if (error) {
      console.error(`❌ Error checking for sent emails:`, error);
      return false; // If error, allow email to be sent
    }

    const emailSent = data && data.length > 0;
    if (emailSent) {
      console.log(
        `⚠️ Email already sent for user ${userId} on ${date} (${reportType})`
      );
    }

    return emailSent;
  } catch (error) {
    console.error(`❌ Error checking for sent emails:`, error);
    return false; // If error, allow email to be sent
  }
}

/**
 * Get existing report for a user on a specific date
 * @param userId - The user ID to check
 * @param date - The date to check (YYYY-MM-DD format)
 * @param reportType - The type of report (daily/weekly)
 * @returns Promise<any> - The existing report data or null
 */
export async function getExistingReport(
  userId: string,
  date: string,
  reportType: "daily" | "weekly"
): Promise<any | null> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .eq("kind", reportType)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error(`❌ Error getting existing report:`, error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`❌ Error getting existing report:`, error);
    return null;
  }
}
