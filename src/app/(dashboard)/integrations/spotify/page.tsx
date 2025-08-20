import { SpotifyHeader } from "@/components/integrations/spotify/spotify-header";
import { SpotifyConnect } from "@/components/integrations/spotify/spotify-connect";
import { SpotifyAccountCard } from "@/components/integrations/spotify/spotify-account-card";
import { SpotifyRecentTracks } from "@/components/integrations/spotify/spotify-recent-tracks";
import { SpotifyTopTracks } from "@/components/integrations/spotify/spotify-top-tracks";
import { SpotifySavedAlbums } from "@/components/integrations/spotify/spotify-saved-albums";
import { Separator } from "@/components/ui/separator";
import {
  getServerSession,
  getServerSupabaseClient,
} from "@/lib/supabase/server";
import { getSpotifyAccessToken } from "@/lib/integrations/spotify";
import { cookies } from "next/headers";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

// Types for Spotify data
type SpotifyAccount = {
  display_name: string;
  email: string;
  product: string;
  id: string;
};

type RecentTrack = {
  id: string;
  title: string;
  artist: string;
  playedAt: string;
  art?: string;
};

type TopTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  popularity: number;
  images: Array<{ url: string; width: number; height: number }>;
  uri: string;
};

type SavedAlbum = {
  id: string;
  name: string;
  artist: string;
  images: Array<{ url: string; width: number; height: number }>;
  release_date: string;
  total_tracks: number;
  album_type: string;
  added_at: string;
};

type SpotifyStats = {
  totalPlaylists: number;
  totalSavedAlbums: number;
  totalSavedTracks: number;
  averagePopularity: number;
  listeningTime: number;
};

type SpotifyData = {
  account: SpotifyAccount | null;
  recentTracks: RecentTrack[];
  topTracks: TopTrack[];
  savedAlbums: SavedAlbum[];
  stats: SpotifyStats;
};

async function getSpotifyData(userId: string): Promise<SpotifyData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cookieHeader = (await cookies()).toString();
    const reqInit: RequestInit = {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    };

    const [accountRes, recentRes, topTracksRes, playlistsRes, albumsRes] =
      await Promise.all([
        fetch(`${baseUrl}/api/integrations/spotify/me`, reqInit),
        fetch(`${baseUrl}/api/integrations/spotify/recent`, reqInit),
        fetch(`${baseUrl}/api/integrations/spotify/top-tracks`, reqInit),
        fetch(`${baseUrl}/api/integrations/spotify/playlists`, reqInit),
        fetch(`${baseUrl}/api/integrations/spotify/saved-albums`, reqInit),
      ]);

    if (
      !accountRes.ok ||
      !recentRes.ok ||
      !topTracksRes.ok ||
      !playlistsRes.ok ||
      !albumsRes.ok
    ) {
      return null;
    }

    const accountData = accountRes.ok ? await accountRes.json() : null;
    const account = accountData
      ? {
          display_name: accountData.display_name,
          email: accountData.email,
          product: accountData.product,
          id: accountData.id,
        }
      : null;

    const recentData = recentRes.ok ? await recentRes.json() : { items: [] };
    const recentTracks = recentData.items || [];

    const topTracksData = topTracksRes.ok
      ? await topTracksRes.json()
      : { items: [] };
    const topTracks = topTracksData.items || [];

    const playlistsData = playlistsRes.ok
      ? await playlistsRes.json()
      : { items: [] };
    const totalPlaylists = playlistsData.items?.length || 0;

    const albumsData = albumsRes.ok ? await albumsRes.json() : { items: [] };
    const savedAlbums = albumsData.items || [];

    const totalSavedAlbums = savedAlbums.length;
    const totalSavedTracks = recentTracks.length;
    const popularities = topTracks.map((t: TopTrack) => t.popularity);
    const averagePopularity =
      popularities.length > 0
        ? Math.round(
            popularities.reduce((a: number, b: number) => a + b, 0) /
              popularities.length
          )
        : 0;
    const listeningTime = totalSavedTracks * 3.5;

    const stats: SpotifyStats = {
      totalPlaylists,
      totalSavedAlbums,
      totalSavedTracks,
      averagePopularity,
      listeningTime,
    };

    return {
      account,
      recentTracks,
      topTracks,
      savedAlbums,
      stats,
    };
  } catch (error) {
    return null;
  }
}

