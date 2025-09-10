import { getServerSupabaseClient } from "@/lib/supabase/server";

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

type GmailProfile = {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
};

type GmailMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers: Array<{
      name: string;
      value: string;
    }>;
  };
};

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function upsertGmailTokens(userId: string, tok: TokenResponse) {
  const supabase = await getServerSupabaseClient();
  const now = Math.floor(Date.now() / 1000);
  const expires_at = now + (tok.expires_in ?? 3600) - 60;

  const { data: existing } = await supabase
    .from("integration_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .eq("provider", "gmail")
    .maybeSingle();

  const { error } = await supabase.from("integration_tokens").upsert(
    {
      user_id: userId,
      provider: "gmail",
      access_token: tok.access_token,
      refresh_token: tok.refresh_token ?? existing?.refresh_token ?? null,
      scope: tok.scope ?? null,
      token_type: tok.token_type ?? "Bearer",
      expires_at,
    },
    { onConflict: "user_id,provider" }
  );
  if (error) throw error;
}

export async function getGmailAccessToken(
  userId: string
): Promise<string | null> {
  try {
    console.log("🔍 Getting Gmail access token for user:", userId);

    const { getServerSupabaseClientWithServiceRole } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await getServerSupabaseClientWithServiceRole();

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", userId)
      .eq("provider", "gmail")
      .maybeSingle();

    if (error) {
      console.log("❌ Gmail token query error:", error);
      return null;
    }

    if (!data) {
      console.log("❌ No Gmail token data found for user:", userId);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (data.expires_at && data.expires_at > now && data.access_token) {
      console.log("✅ Gmail token is valid and not expired");
      return data.access_token;
    }

    if (!data.refresh_token) {
      console.log("❌ No refresh token available for Gmail");
      return null;
    }
    const refreshed = await refreshGmailToken(data.refresh_token);
    if (!refreshed) {
      console.log("❌ Failed to refresh Gmail token");
      return null;
    }

    await upsertGmailTokens(userId, refreshed);
    return refreshed.access_token;
  } catch (error) {
    console.error("❌ Error in getGmailAccessToken:", error);
    return null;
  }
}

export async function refreshGmailToken(
  refreshToken: string
): Promise<TokenResponse | null> {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!tokenRes.ok) return null;

  const tok = (await tokenRes.json()) as TokenResponse;
  return tok;
}

export async function getGmailProfile(
  accessToken: string
): Promise<GmailProfile | null> {
  try {
    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const profile = await response.json();
    return profile;
  } catch (error) {
    return null;
  }
}

export async function getGmailMessages(
  accessToken: string,
  maxResults: number = 10,
  date?: Date
): Promise<GmailMessage[]> {
  try {
    // Build query with date filter if provided
    let query = "";
    if (date) {
      const dateStr = date.toISOString().split("T")[0];
      query = `?q=after:${dateStr} before:${
        new Date(date.getTime() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      }&maxResults=${maxResults}`;
    } else {
      query = `?maxResults=${maxResults}`;
    }

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages${query}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    return [];
  }
}

export async function getGmailMessageDetails(
  accessToken: string,
  messageId: string
): Promise<GmailMessage | null> {
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return null;

    const message = await response.json();
    return message;
  } catch (error) {
    return null;
  }
}

export async function getGmailMessagesWithContent(
  accessToken: string,
  maxResults: number = 10
): Promise<
  Array<{
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
  }>
> {
  try {
    // Get message list
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    const messages = data.messages || [];

    if (messages.length === 0) {
      return [];
    }

    // Get detailed content for each message
    const detailedMessages = await Promise.all(
      messages.map(async (msg: any, index: number) => {
        try {
          // First try with format=full
          let detailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              cache: "no-store",
            }
          );

          // If full format fails, try with minimal format
          if (!detailResponse.ok) {
            detailResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=minimal`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                cache: "no-store",
              }
            );
          }

          if (!detailResponse.ok) {
            return null;
          }

          const messageDetail = await detailResponse.json();

          // Extract headers
          const headers = messageDetail.payload?.headers || [];
          const subject =
            headers.find((h: any) => h.name === "Subject")?.value ||
            "No Subject";
          const from =
            headers.find((h: any) => h.name === "From")?.value ||
            "Unknown Sender";
          const to = headers.find((h: any) => h.name === "To")?.value || "";
          const date = headers.find((h: any) => h.name === "Date")?.value || "";

          // Extract body content
          let body = "";
          let hasAttachments = false;

          if (messageDetail.payload?.body?.data) {
            // Simple text email
            body = Buffer.from(
              messageDetail.payload.body.data,
              "base64"
            ).toString();
          } else if (messageDetail.payload?.parts) {
            // Multipart email
            const textPart = messageDetail.payload.parts.find(
              (part: any) =>
                part.mimeType === "text/plain" || part.mimeType === "text/html"
            );
            if (textPart?.body?.data) {
              body = Buffer.from(textPart.body.data, "base64").toString();
            } else {
              // Multipart email but no text content found
            }
            hasAttachments = messageDetail.payload.parts.some(
              (part: any) =>
                part.mimeType !== "text/plain" && part.mimeType !== "text/html"
            );
          } else {
            // If we only have minimal format, use snippet as body
            body = messageDetail.snippet || "No content available";
          }

          // Extract labels
          const labels = messageDetail.labelIds || [];
          const isRead = !labels.includes("UNREAD");

          const processedMessage = {
            id: msg.id,
            subject:
              subject.length > 50 ? subject.substring(0, 50) + "..." : subject,
            from: from.length > 30 ? from.substring(0, 30) + "..." : from,
            to: to.length > 30 ? to.substring(0, 30) + "..." : to,
            date: date
              ? new Date(date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : "Unknown",
            snippet: messageDetail.snippet || "No preview available",
            body: body || "No content available",
            hasAttachments,
            labels,
            isRead,
          };

          return processedMessage;
        } catch (error) {
          return null;
        }
      })
    );

    // Filter out null results and return unique messages
    const validMessages = detailedMessages.filter((msg) => msg !== null);

    return validMessages;
  } catch (error) {
    return [];
  }
}

export async function getGmailStats(accessToken: string, date?: Date) {
  try {
    const profile = await getGmailProfile(accessToken);
    if (!profile) {
      return null;
    }

    // Get recent messages for additional stats (filter by date if provided)
    const messages = await getGmailMessages(accessToken, 100, date);

    // Calculate unread count (approximate) - handle messages without labelIds
    const unreadCount = messages.filter((msg) => {
      // Check if labelIds exists and includes UNREAD
      return (
        msg.labelIds &&
        Array.isArray(msg.labelIds) &&
        msg.labelIds.includes("UNREAD")
      );
    }).length;

    // Get emails from today - handle messages without internalDate
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const emailsToday = messages.filter((msg) => {
      if (!msg.internalDate) return false;
      try {
        const messageDate = new Date(parseInt(msg.internalDate));
        return messageDate >= todayStart;
      } catch {
        return false;
      }
    }).length;

    const stats = {
      totalEmails: profile.messagesTotal,
      unreadCount,
      emailsToday,
      averageResponseTime: 2.5, // This would need more complex logic
      calendarInvites: 8, // This would need calendar API integration
    };

    return stats;
  } catch (error) {
    return null;
  }
}
