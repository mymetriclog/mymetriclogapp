"use client";

import { GmailHeader } from "@/components/integrations/gmail/gmail-header";
import { GmailConnect } from "@/components/integrations/gmail/gmail-connect";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import {
  Mail,
  Calendar,
  MessageSquare,
  Clock,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Inbox,
  Loader2,
} from "lucide-react";

// Types for Gmail data
type GmailAccount = {
  email: string;
  name: string;
  totalEmails: number;
  unreadCount: number;
  lastSync: string;
};

type GmailStats = {
  totalEmails: number;
  unreadCount: number;
  averageResponseTime: number;
  emailsToday: number;
  calendarInvites: number;
};

type GmailData = {
  account: GmailAccount | null;
  stats: GmailStats;
  emails: Array<{
    id: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    snippet: string;
    body: string;
    hasAttachments: boolean;
    labels: string[];
    isRead: boolean;
  }>;
};

// Loading Skeleton Components
const MetricSkeleton = () => (
  <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

const AccountOverviewSkeleton = () => (
  <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
      <div className="h-6 bg-gray-200 rounded w-32"></div>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-32"></div>
        </div>
      ))}
    </div>
  </div>
);

const EmailSkeleton = () => (
  <div className="p-6 border-b border-gray-200 animate-pulse">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
      <div className="h-4 bg-gray-200 rounded w-32"></div>
      <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
    </div>
    <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  </div>
);

const InboxSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        <div>
          <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="w-24 h-9 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="divide-y divide-gray-200">
      {[1, 2, 3, 4, 5].map((i) => (
        <EmailSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default function GmailIntegrationPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [gmailData, setGmailData] = useState<GmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGmailData() {
      try {
        setLoading(true);
        setError(null);

        // Check connection status
        const connectionRes = await fetch("/api/integrations/gmail/profile");
        if (connectionRes.ok) {
          setIsConnected(true);

          // Fetch Gmail data
          const dataRes = await fetch("/api/integrations/gmail/stats");
          if (dataRes.ok) {
            const data = await dataRes.json();
            setGmailData(data);
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

    fetchGmailData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch("/api/integrations/gmail/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        setIsConnected(false);
        setGmailData(null);
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
            Loading Gmail Integration
          </h2>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Please wait while we check your connection status and fetch Gmail
            data...
          </p>

          {/* Loading Progress Indicators */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Checking connection status...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Verifying Gmail permissions...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Fetching email data...</span>
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
          <GmailHeader connected={true} />
          <GmailConnect connected={true} />

          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="size-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Gmail API Permissions Required
            </h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Your Gmail account is connected but you need to grant additional
              permissions to access your email data and analytics.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-lg mx-auto">
              <h4 className="font-medium text-gray-900 mb-3">
                Required Gmail API Scopes:
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Gmail Read Access</strong>
                    <br />
                    <span className="text-xs text-gray-500">
                      https://www.googleapis.com/auth/gmail.readonly
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
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">User Profile</strong>
                    <br />
                    <span className="text-xs text-gray-500">
                      https://www.googleapis.com/auth/userinfo.profile
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={() =>
                  (window.location.href = "/api/integrations/gmail/connect")
                }
              >
                Reconnect with Full Permissions
              </button>
              <div className="text-sm text-gray-500">or</div>
              <button
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                onClick={handleDisconnect}
              >
                Disconnect Gmail
              </button>
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
          <GmailHeader connected={true} />
          <GmailConnect connected={true} />

          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="size-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to Fetch Gmail Data
            </h3>
            <p className="text-gray-600 mb-6">
              We encountered an issue while trying to fetch your Gmail account
              information.
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
                Disconnect Gmail
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
        <GmailHeader connected={isConnected} />

        {/* Connect/Disconnect */}
        <GmailConnect connected={isConnected} />

        {/* Main Content */}
        {gmailData ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Emails</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {gmailData.stats.totalEmails.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="size-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unread</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {gmailData.stats.unreadCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Clock className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Today</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {gmailData.stats.emailsToday}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Calendar Invites</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {gmailData.stats.calendarInvites}
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
                  <p className="text-sm text-gray-600">Email Address</p>
                  <p className="font-medium text-gray-900">
                    {gmailData.account?.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Sync</p>
                  <p className="font-medium text-gray-900">
                    {gmailData.account?.lastSync
                      ? new Date(gmailData.account.lastSync).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Response Time</p>
                  <p className="font-medium text-gray-900">
                    {gmailData.stats.averageResponseTime}h average
                  </p>
                </div>
              </div>
            </div>

            {/* Email Inbox */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Inbox className="size-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Inbox</h3>
                    <p className="text-sm text-gray-600">
                      {gmailData.emails.length} recent emails
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                >
                  <MessageSquare className="size-4" />
                  Refresh
                </button>
              </div>

              {gmailData.emails.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="size-6 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-1">
                    No Emails Found
                  </h4>
                  <p className="text-gray-500">
                    Your inbox appears to be empty or emails couldn't be
                    fetched.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {gmailData.emails.map((email) => (
                    <div
                      key={email.id}
                      className={`p-6 hover:bg-gray-50 transition-colors ${
                        !email.isRead ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {!email.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                            <span className="font-medium text-gray-900 truncate">
                              {email.from}
                            </span>
                            <span className="text-sm text-gray-500 flex-shrink-0">
                              {new Date(email.date).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1 truncate">
                            {email.subject}
                          </h4>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                            {email.snippet}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>To: {email.to}</span>
                            {email.hasAttachments && (
                              <div className="flex items-center gap-1 text-amber-600">
                                <FileText className="size-3" />
                                <span>Attachment</span>
                              </div>
                            )}
                            {email.labels.length > 0 && (
                              <div className="flex items-center gap-1">
                                {email.labels.slice(0, 2).map((label) => (
                                  <span
                                    key={label}
                                    className="px-2 py-1 bg-gray-100 rounded text-xs"
                                  >
                                    {label}
                                  </span>
                                ))}
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
              Loading Gmail Data
            </h3>
            <p className="text-gray-500">
              Please wait while we fetch your email information...
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="size-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Connect Your Gmail Account
            </h3>
            <p className="text-gray-500 mb-6">
              Connect your Gmail account to see your email analytics and read
              your emails.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
