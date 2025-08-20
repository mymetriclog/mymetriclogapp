"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, LinkIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function GmailConnect({ connected = false }: { connected?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") || "/integrations/gmail";

  function connect() {
    setLoading(true);
    // Redirect to Gmail OAuth
    window.location.href = `/api/integrations/gmail/connect?returnTo=${encodeURIComponent(
      returnTo
    )}`;
  }

  async function disconnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/gmail/disconnect", {
        method: "POST",
      });

      if (res.ok) {
        router.refresh();
      } else {
        console.error("Failed to disconnect Gmail");
      }
    } catch (error) {
      console.error("Error disconnecting Gmail:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 flex flex-wrap items-center gap-2">
        {!connected ? (
          <>
            <Button
              onClick={connect}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-600/90"
            >
              <LinkIcon className="mr-2 size-4" />
              Connect Gmail
            </Button>
            <span className="text-sm text-muted-foreground">
              You'll be redirected to Google to authorize and brought back here.
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
              href="https://myaccount.google.com/permissions"
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
