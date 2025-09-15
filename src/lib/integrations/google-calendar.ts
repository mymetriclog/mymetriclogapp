import { getServerSupabaseClient } from "@/lib/supabase/server";

export interface CalendarData {
  summary: string;
  events: any[];
  analysis: any;
  intelligence: any;
}

export class GoogleCalendarService {
  private baseUrl = "https://www.googleapis.com/calendar/v3";

  async getDailyData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarData> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      if (!accessToken) {
        // No token connected; return graceful fallback without error
        return this.getFallbackData();
      }

      const events = await this.fetchEvents(accessToken, startDate, endDate);
      const analysis = this.analyzeEvents(events);
      const intelligence = this.analyzeCalendarIntelligence(events);
      const summary = this.generateSummary(events, analysis);

      return {
        summary,
        events,
        analysis,
        intelligence,
      };
    } catch (error) {
      console.error(
        "❌ [GoogleCalendarService] Error fetching daily data:",
        error
      );
      return this.getFallbackData();
    }
  }

  async getWeeklyData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarData> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      if (!accessToken) {
        // No token connected; return graceful fallback without error
        return this.getFallbackData();
      }

      const events = await this.fetchEvents(accessToken, startDate, endDate);
      const analysis = this.analyzeEvents(events);
      const intelligence = this.analyzeCalendarIntelligence(events);
      const summary = this.generateSummary(events, analysis);

      return {
        summary,
        events,
        analysis,
        intelligence,
      };
    } catch (error) {
      console.error(
        "❌ [GoogleCalendarService] Error fetching weekly data:",
        error
      );
      return this.getFallbackData();
    }
  }

  private async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const supabase = await getServerSupabaseClient();

      const { data: tokenData } = await supabase
        .from("integration_tokens")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", userId)
        // Support both naming styles: "google-calendar" (DB) and "google_calendar" (legacy)
        .in("provider", ["google-calendar", "google_calendar"])
        .maybeSingle();

      if (!tokenData) return null;

      const now = Math.floor(Date.now() / 1000);
      if (tokenData.expires_at && tokenData.expires_at < now) {
        const refreshedToken = await this.refreshAccessToken(
          tokenData.refresh_token
        );
        if (refreshedToken) {
          await supabase
            .from("integration_tokens")
            .update({
              access_token: refreshedToken.access_token,
              refresh_token: refreshedToken.refresh_token,
              expires_at: refreshedToken.expires_at,
            })
            .eq("user_id", userId)
            .eq("provider", "google_calendar");

          return refreshedToken.access_token;
        }
        return null;
      }

      return tokenData.access_token;
    } catch (error) {
      console.error(
        "❌ [GoogleCalendarService] Error getting access token:",
        error
      );
      return null;
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      };
    } catch (error) {
      console.error(
        "❌ [GoogleCalendarService] Error refreshing token:",
        error
      );
      return null;
    }
  }

  private async fetchEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      const timeMin = startDate.toISOString();
      const timeMax = endDate.toISOString();

      const response = await fetch(
        `${this.baseUrl}/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("❌ [GoogleCalendarService] Error fetching events:", error);
      return [];
    }
  }

  private analyzeEvents(events: any[]): any {
    const totalEvents = events.length;
    let meetingTime = 0;
    let focusTime = 0;

    events.forEach((event) => {
      const start = new Date(event.start.dateTime || event.start.date);
      const end = new Date(event.end.dateTime || event.end.date);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes

      if (this.isMeeting(event)) {
        meetingTime += duration;
      } else if (this.isFocusTime(event)) {
        focusTime += duration;
      }
    });

    const totalTime = meetingTime + focusTime;
    const meetingEfficiency =
      totalTime > 0 ? Math.round((meetingTime / totalTime) * 100) : 0;

    return {
      totalEvents,
      meetingTime: Math.round(meetingTime),
      focusTime: Math.round(focusTime),
      meetingEfficiency,
    };
  }

  private analyzeCalendarIntelligence(events: any[]): any {
    return {
      productivity: this.calculateProductivityScore(events),
      workLifeBalance: this.calculateWorkLifeBalance(events),
      meetingQuality: this.analyzeMeetingQuality(events),
      recommendations: this.generateCalendarRecommendations(events),
    };
  }

  private generateSummary(events: any[], analysis: any): string {
    const parts = [];

    parts.push(`📅 Events: ${analysis.totalEvents}`);

    if (analysis.meetingTime > 0) {
      parts.push(
        `🤝 Meetings: ${Math.floor(analysis.meetingTime / 60)}h ${
          analysis.meetingTime % 60
        }m`
      );
    }

    if (analysis.focusTime > 0) {
      parts.push(
        `🎯 Focus Time: ${Math.floor(analysis.focusTime / 60)}h ${
          analysis.focusTime % 60
        }m`
      );
    }

    return parts.join(" • ");
  }

  private isMeeting(event: any): boolean {
    const title = event.summary?.toLowerCase() || "";
    const meetingKeywords = [
      "meeting",
      "call",
      "conference",
      "standup",
      "sync",
    ];
    return meetingKeywords.some((keyword) => title.includes(keyword));
  }

  private isFocusTime(event: any): boolean {
    const title = event.summary?.toLowerCase() || "";
    const focusKeywords = ["focus", "deep work", "coding", "writing"];
    return focusKeywords.some((keyword) => title.includes(keyword));
  }

  private calculateProductivityScore(events: any[]): number {
    const analysis = this.analyzeEvents(events);
    let score = 50;

    if (analysis.focusTime > 0) {
      score += Math.min(analysis.focusTime / 10, 30);
    }

    if (analysis.meetingTime > 480) {
      score -= 20;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  private calculateWorkLifeBalance(events: any[]): number {
    const workEvents = events.filter((event) => {
      const title = event.summary?.toLowerCase() || "";
      return !title.includes("personal") && !title.includes("family");
    });

    const totalEvents = events.length;
    if (totalEvents === 0) return 50;

    const workRatio = workEvents.length / totalEvents;
    return Math.round(100 - Math.abs(workRatio - 0.7) * 200);
  }

  private analyzeMeetingQuality(events: any[]): any {
    const meetings = events.filter((event) => this.isMeeting(event));

    if (meetings.length === 0) {
      return { score: 0, insights: ["No meetings scheduled"] };
    }

    const avgDuration =
      meetings.reduce((sum, meeting) => {
        const start = new Date(meeting.start.dateTime || meeting.start.date);
        const end = new Date(meeting.end.dateTime || meeting.end.date);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0) / meetings.length;

    let score = 50;
    const insights = [];

    if (avgDuration <= 30) {
      score += 20;
      insights.push("Short, focused meetings");
    } else if (avgDuration > 60) {
      score -= 10;
      insights.push("Long meetings detected");
    }

    return {
      score: Math.min(Math.max(score, 0), 100),
      insights,
      avgDuration: Math.round(avgDuration),
      totalMeetings: meetings.length,
    };
  }

  private generateCalendarRecommendations(events: any[]): string[] {
    const recommendations = [];
    const analysis = this.analyzeEvents(events);

    if (analysis.meetingTime > 480) {
      recommendations.push("Consider reducing meeting time to improve focus");
    }

    if (analysis.focusTime === 0) {
      recommendations.push("Schedule dedicated focus time blocks");
    }

    return recommendations;
  }

  private getFallbackData(): CalendarData {
    return {
      summary: "No calendar data available",
      events: [],
      analysis: {
        totalEvents: 0,
        meetingTime: 0,
        focusTime: 0,
        meetingEfficiency: 0,
      },
      intelligence: {
        productivity: 50,
        workLifeBalance: 50,
        meetingQuality: {
          score: 0,
          insights: [],
          avgDuration: 0,
          totalMeetings: 0,
        },
        recommendations: [],
      },
    };
  }
}
