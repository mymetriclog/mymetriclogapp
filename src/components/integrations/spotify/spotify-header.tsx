"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Music, ShieldCheck } from 'lucide-react'

export function SpotifyHeader({ connected = false }: { connected?: boolean }) {
  return (
    <Card className="border-0 bg-gradient-to-br from-emerald-500/10 via-amber-400/10 to-rose-500/10">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 grid place-items-center rounded-lg bg-emerald-600 text-white">
              <Music className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Spotify</h1>
              <p className="text-muted-foreground text-sm">
                Connect your Spotify account to include music activity in your daily score.
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={connected ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted"}
          >
            <ShieldCheck className="mr-1 size-4" />
            {connected ? "Connected" : "Not connected"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