export default async function SpotifyIntegrationPage() {
  const session = await getServerSession();
  let isConnected = false;
  let spotifyData: SpotifyData | null = null;
  let errorMessage: string | null = null;
  let currentScopes: string | null = null;
  let availableScopes: string[] = [];

  if (session) {
    const supabase = await getServerSupabaseClient();
    const { data: tokenData } = await supabase
      .from("integration_tokens")
      .select("access_token, expires_at, scope")
      .eq("user_id", session.user.id)
      .eq("provider", "spotify")
      .maybeSingle();

    if (tokenData?.access_token) {
      const now = Math.floor(Date.now() / 1000);
      isConnected = !tokenData.expires_at || tokenData.expires_at > now;
      currentScopes = tokenData.scope;

      if (currentScopes) {
        availableScopes = currentScopes
          .split(" ")
          .filter((scope) => scope.trim());
      }

      if (isConnected) {
        try {
          // Fetch all available data with current scopes
          const data: Partial<SpotifyData> = {};

          // Initialize stats object
          data.stats = {
            totalPlaylists: 0,
            totalSavedAlbums: 0,
            totalSavedTracks: 0,
            averagePopularity: 0,
            listeningTime: 0,
          };

          let hasAnyData = false;

          // Fetch account data (user-read-email, user-read-private)
          try {
            const accountRes = await fetch(
              `${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/api/integrations/spotify/me`,
              {
                cache: "no-store",
                headers: { Cookie: (await cookies()).toString() },
              }
            );
            if (accountRes.ok) {
              const accountData = await accountRes.json();
              data.account = {
                display_name: accountData.display_name,
                email: accountData.email,
                product: accountData.product,
                id: accountData.id,
              };
              hasAnyData = true;
            } else if (accountRes.status === 403) {
              // console.log(
              //   "Account API returned 403 - insufficient permissions"
              // );
            }
          } catch (e) {
            // console.log("Could not fetch account data:", e);
          }

          // Fetch recent tracks (user-read-recently-played)
          try {
            const recentRes = await fetch(
              `${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/api/integrations/spotify/recent`,
              {
                cache: "no-store",
                headers: { Cookie: (await cookies()).toString() },
              }
            );
            if (recentRes.ok) {
              const recentData = await recentRes.json();
              data.recentTracks = recentData.items || [];
              hasAnyData = true;
            } else if (recentRes.status === 403) {
              // console.log(
              //   "Recent tracks API returned 403 - insufficient permissions"
              // );
            }
          } catch (e) {
            // console.log("Could not fetch recent tracks:", e);
          }

          // Fetch top tracks (user-top-read)
          try {
            const topTracksRes = await fetch(
              `${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/api/integrations/spotify/top-tracks`,
              {
                cache: "no-store",
                headers: { Cookie: (await cookies()).toString() },
              }
            );
            if (topTracksRes.ok) {
              const topTracksData = await topTracksRes.json();
              data.topTracks = topTracksData.items || [];
              hasAnyData = true;
            } else if (topTracksRes.status === 403) {
              // console.log(
              //   "Top tracks API returned 403 - insufficient permissions"
              // );
            }
          } catch (e) {
            // console.log("Could not fetch top tracks:", e);
          }

          // Fetch playlists (playlist-read-private)
          try {
            const playlistsRes = await fetch(
              `${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/api/integrations/spotify/playlists`,
              {
                cache: "no-store",
                headers: { Cookie: (await cookies()).toString() },
              }
            );
            if (playlistsRes.ok) {
              const playlistsData = await playlistsRes.json();
              if (data.stats) {
                data.stats.totalPlaylists = playlistsData.items?.length || 0;
              }
              hasAnyData = true;
            } else if (playlistsRes.status === 403) {
              // console.log(
              //   "Playlists API returned 403 - insufficient permissions"
              // );
            }
          } catch (e) {
            // console.log("Could not fetch playlists:", e);
          }

          // Fetch saved albums (user-library-read)
          try {
            const albumsRes = await fetch(
              `${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/api/integrations/spotify/saved-albums`,
              {
                cache: "no-store",
                headers: { Cookie: (await cookies()).toString() },
              }
            );
            if (albumsRes.ok) {
              const albumsData = await albumsRes.json();
              data.savedAlbums = albumsData.items || [];
              if (data.stats) {
                data.stats.totalSavedAlbums = albumsData.items?.length || 0;
              }
              hasAnyData = true;
            } else if (albumsRes.status === 403) {
              // console.log(
              //   "Saved albums API returned 403 - insufficient permissions"
              // );
            }
          } catch (e) {
            // console.log("Could not fetch saved albums:", e);
          }

          // Calculate stats from available data
          if (data.recentTracks || data.topTracks || data.savedAlbums) {
            const totalSavedTracks = data.recentTracks?.length || 0;
            const popularities =
              data.topTracks?.map((t: TopTrack) => t.popularity) || [];
            const averagePopularity =
              popularities.length > 0
                ? Math.round(
                    popularities.reduce((a: number, b: number) => a + b, 0) /
                      popularities.length
                  )
                : 0;
            const listeningTime = totalSavedTracks * 3.5;

            if (data.stats) {
              data.stats.totalSavedTracks = totalSavedTracks;
              data.stats.averagePopularity = averagePopularity;
              data.stats.listeningTime = listeningTime;
            }
          }

          // Set spotifyData if we have any data
          if (hasAnyData) {
            spotifyData = data as SpotifyData;
          } else {
            // Instead of error, show what we can display with available scopes
            spotifyData = {
              account: null,
              recentTracks: [],
              topTracks: [],
              savedAlbums: [],
              stats: {
                totalPlaylists: 0,
                totalSavedAlbums: 0,
                totalSavedTracks: 0,
                averagePopularity: 0,
                listeningTime: 0,
              },
            };

            // Show info about what scopes we have vs what we need
            const workingScopes = [];
            if (availableScopes.includes("playlist-read-private"))
              workingScopes.push("Playlists");
            if (availableScopes.includes("user-library-read"))
              workingScopes.push("Saved Albums");
            if (
              availableScopes.includes("user-read-email") ||
              availableScopes.includes("user-read-private")
            )
              workingScopes.push("Account Info");
            if (availableScopes.includes("user-read-recently-played"))
              workingScopes.push("Recent Tracks");
            if (availableScopes.includes("user-top-read"))
              workingScopes.push("Top Tracks");

            if (workingScopes.length > 0) {
              errorMessage = `Available features: ${workingScopes.join(
                ", "
              )}. Some data may be limited due to permission restrictions.`;
            } else {
              errorMessage =
                "No Spotify data available. Please disconnect and reconnect to refresh permissions.";
            }
          }
        } catch (error) {
          errorMessage = "Error fetching Spotify data. Please try again.";
          // console.error("Spotify data fetch error:", error);
        }
      }
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SpotifyHeader connected={isConnected} />
      <SpotifyConnect connected={isConnected} />
      <Separator />

      {currentScopes && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            <strong>✅ Full Spotify Access:</strong>{" "}
            {availableScopes.join(", ")}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">{errorMessage}</div>
          <div className="mt-2 text-xs text-red-600">
            <strong>Solution:</strong> Click "Disconnect" then "Connect Spotify"
            again to refresh your permissions.
          </div>
        </div>
      )}

      {isConnected && spotifyData ? (
        <>
          {/* Stats Grid - Only show if we have meaningful stats */}
          {(spotifyData.stats.totalPlaylists > 0 ||
            spotifyData.stats.totalSavedAlbums > 0 ||
            spotifyData.stats.totalSavedTracks > 0) && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                {spotifyData.stats.totalPlaylists > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {spotifyData.stats.totalPlaylists}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Playlists
                    </div>
                  </div>
                )}
                {spotifyData.stats.totalSavedAlbums > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {spotifyData.stats.totalSavedAlbums}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Saved Albums
                    </div>
                  </div>
                )}
                {spotifyData.stats.totalSavedTracks > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {spotifyData.stats.totalSavedTracks}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Recent Tracks
                    </div>
                  </div>
                )}
                {spotifyData.stats.averagePopularity > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {spotifyData.stats.averagePopularity}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Avg Popularity
                    </div>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Recent Tracks - Only show if we have data */}
            {spotifyData.recentTracks &&
              spotifyData.recentTracks.length > 0 && (
                <div className="md:col-span-2">
                  <SpotifyRecentTracks
                    connected={isConnected}
                    initialItems={spotifyData.recentTracks}
                  />
                </div>
              )}

            {/* Account Card - Only show if we have account data */}
            {spotifyData.account && (
              <div
                className={
                  spotifyData.recentTracks &&
                  spotifyData.recentTracks.length > 0
                    ? ""
                    : "md:col-span-3"
                }
              >
                <SpotifyAccountCard
                  connected={isConnected}
                  initialAccount={spotifyData.account}
                />
              </div>
            )}
          </div>

          {/* Bottom Grid - Only show if we have data */}
          {(spotifyData.topTracks && spotifyData.topTracks.length > 0) ||
          (spotifyData.savedAlbums && spotifyData.savedAlbums.length > 0) ? (
            <>
              <Separator />
              <div className="grid gap-6 md:grid-cols-2">
                {spotifyData.topTracks && spotifyData.topTracks.length > 0 && (
                  <SpotifyTopTracks
                    connected={isConnected}
                    initialTracks={spotifyData.topTracks}
                  />
                )}
                {spotifyData.savedAlbums &&
                  spotifyData.savedAlbums.length > 0 && (
                    <SpotifySavedAlbums
                      connected={isConnected}
                      initialAlbums={spotifyData.savedAlbums}
                    />
                  )}
              </div>
            </>
          ) : null}
        </>
      ) : isConnected ? (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-muted-foreground">
            Loading Spotify data...
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-muted-foreground">
            Connect your Spotify account to see your data
          </div>
        </div>
      )}
    </div>
  );
}
