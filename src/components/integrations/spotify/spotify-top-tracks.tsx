"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Music, TrendingUp } from "lucide-react";

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

export function SpotifyTopTracks({
  connected = false,
  initialTracks = [],
}: {
  connected?: boolean;
  initialTracks?: TopTrack[];
}) {
  const [tracks, setTracks] = useState<TopTrack[]>(initialTracks);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!connected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/spotify/top-tracks");
      if (res.ok) {
        const data = await res.json();
        setTracks(data.items || []);
      }
    } catch (error) {
      console.error("Failed to load top tracks:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (connected && initialTracks.length === 0) {
      load();
    }
  }, [connected, initialTracks]);

  function formatDuration(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Tracks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Connect Spotify to see your top tracks.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Top Tracks (Last 4 Weeks)</CardTitle>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">
            Loading top tracks...
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No top tracks found.
          </div>
        ) : (
          <div className="grid gap-3">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="size-10 rounded-md bg-muted grid place-items-center overflow-hidden flex-shrink-0">
                  {track.images?.[0]?.url ? (
                    <img
                      src={track.images[0].url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Music className="size-4 opacity-60" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{track.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {track.artist} • {track.album}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatDuration(track.duration)}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      <span>{track.popularity}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
