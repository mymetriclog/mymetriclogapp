"use client";

import { GoogleCalendarHeader } from "@/components/integrations/google-calendar/google-calendar-header";
import { GoogleCalendarConnect } from "@/components/integrations/google-calendar/google-calendar-connect";
import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
} from "lucide-react";

// Types for Google Calendar data
type GoogleCalendarAccount = {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  primary?: boolean;
  connectedAt: string;
};

type GoogleCalendarStats = {
  totalEvents: number;
  eventsToday: number;
  upcomingEvents: number;
  allDayEvents: number;
  timedEvents: number;
  avgEventsPerDay: number;
  primaryCalendar: string;
  timeZone: string;
  eventsThisWeek: number;
  busyHours: number;
  weekendEvents: number;
  lastUpdated: string;
};

type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  duration: string;
  attendees: string[];
  organizer: string;
  status: string;
  isAllDay: boolean;
  hasReminders: boolean;
  created: string;
  updated: string;
};

type GoogleCalendarData = {
  account: GoogleCalendarAccount | null;
  stats: GoogleCalendarStats;
  events: GoogleCalendarEvent[];
  upcomingEvents: GoogleCalendarEvent[];
};

export default function GoogleCalendarIntegrationPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [googleCalendarData, setGoogleCalendarData] =
    useState<GoogleCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGoogleCalendarData() {
      try {
        setLoading(true);
        setError(null);

        // Check connection status
        const connectionRes = await fetch(
          "/api/integrations/google-calendar/profile"
        );
        if (connectionRes.ok) {
          setIsConnected(true);

          // Fetch Google Calendar data
          const dataRes = await fetch(
            "/api/integrations/google-calendar/stats"
          );
          if (dataRes.ok) {
            const data = await dataRes.json();
            setGoogleCalendarData(data);
          } else {
            const errorData = await dataRes.json();
            if (
              dataRes.status === 403 ||
              errorData.error?.includes("permission") ||
              errorData.error?.includes("scope") ||
              errorData.error?.includes("insufficient") ||
              errorData.error?.includes("authentication")
            ) {
              setError("permission_denied");
            } else {
              setError("fetch_failed");
            }
          }
        } else {
          // Check if it's a permission error from the profile endpoint
          if (connectionRes.status === 403) {
            setIsConnected(true);
            setError("permission_denied");
          } else {
            setIsConnected(false);
          }
        }
      } catch (error) {
        setIsConnected(false);
        setError("fetch_failed");
      } finally {
        setLoading(false);
      }
    }

    fetchGoogleCalendarData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch("/api/integrations/google-calendar/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        setIsConnected(false);
        setGoogleCalendarData(null);
        setError(null);
      }
    } catch (error) {
      // Handle disconnect error silently
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {/* Full Page Loading Spinner */}
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="size-12 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Loading Google Calendar Integration
          </h2>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Please wait while we check your connection status and fetch Google
            Calendar data...
          </p>

          {/* Loading Progress Indicators */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Checking connection status...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Verifying Google Calendar permissions...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Fetching calendar data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show permission error
  if (error === "permission_denied") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 space-y-6">
          {/* <GoogleCalendarHeader connected={true} />
          <GoogleCalendarConnect connected={true} /> */}

          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="size-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Google Calendar API Permissions Required
            </h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Your Google Calendar account is connected but you need to grant
              additional permissions to access your calendar data and analytics.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-lg mx-auto">
              <h4 className="font-medium text-gray-900 mb-3">
                Required Google Calendar API Scopes:
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">
                      Calendar Read Access
                    </strong>
                    <br />
                    <span className="text-xs text-gray-500">
                      https://www.googleapis.com/auth/calendar.readonly
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">
                      Calendar Events Read Access
                    </strong>
                    <br />
                    <span className="text-xs text-gray-500">
                      https://www.googleapis.com/auth/calendar.events.readonly
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">
                      User Profile Information
                    </strong>
                    <br />
                    <span className="text-xs text-gray-500">
                      https://www.googleapis.com/auth/userinfo.email
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={() =>
                  (window.location.href =
                    "/api/integrations/google-calendar/connect")
                }
              >
                Connect Google Calendar
              </button>
              <div className="text-sm text-gray-500">or</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show general error
  if (error === "fetch_failed") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 space-y-6">
          {/* <GoogleCalendarHeader connected={true} />
          <GoogleCalendarConnect connected={true} /> */}

          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="size-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to Fetch Google Calendar Data
            </h3>
            <p className="text-gray-600 mb-6">
              We encountered an issue while trying to fetch your Google Calendar
              account information.
            </p>

            <div className="space-y-3">
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={handleRefresh}
              >
                Try Again
              </button>
              <div className="text-sm text-gray-500">or</div>
              <button
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                onClick={handleDisconnect}
              >
                Disconnect Google Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <GoogleCalendarHeader connected={isConnected} />

        {/* Connect/Disconnect */}
        <GoogleCalendarConnect connected={isConnected} />

        {/* Main Content */}
        {googleCalendarData ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Events</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {googleCalendarData.stats.totalEvents.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CalendarCheck className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Today</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {googleCalendarData.stats.eventsToday}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CalendarRange className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">This Week</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {googleCalendarData.stats.eventsThisWeek}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="size-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg/Day</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {googleCalendarData.stats.avgEventsPerDay}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Overview */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="size-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Account Overview
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-600">Primary Calendar</p>
                  <p className="font-medium text-gray-900">
                    {googleCalendarData.stats.primaryCalendar}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time Zone</p>
                  <p className="font-medium text-gray-900">
                    {googleCalendarData.stats.timeZone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {new Date(
                      googleCalendarData.stats.lastUpdated
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Clock className="size-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Upcoming Events</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {googleCalendarData.stats.upcomingEvents}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CalendarDays className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">All Day Events</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {googleCalendarData.stats.allDayEvents}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <Activity className="size-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weekend Events</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {googleCalendarData.stats.weekendEvents}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <CalendarRange className="size-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Upcoming Events
                    </h3>
                    <p className="text-sm text-gray-600">
                      Next 7 days • {googleCalendarData.upcomingEvents.length}{" "}
                      events
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Calendar className="size-4" />
                  Refresh
                </button>
              </div>

              {googleCalendarData.upcomingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="size-6 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-1">
                    No Upcoming Events
                  </h4>
                  <p className="text-gray-500">
                    You have no events scheduled for the next 7 days.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {googleCalendarData.upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900 truncate">
                              {event.summary}
                            </span>
                            <span className="text-sm text-gray-500 flex-shrink-0">
                              {new Date(event.start).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Duration: {event.duration}</span>
                            {event.attendees.length > 0 && (
                              <span>Attendees: {event.attendees.length}</span>
                            )}
                            {event.isAllDay && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <CalendarDays className="size-3" />
                                <span>All Day</span>
                              </div>
                            )}
                            {event.hasReminders && (
                              <div className="flex items-center gap-1 text-amber-600">
                                <Clock className="size-3" />
                                <span>Reminders</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : isConnected ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="size-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading Google Calendar Data
            </h3>
            <p className="text-gray-500">
              Please wait while we fetch your calendar information...
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="size-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Connect Your Google Calendar Account
            </h3>
            <p className="text-gray-500 mb-6">
              Connect your Google Calendar account to see your calendar
              analytics and upcoming events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
