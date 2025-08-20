"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, LinkIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function SpotifyConnect({ connected = false }: { connected?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") || "/integrations/spotify";

  function connect() {
    setLoading(true);
    window.location.href = `/api/integrations/spotify/connect?returnTo=${encodeURIComponent(
      returnTo
    )}`;
  }

  async function disconnect() {
    setLoading(true);
    const res = await fetch("/api/integrations/spotify/disconnect", {
      method: "POST",
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-4 flex flex-wrap items-center gap-2">
        {!connected ? (
          <>
            <Button
              onClick={connect}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-600/90"
            >
              <LinkIcon className="mr-2 size-4" />
              Connect Spotify
            </Button>
            <span className="text-sm text-muted-foreground">
              You'll be redirected to Spotify to authorize and brought back
              here.
            </span>
          </>
        ) : (
          <>
            <Button
              variant="destructive"
              onClick={disconnect}
              disabled={loading}
            >
              Disconnect
            </Button>
            <a
              href="https://www.spotify.com/account/apps/"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline"
            >
              Manage authorized apps <ExternalLink className="size-3.5" />
            </a>
          </>
        )}
      </CardContent>
    </Card>
  );
}
