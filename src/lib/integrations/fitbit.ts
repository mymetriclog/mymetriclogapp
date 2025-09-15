import { getServerSupabaseClient } from "@/lib/supabase/server";

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

type FitbitProfile = {
  user: {
    encodedId: string;
    fullName: string;
    email: string;
    avatar: string;
    dateOfBirth: string;
    height: number;
    weight: number;
    gender: string;
    timezone: string;
  };
};

type FitbitStats = {
  today: {
    steps: number;
    calories: number;
    distance: number;
    activeMinutes: number;
    heartRate: {
      resting: number;
      current: number;
    };
    sleep: {
      duration: number;
      efficiency: number;
      startTime?: string | null;
      endTime?: string | null;
      timeInBed?: number;
      stages: {
        light: number;
        deep: number;
        rem: number;
        wake: number;
      };
    };
  };
  weekly: {
    steps: number[];
    calories: number[];
    distance: number[];
    activeMinutes: number[];
  };
  goals: {
    steps: number;
    calories: number;
    distance: number;
    activeMinutes: number;
  };
};

export async function upsertFitbitTokens(userId: string, tok: TokenResponse) {
  const supabase = await getServerSupabaseClient();
  const now = Math.floor(Date.now() / 1000);
  const expires_at = now + (tok.expires_in ?? 604800) - 60; // 7 days default

  const { data: existing } = await supabase
    .from("integration_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .eq("provider", "fitbit")
    .maybeSingle();

  const { error } = await supabase.from("integration_tokens").upsert(
    {
      user_id: userId,
      provider: "fitbit",
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

export async function getFitbitAccessToken(
  userId: string
): Promise<string | null> {
  try {
    console.log("🔍 Getting Fitbit access token for user:", userId);

    const { getServerSupabaseClientWithServiceRole } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await getServerSupabaseClientWithServiceRole();

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", userId)
      .eq("provider", "fitbit")
      .maybeSingle();

    if (error) {
      console.log("❌ Fitbit token query error:", error);
      return null;
    }

    if (!data) {
      console.log("❌ No Fitbit token data found for user:", userId);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (data.expires_at && data.expires_at > now && data.access_token) {
      console.log("✅ Fitbit token is valid and not expired");
      return data.access_token;
    }

    if (!data.refresh_token) {
      console.log("❌ No refresh token available for Fitbit");
      return null;
    }

    const refreshed = await refreshFitbitToken(data.refresh_token);
    if (!refreshed) {
      console.log("❌ Failed to refresh Fitbit token");
      return null;
    }
    await upsertFitbitTokens(userId, refreshed);
    return refreshed.access_token;
  } catch (error) {
    console.error("❌ Error in getFitbitAccessToken:", error);
    return null;
  }
}

async function refreshFitbitToken(
  refreshToken: string
): Promise<TokenResponse | null> {
  try {
    const clientId = process.env.FITBIT_CLIENT_ID;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return null;
    }

    const response = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const tokenData = await response.json();
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type || "Bearer",
      scope: tokenData.scope,
    };
  } catch (error) {
    return null;
  }
}

export async function getFitbitProfile(
  accessToken: string
): Promise<FitbitProfile | null> {
  try {
    const response = await fetch(
      "https://api.fitbit.com/1/user/-/profile.json",
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

export async function getFitbitStats(
  accessToken: string,
  date?: Date
): Promise<FitbitStats | null> {
  try {
    const targetDate = date || new Date();
    const today = targetDate.toISOString().split("T")[0];

    // Fetch today's data
    const [stepsRes, caloriesRes, distanceRes, heartRateRes, sleepRes] =
      await Promise.all([
        fetch(
          `https://api.fitbit.com/1/user/-/activities/steps/date/${today}/1d.json`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          }
        ),
        fetch(
          `https://api.fitbit.com/1/user/-/activities/calories/date/${today}/1d.json`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          }
        ),
        fetch(
          `https://api.fitbit.com/1/user/-/activities/distance/date/${today}/1d.json`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          }
        ),
        fetch(
          `https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d.json`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          }
        ),
        fetch(`https://api.fitbit.com/1/user/-/sleep/date/${today}.json`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        }),
      ]);

    // Parse responses
    const steps = stepsRes.ok ? await stepsRes.json() : null;
    const calories = caloriesRes.ok ? await caloriesRes.json() : null;
    const distance = distanceRes.ok ? await distanceRes.json() : null;
    const heartRate = heartRateRes.ok ? await heartRateRes.json() : null;
    const sleep = sleepRes.ok ? await sleepRes.json() : null;

    // Build stats object
    const stats: FitbitStats = {
      today: {
        steps: steps?.summary?.steps || 0,
        calories: calories?.summary?.caloriesOut || 0,
        distance: distance?.summary?.distances?.[0]?.distance || 0,
        activeMinutes: 0, // Would need additional API call
        heartRate: {
          resting: heartRate?.summary?.restingHeartRate || 0,
          current: 0, // Would need additional API call
        },
        sleep: {
          duration: sleep?.summary?.totalMinutesAsleep || 0,
          efficiency: sleep?.summary?.efficiency || 0,
          startTime: sleep?.summary?.startTime || null,
          endTime: sleep?.summary?.endTime || null,
          timeInBed: sleep?.summary?.totalTimeInBed || 0,
          stages: {
            light: sleep?.summary?.stages?.light || 0,
            deep: sleep?.summary?.stages?.deep || 0,
            rem: sleep?.summary?.stages?.rem || 0,
            wake: sleep?.summary?.stages?.wake || 0,
          },
        },
      },
      weekly: {
        steps: [],
        calories: [],
        distance: [],
        activeMinutes: [],
      },
      goals: {
        steps: 10000,
        calories: 2000,
        distance: 5,
        activeMinutes: 30,
      },
    };

    return stats;
  } catch (error) {
    return null;
  }
}
