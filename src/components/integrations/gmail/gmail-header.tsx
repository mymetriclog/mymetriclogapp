"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ShieldCheck } from "lucide-react";

export function GmailHeader({ connected = false }: { connected?: boolean }) {
  return (
    <Card className="border-0 bg-gradient-to-br from-blue-500/10 via-red-400/10 to-yellow-400/10">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 grid place-items-center rounded-lg bg-blue-600 text-white">
              <Mail className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Gmail</h1>
              <p className="text-muted-foreground text-sm">
                Connect your Gmail account to analyze email patterns and
                communication productivity.
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={
              connected
                ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                : "bg-muted"
            }
          >
            <ShieldCheck className="mr-1 size-4" />
            {connected ? "Connected" : "Not connected"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
