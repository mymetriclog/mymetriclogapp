"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Clock, MessageSquare, Calendar } from "lucide-react";

type GmailStats = {
  totalEmails: number;
  unreadCount: number;
  averageResponseTime: number;
  emailsToday: number;
  calendarInvites: number;
};

interface GmailStatsProps {
  connected: boolean;
  stats?: GmailStats;
}

export function GmailStats({ connected, stats }: GmailStatsProps) {
  if (!connected || !stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5" />
          Email Statistics
        </CardTitle>
        <CardDescription>
          Overview of your email activity and productivity metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg bg-blue-50">
              <div className="text-3xl font-bold text-blue-600">
                {stats.totalEmails.toLocaleString()}
              </div>
              <div className="text-sm font-medium text-blue-800">Total Emails</div>
              <div className="text-xs text-blue-600 mt-1">All time count</div>
            </div>

            <div className="text-center p-4 border rounded-lg bg-red-50">
              <div className="text-3xl font-bold text-red-600">
                {stats.unreadCount}
              </div>
              <div className="text-sm font-medium text-red-800">Unread</div>
              <div className="text-xs text-red-600 mt-1">Requires attention</div>
            </div>

            <div className="text-center p-4 border rounded-lg bg-green-50">
              <div className="text-3xl font-bold text-green-600">
                {stats.emailsToday}
              </div>
              <div className="text-sm font-medium text-green-800">Today</div>
              <div className="text-xs text-green-600 mt-1">Last 24 hours</div>
            </div>

            <div className="text-center p-4 border rounded-lg bg-purple-50">
              <div className="text-3xl font-bold text-purple-600">
                {stats.averageResponseTime}h
              </div>
              <div className="text-sm font-medium text-purple-800">Avg Response</div>
              <div className="text-xs text-purple-600 mt-1">Typical reply time</div>
            </div>

            <div className="text-center p-4 border rounded-lg bg-orange-50">
              <div className="text-3xl font-bold text-orange-600">
                {stats.calendarInvites}
              </div>
              <div className="text-sm font-medium text-orange-800">
                Calendar Invites
              </div>
              <div className="text-xs text-orange-600 mt-1">Meeting requests</div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Additional Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Unread Ratio</span>
                <span className="font-medium">
                  {stats.totalEmails > 0 ? ((stats.unreadCount / stats.totalEmails) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Today's Activity</span>
                <span className="font-medium">
                  {stats.emailsToday > 0 ? 'Active' : 'Quiet'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Response Efficiency</span>
                <span className="font-medium">
                  {stats.averageResponseTime <= 2 ? 'Fast' : stats.averageResponseTime <= 4 ? 'Good' : 'Standard'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Calendar Integration</span>
                <span className="font-medium">
                  {stats.calendarInvites > 0 ? `${stats.calendarInvites} invites` : 'No invites'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
