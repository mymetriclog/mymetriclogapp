"use client"

import { Loader2 } from 'lucide-react'
import { cn } from "@/lib/utils"

export function LoadingOverlay({
  open = false,
  message = "Please wait…",
  className,
}: {
  open?: boolean
  message?: string
  className?: string
}) {
  if (!open) return null
  return (
    <div
      aria-live="assertive"
      role="alert"
      className={cn(
        "fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center gap-3 rounded-md border bg-background px-4 py-3 shadow-lg">
        <Loader2 className="size-5 animate-spin text-emerald-600" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  )
}
