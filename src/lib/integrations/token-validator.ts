import { getServerSupabaseClient } from "@/lib/supabase/server";

export interface TokenStatus {
  provider: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  expiresAt: number | null;
  hasRefreshToken: boolean;
  canAutoRefresh: boolean;
}

export async function validateIntegrationTokens(
  userId: string
): Promise<TokenStatus[]> {
  const supabase = await getServerSupabaseClient();

  const { data: tokens } = await supabase
    .from("integration_tokens")
    .select("provider, expires_at, refresh_token")
    .eq("user_id", userId);

  if (!tokens) return [];

  const now = Math.floor(Date.now() / 1000);
  const oneWeekFromNow = now + 7 * 24 * 60 * 60; // 7 days in seconds

  return tokens.map((token) => {
    const expiresAt = token.expires_at;
    const hasRefreshToken = !!token.refresh_token;

    // Token is expired if it has an expiration time and it's in the past
    const isExpired = expiresAt ? expiresAt < now : false;

    // Token is expiring soon if it expires within 7 days
    const isExpiringSoon = expiresAt
      ? expiresAt < oneWeekFromNow && expiresAt > now
      : false;

    // Calculate days until expiry
    const daysUntilExpiry = expiresAt
      ? Math.ceil((expiresAt - now) / (24 * 60 * 60))
      : 0;

    // Can auto-refresh if we have a refresh token and the token is expired/expiring
    const canAutoRefresh = hasRefreshToken && (isExpired || isExpiringSoon);

    return {
      provider: token.provider,
      isExpired,
      isExpiringSoon,
      daysUntilExpiry,
      expiresAt,
      hasRefreshToken,
      canAutoRefresh,
    };
  });
}

export function getExpiredTokens(tokenStatuses: TokenStatus[]): string[] {
  return tokenStatuses
    .filter((token) => token.isExpired && !token.canAutoRefresh)
    .map((token) => token.provider);
}

export function getExpiringSoonTokens(
  tokenStatuses: TokenStatus[]
): TokenStatus[] {
  return tokenStatuses.filter(
    (token) => token.isExpiringSoon && !token.canAutoRefresh
  );
}

export function getTokensNeedingRefresh(
  tokenStatuses: TokenStatus[]
): TokenStatus[] {
  return tokenStatuses.filter((token) => token.canAutoRefresh);
}

export function shouldShowExpiredWarning(
  tokenStatuses: TokenStatus[]
): boolean {
  return tokenStatuses.some(
    (token) => token.isExpired && !token.canAutoRefresh
  );
}

export function shouldShowExpiringSoonWarning(
  tokenStatuses: TokenStatus[]
): boolean {
  return tokenStatuses.some(
    (token) => token.isExpiringSoon && !token.canAutoRefresh
  );
}

export function shouldShowRefreshWarning(
  tokenStatuses: TokenStatus[]
): boolean {
  return tokenStatuses.some((token) => token.canAutoRefresh);
}
