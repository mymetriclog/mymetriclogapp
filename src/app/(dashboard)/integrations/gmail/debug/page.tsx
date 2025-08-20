import {
  getServerSession,
  getServerSupabaseClient,
} from "@/lib/supabase/server";
import { getGmailAccessToken } from "@/lib/integrations/gmail";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function GmailDebugPage() {
  const session = await getServerSession();
  const supabase = await getServerSupabaseClient();

  if (!session) {
    return <div>Not authenticated</div>;
  }

  // Check if Gmail is connected
  const { data: tokenData } = await supabase
    .from("integration_tokens")
    .select("provider, created_at, expires_at")
    .eq("user_id", session.user.id)
    .eq("provider", "gmail")
    .single();

  const isConnected = !!tokenData;

  // Check environment variables
  const envVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not set",
    GOOGLE_GMAIL_REDIRECT_URL: process.env.GOOGLE_GMAIL_REDIRECT_URL
      ? "Set"
      : "Not set",
  };

  // Try to get access token
  let accessTokenStatus = "Not attempted";
  let accessToken = null;

  if (isConnected) {
    try {
      accessToken = await getGmailAccessToken(session.user.id);
      accessTokenStatus = accessToken ? "Success" : "Failed";
    } catch (error) {
      accessTokenStatus = `Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gmail Integration Debug</h1>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">User Information</h2>
          <p>User ID: {session.user.id}</p>
          <p>Email: {session.user.email}</p>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <p>Gmail Connected: {isConnected ? "Yes" : "No"}</p>
          {tokenData && (
            <>
              <p>
                Token Created: {new Date(tokenData.created_at).toLocaleString()}
              </p>
              <p>
                Token Expires:{" "}
                {tokenData.expires_at
                  ? new Date(tokenData.expires_at * 1000).toLocaleString()
                  : "Never"}
              </p>
            </>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          {Object.entries(envVars).map(([key, value]) => (
            <p key={key}>
              {key}:{" "}
              <span
                className={value === "Set" ? "text-green-600" : "text-red-600"}
              >
                {value}
              </span>
            </p>
          ))}
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Access Token Test</h2>
          <p>Status: {accessTokenStatus}</p>
          {accessToken && <p>Token Length: {accessToken.length} characters</p>}
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Next Steps</h2>
          <ul className="list-disc list-inside space-y-1">
            {!isConnected && <li>Connect Gmail account first</li>}
            {isConnected && !accessToken && <li>Check token refresh logic</li>}
            {accessToken && <li>Test Gmail API calls</li>}
            {Object.values(envVars).some((v) => v === "Not set") && (
              <li>Set missing environment variables</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
