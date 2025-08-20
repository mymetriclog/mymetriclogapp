"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Disc3, Calendar, Music } from "lucide-react";

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

export function SpotifySavedAlbums({
  connected = false,
  initialAlbums = [],
}: {
  connected?: boolean;
  initialAlbums?: SavedAlbum[];
}) {
  const [albums, setAlbums] = useState<SavedAlbum[]>(initialAlbums);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!connected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/spotify/saved-albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data.items || []);
      }
    } catch (error) {
      console.error("Failed to load saved albums:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (connected && initialAlbums.length === 0) {
      load();
    }
  }, [connected, initialAlbums]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saved Albums</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Connect Spotify to see your saved albums.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Saved Albums</CardTitle>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">
            Loading saved albums...
          </div>
        ) : albums.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No saved albums found.
          </div>
        ) : (
          <div className="grid gap-3">
            {albums.map((album) => (
              <div
                key={album.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="size-12 rounded-md bg-muted grid place-items-center overflow-hidden flex-shrink-0">
                  {album.images?.[0]?.url ? (
                    <img
                      src={album.images[0].url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Disc3 className="size-5 opacity-60" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{album.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {album.artist}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Music className="size-3" />
                      <span>{album.total_tracks} tracks</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      <span>{formatDate(album.release_date)}</span>
                    </div>
                    <span>•</span>
                    <span className="capitalize">{album.album_type}</span>
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
