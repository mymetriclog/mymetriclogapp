"use client"

import { cn } from "@/lib/utils"

export function ProgressCircle({
  value = 72,
  size = 120,
  stroke = 10,
  className,
  label = "Score",
}: {
  value?: number
  size?: number
  stroke?: number
  className?: string
  label?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(0 0% 85% / 0.4)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="transparent"
        />
        <defs>
          <linearGradient id="grad" x1="1" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(142 76% 36%)" />
            <stop offset="60%" stopColor="hsl(38 92% 50%)" />
            <stop offset="100%" stopColor="hsl(351 94% 60%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold tabular-nums">{clamped}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
