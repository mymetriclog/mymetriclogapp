"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { nameToColors, toInitials } from "@/lib/name-colors"

type SpotifyAccount = { display_name: string; email: string; product: string }

export function SpotifyAccountCard({ 
  connected = false, 
  initialAccount = null 
}: { 
  connected?: boolean
  initialAccount?: SpotifyAccount | null
}) {
  const [acct, setAcct] = useState<SpotifyAccount | null>(initialAccount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!connected || initialAccount) return
      setLoading(true)
      const res = await fetch("/api/integrations/spotify/me", { cache: "no-store" })
      setLoading(false)
      if (ignore) return
      if (res.ok) setAcct(await res.json())
    }
    load()
    return () => {
      ignore = true
    }
  }, [connected, initialAccount])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Account</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        {connected && acct ? (
          <>
            <Avatar className="size-10 ring-1 ring-black/5 dark:ring-white/10">
              <AvatarFallback
                style={{ backgroundImage: nameToColors(acct.display_name || acct.email).gradient, color: "#fff" }}
                className="font-medium"
              >
                {toInitials(acct.display_name, acct.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium leading-none truncate">{acct.display_name}</div>
              <div className="text-sm text-muted-foreground truncate">{acct.email}</div>
              <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">Plan: {acct.product}</div>
            </div>
          </>
        ) : connected && loading ? (
          <div className="text-sm text-muted-foreground">Loading account…</div>
        ) : (
          <div className="text-sm text-muted-foreground">Connect to view your Spotify account.</div>
        )}
      </CardContent>
    </Card>
  )
}
