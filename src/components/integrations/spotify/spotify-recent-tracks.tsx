"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music4, RefreshCw } from "lucide-react";

type RecentItem = {
  id: string;
  title: string;
  artist: string;
  playedAt: string;
  art?: string;
};

export function SpotifyRecentTracks({
  connected = false,
  initialItems = [],
}: {
  connected?: boolean;
  initialItems?: RecentItem[];
}) {
  const [items, setItems] = useState<RecentItem[]>(initialItems);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!connected) return;
    setLoading(true);
    const res = await fetch("/api/integrations/spotify/recent");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (connected && initialItems.length === 0) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, initialItems]);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recently played</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={!connected || loading}
        >
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        {!connected ? (
          <div className="text-sm text-muted-foreground">
            Connect Spotify to see your recent tracks.
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recent tracks.</div>
        ) : (
          <ul className="grid gap-2">
            {items.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-md border p-2"
              >
                <div className="size-10 rounded-md bg-muted grid place-items-center overflow-hidden">
                  {t.art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.art || "/placeholder.svg"}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Music4 className="size-4 opacity-60" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.artist}
                  </div>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  {new Date(t.playedAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
