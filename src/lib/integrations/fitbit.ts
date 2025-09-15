import { getServerSupabaseClient } from "@/lib/supabase/server";

export interface FitbitData {
  activity: {
    steps: number;
    activeMinutes: number;
    calories: number;
    distance: number;
    summary: string;
  };
  sleep: {
    duration: number;
    efficiency: number;
    deepSleep: number;
    remSleep: number;
    summary: string;
  };
  heart: {
    restingHR: number;
    hrv: number;
    peakHR: number;
    zones: any;
    summary: string;
  };
  hrv: any;
  activityLog: any[];
}

export class FitbitService {
  private baseUrl = "https://api.fitbit.com/1/user/-";

  /**
   * Get daily Fitbit data for a user
   */
  async getDailyData(userId: string, date: Date): Promise<FitbitData> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error("No valid Fitbit access token found");
      }

      const dateStr = this.formatDate(date);

      // Fetch all data concurrently
      const [activityData, sleepData, heartData, hrvData] = await Promise.all([
        this.fetchActivityData(accessToken, dateStr),
        this.fetchSleepData(accessToken, dateStr),
        this.fetchHeartData(accessToken, dateStr),
        this.fetchHRVData(accessToken, dateStr),
      ]);

      return {
        activity: activityData,
        sleep: sleepData,
        heart: heartData,
        hrv: hrvData,
        activityLog: await this.fetchActivityLog(accessToken, dateStr),
      };
    } catch (error) {
      console.error("❌ [FitbitService] Error fetching daily data:", error);
      return this.getFallbackData();
    }
  }

  /**
   * Get weekly Fitbit data for a user
   */
  async getWeeklyData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FitbitData> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error("No valid Fitbit access token found");
      }

      const startDateStr = this.formatDate(startDate);
      const endDateStr = this.formatDate(endDate);

      // Fetch weekly data
      const [activityData, sleepData, heartData, hrvData] = await Promise.all([
        this.fetchWeeklyActivityData(accessToken, startDateStr, endDateStr),
        this.fetchWeeklySleepData(accessToken, startDateStr, endDateStr),
        this.fetchWeeklyHeartData(accessToken, startDateStr, endDateStr),
        this.fetchWeeklyHRVData(accessToken, startDateStr, endDateStr),
      ]);

      return {
        activity: activityData,
        sleep: sleepData,
        heart: heartData,
        hrv: hrvData,
        activityLog: [],
      };
    } catch (error) {
      console.error("❌ [FitbitService] Error fetching weekly data:", error);
      return this.getFallbackData();
    }
  }

  /**
   * Get valid access token for user
   */
  private async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const supabase = await getServerSupabaseClient();

      const { data: tokenData } = await supabase
        .from("integration_tokens")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", userId)
        .eq("provider", "fitbit")
        .single();

      if (!tokenData) return null;

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (tokenData.expires_at && tokenData.expires_at < now) {
        // Try to refresh token
        const refreshedToken = await this.refreshAccessToken(
          tokenData.refresh_token
        );
        if (refreshedToken) {
          // Update token in database
          await supabase
            .from("integration_tokens")
            .update({
              access_token: refreshedToken.access_token,
              refresh_token: refreshedToken.refresh_token,
              expires_at: refreshedToken.expires_at,
            })
            .eq("user_id", userId)
            .eq("provider", "fitbit");

          return refreshedToken.access_token;
        }
        return null;
      }

      return tokenData.access_token;
    } catch (error) {
      console.error("❌ [FitbitService] Error getting access token:", error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      const response = await fetch("https://api.fitbit.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      };
    } catch (error) {
      console.error("❌ [FitbitService] Error refreshing token:", error);
      return null;
    }
  }

  /**
   * Fetch activity data for a specific date
   */
  private async fetchActivityData(
    accessToken: string,
    date: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/activities/date/${date}.json`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Activity API error: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.summary;

      return {
        steps: summary.steps || 0,
        activeMinutes:
          summary.veryActiveMinutes +
            summary.fairlyActiveMinutes +
            summary.lightlyActiveMinutes || 0,
        calories: summary.caloriesOut || 0,
        distance: summary.distances?.[0]?.distance || 0,
        summary: `👣 Steps: ${(
          summary.steps || 0
        ).toLocaleString()} • 🔥 Calories: ${(
          summary.caloriesOut || 0
        ).toLocaleString()} • 📏 Distance: ${(
          (summary.distances?.[0]?.distance || 0) * 0.621371
        ).toFixed(1)} mi`,
      };
    } catch (error) {
      console.error("❌ [FitbitService] Error fetching activity data:", error);
      return {
        steps: 0,
        activeMinutes: 0,
        calories: 0,
        distance: 0,
        summary: "No activity data available",
      };
    }
  }

  /**
   * Fetch sleep data for a specific date
   */
  private async fetchSleepData(
    accessToken: string,
    date: string
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/sleep/date/${date}.json`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Sleep API error: ${response.status}`);
      }

      const data = await response.json();
      const sleep = data.sleep?.[0];

      if (!sleep) {
        return {
          duration: 0,
          efficiency: 0,
          deepSleep: 0,
          remSleep: 0,
          summary: "No sleep data available",
        };
      }

      const duration = sleep.duration;
      const efficiency = sleep.efficiency;
      const deepSleep = sleep.levels?.summary?.deep?.minutes || 0;
      const remSleep = sleep.levels?.summary?.rem?.minutes || 0;

      return {
        duration,
        efficiency,
        deepSleep,
        remSleep,
        summary: `😴 Sleep: ${Math.floor(duration / 60)}h ${
          duration % 60
        }m • Efficiency: ${efficiency}% • Deep: ${Math.floor(
          deepSleep / 60
        )}h ${deepSleep % 60}m • REM: ${Math.floor(remSleep / 60)}h ${
          remSleep % 60
        }m`,
      };
    } catch (error) {
      console.error("❌ [FitbitService] Error fetching sleep data:", error);
      return {
        duration: 0,
        efficiency: 0,
        deepSleep: 0,
        remSleep: 0,
        summary: "No sleep data available",
      };
    }
  }

  /**
   * Fetch heart rate data for a specific date
   */
  private async fetchHeartData(
    accessToken: string,
    date: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/activities/heart/date/${date}/1d.json`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Heart API error: ${response.status}`);
      }

      const data = await response.json();
      const heart = data["activities-heart"]?.[0];

      if (!heart) {
        return {
          restingHR: 0,
          hrv: 0,
          peakHR: 0,
          zones: {},
          summary: "No heart data available",
        };
      }

      const restingHR = heart.value?.restingHeartRate || 0;
      const peakHR = this.calculatePeakHR(heart.value?.heartRateZones || []);
      const zones = heart.value?.heartRateZones || {};

      return {
        restingHR,
        hrv: 0, // HRV is fetched separately
        peakHR,
        zones,
        summary: `❤️ Resting HR: ${restingHR} bpm • Peak HR: ${peakHR} bpm`,
      };
    } catch (error) {
      console.error("❌ [FitbitService] Error fetching heart data:", error);
      return {
        restingHR: 0,
        hrv: 0,
        peakHR: 0,
        zones: {},
        summary: "No heart data available",
      };
    }
  }

  /**
   * Fetch HRV data for a specific date
   */
  private async fetchHRVData(accessToken: string, date: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/hrv/date/${date}.json`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null; // HRV data might not be available
      }

      const data = await response.json();
      const hrv = data.hrv?.[0];

      if (!hrv) {
        return null;
      }

      return {
        value: hrv.value?.dailyRmssd || 0,
        summary: `📊 HRV: ${hrv.value?.dailyRmssd || 0} ms`,
      };
    } catch (error) {
      console.error("❌ [FitbitService] Error fetching HRV data:", error);
      return null;
    }
  }

  /**
   * Fetch activity log for a specific date
   */
  private async fetchActivityLog(
    accessToken: string,
    date: string
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/activities/list.json?afterDate=${date}&sort=asc&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.activities || [];
    } catch (error) {
      console.error("❌ [FitbitService] Error fetching activity log:", error);
      return [];
    }
  }

  /**
   * Fetch weekly activity data
   */
  private async fetchWeeklyActivityData(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/activities/date/${startDate}/${endDate}.json`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Weekly activity API error: ${response.status}`);
      }

      const data = await response.json();
      const activities = data["activities-steps"] || [];

      const totalSteps = activities.reduce(
        (sum: number, day: any) => sum + (day.value || 0),
        0
      );
      const avgSteps = totalSteps / activities.length;

      return {
        steps: Math.round(avgSteps),
        activeMinutes: 0, // Would need separate API call
        calories: 0, // Would need separate API call
        distance: 0, // Would need separate API call
        summary: `👣 Weekly Avg Steps: ${Math.round(
          avgSteps
        ).toLocaleString()}`,
      };
    } catch (error) {
      console.error(
        "❌ [FitbitService] Error fetching weekly activity data:",
        error
      );
      return {
        steps: 0,
        activeMinutes: 0,
        calories: 0,
        distance: 0,
        summary: "No weekly activity data available",
      };
    }
  }

  /**
   * Fetch weekly sleep data
   */
  private async fetchWeeklySleepData(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/sleep/date/${startDate}/${endDate}.json`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Weekly sleep API error: ${response.status}`);
      }

      const data = await response.json();
      const sleepData = data.sleep || [];

      const totalDuration = sleepData.reduce(
        (sum: number, day: any) => sum + (day.duration || 0),
        0
      );
      const avgDuration = totalDuration / sleepData.length;
      const totalEfficiency = sleepData.reduce(
        (sum: number, day: any) => sum + (day.efficiency || 0),
        0
      );
      const avgEfficiency = totalEfficiency / sleepData.length;

      return {
        duration: Math.round(avgDuration),
        efficiency: Math.round(avgEfficiency),
        deepSleep: 0, // Would need detailed calculation
        remSleep: 0, // Would need detailed calculation
        summary: `😴 Weekly Avg Sleep: ${Math.floor(
          avgDuration / 60
        )}h ${Math.round(avgDuration % 60)}m • Efficiency: ${Math.round(
          avgEfficiency
        )}%`,
      };
    } catch (error) {
      console.error(
        "❌ [FitbitService] Error fetching weekly sleep data:",
        error
      );
      return {
        duration: 0,
        efficiency: 0,
        deepSleep: 0,
        remSleep: 0,
        summary: "No weekly sleep data available",
      };
    }
  }

  /**
   * Fetch weekly heart data
   */
  private async fetchWeeklyHeartData(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/activities/heart/date/${startDate}/${endDate}.json`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Weekly heart API error: ${response.status}`);
      }

      const data = await response.json();
      const heartData = data["activities-heart"] || [];

      const totalRestingHR = heartData.reduce(
        (sum: number, day: any) => sum + (day.value?.restingHeartRate || 0),
        0
      );
      const avgRestingHR = totalRestingHR / heartData.length;

      return {
        restingHR: Math.round(avgRestingHR),
        hrv: 0, // Would need separate calculation
        peakHR: 0, // Would need separate calculation
        zones: {},
        summary: `❤️ Weekly Avg Resting HR: ${Math.round(avgRestingHR)} bpm`,
      };
    } catch (error) {
      console.error(
        "❌ [FitbitService] Error fetching weekly heart data:",
        error
      );
      return {
        restingHR: 0,
        hrv: 0,
        peakHR: 0,
        zones: {},
        summary: "No weekly heart data available",
      };
    }
  }

  /**
   * Fetch weekly HRV data
   */
  private async fetchWeeklyHRVData(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/hrv/date/${startDate}/${endDate}.json`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const hrvData = data.hrv || [];

      const totalHRV = hrvData.reduce(
        (sum: number, day: any) => sum + (day.value?.dailyRmssd || 0),
        0
      );
      const avgHRV = totalHRV / hrvData.length;

      return {
        value: Math.round(avgHRV),
        summary: `📊 Weekly Avg HRV: ${Math.round(avgHRV)} ms`,
      };
    } catch (error) {
      console.error(
        "❌ [FitbitService] Error fetching weekly HRV data:",
        error
      );
      return null;
    }
  }

  /**
   * Calculate peak heart rate from zones
   */
  private calculatePeakHR(zones: any[]): number {
    if (!zones || zones.length === 0) return 0;

    let peakHR = 0;
    zones.forEach((zone) => {
      if (zone.max && zone.max > peakHR) {
        peakHR = zone.max;
      }
    });

    return peakHR;
  }

  /**
   * Format date for Fitbit API
   */
  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Get fallback data when API fails
   */
  private getFallbackData(): FitbitData {
    return {
      activity: {
        steps: 0,
        activeMinutes: 0,
        calories: 0,
        distance: 0,
        summary: "No activity data available",
      },
      sleep: {
        duration: 0,
        efficiency: 0,
        deepSleep: 0,
        remSleep: 0,
        summary: "No sleep data available",
      },
      heart: {
        restingHR: 0,
        hrv: 0,
        peakHR: 0,
        zones: {},
        summary: "No heart data available",
      },
      hrv: null,
      activityLog: [],
    };
  }
}
